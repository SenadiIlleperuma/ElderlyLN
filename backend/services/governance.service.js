const db = require("../db");

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

// FAMILY/CAREGIVER: FILE COMPLAINT
async function fileComplaint(userId, bookingId, reason, role) {
  if (!["family", "caregiver"].includes(role)) {
    throw new Error("Forbidden: Only family or caregiver users can file complaints.");
  }

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

  if (bRes.rows.length === 0) {
    throw new Error("Invalid bookingId.");
  }

  const row = bRes.rows[0];
  const isFamilyOwner = row.family_user_fk === userId;
  const isCaregiverOwner = row.caregiver_user_fk === userId;

  if (!isFamilyOwner && !isCaregiverOwner) {
    throw new Error("Forbidden: this booking is not yours.");
  }

  const dq = `
    SELECT 1
    FROM complaint
    WHERE booking_fk = $1 AND filer_fk = $2
    LIMIT 1
  `;
  const dRes = await db.query(dq, [bookingId, userId]);

  if (dRes.rows.length > 0) {
    throw new Error("You have already filed a complaint for this booking.");
  }

  const category = "Other";
  const status = "Submitted";

  const iq = `
    INSERT INTO complaint
      (booking_fk, filer_fk, submitted_at, description, status, resolution_sla, category)
    VALUES
      ($1, $2, NOW(), $3, $4, NOW() + INTERVAL '24 hours', $5)
    RETURNING
      complaint_id, booking_fk, filer_fk, submitted_at, description, status, resolution_sla, category
  `;
  const iRes = await db.query(iq, [bookingId, userId, reason, status, category]);

  return iRes.rows[0];
}

// ADMIN: DASHBOARD STATS
async function getAdminStats() {
  const usersQ = `SELECT COUNT(*)::int AS total_users FROM "user" WHERE is_active = true`;
  const bookingsQ = `SELECT COUNT(*)::int AS total_bookings FROM booking`;
  const pendingVerifyQ = `
    SELECT COUNT(*)::int AS pending_reviews
    FROM caregiver
    WHERE UPPER(REPLACE(COALESCE(profile_status, ''), ' ', '_')) IN ('PENDING_VERIFICATION', 'PENDING')
  `;
  const urgentComplaintsQ = `
    SELECT COUNT(*)::int AS urgent_unresolved
    FROM complaint
    WHERE status IN ('Submitted', 'Under Review')
      AND resolution_sla < NOW()
  `;

  const [u, b, p, ur] = await Promise.all([
    db.query(usersQ),
    db.query(bookingsQ),
    db.query(pendingVerifyQ),
    db.query(urgentComplaintsQ),
  ]);

  return {
    totalUsers: u.rows[0].total_users,
    totalBookings: b.rows[0].total_bookings,
    pendingReviews: p.rows[0].pending_reviews,
    urgentUnresolved: ur.rows[0].urgent_unresolved,
  };
}

// ADMIN: VERIFICATION QUEUE
async function getVerificationQueue() {
  const q = `
    SELECT
      c.caregiver_id,
      c.full_name,
      c.profile_status,
      COALESCE(d.docs_count, 0) AS docs_count,
      d.last_uploaded_at AS requested_at
    FROM caregiver c
    LEFT JOIN (
      SELECT
        caregiver_fk,
        COUNT(*)::int AS docs_count,
        MAX(uploaded_at) AS last_uploaded_at
      FROM caregiver_document
      WHERE UPPER(REPLACE(COALESCE(verification_status, ''), ' ', '_')) IN ('UNDER_REVIEW', 'UPLOADED', 'REJECTED')
      GROUP BY caregiver_fk
    ) d ON d.caregiver_fk = c.caregiver_id
    WHERE UPPER(REPLACE(COALESCE(c.profile_status, ''), ' ', '_')) IN ('PENDING_VERIFICATION', 'PENDING')
    ORDER BY d.last_uploaded_at DESC NULLS LAST, c.caregiver_id DESC
  `;
  const r = await db.query(q);

  return r.rows.map((x) => ({
    id: x.caregiver_id,
    name: x.full_name,
    requestedAt: x.requested_at || null,
    docsCount: x.docs_count,
    profileStatus: normalizeStatus(x.profile_status),
  }));
}

