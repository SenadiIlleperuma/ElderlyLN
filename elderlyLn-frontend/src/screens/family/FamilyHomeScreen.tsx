import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import FamilyBottomNav from "../../components/FamilyBottomNav";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "FamilyHome">;

type BookingRow = {
  booking_id: string;
  service_date: string;
  booking_status: "Requested" | "Accepted" | "Declined" | "Completed" | "Cancelled";
  caregiver_name?: string | null;
  caregiver_district?: string | null;
  caregiver_service_type?: string | null;
  caregiver_time_period?: string | null;
};

type BookingStatusUI = "UPCOMING" | "COMPLETED" | "REQUESTED";

function formatShortDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clean(v: any) {
  const s = String(v ?? "").trim();
  if (!s || s === "not_set" || s === "null" || s === "undefined") return "";
  return s;
}

function toUiStatus(s: BookingRow["booking_status"]): BookingStatusUI {
  if (s === "Completed") return "COMPLETED";
  if (s === "Requested") return "REQUESTED";
  if (s === "Accepted") return "UPCOMING";
  return "REQUESTED";
}

export default function FamilyHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState<string>("");
  const [recent, setRecent] = useState<BookingRow[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserName = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) {
        setFullName("");
        return;
      }
      const user = JSON.parse(userStr);
      const name =
        user?.full_name ||
        user?.fullName ||
        user?.name ||
        user?.fullname ||
        "";
      setFullName(String(name || ""));
    } catch {
      setFullName("");
    }
  };

  const fetchRecentBookings = async () => {
    try {
      setLoadingRecent(true);
      const res = await api.get("/booking/myBookings");
      const all: BookingRow[] = Array.isArray(res.data) ? res.data : [];
      setRecent(all.slice(0, 2)); 
    } catch (err: any) {
      console.log("Home recent bookings error:", err?.response?.data || err?.message);
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserName();
      fetchRecentBookings();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserName();
    await fetchRecentBookings();
    setRefreshing(false);
  }, []);

  const statusLabel = (s: BookingStatusUI) => {
    if (s === "UPCOMING") return t("status_upcoming") || "Upcoming";
    if (s === "COMPLETED") return t("status_completed") || "Completed";
    return t("status_requested") || "Requested";
  };

  const Badge = ({ status }: { status: BookingStatusUI }) => {
    const bg = status === "UPCOMING" ? "#E8F1FF" : status === "COMPLETED" ? "#E7F8EE" : "#FFF2E0";
    const txt = status === "UPCOMING" ? "#2E6BFF" : status === "COMPLETED" ? "#1F8A4C" : "#B25B00";
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: txt }]}>{statusLabel(status)}</Text>
      </View>
    );
  };

  const onLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    navigation.reset({ index: 0, routes: [{ name: "RoleSelect" }] });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>E</Text>
        </View>

        <Text style={styles.headerTitle}>{t("nav_home") || "Home"}</Text>

        <Pressable onPress={onLogout} style={styles.headerBtn}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.muted} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.greetCard}>
          <View style={styles.greetIcon}>
            <Text style={{ fontSize: 22 }}>🏠</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.greetTitle}>
              {t("hello_name", { name: fullName?.trim() ? fullName : (t("guest") || "Guest") })}
            </Text>
            <Text style={styles.greetSub}>{t("welcome_portal") || "Welcome to your family care portal."}</Text>
          </View>

          <Pressable onPress={() => navigation.navigate("EditProfile")} style={styles.profileBtn}>
            <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.bigTitle}>{t("find_support") || "Find support"}</Text>
          <Text style={styles.bigSub}>{t("find_support_sub") || "Let our AI help you find the best caregiver match."}</Text>

          <Pressable onPress={() => navigation.navigate("FindCaregiver")} style={styles.searchPill}>
            <Ionicons name="search" size={18} color={theme.colors.primary} />
            <Text style={styles.searchPillText}>{t("start_search") || "Start Search"}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t("recent_bookings") || "Recent bookings"}</Text>
          <Pressable onPress={() => navigation.navigate("MyBookings", {})}>
            <Text style={styles.link}>{t("view_all") || "View all"}</Text>
          </Pressable>
        </View>

        {loadingRecent ? (
          <View style={{ paddingVertical: 18, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: theme.colors.muted, fontWeight: "800" }}>
              {t("loading_bookings") || "Loading bookings..."}
            </Text>
          </View>
        ) : recent.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyRecentTitle}>{t("no_bookings_yet") || "No bookings yet"}</Text>
            <Text style={styles.emptyRecentSub}>{t("no_bookings_sub") || "Book a caregiver and your requests will appear here."}</Text>
          </View>
        ) : (
          recent.map((b) => {
            const uiStatus = toUiStatus(b.booking_status);
            const caregiverName = clean(b.caregiver_name) || (t("caregiver_generic") || "Caregiver");
            const date = formatShortDate(b.service_date);
            const service = clean(b.caregiver_service_type) || (t("service_type") || "Service");

            return (
              <Pressable
                key={b.booking_id}
                onPress={() => navigation.navigate("MyBookings", {})}
                style={styles.bookingCard}
              >
                <View style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingName}>{caregiverName}</Text>
                  <Text style={styles.bookingMeta}>
                    {date} • {service}
                  </Text>
                </View>
                <Badge status={uiStatus} />
              </Pressable>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      <FamilyBottomNav active="home" navigation={navigation} />
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
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "white", fontWeight: "900" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  content: { padding: theme.spacing.lg },

  greetCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  greetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  greetTitle: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  greetSub: { marginTop: 3, fontSize: 12.5, color: theme.colors.muted },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  bigCard: { marginTop: 14, backgroundColor: theme.colors.primary, borderRadius: 20, padding: theme.spacing.lg },
  bigTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  bigSub: { marginTop: 6, color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 18 },
  searchPill: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchPillText: { fontWeight: "900", color: theme.colors.primary },

  sectionRow: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 15, fontWeight: "900", color: theme.colors.text },
  link: { fontWeight: "800", color: theme.colors.primary },

  bookingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#E9EEF8" },
  bookingName: { fontSize: 14, fontWeight: "900", color: theme.colors.text },
  bookingMeta: { marginTop: 2, fontSize: 12, color: theme.colors.muted },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 11.5, fontWeight: "900" },

  emptyRecent: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  emptyRecentTitle: { fontWeight: "900", color: theme.colors.text, fontSize: 14 },
  emptyRecentSub: { marginTop: 6, color: theme.colors.muted, fontWeight: "700" },
});
