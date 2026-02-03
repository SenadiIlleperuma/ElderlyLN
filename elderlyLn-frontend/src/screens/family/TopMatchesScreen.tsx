import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import FamilyBottomNav from "../../components/FamilyBottomNav";

type Props = NativeStackScreenProps<AuthStackParamList, "TopMatches">;

export default function TopMatchesScreen({ navigation, route }: Props) {
  const { t } = useTranslation();

  const { matches = [], filters } = route.params || ({} as any);

  const district = filters?.district || "anywhere";
  const displayDistrict =
    district === "" || district === "anywhere"
      ? t("sri_lanka")
      : district.charAt(0).toUpperCase() + district.slice(1);

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
            const ratingSafe = typeof c.rating === "number" ? c.rating : 0;
            const reviewsSafe = typeof c.reviewsCount === "number" ? c.reviewsCount : 0;
            const expSafe = typeof c.experienceYears === "number" ? c.experienceYears : 0;

            const specialtiesArr: string[] = Array.isArray(c.specialties) ? c.specialties : [];
            const firstLine = specialtiesArr?.[0] || t("caregiver_generic");

            return (
              <Pressable
                key={c.id || c.caregiver_id || c.caregiverId || c.user_fk || c.name}
                onPress={() => navigation.navigate("CaregiverProfile", { caregiver: c, filters })}
                style={styles.card}
              >
                <View style={styles.matchBadge}>
                  <Text style={styles.matchText}>{c.matchPercent}% {t("match_label")}</Text>
                </View>

                <View style={styles.row}>
                  <View style={styles.pic}>
                    <Ionicons name="person" size={24} color="#98A2B3" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{c.name}</Text>
                    <Text style={styles.sub}>
                      {firstLine} • {expSafe} {t("yrs_exp")}
                    </Text>

                    <View style={styles.tags}>
                      {specialtiesArr.slice(0, 2).map((tag) => (
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
                    <Text style={styles.rating}>{ratingSafe.toFixed(1)}</Text>
                    <Text style={styles.muted}>({reviewsSafe})</Text>
                  </View>

                  <Text style={styles.viewProfile}>{t("view_profile")}</Text>
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
