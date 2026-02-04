import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";

import { AuthStackParamList, BookingRow } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import CaregiverBottomNav from "../../components/CaregiverBottomNav";
import { getUser } from "../../services/storage";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "CaregiverHome">;

type Shift = {
  id: string;
  day: string;
  month: string;
  title: string;
  time: string;
};

function cleanText(v: any) {
  const s = String(v ?? "").trim();
  if (!s || s === "not_set" || s === "null" || s === "undefined") return "";
  return s;
}

function formatShiftDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { month: "—", day: "—" };
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate());
  return { month, day };
}

function formatShiftTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function normStatus(s: any) {
  return String(s ?? "")
    .trim()
    .toLowerCase(); // requested/accepted/completed/declined
}

function isSameMonth(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function toNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatLKR(n: number) {
  const rounded = Math.round(n);
  return `Rs ${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default function CaregiverHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [name, setName] = useState<string>("");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
     const u = (await getUser()) as any;
     const nm = u?.name || u?.full_name || u?.fullName || "";
     if (nm) setName(String(nm));
    })();
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const res = await api.get("/booking/myBookings");
      const data = Array.isArray(res.data) ? res.data : [];

      const mapped: BookingRow[] = data.map((r: any) => ({
        booking_id: String(r.booking_id ?? ""),
        family_fk: String(r.family_fk ?? ""),
        caregiver_fk: String(r.caregiver_fk ?? ""),
        requested_at: String(r.requested_at ?? ""),
        service_date: String(r.service_date ?? ""),
        booking_status: (r.booking_status ?? "Requested") as BookingRow["booking_status"],

        family_name: r.family_name ?? null,
        family_district: r.family_district ?? null,
        family_care_needs: Array.isArray(r.family_care_needs) ? r.family_care_needs : null,

        caregiver_service_type: r.caregiver_service_type ?? null,
        caregiver_time_period: r.caregiver_time_period ?? null,
        caregiver_languages: r.caregiver_languages ?? null,
        caregiver_expected_rate: r.caregiver_expected_rate ?? null,
      }));

      setBookings(mapped);
    } catch (e) {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const {
    jobRequestsCount,
    completedCount,
    totalEarnings,
    monthEarnings,
    upcomingShifts,
  } = useMemo(() => {
    const now = new Date();
    const thisMonth = now;

    const requested = bookings.filter((b) => normStatus(b.booking_status) === "requested");
    const completed = bookings.filter((b) => normStatus(b.booking_status) === "completed");
    const accepted = bookings.filter((b) => normStatus(b.booking_status) === "accepted");

    const totalEarn = completed.reduce((sum, b) => sum + toNumber(b.caregiver_expected_rate), 0);

    const monthEarn = completed.reduce((sum, b) => {
      const d = new Date(b.service_date);
      if (Number.isNaN(d.getTime())) return sum;
      if (!isSameMonth(d, thisMonth)) return sum;
      return sum + toNumber(b.caregiver_expected_rate);
    }, 0);

    const upcomingAccepted = accepted
      .filter((b) => {
        const d = new Date(b.service_date);
        return !Number.isNaN(d.getTime()) && d >= now;
      })
      .sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime())
      .slice(0, 3);

    const shifts: Shift[] = upcomingAccepted.map((b) => {
      const { month, day } = formatShiftDate(b.service_date);
      const district = cleanText(b.family_district);
      const family = cleanText(b.family_name) || t("family_generic");
      const title = district ? `${family} • ${district}` : family;
      const start = formatShiftTime(b.service_date);
      return { id: b.booking_id, month, day, title, time: start !== "—" ? start : "—" };
    });

    return {
      jobRequestsCount: requested.length,
      completedCount: completed.length,
      totalEarnings: totalEarn,
      monthEarnings: monthEarn,
      upcomingShifts: shifts,
    };
  }, [bookings, t]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t("dashboard")}</Text>

          <View style={styles.onlinePill}>
            <Text style={styles.onlineText}>{t("online")}</Text>
          </View>
        </View>

        {!!name && <Text style={styles.greeting}>{t("hi_name", { name })}</Text>}

        {/* Earnings Card */}
        <View style={styles.bigCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigLabel}>{t("total_earnings")}</Text>

            {loadingBookings ? (
              <View style={{ marginTop: 10 }}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <Text style={styles.bigValue}>{formatLKR(totalEarnings)}</Text>
            )}

            <View style={styles.bigDivider} />

            <View style={styles.bigBottom}>
              <View>
                <Text style={styles.smallLabel}>{t("this_month")}</Text>
                <Text style={styles.smallValue}>
                  {loadingBookings ? "—" : `+ ${formatLKR(monthEarnings)}`}
                </Text>
              </View>

              <View>
                <Text style={styles.smallLabel}>{t("jobs_done")}</Text>
                <Text style={styles.smallValue}>
                  {loadingBookings ? "—" : `${completedCount} ${t("visits")}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.iconBox}>
            <Ionicons name="card-outline" size={26} color="#60A5FA" />
          </View>
        </View>

        {/* Tiles */}
        <View style={styles.tilesRow}>
          <Pressable style={styles.tile} onPress={() => navigation.navigate("JobRequests")}>
            <View style={styles.tileIconWrap}>
              <Ionicons name="briefcase-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.tileTitle}>{t("job_requests")}</Text>
            <Text style={styles.tileSub}>
              {loadingBookings ? "—" : `${jobRequestsCount} ${t("new_match")}`}
            </Text>
          </Pressable>

          <Pressable style={styles.tile} onPress={() => navigation.navigate("CaregiverEditProfile")}>
            <View style={styles.tileIconWrap}>
              <Ionicons name="person-outline" size={22} color="#64748B" />
            </View>
            <Text style={styles.tileTitle}>{t("edit_profile")}</Text>
            <Text style={styles.tileSub}>{t("update_rates")}</Text>
          </Pressable>
        </View>

        {/* Upcoming shifts */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t("upcoming_shifts")}</Text>
          <Pressable onPress={() => navigation.navigate("CaregiverAlerts")}>
            <Text style={styles.link}>{t("full_calendar")}</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 10, gap: 12 }}>
          {loadingBookings ? (
            <View style={styles.shiftCard}>
              <View style={styles.dateBox}>
                <Text style={styles.month}>—</Text>
                <Text style={styles.day}>—</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shiftTitle}>{t("loading_requests") || "Loading..."}</Text>
                <Text style={styles.shiftTime}> </Text>
              </View>
              <View style={styles.clock}>
                <ActivityIndicator />
              </View>
            </View>
          ) : upcomingShifts.length === 0 ? (
            <View style={styles.shiftCard}>
              <View style={styles.dateBox}>
                <Text style={styles.month}>—</Text>
                <Text style={styles.day}>—</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.shiftTitle}>{t("no_upcoming_shifts")}</Text>
                <Text style={styles.shiftTime}>{t("no_upcoming_shifts_sub")}</Text>
              </View>

              <View style={styles.clock}>
                <Ionicons name="time-outline" size={18} color="#16A34A" />
              </View>
            </View>
          ) : (
            upcomingShifts.map((s) => (
              <View key={s.id} style={styles.shiftCard}>
                <View style={styles.dateBox}>
                  <Text style={styles.month}>{s.month}</Text>
                  <Text style={styles.day}>{s.day}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.shiftTitle}>{s.title}</Text>
                  <Text style={styles.shiftTime}>{s.time}</Text>
                </View>

                <View style={styles.clock}>
                  <Ionicons name="time-outline" size={18} color="#16A34A" />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <CaregiverBottomNav active="home" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.xl,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: theme.colors.text,
  },
  onlinePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  onlineText: {
    fontWeight: "900",
    color: "#166534",
    letterSpacing: 0.5,
  },

  greeting: {
    marginTop: 10,
    fontWeight: "900",
    color: "#334155",
  },

  bigCard: {
    marginTop: 14,
    backgroundColor: "#0B1220",
    borderRadius: 28,
    padding: 18,
    flexDirection: "row",
    gap: 14,
  },
  bigLabel: {
    color: "#94A3B8",
    fontWeight: "900",
    letterSpacing: 1,
  },
  bigValue: {
    marginTop: 8,
    color: "white",
    fontSize: 34,
    fontWeight: "900",
  },
  bigDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 14,
  },
  bigBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallLabel: {
    color: "rgba(255,255,255,0.45)",
    fontWeight: "900",
    fontSize: 12,
  },
  smallValue: {
    marginTop: 6,
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },

  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  tilesRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  tile: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    alignItems: "center",
  },
  tileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  tileTitle: {
    fontWeight: "900",
    color: theme.colors.text,
  },
  tileSub: {
    marginTop: 6,
    color: theme.colors.muted,
    fontWeight: "800",
    fontSize: 12,
  },

  sectionRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: "900",
  },

  shiftCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateBox: {
    width: 52,
    alignItems: "center",
  },
  month: {
    color: "#94A3B8",
    fontWeight: "900",
  },
  day: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
  },

  shiftTitle: {
    fontWeight: "900",
    color: theme.colors.text,
    fontSize: 16,
  },
  shiftTime: {
    marginTop: 6,
    color: theme.colors.muted,
    fontWeight: "800",
  },

  clock: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
});
