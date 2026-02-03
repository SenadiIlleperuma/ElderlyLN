const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "150f6913e9b2c600d7463b2b27f027975459ff7416274fd051c33c42dac6a03a";

const getPasswordColumn = async () => {
  const q = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'user'
      AND column_name IN ('password_hash', 'password')
    LIMIT 1;
  `;
  const r = await db.query(q);
  if (!r.rows[0]) {
    throw new Error(`No password column found in "user" table. Expected 'password_hash' or 'password'.`);
  }
  return r.rows[0].column_name;
};

const insertProfile = async (userId, role, full_name, district, client) => {
  if (role === "admin") return;

  if (role === "family") {
    await client.query(
      `INSERT INTO family (user_fk, full_name, district)
       VALUES ($1, $2, $3)`,
      [userId, full_name, district]
    );
  } else if (role === "caregiver") {
    await client.query(
      `INSERT INTO caregiver (user_fk, full_name, district)
       VALUES ($1, $2, $3)`,
      [userId, full_name, district]
    );
  }
};

const registerUser = async (role, email, password, phone_no, full_name, district) => {
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const pwCol = await getPasswordColumn();
    const hashedPassword = await bcrypt.hash(password, 10);

    const userInsertSql = `
      INSERT INTO "user" (email, phone_no, ${pwCol}, role)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, role, email, phone_no
    `;

    const userResult = await client.query(userInsertSql, [
      email,
      phone_no,
      hashedPassword,
      role,
    ]);

    const user = userResult.rows[0];

    await insertProfile(user.user_id, role, full_name, district, client);

    await client.query("COMMIT");

    return {
      user_id: user.user_id,
      role: user.role,
      email: user.email,
      phone_no: user.phone_no,
      full_name,
      district,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      throw new Error("Email or phone number already registered.");
    }
    throw err;
  } finally {
    client.release();
  }
};

const loginUser = async (email, password) => {
  const pwCol = await getPasswordColumn();

  const userResult = await db.query(
    `SELECT user_id, ${pwCol} as password_hash, role, email, phone_no
     FROM "user"
     WHERE email = $1`,
    [email]
  );

  const user = userResult.rows[0];
  if (!user) throw new Error("Invalid email or password.");

  if (!user.password_hash) {
    throw new Error("This account has no password set. Please register again.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) throw new Error("Invalid email or password.");

  let profile = { full_name: null, district: null };

  if (user.role === "family") {
    const p = await db.query(
      `SELECT full_name, district
       FROM family
       WHERE user_fk = $1`,
      [user.user_id]
    );
    if (p.rows[0]) profile = p.rows[0];
  } else if (user.role === "caregiver") {
    const p = await db.query(
      `SELECT full_name, district
       FROM caregiver
       WHERE user_fk = $1`,
      [user.user_id]
    );
    if (p.rows[0]) profile = p.rows[0];
  } else if (user.role === "admin") {
    profile = { full_name: "Admin", district: null };
  }

  const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });

  return {
    token,
    user_id: user.user_id,
    role: user.role,
    email: user.email,
    phone_no: user.phone_no,
    full_name: profile.full_name,
    district: profile.district,
  };
};

module.exports = {
  registerUser,
  loginUser,
};
