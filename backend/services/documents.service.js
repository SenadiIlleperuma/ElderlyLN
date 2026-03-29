const db = require("../db");
const { supabase } = require("../utils/supabaseClient");
const notificationService = require("./notification.service");

const ALLOWED_TYPES = ["NIC", "POLICE", "CERTIFICATE", "OTHER"];

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

async function getCaregiverProfileByUserId(userId) {
  const q = `
    SELECT caregiver_id, profile_status, verification_badges
    FROM caregiver
    WHERE user_fk = $1
    LIMIT 1
  `;
  const r = await db.query(q, [userId]);

  if (!r.rows[0]) {
    throw new Error("Caregiver profile not found for this user.");
  }

  return r.rows[0];
}

async function saveCaregiverDocument({ userId, documentType, file }) {
  const type = String(documentType || "").toUpperCase().trim();

  if (!ALLOWED_TYPES.includes(type)) {
    throw new Error(`Invalid document_type. Use: ${ALLOWED_TYPES.join(", ")}`);
  }

  if (!file) {
    throw new Error("File is required.");
  }

  const caregiver = await getCaregiverProfileByUserId(userId);
  const caregiverId = caregiver.caregiver_id;
  const profileStatus = normalizeStatus(caregiver.profile_status);

  if (profileStatus === "VERIFIED") {
    throw new Error("You are already verified. Re-upload is not allowed right now.");
  }

  const bucket = process.env.SUPABASE_BUCKET;
  if (!bucket) {
    throw new Error("SUPABASE_BUCKET is not set.");
  }

  const safeName = (file.originalname || `doc_${Date.now()}`).replace(/\s+/g, "_");
  const storagePath = `caregiver/${caregiverId}/${Date.now()}_${type}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const fileUrl = publicUrlData.publicUrl;

  const fileName = safeName;
  const mimeType = file.mimetype || null;
  const sizeKb = file.size ? Math.ceil(file.size / 1024) : null;

  const insertQ = `
    INSERT INTO caregiver_document
      (
        caregiver_fk,
        document_type,
        file_url,
        file_name,
        file_size_kb,
        mime_type,
        verification_status,
        uploaded_at
      )
    VALUES
      ($1, $2, $3, $4, $5, $6, 'UPLOADED', NOW())
    RETURNING
      document_id,
      caregiver_fk,
      document_type,
      file_url,
      file_name,
      file_size_kb,
      mime_type,
      verification_status,
      uploaded_at
  `;

  const ins = await db.query(insertQ, [
    caregiverId,
    type,
    fileUrl,
    fileName,
    sizeKb,
    mimeType,
  ]);

  return ins.rows[0];
}

async function listMyCaregiverDocuments(userId) {
  const caregiver = await getCaregiverProfileByUserId(userId);
  const caregiverId = caregiver.caregiver_id;

  const docsQ = `
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

  const docsRes = await db.query(docsQ, [caregiverId]);

  return {
    caregiver: {
      caregiver_id: caregiver.caregiver_id,
      profile_status: caregiver.profile_status,
      verification_badges: caregiver.verification_badges || [],
    },
    documents: docsRes.rows.map((row) => ({
      ...row,
      verification_status: normalizeStatus(row.verification_status),
      document_type: String(row.document_type || "").toUpperCase().trim(),
    })),
  };
}

async function listCaregiverDocumentsByCaregiverId(caregiverId) {
  const caregiverQ = `
    SELECT
      caregiver_id,
      full_name,
      profile_status,
      verification_badges,
      profile_image_url
    FROM caregiver
    WHERE caregiver_id = $1
    LIMIT 1
  `;
  const caregiverRes = await db.query(caregiverQ, [caregiverId]);

  if (!caregiverRes.rows[0]) {
    throw new Error("Caregiver not found.");
  }

  const docsQ = `
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

  const docsRes = await db.query(docsQ, [caregiverId]);

  return {
    caregiver: {
      ...caregiverRes.rows[0],
      profile_status: normalizeStatus(caregiverRes.rows[0].profile_status),
      verification_badges: caregiverRes.rows[0].verification_badges || [],
    },
    documents: docsRes.rows.map((row) => ({
      ...row,
      verification_status: normalizeStatus(row.verification_status),
      document_type: String(row.document_type || "").toUpperCase().trim(),
    })),
  };
}

async function submitForVerification(userId) {
  const caregiver = await getCaregiverProfileByUserId(userId);
  const caregiverId = caregiver.caregiver_id;
  const currentStatus = normalizeStatus(caregiver.profile_status);

  if (currentStatus === "VERIFIED") {
    throw new Error("You are already verified.");
  }

  if (currentStatus === "PENDING_VERIFICATION" || currentStatus === "PENDING") {
    throw new Error("You already submitted documents. Please wait for admin review.");
  }

  const docsQ = `
    SELECT
      document_id,
      document_type,
      verification_status,
      file_name
    FROM caregiver_document
    WHERE caregiver_fk = $1
  `;
  const docsRes = await db.query(docsQ, [caregiverId]);

  if (docsRes.rows.length === 0) {
    throw new Error("Please upload at least one document before submitting for verification.");
  }

  try {
    await db.query("BEGIN");

    const updateCaregiverQ = `
      UPDATE caregiver
      SET
        profile_status = 'PENDING_VERIFICATION'
      WHERE caregiver_id = $1
      RETURNING caregiver_id, profile_status, verification_badges
    `;
    const caregiverRes = await db.query(updateCaregiverQ, [caregiverId]);

    if (!caregiverRes.rows[0]) {
      throw new Error("Caregiver not found.");
    }

    const updateDocsQ = `
      UPDATE caregiver_document
      SET verification_status = 'UNDER_REVIEW'
      WHERE caregiver_fk = $1
        AND UPPER(REPLACE(COALESCE(verification_status, ''), ' ', '_')) IN ('UPLOADED', 'REJECTED')
    `;
    await db.query(updateDocsQ, [caregiverId]);

    await db.query("COMMIT");

    // Get caregiver name for admin notification
    const caregiverNameQ = `
      SELECT u.full_name
      FROM caregiver c
      JOIN "user" u ON c.user_fk = u.user_id
      WHERE c.caregiver_id = $1
      LIMIT 1
    `;
    const caregiverNameRes = await db.query(caregiverNameQ, [caregiverId]);
    const caregiverName = caregiverNameRes.rows[0]?.full_name || "A caregiver";

    // Notify all admins
    await notificationService.notifyAllAdmins({
      title: "New caregiver verification request",
      message: `${caregiverName} has submitted documents for verification.`,
      type: "VERIFICATION",
      relatedEntityType: "caregiver",
      relatedEntityId: caregiverId,
    });

    return caregiverRes.rows[0];
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

module.exports = {
  saveCaregiverDocument,
  listMyCaregiverDocuments,
  listCaregiverDocumentsByCaregiverId,
  submitForVerification,
};