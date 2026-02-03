import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "CaregiverProfile">;

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

const parseList = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);

  const s = String(raw).trim();
  if (!s || s.toLowerCase() === "not_set") return [];

  return s.split(",").map((x) => x.trim()).filter(Boolean);
};

export default function CaregiverProfileScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { caregiver } = route.params;

  const ratingSafe =
    typeof caregiver?.rating === "number"
      ? caregiver.rating
      : typeof caregiver?.avg_rating === "number"
      ? caregiver.avg_rating
      : 0;

  const reviewsSafe =
    typeof caregiver?.reviewsCount === "number"
      ? caregiver.reviewsCount
      : typeof caregiver?.reviews_count === "number"
      ? caregiver.reviews_count
      : 0;

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

  const serviceTypeRaw =
    caregiver?.caregiver_service_type ??
    caregiver?.careServiceType ??
    caregiver?.care_service_type ??
    caregiver?.service_type ??
    caregiver?.serviceType ??
    caregiver?.caregiverServiceType;

  const timePeriodRaw =
    caregiver?.caregiver_time_period ??
    caregiver?.preferredTime ??
    caregiver?.preferred_time ??
    caregiver?.preferred_time_period ??
    caregiver?.availability_period ??
    caregiver?.timePeriod ??
    caregiver?.preferredTimePeriod;

  const languagesRaw =
    caregiver?.caregiver_languages ??
    caregiver?.languagesSpoken ??
    caregiver?.languages_spoken ??
    caregiver?.languages ??
    caregiver?.languagesSpokenList;

  const expectedRate =
    caregiver?.ratePerHour ??
    caregiver?.rate_per_hour ??
    caregiver?.expected_salary ??
    caregiver?.expected_rate ??
    caregiver?.expectedRate ??
    caregiver?.rate ??
    0;

  const specialtiesArr: string[] = useMemo(() => {
    const raw =
      caregiver?.specialties ??
      caregiver?.care_category ??
      caregiver?.careCategory ??
      caregiver?.specialities ??
      caregiver?.specialties_list;

    return parseList(raw);
  }, [caregiver]);

  const qualsArr: string[] = useMemo(() => {
    const raw =
      caregiver?.qualifications ??
      caregiver?.qualifications_list ??
      caregiver?.qualification ??
      caregiver?.qualificationsList ??
      caregiver?.quals;

    return parseList(raw);
  }, [caregiver]);

  const aboutText =
    displayField(
      caregiver?.about ??
        (specialtiesArr.length ? specialtiesArr.join(", ") : t("experienced_caregiver"))
    ) || "Experienced caregiver";

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
              <Ionicons name="person-circle" size={82} color="#98A2B3" />
            </View>

            <Text style={styles.name}>{displayField(caregiver?.name ?? caregiver?.full_name)}</Text>
            <Text style={styles.sub}>
              {displayField(caregiver?.district)} • {expSafe} {t("yrs_exp")}
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
                <Text style={styles.infoValue}>{displayField(serviceTypeRaw)}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t("time_period")}</Text>
                <Text style={styles.infoValue}>{displayField(timePeriodRaw)}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t("languages")}</Text>
                <Text style={styles.infoValue}>{displayField(languagesRaw)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t("about")}</Text>
            <Text style={styles.bodyText}>{aboutText}</Text>

            <Text style={styles.sectionTitle}>{t("specialties")}</Text>
            <View style={styles.chipsRow}>
              {specialtiesArr.length === 0 ? (
                <Text style={styles.bodyText}>-</Text>
              ) : (
                specialtiesArr.map((s) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.sectionTitle}>{t("qualifications")}</Text>
            <View style={{ marginTop: 10 }}>
              {qualsArr.length === 0 ? (
                <Text style={styles.bodyText}>-</Text>
              ) : (
                qualsArr.map((q) => (
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
  safe: { flex: 1, backgroundColor: theme.colors.bg },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },

  content: { padding: theme.spacing.xl },

  hero: {
    backgroundColor: "white",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  heroTop: { height: 120, backgroundColor: theme.colors.primary },
  heroBody: { padding: theme.spacing.xl },

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
  },

  name: { marginTop: 12, fontSize: 26, fontWeight: "900", color: theme.colors.text },
  sub: { marginTop: 4, fontSize: 14, color: theme.colors.muted, fontWeight: "700" },

  metricsRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
  },
  metric: { alignItems: "flex-start", gap: 4 },
  metricLabel: { fontSize: 12, color: theme.colors.muted, fontWeight: "900" },
  metricValue: { fontSize: 16, color: theme.colors.text, fontWeight: "900" },

  infoGrid: {
    marginTop: 16,
    gap: 10,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
  },
  infoItem: { gap: 3 },
  infoLabel: { fontSize: 12, color: theme.colors.muted, fontWeight: "900" },
  infoValue: { fontSize: 14, color: theme.colors.text, fontWeight: "800" },

  sectionTitle: { marginTop: 18, fontSize: 14, fontWeight: "900", color: theme.colors.text },
  bodyText: { marginTop: 8, fontSize: 15, lineHeight: 22, color: theme.colors.muted, fontWeight: "700" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  chip: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: { color: theme.colors.primary, fontWeight: "900", fontSize: 13 },

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
  qualText: { flex: 1, fontSize: 15, fontWeight: "800", color: theme.colors.text },

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
  bookBtnText: { color: "white", fontSize: 16, fontWeight: "900" },
});
