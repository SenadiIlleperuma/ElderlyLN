import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { theme } from "../../constants/theme";

export default function AdminHomeScreen({ navigation }: any) {
  const { t } = useTranslation();

  const totalUsers = 1420;
  const totalBookings = 842;
  const pendingReviews = 14;
  const urgentUnresolved = 1; 

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t("admin_console")}</Text>

          <Pressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.metricCard, styles.metricBlue]}>
            <Text style={styles.metricLabel}>{t("total_users")}</Text>
            <Text style={styles.metricValue}>{totalUsers.toLocaleString()}</Text>

            <View style={styles.deltaPill}>
              <Ionicons name="trending-up-outline" size={14} color="#fff" />
              <Text style={styles.deltaText}>+12%</Text>
            </View>
          </View>

          <View style={[styles.metricCard, styles.metricDark]}>
            <Text style={[styles.metricLabel, { color: "rgba(255,255,255,0.7)" }]}>{t("bookings")}</Text>
            <Text style={[styles.metricValue, { color: "#fff" }]}>{totalBookings.toLocaleString()}</Text>

            <View style={[styles.deltaPill, { backgroundColor: "rgba(34,197,94,0.25)" }]}>
              <Ionicons name="trending-up-outline" size={14} color="#22c55e" />
              <Text style={[styles.deltaText, { color: "#22c55e" }]}>+8%</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pulse-outline" size={18} color={theme.colors.text} />
            <Text style={styles.sectionTitle}>{t("management_center")}</Text>
          </View>

          <Pressable style={styles.manageItem} onPress={() => navigation?.navigate?.("AdminHub")}>
            <View style={styles.manageIcon}>
              <Ionicons name="document-text-outline" size={22} color="#fff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.manageTitle}>{t("verification_hub")}</Text>
              <Text style={styles.manageSub}>{t("pending_reviews", { count: pendingReviews })}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
          </Pressable>
        </View>

        <View style={styles.urgentCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="alert-circle-outline" size={22} color="#ef4444" />
            <Text style={styles.urgentTitle}>{t("urgent_issues")}</Text>
          </View>

          <Text style={styles.urgentText}>{t("urgent_issues_sub")}</Text>

          <Pressable style={styles.urgentBtn} onPress={() => navigation?.navigate?.("AdminHub")}>
            <Text style={styles.urgentBtnText}>{t("go_to_hub")}</Text>
          </Pressable>

          <Text style={styles.urgentSmall}>{t("unresolved_count", { count: urgentUnresolved })}</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7FAFF" },
  container: { padding: theme.spacing.xl, paddingBottom: 40 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: theme.colors.text },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8EEF8",
    alignItems: "center",
    justifyContent: "center",
  },

  cardRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  metricCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    minHeight: 130,
    justifyContent: "space-between",
  },
  metricBlue: { backgroundColor: "#2E6BFF" },
  metricDark: { backgroundColor: "#0B1220" },

  metricLabel: { fontWeight: "900", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", fontSize: 12 },
  metricValue: { fontWeight: "900", fontSize: 34, color: "#fff" },

  deltaPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  deltaText: { fontWeight: "900", color: "#fff", fontSize: 12 },

  sectionCard: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8EEF8",
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionTitle: { fontWeight: "900", color: theme.colors.text, fontSize: 16 },

  manageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8EEF8",
  },
  manageIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#2E6BFF",
    alignItems: "center",
    justifyContent: "center",
  },
  manageTitle: { fontWeight: "900", color: theme.colors.text, fontSize: 15 },
  manageSub: { marginTop: 4, fontWeight: "800", color: theme.colors.muted },

  urgentCard: {
    marginTop: 16,
    backgroundColor: "#FFF1F2",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  urgentTitle: { fontWeight: "900", color: "#991b1b", fontSize: 16 },
  urgentText: { marginTop: 10, color: "#be123c", fontWeight: "800" },
  urgentBtn: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  urgentBtnText: { fontWeight: "900", color: "#be123c" },
  urgentSmall: { marginTop: 10, fontWeight: "800", color: "#be123c", opacity: 0.8, fontSize: 12 },
});
