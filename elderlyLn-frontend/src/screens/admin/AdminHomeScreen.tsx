import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { theme } from "../../constants/theme";

type Tab = "METRICS" | "COMPLAINTS";

type Complaint = {
  id: string;
  from: string;
  status: "Open" | "Urgent" | "Resolved";
  reason: string;
  about: string;
};

const MOCK_COMPLAINTS: Complaint[] = [
  { id: "1021", from: "Family: Mary J.", status: "Urgent", reason: "Caregiver did not arrive on time.", about: "Booking #B-88" },
  { id: "1022", from: "Caregiver: Sunil K.", status: "Open", reason: "Payment dispute for completed shift.", about: "Booking #B-91" },
  { id: "1023", from: "Family: Ravindu P.", status: "Open", reason: "Communication issues and rude behavior.", about: "Caregiver profile" }
];

export default function AdminHomeScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("METRICS");

  const complaintCount = MOCK_COMPLAINTS.length;

  const stats = useMemo(
    () => [
      { label: t("total_users"), value: "2,840", icon: "people-outline" as const },
      { label: t("active_care"), value: "142", icon: "medkit-outline" as const },
      { label: t("verification"), value: "12", icon: "document-text-outline" as const },
      { label: t("daily_revenue"), value: "Rs. 42k", icon: "cash-outline" as const }
    ],
    [t]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoMini}>
            <Text style={styles.logoMiniText}>E</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("control_center")}</Text>
          </View>

          <Pressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
            <View style={styles.dot} />
          </Pressable>
        </View>

        <View style={styles.tabsWrap}>
          <Pressable onPress={() => setTab("METRICS")} style={[styles.tabBtn, tab === "METRICS" && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab === "METRICS" && styles.tabTextActive]}>{t("live_metrics")}</Text>
          </Pressable>

          <Pressable onPress={() => setTab("COMPLAINTS")} style={[styles.tabBtn, tab === "COMPLAINTS" && styles.tabBtnActiveDark]}>
            <Text style={[styles.tabText, tab === "COMPLAINTS" && styles.tabTextActiveDark]}>
              {t("complaints")} ({complaintCount})
            </Text>
          </Pressable>
        </View>

        {tab === "METRICS" ? (
          <>
            <View style={styles.statsGrid}>
              {stats.map((s, idx) => (
                <View key={idx} style={styles.statCard}>
                  <Ionicons name={s.icon} size={22} color={theme.colors.text} />
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.bigCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bigTitle}>{t("caregiver_verification")}</Text>
                <Text style={styles.bigDesc}>{t("review_nvq")}</Text>
              </View>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>12</Text>
              </View>
            </Pressable>

            <Pressable style={styles.bigCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bigTitle}>{t("transactions")}</Text>
                <Text style={styles.bigDesc}>{t("monitor_payments")}</Text>
              </View>
              <View style={styles.goIcon}>
                <Ionicons name="arrow-forward" size={18} color="#16a34a" />
              </View>
            </Pressable>

            <Pressable style={styles.darkCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.darkTitle}>{t("system_performance_reports")}</Text>
                <Text style={styles.darkDesc}>{t("ml_metrics_user_growth")}</Text>
              </View>
              <Text style={{ fontSize: 22 }}>📊</Text>
            </Pressable>

            <View style={styles.urgentCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="alert-circle-outline" size={22} color="#e11d48" />
                <Text style={styles.urgentTitle}>{t("urgent_reports")}</Text>
              </View>
              <Text style={styles.urgentText}>There are 3 unresolved disputes requiring immediate attention.</Text>

              <Pressable onPress={() => setTab("COMPLAINTS")} style={styles.resolveBtn}>
                <Text style={styles.resolveText}>{t("resolve_now")}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={{ gap: 12 }}>
            {MOCK_COMPLAINTS.map((c) => (
              <View key={c.id} style={styles.complaintCard}>
                <View style={styles.complaintTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.complaintSmall}>Dispute #{c.id}</Text>
                    <Text style={styles.complaintFrom}>{c.from}</Text>
                  </View>

                  <View style={[styles.statusPill, c.status === "Urgent" ? styles.pillUrgent : c.status === "Resolved" ? styles.pillOk : styles.pillOpen]}>
                    <Text style={styles.statusPillText}>{c.status}</Text>
                  </View>
                </View>

                <View style={styles.quoteBox}>
                  <Text style={styles.quoteText}>"{c.reason}"</Text>
                </View>

                <View style={styles.complaintBottom}>
                  <Text style={styles.targetText}>Target: {c.about}</Text>
                  <Pressable>
                    <Text style={styles.reviewLink}>Review Case</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1,
    backgroundColor: "#F7FAFF" 
  },
  container: {
     padding: theme.spacing.xl, 
     paddingBottom: 40 
    },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    marginBottom: 18 
  },
  logoMini: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: theme.colors.primary, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  logoMiniText: { 
    color: "white", 
    fontWeight: "900", 
    fontSize: 16 
  },
  title: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.text, 
    textAlign: "center" 
  },
  iconBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: "white", 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 1, 
    borderColor: "#E8EEF8" 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 99, 
    backgroundColor: "#ef4444", 
    position: "absolute", 
    right: 10, 
    top: 10 
  },

  tabsWrap: { 
    flexDirection: "row", 
    backgroundColor: "#0F172A", 
    borderRadius: 18, 
    padding: 6, 
    gap: 6, 
    marginBottom: 18 
  },
  tabBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 14, 
    alignItems: "center" 
  },
  tabBtnActive: { backgroundColor: "white" },
  tabBtnActiveDark: { backgroundColor: "#0B1220" },
  tabText: { 
    fontWeight: "900", 
    fontSize: 12, 
    color: "#94A3B8" 
  },
  tabTextActive: { color: "#0F172A" },
  tabTextActiveDark: { color: "white" },

  statsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12, 
    marginBottom: 14 
  },
  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8EEF8",
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  statLabel: { 
    marginTop: 10, 
    fontSize: 10, 
    fontWeight: "900", 
    color: "#64748B", 
    textTransform: "uppercase" 
  },
  statValue: { 
    marginTop: 6, 
    fontSize: 20, 
    fontWeight: "900", 
    color: theme.colors.text 
  },

  bigCard: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E8EEF8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12
  },
  bigTitle: { 
    fontSize: 16, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  bigDesc: { 
    marginTop: 6, 
    fontSize: 13, 
    color: "#64748B" 
  },
  badgeCount: { 
    width: 54, 
    height: 54, 
    borderRadius: 18, 
    backgroundColor: "#EEF2FF", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  badgeCountText: { 
    fontWeight: "900", 
    color: theme.colors.primary, 
    fontSize: 16 
  },
  goIcon: { 
    width: 54, 
    height: 54, 
    borderRadius: 18, 
    backgroundColor: "#EAFBF0", 
    alignItems: "center", 
    justifyContent: "center" 
  },

  darkCard: {
    marginTop: 12,
    backgroundColor: "#0B1220",
    borderRadius: 30,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  darkTitle: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "900" 
  },
  darkDesc: { 
    marginTop: 6, 
    color: "#94A3B8", 
    fontSize: 13 
  },

  urgentCard: { 
    marginTop: 14, 
    backgroundColor: "#FFF1F2", 
    borderRadius: 28, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: "#FFE4E6" 
  },
  urgentTitle: { 
    fontSize: 16, 
    fontWeight: "900", 
    color: "#881337" 
  },
  urgentText: { 
    marginTop: 10, 
    color: "#BE123C", 
    opacity: 0.8, 
    fontSize: 13
   },
  resolveBtn: { 
    marginTop: 14, 
    backgroundColor: "white", 
    paddingVertical: 12, 
    borderRadius: 14, 
    alignItems: "center" 
  },
  resolveText: { 
    color: "#E11D48", 
    fontWeight: "900", 
    fontSize: 12, 
    textTransform: "uppercase" 
  },
  complaintCard: { 
    backgroundColor: "white", 
    borderRadius: 28, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: "#E8EEF8" 
  },
  complaintTop: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    justifyContent: "space-between", 
    marginBottom: 10, 
    gap: 10 
  },
  complaintSmall: { 
    fontSize: 10, 
    fontWeight: "900", 
    color: "#94A3B8", 
    textTransform: "uppercase" 
  },
  complaintFrom: { 
    marginTop: 4, 
    fontSize: 14, 
    fontWeight: "900", 
    color: theme.colors.text 
  },

  statusPill: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 999 
  },
  pillUrgent: { 
    backgroundColor: "#FFE4E6" 
  },
  pillOpen: { 
    backgroundColor: "#FEF3C7" 
  },
  pillOk: { 
    backgroundColor: "#DCFCE7" 
  },
  statusPillText: { 
    fontSize: 10, 
    fontWeight: "900", 
    color: "#0F172A", 
    textTransform: "uppercase" 
  },

  quoteBox: { 
    backgroundColor: "#F8FAFC", 
    borderRadius: 16, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: "#EEF2F6" 
  },
  quoteText: { 
    color: "#475569", 
    fontSize: 13, 
    fontStyle: "italic" 
  },

  complaintBottom: { 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: "#EEF2F6", 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  targetText: { 
    fontSize: 11, 
    fontWeight: "800", 
    color: "#94A3B8" 
  },
  reviewLink: { 
    fontSize: 12, 
    fontWeight: "900", 
    color: theme.colors.primary 
  }
});
