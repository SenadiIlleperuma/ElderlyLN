const express = require("express");
const router = express.Router();
const mlService = require("../services/ml.service");
const profileService = require("../services/profile.service");
const { authenticateToken } = require("../middleware/auth.middleware");

function getMatchCaregiverId(match) {
  const raw =
    match?.caregiver_id ??
    match?.caregiverId ??
    match?.id ??
    null;

  const caregiverId = Number(raw);
  return Number.isNaN(caregiverId) ? null : caregiverId;
}

router.post("/search", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "family") {
      return res.status(403).json({
        message: "Forbidden: Only families can search for caregivers.",
      });
    }

    const filters = {
      district: req.body.district || "",
      careCategory: req.body.careCategory || "",
      serviceType: req.body.serviceType || "",
      timePeriod: req.body.timePeriod || "",
      needs: req.body.needs || "",
    };

    console.log("Searching with filters:", filters);

    const matches = await mlService.getPredictions(filters);

    const enrichedMatches = await Promise.all(
      (matches || []).map(async (match) => {
        try {
          const caregiverId = getMatchCaregiverId(match);

          if (!caregiverId) {
            return match;
          }

          const profile = await profileService.getCaregiverPublicProfileById(caregiverId);

          return {
            ...match,

            // ids
            caregiver_id:
              match?.caregiver_id ??
              match?.caregiverId ??
              profile?.caregiver_id,
            caregiverId:
              match?.caregiverId ??
              match?.caregiver_id ??
              profile?.caregiver_id,
            id:
              match?.id ??
              match?.caregiver_id ??
              match?.caregiverId ??
              profile?.caregiver_id,

            // name
            name:
              match?.name ??
              match?.full_name ??
              profile?.full_name ??
              "Caregiver",
            full_name:
              match?.full_name ??
              match?.name ??
              profile?.full_name ??
              "Caregiver",

            // image
            profile_image_url:
              match?.profile_image_url ??
              match?.profileImageUrl ??
              profile?.profile_image_url ??
              "",
            profileImageUrl:
              match?.profileImageUrl ??
              match?.profile_image_url ??
              profile?.profile_image_url ??
              "",

            // district
            district:
              match?.district ??
              profile?.district ??
              "",

            // experience
            experience_years:
              match?.experience_years ??
              match?.years_experience ??
              match?.experienceYears ??
              profile?.experience_years ??
              0,
            years_experience:
              match?.years_experience ??
              match?.experience_years ??
              match?.experienceYears ??
              profile?.experience_years ??
              0,
            experienceYears:
              match?.experienceYears ??
              match?.experience_years ??
              match?.years_experience ??
              profile?.experience_years ??
              0,

            // rating
            avg_rating:
              match?.avg_rating ??
              match?.rating ??
              profile?.avg_rating ??
              0,
            rating:
              match?.rating ??
              match?.avg_rating ??
              profile?.avg_rating ??
              0,

            // reviews
            reviews_count:
              match?.reviews_count ??
              match?.reviewsCount ??
              profile?.reviews_count ??
              0,
            reviewsCount:
              match?.reviewsCount ??
              match?.reviews_count ??
              profile?.reviews_count ??
              0,

            // other useful fields for profile screen
            qualifications:
              match?.qualifications ??
              profile?.qualifications ??
              [],
            languages_spoken:
              match?.languages_spoken ??
              profile?.languages_spoken ??
              [],
            care_category:
              match?.care_category ??
              match?.specialties ??
              profile?.care_category ??
              [],
            specialties:
              match?.specialties ??
              match?.care_category ??
              profile?.care_category ??
              [],
            service_type:
              match?.service_type ??
              profile?.service_type ??
              "",
            availability_period:
              match?.availability_period ??
              profile?.availability_period ??
              "",
            expected_rate:
              match?.expected_rate ??
              match?.rate ??
              profile?.expected_rate ??
              0,
            profile_status:
              match?.profile_status ??
              profile?.profile_status ??
              "",
            verification_badges:
              match?.verification_badges ??
              profile?.verification_badges ??
              [],
          };
        } catch (innerErr) {
          console.log("Match enrichment skipped:", innerErr?.message || innerErr);
          return match;
        }
      })
    );

    console.log(`Found ${enrichedMatches.length} matches`);
    return res.status(200).json({ matches: enrichedMatches });
  } catch (err) {
    console.error("Matching search error:", err);
    return res.status(500).json({
      message: "Search failed.",
      error: err.message,
    });
  }
});

module.exports = router;