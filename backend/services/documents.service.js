const db = require("../db");
const { supabase } = require("../utils/supabaseClient");

const ALLOWED_TYPES = ["NIC", "POLICE", "CERTIFICATE", "OTHER"];

async function getCaregiverIdByUserId(userId) {
  const r = await db.query(`SELECT caregiver_id FROM caregiver WHERE user_fk = $1 LIMIT 1`, [userId]);
  if (!r.rows[0]) throw new Error("Caregiver profile not found for this user.");
  return r.rows[0].caregiver_id;
}

async function saveCaregiverDocument({ userId, documentType, file }) {
  const type = String(documentType || "").toUpperCase().trim();
  if (!ALLOWED_TYPES.includes(type)) {
    throw new Error(`Invalid document_type. Use: ${ALLOWED_TYPES.join(", ")}`);
  }

  const caregiverId = await getCaregiverIdByUserId(userId);

  // ---- Upload to Supabase Storage ----
  const bucket = process.env.SUPABASE_BUCKET;

  const safeName = (file.originalname || `doc_${Date.now()}`).replace(/\s+/g, "_");
  const path = `caregiver/${caregiverId}/${Date.now()}_${type}_${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const fileUrl = data.publicUrl;

  // ---- Save DB record ----
  const fileName = safeName;
  const mimeType = file.mimetype;
  const sizeKb = Math.ceil((file.size || 0) / 1024);

  const insertQ = `
    INSERT INTO caregiver_document
      (caregiver_fk, document_type, file_url, file_name, file_size_kb, mime_type, verification_status, uploaded_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, 'UPLOADED', NOW())
    RETURNING
      document_id, caregiver_fk, document_type, file_url, file_name, file_size_kb, mime_type, verification_status, uploaded_at
  `;
  const ins = await db.query(insertQ, [caregiverId, type, fileUrl, fileName, sizeKb, mimeType]);

  return ins.rows[0];
}