// ADMIN: Get caregiver details + uploaded documents for verification page
async function getCaregiverVerificationDetails(caregiverId) {
  const cq = `
    SELECT
      c.caregiver_id,
      c.full_name,
      c.profile_status,
      c.verification_badges,
      c.profile_image_url,
      (
        SELECT MAX(uploaded_at)
        FROM caregiver_document d
        WHERE d.caregiver_fk = c.caregiver_id
      ) AS requested_at
    FROM caregiver c
    WHERE c.caregiver_id = $1
    LIMIT 1
  `;
  const cRes = await db.query(cq, [caregiverId]);

  if (cRes.rows.length === 0) {
    throw new Error("Caregiver not found.");
  }

  const dq = `
    SELECT
      document_id,
      document_type,
      file_name,
      file_url,
      file_size_kb,
      mime_type,
      verification_status,
      uploaded_at
    FROM caregiver_document
    WHERE caregiver_fk = $1
    ORDER BY uploaded_at DESC, document_id DESC
  `;
  const dRes = await db.query(dq, [caregiverId]);

  const caregiver = cRes.rows[0];
  caregiver.profile_status = normalizeStatus(caregiver.profile_status);
  caregiver.verification_badges = caregiver.verification_badges || [];

  return {
    caregiver,
    documents: dRes.rows.map((row) => ({
      ...row,
      verification_status: normalizeStatus(row.verification_status),
    })),
  };
}

// ADMIN: APPROVE / REJECT caregiver
async function updateCaregiverStatus(caregiverId, adminUserId, newStatus, note, badge) {
  const normalized = normalizeStatus(newStatus);
  const allowed = ["VERIFIED", "REJECTED"];

  if (!allowed.includes(normalized)) {
    throw new Error(`Invalid newStatus. Use: ${allowed.join(", ")}`);
  }

  const caregiverQ = `
    SELECT caregiver_id, full_name, profile_status
    FROM caregiver
    WHERE caregiver_id = $1
    LIMIT 1
  `;
  const caregiverRes = await db.query(caregiverQ, [caregiverId]);

  if (!caregiverRes.rows[0]) {
    throw new Error("Caregiver not found.");
  }

  const finalBadges = normalized === "VERIFIED" ? [badge || "Training Verified"] : [];
  const docStatus = normalized === "VERIFIED" ? "APPROVED" : "REJECTED";

  try {
    await db.query("BEGIN");

    const updateCaregiverQ = `
      UPDATE caregiver
      SET
        profile_status = $2,
        verification_badges = $3
      WHERE caregiver_id = $1
      RETURNING caregiver_id, full_name, profile_status, verification_badges
    `;
    const updatedCaregiverRes = await db.query(updateCaregiverQ, [
      caregiverId,
      normalized,
      finalBadges,
    ]);

    const updateDocsQ = `
      UPDATE caregiver_document
      SET verification_status = $2
      WHERE caregiver_fk = $1
    `;
    await db.query(updateDocsQ, [caregiverId, docStatus]);

    await db.query("COMMIT");

    return {
      ...updatedCaregiverRes.rows[0],
      profile_status: normalizeStatus(updatedCaregiverRes.rows[0].profile_status),
      admin_note: note || null,
      updated_by: adminUserId,
      documents_status: docStatus,
    };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

// ADMIN: LIST COMPLAINTS
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
      COALESCE(filer_family.full_name, filer_caregiver.full_name) AS filer_name,
      b.booking_status,
      b.service_date,
      f.full_name AS family_name,
      cg.full_name AS caregiver_name
    FROM complaint c
    JOIN "user" u ON u.user_id = c.filer_fk
    JOIN booking b ON b.booking_id = c.booking_fk
    JOIN family f ON f.family_id = b.family_fk
    JOIN caregiver cg ON cg.caregiver_id = b.caregiver_fk
    LEFT JOIN family filer_family ON filer_family.user_fk = c.filer_fk
    LEFT JOIN caregiver filer_caregiver ON filer_caregiver.user_fk = c.filer_fk
    ORDER BY c.submitted_at DESC
  `;
  const r = await db.query(q);
  return r.rows;
}

// ADMIN: RESOLVE COMPLAINT
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

  if (!r.rows[0]) {
    throw new Error("Complaint not found.");
  }

  return r.rows[0];
}

module.exports = {
  fileComplaint,
  getAdminStats,
  getVerificationQueue,
  getCaregiverVerificationDetails,
  updateCaregiverStatus,
  listComplaintsForAdmin,
  resolveComplaint,
};