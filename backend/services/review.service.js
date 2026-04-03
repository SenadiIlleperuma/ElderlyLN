const db = require("../db");

async function addReview(userId, bookingId, ratingScore, comment) {
const score = Number(ratingScore);

  if (!bookingId || Number.isNaN(score) || score < 1 || score > 5) {
    throw new Error("Invalid input: Booking ID and a 1-5 rating score are required.");
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // Validate booking ownership and status
    const bq = `
      SELECT b.booking_id, b.booking_status, b.family_fk, b.caregiver_fk, f.user_fk AS family_user_fk
      FROM booking b
      JOIN family f ON f.family_id = b.family_fk
      WHERE b.booking_id = $1
    `;
    const bRes = await client.query(bq, [bookingId]);
    if (bRes.rows.length === 0) throw new Error("Invalid bookingId.");

    const b = bRes.rows[0];

    if (b.family_user_fk !== userId) throw new Error("Forbidden: this booking is not yours.");
    if (b.booking_status !== "Completed") {
      throw new Error("You can only review after the booking is Completed.");
    }

    //Prevent duplicates
    const dq = `SELECT 1 FROM review WHERE booking_fk = $1 LIMIT 1`;
    const dRes = await client.query(dq, [bookingId]);
    if (dRes.rows.length > 0) {
      throw new Error("Review already submitted for this booking.");
    }

    // Insert review
    const iq = `
      INSERT INTO review (booking_fk, caregiver_fk, family_fk, rating_score, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING review_id, booking_fk, caregiver_fk, rating_score, comment, created_at
    `;
   
    const iRes = await client.query(iq, [
      bookingId,
      b.caregiver_fk,
      b.family_fk,
      score,
      comment && String(comment).trim() !== "" ? comment : null,
    ]);

    // Recalculate avg rating for that caregiver and update caregiver table
    const statsQ = `
      UPDATE caregiver c
      SET
        avg_rating = sub.avg_rating,
        review_count = sub.review_count
      FROM (
        SELECT caregiver_fk,
               COALESCE(ROUND(AVG(rating_score)::numeric, 1), 0.0) AS avg_rating,
               COUNT(*)::int AS review_count
        FROM review
        WHERE caregiver_fk = $1
        GROUP BY caregiver_fk
      ) sub
      WHERE c.caregiver_id = sub.caregiver_fk
      RETURNING c.caregiver_id, c.avg_rating, c.review_count
    `;
    const statsRes = await client.query(statsQ, [b.caregiver_fk]);

    const newAvg = statsRes.rows[0]?.avg_rating ?? null;
    const newReviewCount = statsRes.rows[0]?.review_count ?? 0;

    await client.query("COMMIT");

    return {
      review: iRes.rows[0],
      caregiver_id: b.caregiver_fk,
      new_avg_rating: newAvg,
      new_review_count: newReviewCount,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { addReview };