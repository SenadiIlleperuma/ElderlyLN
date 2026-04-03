import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "CaregiverProfile">;

// Clean and safely display values from different caregiver data fields
const displayField = (v: any) => {
  if (v === null || v === undefined) return "-";
  if (Array.isArray(v)) {
    const joined = v.map((x) => String(x).trim()).filter(Boolean).join(", ");
    return joined.length ? joined : "-";
  }

  const s = String(v).trim();
  if (!s) return "-";

  const low = s.toLowerCase();
  if (low === "not_set" || low === "null" || low === "undefined") return "-";

  return s;
};

// Convert various list formats into a clean string array
const parseList = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);

  const s = String(raw).trim();
  if (!s || s.toLowerCase() === "not_set") return [];

  return s.split(",").map((x) => x.trim()).filter(Boolean);
};

function mapDisplayValueToTranslationKey(value: string) {
  const normalized = value.trim().toLowerCase();

  const map: Record<string, string> = {
    "elderly care": "care_elderly",
    "child care": "care_child",
    "disability care": "care_disability",
    "patient care": "care_patient",
    "palliative care": "care_palliative",
    "domestic support": "care_domestic",
    "other": "other",

    "cooking and looking after": "cook_and_care",
    "looking after only": "care_only",
    "supervising only": "supervise_only",
    "all-around care": "all_around",

    "half-day": "half_day",
    "full-day": "full_day",
    "hourly basis": "hourly",
    "live-in caregiver": "live_in",

    "sinhala": "lang_si",
    "english": "lang_en",
    "tamil": "lang_ta",

    "experienced caregiver": "experienced_caregiver",

    "nvq level 2": "qual_nvq_level_2",
    "nvq level 3": "qual_nvq_level_3",
    "nvq level 4": "qual_nvq_level_4",
    "first aid certificate": "qual_first_aid_certificate",
    "diploma in caregiving": "qual_diploma_in_caregiving",
    "short caregiving course": "qual_short_caregiving_course",
    "phlebotomy+mental health": "qual_phlebotomy_mental_health",
    "phlebotomy + mental health": "qual_phlebotomy_mental_health",
  };

  return map[normalized] || null;
}

function translateDisplayValue(value: string, t: (key: string, options?: any) => string) {
  const key = mapDisplayValueToTranslationKey(value);
  return key ? t(key) : value;
}

function translateDisplayList(values: string[], t: (key: string, options?: any) => string) {
  return values.map((value) => translateDisplayValue(String(value).trim(), t));
}

function translateDisplayField(value: any, t: (key: string, options?: any) => string) {
  if (value === null || value === undefined) return "-";

  if (Array.isArray(value)) {
    const translated = translateDisplayList(
      value.map((item) => String(item).trim()).filter(Boolean),
      t
    );
    return translated.length ? translated.join(", ") : "-";
  }

  const raw = displayField(value);
  if (raw === "-") return raw;

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return translateDisplayList(parts, t).join(", ");
  }

  return translateDisplayValue(raw, t);
}

