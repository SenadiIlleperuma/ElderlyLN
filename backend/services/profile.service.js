const path = require("path");
const db = require("../db");
const { supabase } = require("../utils/supabaseClient");

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

async function getFamilyByUserId(userId) {
  const q = `
    SELECT
      f.family_id,
      f.user_fk,
      f.full_name,
      f.district,
      f.preferred_language,
      f.care_needs,
      f.profile_image_url,
      u.email,
      u.phone_no,
      u.is_active,
      u.deactivated_at
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
      c.caregiver_id,
      c.user_fk,
      c.full_name,
      c.age,
      c.gender,
      c.district,
      c.edu_level,
      c.qualifications,
      c.experience_years,
      c.languages_spoken,
      c.care_category,
      c.service_type,
      c.availability_period,
      c.expected_rate,
      c.avg_rating,
      c.verification_badges,
      c.profile_status,
      c.profile_image_url,
      u.email,
      u.phone_no,
      u.is_active,
      u.deactivated_at
    FROM caregiver c
    JOIN "user" u ON u.user_id = c.user_fk
    WHERE c.user_fk = $1
    LIMIT 1
  `;

  const r = await db.query(q, [userId]);
  if (!r.rows[0]) throw new Error("Caregiver profile not found.");

  const row = r.rows[0];
  row.profile_status = normalizeStatus(row.profile_status);
  row.verification_badges = row.verification_badges || [];
  return row;
}

async function getCaregiverPublicProfileById(caregiverId) {
  const q = `
    SELECT
      c.caregiver_id,
      c.user_fk,
      c.full_name,
      c.age,
      c.gender,
      c.district,
      c.edu_level,
      c.qualifications,
      c.experience_years,
      c.languages_spoken,
      c.care_category,
      c.service_type,
      c.availability_period,
      c.expected_rate,
      c.avg_rating,
      c.verification_badges,
      c.profile_status,
      c.profile_image_url
    FROM caregiver c
    WHERE c.caregiver_id = $1
    LIMIT 1
  `;

  const r = await db.query(q, [caregiverId]);
  if (!r.rows[0]) throw new Error("Caregiver profile not found.");

  const row = r.rows[0];
  row.profile_status = normalizeStatus(row.profile_status);
  row.verification_badges = row.verification_badges || [];
  row.reviews_count = 0;
  return row;
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
    qualifications,
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
      qualifications = COALESCE($4, qualifications),
      experience_years = COALESCE($5, experience_years),
      languages_spoken = COALESCE($6, languages_spoken),
      care_category = COALESCE($7, care_category),
      service_type = COALESCE($8, service_type),
      availability_period = COALESCE($9, availability_period),
      expected_rate = COALESCE($10, expected_rate),
      profile_image_url = COALESCE($11, profile_image_url)
    WHERE user_fk = $1
    `,
    [
      userId,
      full_name,
      district,
      qualifications,
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

async function saveMyCaregiverProfileImage(userId, file) {
  if (!file) {
    throw new Error("Profile image file is required.");
  }

  const caregiver = await getCaregiverByUserId(userId);
  const caregiverId = caregiver.caregiver_id;

  const bucket = process.env.SUPABASE_BUCKET;
  if (!bucket) {
    throw new Error("SUPABASE_BUCKET is not set.");
  }

  const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  const safeBase = path
    .basename(file.originalname || "profile_image", ext)
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 50);

  const storagePath = `caregiver/${caregiverId}/profile/${Date.now()}_${safeBase}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const imageUrl = data?.publicUrl;

  if (!imageUrl) {
    throw new Error("Could not generate public URL for uploaded image.");
  }

  const q = `
    UPDATE caregiver
    SET profile_image_url = $2
    WHERE user_fk = $1
    RETURNING caregiver_id, user_fk, full_name, profile_image_url, profile_status, verification_badges
  `;
  const r = await db.query(q, [userId, imageUrl]);

  if (!r.rows[0]) {
    throw new Error("Caregiver profile not found.");
  }

  const row = r.rows[0];
  row.profile_status = normalizeStatus(row.profile_status);
  row.verification_badges = row.verification_badges || [];

  return row;
}

