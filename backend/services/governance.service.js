const db = require("../db");

async function fileComplaint(userId, bookingId, reason, role) {
// only family or caregiver can file complaints
  if (!["family", "caregiver"].includes(role)) {
    throw new Error("Forbidden: Only family or caregiver users can file complaints.");
  }

// verify booking ownership
  const bq = `
    SELECT
      b.booking_id,
      f.user_fk AS family_user_fk,
      c.user_fk AS caregiver_user_fk
    FROM booking b
    JOIN family f ON f.family_id = b.family_fk
    JOIN caregiver c ON c.caregiver_id = b.caregiver_fk
    WHERE b.booking_id = $1
  `;
  const bRes = await db.query(bq, [bookingId]);
  if (bRes.rows.length === 0) throw new Error("Invalid bookingId.");

  const row = bRes.rows[0];
  const isFamilyOwner = row.family_user_fk === userId;
  const isCaregiverOwner = row.caregiver_user_fk === userId;

  if (!isFamilyOwner && !isCaregiverOwner) {
    throw new Error("Forbidden: this booking is not yours.");
  }

  const dq = `SELECT 1 FROM complaint WHERE booking_fk = $1 LIMIT 1`;
  const dRes = await db.query(dq, [bookingId]);
  if (dRes.rows.length > 0) {
    throw new Error("Complaint already filed for this booking.");
  }

  const category = "Other"; 
  const status = "Submitted";

  const iq = `
    INSERT INTO complaint (booking_fk, filer_fk, description, status, resolution_sla, category)
    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours', $5)
    RETURNING complaint_id, booking_fk, filer_fk, submitted_at, description, status, resolution_sla, category
  `;
  const iRes = await db.query(iq, [bookingId, userId, reason, status, category]);
  return iRes.rows[0];
}

async function listComplaintsForAdmin() {
  const q = `
    SELECT
      c.complaint_id,
      c.booking_fk,
      c.filer_fk,
      c.submitted_at,
      c.description,
      c.status,
      c.resolution_sla,
      c.resolved_by_fk,
      c.category,
      c.resolution_note,

      u.role AS filer_role,
      u.full_name AS filer_name,

      b.booking_status,
      b.service_date,

      f.full_name AS family_name,
      cg.full_name AS caregiver_name
    FROM complaint c
    JOIN "user" u ON u.user_id = c.filer_fk
    JOIN booking b ON b.booking_id = c.booking_fk
    JOIN family f ON f.family_id = b.family_fk
    JOIN caregiver cg ON cg.caregiver_id = b.caregiver_fk
    ORDER BY c.submitted_at DESC
  `;
  const r = await db.query(q);
  return r.rows;
}

async function resolveComplaint(complaintId, adminUserId, resolutionNote, newStatus) {
  const allowed = ["Submitted", "Under Review", "Closed"];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status. Use: ${allowed.join(", ")}`);
  }

  const q = `
    UPDATE complaint
    SET
      status = $2,
      resolution_note = $3,
      resolved_by_fk = $4
    WHERE complaint_id = $1
    RETURNING complaint_id, status, resolution_note, resolved_by_fk
  `;
  const r = await db.query(q, [complaintId, newStatus, resolutionNote, adminUserId]);
  if (!r.rows[0]) throw new Error("Complaint not found.");
  return r.rows[0];
}

module.exports = {
  fileComplaint,
  listComplaintsForAdmin,
  resolveComplaint,
};
