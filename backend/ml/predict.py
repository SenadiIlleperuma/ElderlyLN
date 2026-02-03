import sys
import json
import joblib
import pandas as pd
import numpy as np

def safe_transform(le, value):
    value = "None" if value is None else str(value)
    if value not in le.classes_:
        le.classes_ = np.append(le.classes_, value)
    return int(le.transform([value])[0])

def to_list(val):
    if val is None:
        return []
    if isinstance(val, list):
        return val
    s = str(val).strip()
    if not s:
        return []
    # Handle array format {value1,value2}
    if s.startswith('{') and s.endswith('}'):
        s = s[1:-1]
    if "," in s:
        return [x.strip() for x in s.split(",") if x.strip()]
    return [s]

def predict_matches(payload, model_path):
    caregivers = payload["caregivers"]
    family = payload.get("familyRequirements", {})

    bundle = joblib.load(model_path)
    model = bundle["model"]
    encoders = bundle["encoders"]
    scaler = bundle["scaler"]
    feature_names = bundle["feature_names"]

    categorical_cols = [
        "Gender", "District", "Education_Level", "Qualification",
        "Languages_Spoken", "Care_Category", "Care_Service_Type", "Preferred_Time"
    ]
    numeric_cols = ["Age", "Years_Experience", "Expected_Salary"]

    rows = []
    for cg in caregivers:
        # Extract first language if multiple
        languages = cg.get("languages_spoken", "Sinhala")
        if isinstance(languages, str):
            if ',' in languages:
                languages = languages.split(',')[0].strip()
        
        rows.append({
            "Age": int(cg.get("age", 30)),
            "Gender": str(cg.get("gender", "Female")),
            "District": family.get("district", cg.get("district", "Colombo")) if family.get("district") and family.get("district") != "anywhere" else cg.get("district", "Colombo"),
            "Education_Level": str(cg.get("education_level", "Diploma")),
            "Qualification": str(cg.get("qualification", "Caregiver")),
            "Years_Experience": int(cg.get("years_experience", 3)),
            "Languages_Spoken": str(languages),
            "Care_Category": str(family.get("careCategory", cg.get("care_category", "Elderly"))),
            "Care_Service_Type": str(family.get("serviceType", cg.get("care_service_type", "Care Only"))),
            "Preferred_Time": str(family.get("timePeriod", cg.get("preferred_time", "Full Day"))),
            "Expected_Salary": int(cg.get("expected_salary", 1000)),
        })

    X = pd.DataFrame(rows)

    # Encode categorical columns
    for col in categorical_cols:
        le = encoders.get(col)
        if le is None:
            X[col] = 0
        else:
            X[col] = X[col].fillna("None").astype(str).apply(lambda v: safe_transform(le, v))

    # Scale numeric columns
    X[numeric_cols] = X[numeric_cols].fillna(0)
    if scaler is not None:
        X[numeric_cols] = scaler.transform(X[numeric_cols])

    X = X[feature_names]

    # Predict
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)
        if "1" in list(model.classes_):
            idx = list(model.classes_).index("1")
            scores = proba[:, idx]
        elif 1 in list(model.classes_):
            idx = list(model.classes_).index(1)
            scores = proba[:, idx]
        else:
            scores = proba.max(axis=1)
    else:
        pred = model.predict(X)
        scores = np.array([1.0 if str(p) in ["1", "Accepted", "accepted", "True"] else 0.0 for p in pred])

    results = []
    for i, cg in enumerate(caregivers):
        match_percent = int(round(float(scores[i]) * 100))
        match_percent = max(65, min(99, match_percent))

        results.append({
            "id": str(cg.get("caregiver_id")),
            "name": cg.get("name", "Unknown"),
            "district": cg.get("district", "Unknown"),
            "rating": float(cg.get("rating", 0) or 0),
            "reviewsCount": int(cg.get("reviews_count", 0) or 0),
            "ratePerHour": int(cg.get("expected_salary", 0) or 0),
            "experienceYears": int(cg.get("years_experience", 0) or 0),
            "about": str(cg.get("about", "Experienced caregiver")),
            "specialties": to_list(cg.get("specialties") or cg.get("care_category")),
            "qualifications": to_list(cg.get("qualifications_list") or cg.get("qualification")),
            "matchPercent": match_percent
        })

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