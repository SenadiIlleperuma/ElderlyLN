const { spawn } = require("child_process");
const path = require("path");
const db = require("../db");

const ML_MODEL_PATH = path.join(__dirname, "../../elderlyLn-ml/caregiver_matcher.pkl");
const PYTHON_SCRIPT_PATH = path.join(__dirname, "../ml/predict.py");

const SERVICE_TYPE_MAP = {
  care_only: ["Looking after", "Looking after only", "Looking after, All-around care"],
  supervise_only: ["Supervising"],
  all_around: ["All-around", "All Around", "All-around care"],
  cook_and_care: ["Cooking + looking after", "Cooking and looking after"],
};

const TIME_PERIOD_MAP = {
  hourly: ["Hourly"],
  half_day: ["Half-day", "Half day"],
  full_day: ["Full-day", "Full day"],
  live_in: ["Live In", "Live-in"],
};

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeText = (v) => (v === null || v === undefined ? "" : String(v));

const normalizeArrayFromDB = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  const s = String(v).trim();
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
};

const computeHourlyRate = (expectedSalary, preferredTime) => {
  const salary = toNumber(expectedSalary, 0);
  const period = normalizeText(preferredTime).toLowerCase();
  if (!salary) return 0;

  if (period.includes("hour")) return salary;
  if (period.includes("half")) return Math.round(salary / 4);
  if (period.includes("full")) return Math.round(salary / 8);
  if (period.includes("live")) return Math.round(salary / 24);

  return salary;
};

const getCaregiversFromDB = async (filters) => {
  let sql = `
    SELECT
      c.caregiver_id,
      c.user_fk,
      c.full_name AS name,
      c.district,
      c.age,
      c.gender,
      c.edu_level AS education_level,

      COALESCE(array_to_string(c.qualifications, ', '), '') AS qualification,
      COALESCE(c.experience_years, 0) AS years_experience,
      COALESCE(array_to_string(c.languages_spoken, ', '), '') AS languages_spoken,
      COALESCE(array_to_string(c.care_category, ', '), '') AS care_category,

      c.service_type AS care_service_type,
      c.availability_period AS preferred_time,

      COALESCE(c.expected_rate, 0) AS expected_salary,
      COALESCE(c.avg_rating, 0) AS rating
    FROM caregiver c
    JOIN "user" u ON c.user_fk = u.user_id
    WHERE u.role = 'caregiver'
      AND c.profile_status = ANY($1::text[])
  `;

  const params = [[ "Verified", "Pending Verification" ]];
  let i = 2;

  if (filters.district && filters.district.trim() !== "") {
    sql += ` AND LOWER(c.district) = LOWER($${i})`;
    params.push(filters.district);
    i++;
  }

  if (filters.careCategory && filters.careCategory.trim() !== "") {
    sql += `
      AND EXISTS (
        SELECT 1
        FROM unnest(c.care_category) AS cc(item)
        WHERE LOWER(cc.item) LIKE LOWER($${i})
      )
    `;
    params.push(`%${filters.careCategory}%`);
    i++;
  }

  if (filters.serviceType && filters.serviceType.trim() !== "") {
    const allowed = SERVICE_TYPE_MAP[filters.serviceType] || [];
    if (allowed.length > 0) {
      sql += ` AND (`;
      allowed.forEach((val, idx) => {
        if (idx > 0) sql += ` OR `;
        sql += ` LOWER(c.service_type) = LOWER($${i}) `;
        params.push(val);
        i++;
      });
      sql += `)`;
    } else {
      sql += ` AND LOWER(c.service_type) LIKE LOWER($${i})`;
      params.push(`%${filters.serviceType}%`);
      i++;
    }
  }

  if (filters.timePeriod && filters.timePeriod.trim() !== "") {
    const allowed = TIME_PERIOD_MAP[filters.timePeriod] || [];
    if (allowed.length > 0) {
      sql += ` AND (`;
      allowed.forEach((val, idx) => {
        if (idx > 0) sql += ` OR `;
        sql += ` LOWER(c.availability_period) = LOWER($${i}) `;
        params.push(val);
        i++;
      });
      sql += `)`;
    } else {
      sql += ` AND LOWER(c.availability_period) LIKE LOWER($${i})`;
      params.push(`%${filters.timePeriod}%`);
      i++;
    }
  }

  if (filters.needs && filters.needs.trim() !== "") {
    sql += `
      AND (
        LOWER(array_to_string(c.qualifications, ',')) LIKE LOWER($${i})
        OR LOWER(array_to_string(c.languages_spoken, ',')) LIKE LOWER($${i})
        OR LOWER(array_to_string(c.care_category, ',')) LIKE LOWER($${i})
      )
    `;
    params.push(`%${filters.needs}%`);
    i++;
  }

  const result = await db.query(sql, params);
  return result.rows;
};

const runMLPrediction = (caregivers, familyRequirements) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [
      PYTHON_SCRIPT_PATH,
      JSON.stringify({ caregivers, familyRequirements }),
      ML_MODEL_PATH,
    ]);

    let out = "";
    let err = "";

    pythonProcess.stdout.on("data", (d) => (out += d.toString()));
    pythonProcess.stderr.on("data", (d) => (err += d.toString()));

    pythonProcess.on("close", (code) => {
      if (code !== 0) return reject(new Error("ML prediction failed: " + err));
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error("Failed to parse ML results: " + out));
      }
    });
  });
};

const getPredictions = async (filters) => {
  const caregivers = await getCaregiversFromDB(filters);
  if (caregivers.length === 0) return [];

  console.log(`Found ${caregivers.length} caregivers in DB, running ML...`);
  const matches = await runMLPrediction(caregivers, filters);

  const byId = new Map();
  caregivers.forEach((c) => byId.set(String(c.caregiver_id), c));

  const merged = (matches || [])
    .map((m) => {
      const cid = String(m.caregiver_id || m.caregiverId || m.id || "");
      const base = byId.get(cid);
      if (!base) return null;

      return {
        ...m,

        id: cid,
        caregiver_id: cid,

        name: base.name,
        district: base.district,
        rating: Number(base.rating) || 0,
        reviewsCount: Number(base.reviews_count) || 0,

        care_service_type: base.care_service_type,
        preferred_time: base.preferred_time,
        languages_spoken: base.languages_spoken,

        expected_rate: Number(base.expected_salary) || 0,
        years_experience: Number(base.years_experience) || 0,

        care_category: base.care_category,
        qualification: base.qualification,
      };
    })
    .filter(Boolean);

  return merged;
};
module.exports = { getPredictions };
