const db = require("../db");

async function fileComplaint(userId, bookingId, reason, role) {
  if (role !== "family") {
    throw new Error("Forbidden: Only family users can file complaints.");
  }

  const bq = `
    SELECT b.booking_id, f.user_fk AS family_user_fk
    FROM booking b
    JOIN family f ON f.family_id = b.family_fk
    WHERE b.booking_id = $1
  `;
  const bRes = await db.query(bq, [bookingId]);

  if (bRes.rows.length === 0) throw new Error("Invalid bookingId.");
  if (bRes.rows[0].family_user_fk !== userId) {
    throw new Error("Forbidden: this booking is not yours.");
  }

  const dq = `SELECT 1 FROM complaint WHERE booking_fk = $1 LIMIT 1`;
  const dRes = await db.query(dq, [bookingId]);
  if (dRes.rows.length > 0) {
    throw new Error("Complaint already filed for this booking.");
  }

  const iq = `
    INSERT INTO complaint (booking_fk, filer_fk, description, status, resolution_sla)
    VALUES ($1, $2, $3, 'Submitted', NOW() + INTERVAL '24 hours')
    RETURNING complaint_id, booking_fk, filer_fk, submitted_at, status, resolution_sla
  `;

  const iRes = await db.query(iq, [bookingId, userId, reason]);
  return iRes.rows[0];
}

module.exports = { fileComplaint };
