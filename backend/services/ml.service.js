const { spawn } = require("child_process");
const path = require("path");
const db = require("../db");

// ML model and Python script paths
const ML_MODEL_PATH = path.join(__dirname, "../../elderlyLn-ml/elderlyln_matcher_final.pkl");
const PYTHON_SCRIPT_PATH = path.join(__dirname, "../ml/predict.py");

// Maps frontend service filters to DB values
const SERVICE_TYPE_MAP = {
  care_only: ["Looking after", "Looking after only", "Looking after, All-around care"],
  supervise_only: ["Supervising"],
  all_around: ["All-around", "All Around", "All-around care"],
  cook_and_care: ["Cooking + looking after", "Cooking and looking after"],
};

// Maps frontend time filters to DB values
const TIME_PERIOD_MAP = {
  hourly: ["Hourly"],
  half_day: ["Half-day", "Half day"],
  full_day: ["Full-day", "Full day"],
  live_in: ["Live In", "Live-in"],
};

// Safe number conversion
const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Safe text normalization
const normalizeText = (v) => (v === null || v === undefined ? "" : String(v).trim());

// Converts DB arrays/strings to clean arrays
const normalizeArrayFromDB = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);

  let s = String(v).trim();
  if (!s) return [];

  if (s.startsWith("{") && s.endsWith("}")) {
    s = s.slice(1, -1);
  }

  return s.split(",").map((x) => x.trim()).filter(Boolean);
};

// Normalizes caregiver profile status
const normalizeProfileStatus = (status) => {
  const s = normalizeText(status).toUpperCase().replace(/\s+/g, "_");
  if (s === "VERIFIED") return "VERIFIED";
  if (s === "PENDING_VERIFICATION" || s === "PENDING") return "PENDING_VERIFICATION";
  if (s === "REJECTED") return "REJECTED";
  return s || "UNKNOWN";
};

// Priority used for sorting
const statusPriority = (status) => {
  const normalized = normalizeProfileStatus(status);
  if (normalized === "VERIFIED") return 3;
  if (normalized === "PENDING_VERIFICATION") return 2;
  if (normalized === "REJECTED") return 1;
  return 0;
};

// Converts expected salary to hourly rate
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

