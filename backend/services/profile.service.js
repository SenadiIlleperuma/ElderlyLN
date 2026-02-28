// services/profile.service.js
const db = require("../db");

async function getFamilyByUserId(userId) {
  const q = `
    SELECT
      f.family_id, f.user_fk, f.full_name, f.district, f.preferred_language,
      f.care_needs, f.profile_image_url,
      u.email, u.phone_no, u.is_active, u.deactivated_at
    FROM family f
    JOIN "user" u ON u.user_id = f.user_fk
    WHERE f.user_fk = $1
    LIMIT 1
  `;
  const r = await db.query(q, [userId]);
  if (!r.rows[0]) throw new Error("Family profile not found.");
  return r.rows[0];
}

async function getCaregiverByUserId(userId) {
  const q = `
    SELECT
      c.caregiver_id, c.user_fk, c.full_name, c.district,
      c.experience_years, c.languages_spoken, c.care_category,
      c.service_type, c.availability_period, c.expected_rate,
      c.profile_image_url,
      c.profile_status,
      c.verification_badges,
      u.email, u.phone_no, u.is_active, u.deactivated_at
    FROM caregiver c
    JOIN "user" u ON u.user_id = c.user_fk
    WHERE c.user_fk = $1
    LIMIT 1
  `;
  const r = await db.query(q, [userId]);
  if (!r.rows[0]) throw new Error("Caregiver profile not found.");

  console.log("[DB getCaregiverByUserId] userId:", userId, "caregiver_id:", r.rows[0].caregiver_id, "status:", r.rows[0].profile_status);

  return r.rows[0];
}

async function getMyFamilyProfile(userId) {
  return await getFamilyByUserId(userId);
}

async function updateMyFamilyProfile(userId, payload) {
  const {
    full_name,
    district,
    preferred_language,
    care_needs,
    profile_image_url,
    email,
    phone_no,
  } = payload;

  await db.query(
    `
    UPDATE family
    SET
      full_name = COALESCE($2, full_name),
      district = COALESCE($3, district),
      preferred_language = COALESCE($4, preferred_language),
      care_needs = COALESCE($5, care_needs),
      profile_image_url = COALESCE($6, profile_image_url)
    WHERE user_fk = $1
    `,
    [userId, full_name, district, preferred_language, care_needs, profile_image_url]
  );

  await db.query(
    `
    UPDATE "user"
    SET
      email = COALESCE($2, email),
      phone_no = COALESCE($3, phone_no)
    WHERE user_id = $1
    `,
    [userId, email, phone_no]
  );

  return await getFamilyByUserId(userId);
}

async function getMyCaregiverProfile(userId) {
  return await getCaregiverByUserId(userId);
}

async function updateMyCaregiverProfile(userId, payload) {
  const {
    full_name,
    district,
    experience_years,
    languages_spoken,
    care_category,
    service_type,
    availability_period,
    expected_rate,
    profile_image_url,
    email,
    phone_no,
  } = payload;

  await db.query(
    `
    UPDATE caregiver
    SET
      full_name = COALESCE($2, full_name),
      district = COALESCE($3, district),
      experience_years = COALESCE($4, experience_years),
      languages_spoken = COALESCE($5, languages_spoken),
      care_category = COALESCE($6, care_category),
      service_type = COALESCE($7, service_type),
      availability_period = COALESCE($8, availability_period),
      expected_rate = COALESCE($9, expected_rate),
      profile_image_url = COALESCE($10, profile_image_url)
    WHERE user_fk = $1
    `,
    [
      userId,
      full_name,
      district,
      experience_years,
      languages_spoken,
      care_category,
      service_type,
      availability_period,
      expected_rate,
      profile_image_url,
    ]
  );

  await db.query(
    `
    UPDATE "user"
    SET
      email = COALESCE($2, email),
      phone_no = COALESCE($3, phone_no)
    WHERE user_id = $1
    `,
    [userId, email, phone_no]
  );

  return await getCaregiverByUserId(userId);
}