function getNumericValue(...values: any[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return null;
}

// Normalize status values to a consistent format for badge display
function normalizeStatus(value: any) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

// Generate initials for avatar display based on the caregiver's name
function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CaregiverProfileScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { caregiver: initialCaregiver } = route.params;
  const [caregiver, setCaregiver] = useState<any>(initialCaregiver);

  useEffect(() => {
    const caregiverId =
      initialCaregiver?.caregiver_id ??
      initialCaregiver?.caregiverId ??
      initialCaregiver?.caregiver_fk ??
      initialCaregiver?.id;

    if (!caregiverId) return;

    let isMounted = true;

    const loadFreshCaregiver = async () => {
      try {
        const res = await api.get(`/profile/caregiver/${caregiverId}`);

        if (isMounted && res?.data) {
          setCaregiver((prev: any) => ({
            ...prev,
            ...res.data,
            review_count:
              res.data?.review_count ??
              res.data?.reviews_count ??
              prev?.review_count ??
              prev?.reviews_count ??
              0,
            reviews_count:
              res.data?.review_count ??
              res.data?.reviews_count ??
              prev?.review_count ??
              prev?.reviews_count ??
              0,
          }));
        }
      } catch (error: any) {
        console.log(
          "Failed to fetch fresh caregiver profile:",
          error?.response?.data || error?.message || error
        );
      }
    };

    loadFreshCaregiver();

    return () => {
      isMounted = false;
    };
  }, [initialCaregiver]);

  // Determine display name with fallbacks and generate initials for avatar
  const displayName = displayField(caregiver?.name ?? caregiver?.full_name);
  const initials = getInitials(displayName === "-" ? t("caregiver_generic") : displayName);

  // Read rating from available fields
  const ratingSafe =
    getNumericValue(
      caregiver?.rating,
      caregiver?.avg_rating,
      caregiver?.average_rating,
      caregiver?.avgRating
    ) ?? 0;

  // Read reviews count from available fields
  const reviewsSafe =
    getNumericValue(
      caregiver?.review_count,
      caregiver?.reviewCount,
      caregiver?.reviewsCount,
      caregiver?.reviews_count,
      caregiver?.reviews
    ) ?? 0;

  // Read experience years from available fields
  const expSafe =
    typeof caregiver?.experienceYears === "number"
      ? caregiver.experienceYears
      : typeof caregiver?.years_experience === "number"
      ? caregiver.years_experience
      : typeof caregiver?.experience_years === "number"
      ? caregiver.experience_years
      : typeof caregiver?.experience_years === "string"
      ? Number(caregiver.experience_years) || 0
      : 0;

  // Read service type from available fields
  const serviceTypeRaw =
    caregiver?.caregiver_service_type ??
    caregiver?.careServiceType ??
    caregiver?.care_service_type ??
    caregiver?.service_type ??
    caregiver?.serviceType ??
    caregiver?.caregiverServiceType;

  // Read time period from available fields
  const timePeriodRaw =
    caregiver?.caregiver_time_period ??
    caregiver?.preferredTime ??
    caregiver?.preferred_time ??
    caregiver?.preferred_time_period ??
    caregiver?.availability_period ??
    caregiver?.timePeriod ??
    caregiver?.preferredTimePeriod;

  // Read languages from available fields
  const languagesRaw =
    caregiver?.caregiver_languages ??
    caregiver?.languagesSpoken ??
    caregiver?.languages_spoken ??
    caregiver?.languages ??
    caregiver?.languagesSpokenList;

  // Read expected rate from available fields
  const expectedRate =
    caregiver?.ratePerHour ??
    caregiver?.rate_per_hour ??
    caregiver?.expected_salary ??
    caregiver?.expected_rate ??
    caregiver?.expectedRate ??
    caregiver?.rate ??
    0;

  // Build caregiver specialties from display candidate fields
  const specialtiesArr: string[] = useMemo(() => {
    const raw =
      caregiver?.specialties ??
      caregiver?.care_category ??
      caregiver?.careCategory ??
      caregiver?.specialities ??
      caregiver?.specialties_list;

    return parseList(raw);
  }, [caregiver]);

  // Build the caregiver qualifications list from available fields
  const qualsArr: string[] = useMemo(() => {
    const raw =
      caregiver?.qualifications ??
      caregiver?.qualifications_list ??
      caregiver?.qualification ??
      caregiver?.qualificationsList ??
      caregiver?.quals;

    return parseList(raw);
  }, [caregiver]);

  // Build the caregiver verification badge list
  const badgesArr: string[] = useMemo(() => {
    const raw =
      caregiver?.verification_badges ??
      caregiver?.verification_badge ??
      caregiver?.badges;

    return parseList(raw);
  }, [caregiver]);

  // Normalize the caregiver verification status
  const profileStatus = normalizeStatus(
    caregiver?.profile_status ?? caregiver?.status ?? caregiver?.verification_status
  );

  // Determine the text for the verification badge
  const badgeText =
    badgesArr.length > 0
      ? badgesArr[0]
      : profileStatus === "VERIFIED"
      ? t("verified")
      : "";

  // Build the about text from available fields
  const aboutText =
    displayField(
      caregiver?.about ??
        (specialtiesArr.length ? specialtiesArr.join(", ") : t("experienced_caregiver"))
    ) || t("experienced_caregiver");

  const translatedDistrict = (() => {
    const rawDistrict = displayField(caregiver?.district);
    if (rawDistrict === "-") return rawDistrict;

    return t(`district_${rawDistrict.trim().toLowerCase().replace(/\s+/g, "_")}`, {
      defaultValue: rawDistrict,
    });
  })();

  const translatedServiceType = translateDisplayField(serviceTypeRaw, t);
  const translatedTimePeriod = translateDisplayField(timePeriodRaw, t);
  const translatedLanguages = translateDisplayField(languagesRaw, t);
  const translatedAboutText = translateDisplayField(aboutText, t);
  const translatedSpecialtiesArr = translateDisplayList(specialtiesArr, t);
  const translatedQualsArr = translateDisplayList(qualsArr, t);

  // Open booking screen with the selected caregiver's details
  const onBookNow = () => {
    navigation.navigate("BookService", { caregiver });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("caregiver_profile")}</Text>

        <Pressable onPress={() => navigation.navigate("FamilyHome")} style={styles.headerBtn}>
          <Ionicons name="home-outline" size={20} color={theme.colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroTop} />

          <View style={styles.heroBody}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>

            <Text style={styles.name}>{displayName}</Text>

            {badgeText ? (
              <View style={styles.badgeWrap}>
                <Ionicons name="shield-checkmark" size={14} color="#166534" />
                <Text style={styles.badgeText}>{badgeText}</Text>
              </View>
            ) : null}

            <Text style={styles.sub}>
              {translatedDistrict} • {expSafe} {t("yrs_exp")}
            </Text>

            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t("rating")}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.metricValue}>{Number(ratingSafe || 0).toFixed(1)}</Text>
                  <Ionicons name="star" size={14} color="#F7B500" />
                </View>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t("rate")}</Text>
                <Text style={styles.metricValue}>
                  Rs. {Number(expectedRate) || 0}/{t("per_hour")}
                </Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{t("reviews")}</Text>
                <Text style={styles.metricValue}>{reviewsSafe}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t("service_type")}</Text>
                <Text style={styles.infoValue}>{translatedServiceType}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t("time_period")}</Text>
                <Text style={styles.infoValue}>{translatedTimePeriod}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t("languages")}</Text>
                <Text style={styles.infoValue}>{translatedLanguages}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t("about")}</Text>
            <Text style={styles.bodyText}>{translatedAboutText}</Text>

            <Text style={styles.sectionTitle}>{t("specialties")}</Text>
            <View style={styles.chipsRow}>
              {translatedSpecialtiesArr.length === 0 ? (
                <Text style={styles.bodyText}>-</Text>
              ) : (
                translatedSpecialtiesArr.map((s) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.sectionTitle}>{t("qualifications")}</Text>
            <View style={{ marginTop: 10 }}>
              {translatedQualsArr.length === 0 ? (
                <Text style={styles.bodyText}>-</Text>
              ) : (
                translatedQualsArr.map((q) => (
                  <View key={q} style={styles.qualRow}>
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.qualText}>{q}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={onBookNow} style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>{t("book_now")}</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.xl,
  },
  hero: {
    backgroundColor: "white",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  heroTop: {
    height: 120,
    backgroundColor: theme.colors.primary,
  },
  heroBody: {
    padding: theme.spacing.xl,
  },
  avatarWrap: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: "white",
    marginTop: -60,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  name: {
    marginTop: 12,
    fontSize: 26,
    fontWeight: "900",
    color: theme.colors.text,
  },
  badgeWrap: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 12,
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: "700",
  },

  metricsRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
  },
  metric: {
    alignItems: "flex-start",
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: "900",
  },
  metricValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "900",
  },

  infoGrid: {
    marginTop: 16,
    gap: 10,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
  },
  infoItem: {
    gap: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: "900",
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "800",
  },

  sectionTitle: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.text,
  },
  bodyText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.muted,
    fontWeight: "700",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  chip: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 13,
  },

  qualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg,
    marginBottom: 12,
  },
  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qualText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bookBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  bookBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
});