async function removeMyCaregiverProfileImage(userId) {
  const q = `
    UPDATE caregiver
    SET profile_image_url = NULL
    WHERE user_fk = $1
    RETURNING caregiver_id, user_fk, full_name, profile_image_url, profile_status, verification_badges
  `;
  const r = await db.query(q, [userId]);

  if (!r.rows[0]) {
    throw new Error("Caregiver profile not found.");
  }

  const row = r.rows[0];
  row.profile_status = normalizeStatus(row.profile_status);
  row.verification_badges = row.verification_badges || [];

  return row;
}

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

  const row = r.rows[0];
  row.profile_status = normalizeStatus(row.profile_status);
  row.verification_badges = row.verification_badges || [];
  return row;
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
    ORDER BY uploaded_at DESC, document_id DESC
  `;
  const r = await db.query(q, [caregiverId]);

  return r.rows.map((row) => ({
    ...row,
    verification_status: normalizeStatus(row.verification_status),
  }));
}

async function addMyCaregiverDocument(userId, doc) {
  const caregiverId = await getCaregiverIdByUserId(userId);

  const { document_type, file_url, file_name, file_size_kb, mime_type } = doc;

  const allowedTypes = ["NIC", "POLICE", "CERTIFICATE", "OTHER"];
  const finalType = String(document_type || "").trim().toUpperCase();

  if (!allowedTypes.includes(finalType)) {
    throw new Error(`Invalid document_type. Use: ${allowedTypes.join(", ")}`);
  }

  const verification_status = "UPLOADED";

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
    finalType,
    file_url,
    file_name,
    file_size_kb,
    mime_type,
    verification_status,
  ]);

  const row = r.rows[0];
  row.verification_status = normalizeStatus(row.verification_status);
  return row;
}

async function submitMyCaregiverForVerification(userId) {
  const caregiverId = await getCaregiverIdByUserId(userId);

  const currentQ = `
    SELECT caregiver_id, profile_status
    FROM caregiver
    WHERE caregiver_id = $1
    LIMIT 1
  `;
  const currentRes = await db.query(currentQ, [caregiverId]);

  if (!currentRes.rows[0]) {
    throw new Error("Caregiver profile not found.");
  }

  const currentStatus = normalizeStatus(currentRes.rows[0].profile_status);

  if (currentStatus === "VERIFIED") {
    throw new Error("You are already verified.");
  }

  if (currentStatus === "PENDING_VERIFICATION" || currentStatus === "PENDING") {
    throw new Error("You already submitted documents. Please wait for admin review.");
  }

  const q = `
    SELECT document_type
    FROM caregiver_document
    WHERE caregiver_fk = $1
  `;
  const r = await db.query(q, [caregiverId]);
  const types = [...new Set(r.rows.map((x) => String(x.document_type || "").toUpperCase().trim()))];

  if (!types.includes("NIC") || !types.includes("POLICE")) {
    throw new Error("Please upload NIC and Police Clearance before submitting for verification.");
  }

  try {
    await db.query("BEGIN");

    const upd = `
      UPDATE caregiver
      SET profile_status = 'PENDING_VERIFICATION'
      WHERE caregiver_id = $1
      RETURNING caregiver_id, profile_status
    `;
    const u = await db.query(upd, [caregiverId]);

    await db.query(
      `
      UPDATE caregiver_document
      SET verification_status = 'UNDER_REVIEW'
      WHERE caregiver_fk = $1
        AND UPPER(REPLACE(COALESCE(verification_status, ''), ' ', '_')) IN ('UPLOADED', 'REJECTED')
      `,
      [caregiverId]
    );

    await db.query("COMMIT");

    const row = u.rows[0];
    row.profile_status = normalizeStatus(row.profile_status);
    return row;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
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
  getCaregiverPublicProfileById,
  saveMyCaregiverProfileImage,
  removeMyCaregiverProfileImage,
  getMyCaregiverVerificationStatus,
  listMyCaregiverDocuments,
  addMyCaregiverDocument,
  submitMyCaregiverForVerification,
  deactivateMyAccount,
  reactivateMyAccount,
  deleteMyAccountPermanently,
};