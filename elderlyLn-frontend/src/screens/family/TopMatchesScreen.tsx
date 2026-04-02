import React, { useState } from "react";
import {View,Text,StyleSheet,Pressable,ScrollView,Image, ActivityIndicator,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import FamilyBottomNav from "../../components/FamilyBottomNav";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "TopMatches">;

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
    "tamil": "lang_ta",
    "english": "lang_en",
  };

  return map[normalized] || null;
}

function translateDisplayValue(value: string, t: (key: string) => string) {
  const key = mapDisplayValueToTranslationKey(value);
  return key ? t(key) : value;
}

function translateDisplayList(values: string[], t: (key: string) => string) {
  return values.map((value) => translateDisplayValue(String(value).trim(), t));
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

export default function TopMatchesScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { matches = [], filters } = route.params || ({} as any);

  // Tracks which caregiver card is currently loading before navigation
  const [openingId, setOpeningId] = useState<string | null>(null);
  // Stores failed image states to avoid repeatedly rendering broken profile images
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const district = filters?.district || "anywhere";
  const displayDistrict =
    district === "" || district === "anywhere"
      ? t("sri_lanka")
      : t(`district_${String(district).trim().toLowerCase().replace(/\s+/g, "_")}`, {
          defaultValue: district.charAt(0).toUpperCase() + district.slice(1),
        });

    // Attempts to fetch the full caregiver profile before opening the profile screen
  const openCaregiverProfile = async (c: any) => {
    try {
      const caregiverId = String(
        c?.caregiver_id ?? c?.caregiverId ?? c?.id ?? ""
      ).trim();

      // If no valid caregiver ID is found, navigate with the existing data 
      if (!caregiverId) {
        navigation.navigate("CaregiverProfile", { caregiver: c, filters });
        return;
      }
      setOpeningId(caregiverId);

      // Requests the full caregiver profile for detailed viewing
      const res = await api.get(`/profile/caregiver/${caregiverId}`);

      const fallbackRating = getNumericValue(
        c?.rating,
        c?.avg_rating,
        c?.average_rating,
        c?.avgRating
      );
      const fetchedRating = getNumericValue(
        res?.data?.rating,
        res?.data?.avg_rating,
        res?.data?.average_rating,
        res?.data?.avgRating
      );

      const fallbackReviews = getNumericValue(
        c?.reviewsCount,
        c?.reviews_count,
        c?.review_count,
        c?.reviewCount
      );
      const fetchedReviews = getNumericValue(
        res?.data?.reviewsCount,
        res?.data?.reviews_count,
        res?.data?.review_count,
        res?.data?.reviewCount
      );

      const mergedCaregiver = {
        ...c,
        ...res.data,
        avg_rating: fetchedRating ?? fallbackRating ?? 0,
        reviews_count: fetchedReviews ?? fallbackReviews ?? 0,
      };

      navigation.navigate("CaregiverProfile", {
        caregiver: mergedCaregiver,
        filters,
      });
    } catch (err: any) {
      console.log("openCaregiverProfile error:", err?.response?.data || err?.message || err);
      navigation.navigate("CaregiverProfile", { caregiver: c, filters });
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("top_matches")}</Text>

        <Pressable onPress={() => navigation.navigate("FindCaregiver")} style={styles.headerBtn}>
          <Ionicons name="create-outline" size={20} color={theme.colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <View style={styles.bannerIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerSmall}>{t("ai_powered")}</Text>
            <Text style={styles.bannerBig}>
              {t("found_matches_in")} {displayDistrict}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate("FindCaregiver")}>
            <Text style={styles.edit}>{t("edit")}</Text>
          </Pressable>
        </View>
        {/* Displays an empty state if no caregivers matched the selected filters */}
        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>{t("no_matches")}</Text>
            <Text style={styles.emptySub}>{t("try_change_filters")}</Text>
            <Pressable onPress={() => navigation.goBack()} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>{t("edit_filters")}</Text>
            </Pressable>
          </View>
        ) : (
          matches.map((c: any) => {
            // Normalise rating values from possible backend field names
            const ratingSafe =
              getNumericValue(
                c?.rating,
                c?.avg_rating,
                c?.average_rating,
                c?.avgRating
              ) ?? 0;
            // Normalise review count values from possible backend field names  
            const reviewsSafe =
              getNumericValue(
                c?.reviewsCount,
                c?.reviews_count,
                c?.review_count,
                c?.reviewCount
              ) ?? 0;

            const expSafe =
              typeof c.experienceYears === "number"
                ? c.experienceYears
                : typeof c.years_experience === "number"
                ? c.years_experience
                : typeof c.experience_years === "number"
                ? c.experience_years
                : typeof c.experience_years === "string"
                ? Number(c.experience_years) || 0
                : 0;
            // Extracts caregiver specialities for summary text and tag rendering
            const specialtiesArr: string[] = Array.isArray(c.specialties)
              ? c.specialties
              : Array.isArray(c.care_category)
              ? c.care_category
              : [];
            const translatedSpecialties = translateDisplayList(specialtiesArr, t);
            // Use the first specialty
            const firstLine = translatedSpecialties?.[0] || t("caregiver_generic");
            const displayName = c?.name ?? c?.full_name ?? t("caregiver_generic");
            const initials = getInitials(displayName);

            const profileImageUrl =
              c?.profile_image_url ??
              c?.profileImageUrl ??
              c?.image_url ??
              c?.imageUrl ??
              "";
            // A stable key and loading reference for each caregiver card is made 
            const caregiverId = String(
              c?.caregiver_id ?? c?.caregiverId ?? c?.id ?? displayName
            );
            const isOpening = openingId === caregiverId;
            const showImage = !!profileImageUrl && !brokenImages[caregiverId];

            return (
              <Pressable
                key={caregiverId}
                onPress={() => openCaregiverProfile(c)}
                style={styles.card}
                disabled={isOpening}
              >
                <View style={styles.matchBadge}>
                  <Text style={styles.matchText}>
                    {c.matchPercent}% {t("match_label")}
                  </Text>
                </View>

                <View style={styles.row}>
                  <View style={styles.pic}>
                    {showImage ? (
                      <Image
                        source={{ uri: profileImageUrl }}
                        style={styles.picImage}
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [caregiverId]: true }))
                        }
                      />
                    ) : (
                      <Text style={styles.initialsText}>{initials}</Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{displayName}</Text>
                    <Text style={styles.sub}>
                      {firstLine} • {expSafe} {t("yrs_exp")}
                    </Text>

                    <View style={styles.tags}>
                      {translatedSpecialties.slice(0, 2).map((tag) => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.bottomRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="star" size={16} color="#F4B400" />
                    <Text style={styles.rating}>{Number(ratingSafe || 0).toFixed(1)}</Text>
                    <Text style={styles.muted}>({reviewsSafe})</Text>
                  </View>

                  {isOpening ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Text style={styles.viewProfile}>{t("view_profile")}</Text>
                  )}
                </View>
              </Pressable>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      <FamilyBottomNav active="search" navigation={navigation} />
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

  banner: {
    backgroundColor: "#EEF6FF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#D6E6FF",
  },
  bannerIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#DDEBFF" },
  bannerSmall: { color: theme.colors.primary, fontWeight: "900", fontSize: 12 },
  bannerBig: { color: theme.colors.text, fontWeight: "900", marginTop: 2 },
  edit: { color: theme.colors.primary, fontWeight: "900" },

  card: {
    marginTop: 14,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: "relative",
  },
  matchBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 16,
  },
  matchText: { color: "white", fontWeight: "900", fontSize: 12 },

  row: { flexDirection: "row", gap: 12, alignItems: "center" },

  pic: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  picImage: {
    width: "100%",
    height: "100%",
  },
  initialsText: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.primary,
  },

  name: { fontSize: 18, fontWeight: "900", color: theme.colors.text },
  sub: { marginTop: 4, color: theme.colors.muted, fontWeight: "700" },

  tags: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  tag: { backgroundColor: "#F2F4F7", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  tagText: { fontWeight: "800", color: "#344054", fontSize: 12 },

  bottomRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rating: { fontWeight: "900", color: theme.colors.text },
  muted: { color: theme.colors.muted, fontWeight: "700" },

  viewProfile: { color: theme.colors.primary, fontWeight: "900" },

  emptyState: { alignItems: "center", marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: theme.colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: theme.colors.muted, marginTop: 8, textAlign: "center" },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: "white", fontWeight: "900" },
});