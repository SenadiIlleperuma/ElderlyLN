const db = require("../db");

async function addReview(userId, bookingId, ratingScore, comment) {
const score = Number(ratingScore);

  if (!bookingId || Number.isNaN(score) || score < 1 || score > 5) {
    throw new Error("Invalid input: Booking ID and a 1-5 rating score are required.");
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Validate booking ownership and status
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

    // 2) Prevent duplicates
    const dq = `SELECT 1 FROM review WHERE booking_fk = $1 LIMIT 1`;
    const dRes = await client.query(dq, [bookingId]);
    if (dRes.rows.length > 0) {
      throw new Error("Review already submitted for this booking.");
    }

    // 3) Insert review
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

    // 4) Recalculate avg rating for that caregiver and update caregiver table
    const avgQ = `
      UPDATE caregiver c
      SET avg_rating = sub.avg_rating
      FROM (
        SELECT caregiver_fk,
               COALESCE(ROUND(AVG(rating_score)::numeric, 1), 0.0) AS avg_rating
        FROM review
        WHERE caregiver_fk = $1
        GROUP BY caregiver_fk
      ) sub
      WHERE c.caregiver_id = sub.caregiver_fk
      RETURNING c.caregiver_id, c.avg_rating
    `;
    const avgRes = await client.query(avgQ, [b.caregiver_fk]);

    const newAvg = avgRes.rows[0]?.avg_rating ?? null;

    await client.query("COMMIT");

    return {
      review: iRes.rows[0],
      caregiver_id: b.caregiver_fk,
      new_avg_rating: newAvg,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { addReview };
