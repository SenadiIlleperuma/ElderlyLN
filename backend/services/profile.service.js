const db = require("../db");

function assertAllowedRole(role) {
  if (!["family", "caregiver"].includes(role)) {
    throw new Error("Profile actions only supported for family/caregiver.");
  }
}

async function getMyProfile(userId, role) {
  assertAllowedRole(role);

  const u = await db.query(`SELECT user_id, email, phone_no, role, is_active FROM "user" WHERE user_id = $1`, [userId]);
  if (!u.rows[0]) throw new Error("User not found.");
  if (u.rows[0].is_active === false) throw new Error("Account is deactivated.");

  if (role === "family") {
    const q = `
      SELECT
        u.user_id, u.email, u.phone_no, u.role,
        f.family_id, f.full_name, f.district, f.preferred_language, f.care_needs
      FROM "user" u
      JOIN family f ON f.user_fk = u.user_id
      WHERE u.user_id = $1
    `;
    const r = await db.query(q, [userId]);
    if (!r.rows[0]) throw new Error("Family profile not found.");
    return r.rows[0];
  }

  const q = `
    SELECT
      u.user_id, u.email, u.phone_no, u.role,
      c.caregiver_id, c.full_name, c.district, c.languages_spoken, c.service_type, c.availability_period, c.expected_rate
    FROM "user" u
    JOIN caregiver c ON c.user_fk = u.user_id
    WHERE u.user_id = $1
  `;
  const r = await db.query(q, [userId]);
  if (!r.rows[0]) throw new Error("Caregiver profile not found.");
  return r.rows[0];
}

async function updateMyProfile(userId, role, payload) {
  assertAllowedRole(role);

  const u = await db.query(`SELECT is_active FROM "user" WHERE user_id = $1`, [userId]);
  if (!u.rows[0]) throw new Error("User not found.");
  if (u.rows[0].is_active === false) throw new Error("Account is deactivated.");

  const full_name = payload.full_name ?? payload.fullName;
  const district = payload.district;
  const phone_no = payload.phone_no ?? payload.phone;
  const email = payload.email;

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    if (email || phone_no) {
      const fields = [];
      const vals = [];
      let i = 1;

      if (email) { fields.push(`email = $${i++}`); vals.push(email); }
      if (phone_no) { fields.push(`phone_no = $${i++}`); vals.push(phone_no); }

      vals.push(userId);
      await client.query(`UPDATE "user" SET ${fields.join(", ")} WHERE user_id = $${i}`, vals);
    }

    if (role === "family") {
      if (!full_name || !district) throw new Error("full_name and district are required.");

      const q = `
        UPDATE family
        SET full_name = $1, district = $2
        WHERE user_fk = $3
        RETURNING family_id, full_name, district, preferred_language, care_needs
      `;
      const r = await client.query(q, [full_name, district, userId]);
      if (!r.rows[0]) throw new Error("Family profile not found.");
      await client.query("COMMIT");
      return r.rows[0];
    } else {
      if (!full_name || !district) throw new Error("full_name and district are required.");

      const q = `
        UPDATE caregiver
        SET full_name = $1, district = $2
        WHERE user_fk = $3
        RETURNING caregiver_id, full_name, district, languages_spoken, service_type, availability_period, expected_rate
      `;
      const r = await client.query(q, [full_name, district, userId]);
      if (!r.rows[0]) throw new Error("Caregiver profile not found.");
      await client.query("COMMIT");
      return r.rows[0];
    }
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") throw new Error("Email or phone already in use.");
    throw err;
  } finally {
    client.release();
  }
}

async function deactivateAccount(userId) {
  const r = await db.query(
    `UPDATE "user" SET is_active = FALSE, deactivated_at = NOW() WHERE user_id = $1 RETURNING user_id`,
    [userId]
  );
  if (!r.rows[0]) throw new Error("User not found.");
  return true;
}

async function deleteAccount(userId) {
  const r = await db.query(`DELETE FROM "user" WHERE user_id = $1 RETURNING user_id`, [userId]);
  if (!r.rows[0]) throw new Error("User not found.");
  return true;
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  deactivateAccount,
  deleteAccount,
};