// Gets caregivers from DB using filters
const getCaregiversFromDB = async (filters = {}) => {
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
      COALESCE(c.avg_rating, 0) AS rating,
      c.profile_status,
      COALESCE(u.role, 'caregiver') AS user_role
    FROM caregiver c
    LEFT JOIN "user" u ON c.user_fk = u.user_id
    WHERE 1=1
  `;

  const params = [];
  let i = 1;

  if (filters.district && filters.district.trim() !== "") {
    sql += ` AND LOWER(c.district) = LOWER($${i})`;
    params.push(filters.district.trim());
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
    params.push(`%${filters.careCategory.trim()}%`);
    i++;
  }

  if (filters.serviceType && filters.serviceType.trim() !== "") {
    const allowed = SERVICE_TYPE_MAP[filters.serviceType] || [];

    if (allowed.length > 0) {
      sql += ` AND (`;
      allowed.forEach((val, idx) => {
        if (idx > 0) sql += ` OR `;
        sql += `LOWER(c.service_type) = LOWER($${i})`;
        params.push(val);
        i++;
      });
      sql += `)`;
    } else {
      sql += ` AND LOWER(c.service_type) LIKE LOWER($${i})`;
      params.push(`%${filters.serviceType.trim()}%`);
      i++;
    }
  }

  if (filters.timePeriod && filters.timePeriod.trim() !== "") {
    const allowed = TIME_PERIOD_MAP[filters.timePeriod] || [];

    if (allowed.length > 0) {
      sql += ` AND (`;
      allowed.forEach((val, idx) => {
        if (idx > 0) sql += ` OR `;
        sql += `LOWER(c.availability_period) = LOWER($${i})`;
        params.push(val);
        i++;
      });
      sql += `)`;
    } else {
      sql += ` AND LOWER(c.availability_period) LIKE LOWER($${i})`;
      params.push(`%${filters.timePeriod.trim()}%`);
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
    params.push(`%${filters.needs.trim()}%`);
    i++;
  }

  const result = await db.query(sql, params);
  return result.rows;
};

// Runs Python ML prediction
const runMLPrediction = (caregivers, familyRequirements) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ caregivers, familyRequirements });

    const pythonProcess = spawn("python3", [
      PYTHON_SCRIPT_PATH,
      payload,
      ML_MODEL_PATH,
    ]);

    let out = "";
    let err = "";

    pythonProcess.stdout.on("data", (d) => {
      out += d.toString();
    });

    pythonProcess.stderr.on("data", (d) => {
      err += d.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error("ML prediction failed: " + err));
      }

      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error("Failed to parse ML results: " + out));
      }
    });
  });
};

// Sorts final results
const sortWithStatusPriority = (items) => {
  return items.sort((a, b) => {
    const matchDiff = toNumber(b.matchPercent, 0) - toNumber(a.matchPercent, 0);
    if (matchDiff !== 0) return matchDiff;

    const statusDiff = statusPriority(b.profile_status) - statusPriority(a.profile_status);
    if (statusDiff !== 0) return statusDiff;

    const expDiff =
      toNumber(b.years_experience ?? b.experienceYears, 0) -
      toNumber(a.years_experience ?? a.experienceYears, 0);
    if (expDiff !== 0) return expDiff;

    const ratingDiff = toNumber(b.rating, 0) - toNumber(a.rating, 0);
    if (ratingDiff !== 0) return ratingDiff;

    return 0;
  });
};

// Fallback results if ML fails
const buildFallbackResults = (caregivers) => {
  const mapped = caregivers.map((cg) => ({
    id: String(cg.caregiver_id),
    caregiver_id: String(cg.caregiver_id),
    name: cg.name || "Unknown",
    district: cg.district || "Unknown",
    rating: toNumber(cg.rating, 0),
    reviewsCount: 0,
    care_service_type: cg.care_service_type || "",
    preferred_time: cg.preferred_time || "",
    languages_spoken: normalizeArrayFromDB(cg.languages_spoken),
    expected_rate: toNumber(cg.expected_salary, 0),
    years_experience: toNumber(cg.years_experience, 0),
    care_category: normalizeArrayFromDB(cg.care_category),
    qualification: normalizeArrayFromDB(cg.qualification),
    about: "Experienced caregiver",
    ratePerHour: computeHourlyRate(cg.expected_salary, cg.preferred_time),
    profile_status: normalizeProfileStatus(cg.profile_status),
    matchPercent: 75,
    rawMatchPercent: 75,
  }));

  return sortWithStatusPriority(mapped);
};
// Main prediction flow
const getPredictions = async (filters = {}) => {
  const caregivers = await getCaregiversFromDB(filters);
  if (caregivers.length === 0) return [];

  console.log(`Found ${caregivers.length} caregivers in DB, running ML...`);
  try {
    const matches = await runMLPrediction(caregivers, filters);

    const byId = new Map();
    caregivers.forEach((c) => byId.set(String(c.caregiver_id), c));

    const merged = (matches || [])
      .map((m) => {
        const original = byId.get(String(m.id));
        if (!original) return null;

        return {
          id: String(original.caregiver_id),
          caregiver_id: String(original.caregiver_id),
          name: m.name || original.name || "Unknown",
          district: m.district || original.district || "Unknown",
          rating: toNumber(m.rating, toNumber(original.rating, 0)),
          reviewsCount: toNumber(m.reviewsCount, 0),
          care_service_type: original.care_service_type || "",
          preferred_time: original.preferred_time || "",
          languages_spoken: normalizeArrayFromDB(original.languages_spoken),
          expected_rate: toNumber(original.expected_salary, 0),
          years_experience: toNumber(
            m.years_experience ?? m.experienceYears,
            toNumber(original.years_experience, 0)
          ),
          experienceYears: toNumber(
            m.experienceYears ?? m.years_experience,
            toNumber(original.years_experience, 0)
          ),
          care_category: normalizeArrayFromDB(original.care_category),
          qualification: normalizeArrayFromDB(original.qualification),
          about: m.about || "Experienced caregiver",
          ratePerHour: computeHourlyRate(original.expected_salary, original.preferred_time),
          profile_status: normalizeProfileStatus(m.profile_status || original.profile_status),
          rawMatchPercent: toNumber(m.rawMatchPercent, toNumber(m.matchPercent, 0)),
          matchPercent: toNumber(m.matchPercent, 0),
        };
      })
      .filter(Boolean);
    if (merged.length === 0) {
      return buildFallbackResults(caregivers);
    }
    return sortWithStatusPriority(merged);
  } catch (error) {
    console.error("ML prediction failed, using fallback:", error.message);
    return buildFallbackResults(caregivers);
  }
};
module.exports = {
  getPredictions,
};