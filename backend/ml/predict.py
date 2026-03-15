import sys
import json
import joblib
import pandas as pd
import numpy as np


def safe_transform(le, value):
    value = "None" if value is None else str(value).strip()
    if value == "":
        value = "None"
    if value not in le.classes_:
        le.classes_ = np.append(le.classes_, value)
    return int(le.transform([value])[0])


def safe_int(value, default=0):
    if value is None:
        return default
    if isinstance(value, str):
        value = value.strip()
        if value == "":
            return default
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default


def safe_float(value, default=0.0):
    if value is None:
        return default
    if isinstance(value, str):
        value = value.strip()
        if value == "":
            return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_str(value, default="None"):
    if value is None:
        return default
    value = str(value).strip()
    return value if value else default


def first_language(val, default="Sinhala"):
    if val is None:
        return default
    if isinstance(val, list):
        return str(val[0]).strip() if len(val) > 0 and str(val[0]).strip() else default

    s = str(val).strip()
    if not s:
        return default

    if s.startswith("{") and s.endswith("}"):
        s = s[1:-1]

    if "," in s:
        first = s.split(",")[0].strip()
        return first if first else default

    return s


def to_list(val):
    if val is None:
        return []
    if isinstance(val, list):
        return [str(x).strip() for x in val if str(x).strip()]

    s = str(val).strip()
    if not s:
        return []

    if s.startswith("{") and s.endswith("}"):
        s = s[1:-1]

    if "," in s:
        return [x.strip() for x in s.split(",") if x.strip()]

    return [s]


def normalize_family_value(value, fallback):
    if value is None:
        return fallback
    s = str(value).strip()
    if s == "":
        return fallback
    if s.lower() == "anywhere":
        return fallback
    return s


def predict_matches(payload, model_path):
    caregivers = payload.get("caregivers", [])
    family = payload.get("familyRequirements", {})

    bundle = joblib.load(model_path)
    model = bundle["model"]
    encoders = bundle["encoders"]
    scaler = bundle["scaler"]
    feature_names = bundle["feature_names"]

    categorical_cols = [
        "Gender",
        "District",
        "Education_Level",
        "Qualification",
        "Languages_Spoken",
        "Care_Category",
        "Care_Service_Type",
        "Preferred_Time",
    ]
    numeric_cols = ["Age", "Years_Experience", "Expected_Salary"]

    rows = []
    for cg in caregivers:
      caregiver_district = safe_str(cg.get("district"), "Colombo")
      caregiver_category = safe_str(cg.get("care_category"), "Elderly")
      caregiver_service_type = safe_str(cg.get("care_service_type"), "Care Only")
      caregiver_preferred_time = safe_str(cg.get("preferred_time"), "Full Day")

      row = {
          "Age": safe_int(cg.get("age"), 30),
          "Gender": safe_str(cg.get("gender"), "Female"),
          "District": normalize_family_value(family.get("district"), caregiver_district),
          "Education_Level": safe_str(cg.get("education_level"), "Diploma"),
          "Qualification": safe_str(cg.get("qualification"), "Caregiver"),
          "Years_Experience": safe_int(cg.get("years_experience"), 3),
          "Languages_Spoken": first_language(cg.get("languages_spoken"), "Sinhala"),
          "Care_Category": normalize_family_value(family.get("careCategory"), caregiver_category),
          "Care_Service_Type": normalize_family_value(family.get("serviceType"), caregiver_service_type),
          "Preferred_Time": normalize_family_value(family.get("timePeriod"), caregiver_preferred_time),
          "Expected_Salary": safe_int(cg.get("expected_salary"), 1000),
      }

      rows.append(row)

    X = pd.DataFrame(rows)

    for col in categorical_cols:
        le = encoders.get(col)
        if le is None:
            X[col] = 0
        else:
            X[col] = X[col].fillna("None").astype(str).apply(lambda v: safe_transform(le, v))

    X[numeric_cols] = X[numeric_cols].fillna(0)
    if scaler is not None:
        X[numeric_cols] = scaler.transform(X[numeric_cols])

    X = X[feature_names]

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)
        classes_list = list(model.classes_)

        if "1" in classes_list:
            idx = classes_list.index("1")
            scores = proba[:, idx]
        elif 1 in classes_list:
            idx = classes_list.index(1)
            scores = proba[:, idx]
        else:
            scores = proba.max(axis=1)
    else:
        pred = model.predict(X)
        scores = np.array(
            [1.0 if str(p) in ["1", "Accepted", "accepted", "True"] else 0.0 for p in pred]
        )

    results = []
    for i, cg in enumerate(caregivers):
        match_percent = int(round(float(scores[i]) * 100))
        match_percent = max(65, min(99, match_percent))

        results.append(
            {
                "id": str(cg.get("caregiver_id") or ""),
                "name": safe_str(cg.get("name"), "Unknown"),
                "district": safe_str(cg.get("district"), "Unknown"),
                "rating": safe_float(cg.get("rating"), 0.0),
                "reviewsCount": safe_int(cg.get("reviews_count"), 0),
                "ratePerHour": safe_int(cg.get("expected_salary"), 0),
                "experienceYears": safe_int(cg.get("years_experience"), 0),
                "about": safe_str(cg.get("about"), "Experienced caregiver"),
                "specialties": to_list(cg.get("specialties") or cg.get("care_category")),
                "qualifications": to_list(cg.get("qualifications_list") or cg.get("qualification")),
                "matchPercent": match_percent,
            }
        )

    results.sort(key=lambda x: x["matchPercent"], reverse=True)
    return results


if __name__ == "__main__":
    try:
        payload = json.loads(sys.argv[1])
        model_path = sys.argv[2]
        matches = predict_matches(payload, model_path)
        print(json.dumps(matches))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)