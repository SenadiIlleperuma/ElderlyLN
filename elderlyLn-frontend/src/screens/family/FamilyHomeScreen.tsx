import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import FamilyBottomNav from "../../components/FamilyBottomNav";

type Props = NativeStackScreenProps<AuthStackParamList, "FamilyHome">;

type BookingStatus = "UPCOMING" | "COMPLETED" | "REQUESTED";

const recentBookings = [
  { id: "b1", name: "Sahan Perera", date: "Oct 24, 2023", service: "Post-Op", status: "UPCOMING" as BookingStatus },
  { id: "b2", name: "Priyani Fernando", date: "Oct 18, 2023", service: "Dementia Care", status: "COMPLETED" as BookingStatus },
];

export default function FamilyHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState<string>("");

  const loadUserName = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      console.log("Home: AsyncStorage user =", userStr);

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
    } catch (e) {
      console.log("Home: failed to read user from storage", e);
      setFullName("");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserName();
    }, [])
  );

  const statusLabel = (s: BookingStatus) => {
    if (s === "UPCOMING") return t("status_upcoming");
    if (s === "COMPLETED") return t("status_completed");
    return t("status_requested");
  };

  const Badge = ({ status }: { status: BookingStatus }) => {
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

        <Text style={styles.headerTitle}>{t("nav_home")}</Text>

        <Pressable onPress={onLogout} style={styles.headerBtn}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.greetCard}>
          <View style={styles.greetIcon}>
            <Text style={{ fontSize: 22 }}>🏠</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.greetTitle}>
              {t("hello_name", { name: fullName?.trim() ? fullName : t("guest") })}
            </Text>
            <Text style={styles.greetSub}>{t("welcome_portal")}</Text>
          </View>

          <Pressable onPress={() => navigation.navigate("EditProfile")} style={styles.profileBtn}>
            <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.bigTitle}>{t("find_support")}</Text>
          <Text style={styles.bigSub}>{t("find_support_sub")}</Text>

          <Pressable onPress={() => navigation.navigate("FindCaregiver")} style={styles.searchPill}>
            <Ionicons name="search" size={18} color={theme.colors.primary} />
            <Text style={styles.searchPillText}>{t("start_search")}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t("recent_bookings")}</Text>
          <Pressable onPress={() => navigation.navigate("MyBookings", {})}>
            <Text style={styles.link}>{t("view_all")}</Text>
          </Pressable>
        </View>

        {recentBookings.map((b) => (
          <Pressable key={b.id} onPress={() => navigation.navigate("MyBookings", {})} style={styles.bookingCard}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingName}>{b.name}</Text>
              <Text style={styles.bookingMeta}>
                {b.date} • {b.service}
              </Text>
            </View>
            <Badge status={b.status} />
          </Pressable>
        ))}

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
});