// CAREGIVER VERIFICATION HELPERS
async function getCaregiverIdByUserId(userId) {
  const q = `SELECT caregiver_id FROM caregiver WHERE user_fk = $1 LIMIT 1`;
  const r = await db.query(q, [userId]);
  if (!r.rows[0]) throw new Error("Caregiver profile not found.");
  return r.rows[0].caregiver_id;
}

async function getMyCaregiverVerificationStatus(userId) {
  const q = `
    SELECT caregiver_id, profile_status, verification_badges
    FROM caregiver
    WHERE user_fk = $1
    LIMIT 1
  `;
  const r = await db.query(q, [userId]);
  if (!r.rows[0]) throw new Error("Caregiver profile not found.");
  return r.rows[0];
}

async function listMyCaregiverDocuments(userId) {
  const caregiverId = await getCaregiverIdByUserId(userId);

  const q = `
    SELECT
      document_id,
      caregiver_fk,
      document_type,
      file_url,
      file_name,
      file_size_kb,
      mime_type,
      verification_status,
      uploaded_at
    FROM caregiver_document
    WHERE caregiver_fk = $1
    ORDER BY uploaded_at DESC
  `;
  const r = await db.query(q, [caregiverId]);
  return r.rows;
}

async function addMyCaregiverDocument(userId, doc) {
  const caregiverId = await getCaregiverIdByUserId(userId);

  const {
    document_type,
    file_url,
    file_name,
    file_size_kb,
    mime_type,
  } = doc;

  const allowedTypes = ["NIC", "POLICE", "CERTIFICATE"];
  if (!allowedTypes.includes(document_type)) {
    throw new Error(`Invalid document_type. Use: ${allowedTypes.join(", ")}`);
  }

  const verification_status = "PENDING";

  const q = `
    INSERT INTO caregiver_document
      (caregiver_fk, document_type, file_url, file_name, file_size_kb, mime_type, verification_status, uploaded_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING
      document_id, caregiver_fk, document_type, file_url, file_name, file_size_kb, mime_type, verification_status, uploaded_at
  `;
  const r = await db.query(q, [
    caregiverId,
    document_type,
    file_url,
    file_name,
    file_size_kb,
    mime_type,
    verification_status,
  ]);

  return r.rows[0];
}

async function submitMyCaregiverForVerification(userId) {
  const caregiverId = await getCaregiverIdByUserId(userId);

  const q = `
    SELECT document_type
    FROM caregiver_document
    WHERE caregiver_fk = $1
  `;
  const r = await db.query(q, [caregiverId]);
  const types = r.rows.map((x) => x.document_type);

  if (!types.includes("NIC") || !types.includes("POLICE")) {
    throw new Error("Please upload NIC and Police Clearance before submitting for verification.");
  }

  const upd = `
    UPDATE caregiver
    SET profile_status = 'PENDING_VERIFICATION'
    WHERE caregiver_id = $1
    RETURNING caregiver_id, profile_status
  `;
  const u = await db.query(upd, [caregiverId]);
  return u.rows[0];
}

async function deactivateMyAccount(userId) {
  const q = `
    UPDATE "user"
    SET is_active = FALSE,
        deactivated_at = NOW()
    WHERE user_id = $1
    RETURNING user_id, is_active, deactivated_at
  `;
  const r = await db.query(q, [userId]);
  return r.rows[0];
}

async function reactivateMyAccount(userId) {
  const q = `
    UPDATE "user"
    SET is_active = TRUE,
        deactivated_at = NULL
    WHERE user_id = $1
    RETURNING user_id, is_active
  `;
  const r = await db.query(q, [userId]);
  return r.rows[0];
}

async function deleteMyAccountPermanently(userId) {
  const q = `DELETE FROM "user" WHERE user_id = $1 RETURNING user_id`;
  const r = await db.query(q, [userId]);
  if (!r.rows[0]) throw new Error("Account not found.");
  return { deleted: true };
}

module.exports = {
  getMyFamilyProfile,
  updateMyFamilyProfile,
  getMyCaregiverProfile,
  updateMyCaregiverProfile,

  getMyCaregiverVerificationStatus,
  listMyCaregiverDocuments,
  addMyCaregiverDocument,
  submitMyCaregiverForVerification,

  deactivateMyAccount,
  reactivateMyAccount,
  deleteMyAccountPermanently,
};