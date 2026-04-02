import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView,  ActivityIndicator, Modal,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// Language options for the app
const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "si", label: "සිංහල", short: "SI" },
  { code: "ta", label: "தமிழ்", short: "TA" },
];

// Clean values before showing in the dashboard
function cleanText(v: any) {
  const s = String(v ?? "").trim();
  if (!s || s === "not_set" || s === "null" || s === "undefined") return "";
  return s;
}

function parseServiceDate(value: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  if (/[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const utcDate = new Date(`${normalized}Z`);
  if (!Number.isNaN(utcDate.getTime())) return utcDate;

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function hasExplicitTime(value: string) {
  return /T\d{2}:\d{2}/.test(String(value ?? "")) || /\d{2}:\d{2}/.test(String(value ?? ""));
}

// Format service date into a month and day display
function formatShiftDate(iso: string) {
  const d = parseServiceDate(iso);
  if (!d) return { month: "—", day: "—" };
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate());
  return { month, day };
}

// Format service date into a time display
function formatShiftTime(iso: string) {
  const d = parseServiceDate(iso);
  if (!d) return "—";
  if (!hasExplicitTime(iso)) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Normalize booking status for consistent comparisons
function normStatus(s: any) {
  return String(s ?? "").trim().toLowerCase();
}

function isSameMonth(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function toNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
// Format a number as Sri Lankan Rupees
function formatLKR(n: number) {
  const rounded = Math.round(n);
  return `Rs ${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default function CaregiverHomeScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();

  const [name, setName] = useState<string>("");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Determine the current language for display in the header
  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

    // Load the caregiver's saved name for the greeting message
  useEffect(() => {
    (async () => {
      const u = (await getUser()) as any;
      const nm = u?.name || u?.full_name || u?.fullName || "";
      if (nm) setName(String(nm));
    })();
  }, []);

  // Load all bookings linked to the caregiver
  const loadBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      // Request caregiver booking data from the backend
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
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

// Load bookings when the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  // Change the app's language and save the preference
  const handleChangeLanguage = async (langCode: string) => {
    try {
      await i18n.changeLanguage(langCode);
      await AsyncStorage.setItem("app_language", langCode);
      setLanguageModalVisible(false);
    } catch (error) {
      console.log("Language change error:", error);
    }
  };
// Logout the caregiver and reset navigation to the role selection screen
  const onLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user", "role", "session"]);
    navigation.reset({ index: 0, routes: [{ name: "RoleSelect" }] });
  };

  // Calculate summary values for requests, earnings, and upcoming shifts based on the loaded bookings
  const {
    jobRequestsCount,
    completedCount,
    totalEarnings,
    monthEarnings,
    upcomingShifts,
  } = useMemo(() => {
    const now = new Date();
    const thisMonth = now;

    // Split bookings by status for dashboard display
    const requested = bookings.filter((b) => {
      const status = normStatus(b.booking_status);
      return status === "requested" || status === "pending";
    });
    const completed = bookings.filter((b) => {
      const status = normStatus(b.booking_status);
      return status === "completed" || status === "done";
    });
    const accepted = bookings.filter((b) => {
      const status = normStatus(b.booking_status);
      return status === "accepted" || status === "confirmed" || status === "ongoing";
    });

    
    const totalEarn = completed.reduce((sum, b) => sum + toNumber(b.caregiver_expected_rate), 0);
    
    const monthEarn = completed.reduce((sum, b) => {
      const d = parseServiceDate(b.service_date);
      if (!d) return sum;
      if (!isSameMonth(d, thisMonth)) return sum;
      return sum + toNumber(b.caregiver_expected_rate);
    }, 0);

    // Keep only future accepted bookings and show the next few shifts
    const upcomingAccepted = accepted
      .filter((b) => {
        const d = parseServiceDate(b.service_date);
        if (!d) return false;

        const compareDate = new Date(d);
        compareDate.setHours(23, 59, 59, 999);

        return compareDate >= now;
      })
      .sort((a, b) => {
        const aTime = parseServiceDate(a.service_date)?.getTime() ?? 0;
        const bTime = parseServiceDate(b.service_date)?.getTime() ?? 0;
        return aTime - bTime;
      })
      .slice(0, 3);

    const shifts: Shift[] = upcomingAccepted.map((b) => {
      const { month, day } = formatShiftDate(b.service_date);
      const district = cleanText(b.family_district);
      const family = cleanText(b.family_name) || t("family_generic");
      const title = district ? `${family} • ${district}` : family;
      const start = cleanText(b.caregiver_time_period) || formatShiftTime(b.service_date);
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

          <View style={styles.headerActions}>
            <Pressable onPress={() => setLanguageModalVisible(true)} style={styles.langBtn}>
              <Ionicons name="globe-outline" size={18} color="#94A3B8" />
              <Text style={styles.langBtnText}>{currentLanguage.short}</Text>
              <Ionicons name="chevron-down" size={14} color="#94A3B8" />
            </Pressable>

            <Pressable onPress={onLogout} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

      {/* Dropdown for language selection */}
        <Modal
          transparent
          visible={languageModalVisible}
          animationType="fade"
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
            <View style={styles.dropdownCard}>
              {LANGUAGES.map((lang, index) => {
                const selected = i18n.language === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    style={[styles.dropdownItem, index !== LANGUAGES.length - 1 && styles.dropdownBorder]}
                    onPress={() => handleChangeLanguage(lang.code)}
                  >
                    <Text style={styles.dropdownText}>{lang.label}</Text>
                    {selected && <Ionicons name="checkmark-circle-outline" size={18} color="#94A3B8" />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>

        {!!name && <Text style={styles.greeting}>{t("hi_name", { name })}</Text>}

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
              <View style={styles.bottomStat}>
                <Text style={styles.smallLabel}>{t("this_month")}</Text>
                <Text style={styles.smallValue}>
                  {loadingBookings ? "—" : `+ ${formatLKR(monthEarnings)}`}
                </Text>
              </View>

              <View style={styles.bottomStat}>
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

        <View style={styles.tilesRow}>
          {/* Quick navigation to the caregiver's incoming job requests */}
          <Pressable style={styles.tile} onPress={() => navigation.navigate("JobRequests")}>
            <View style={styles.tileIconWrap}>
              <Ionicons name="briefcase-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.tileTitle}>{t("job_requests")}</Text>
            <Text style={styles.tileSub}>
              {loadingBookings ? "—" : `${jobRequestsCount} ${t("new_match")}`}
            </Text>
          </Pressable>
          {/* Quick navigation to edit caregiver profile details */}
          <Pressable style={styles.tile} onPress={() => navigation.navigate("CaregiverEditProfile")}>
            <View style={styles.tileIconWrap}>
              <Ionicons name="person-outline" size={22} color="#64748B" />
            </View>
            <Text style={styles.tileTitle}>{t("edit_profile")}</Text>
            <Text style={styles.tileSub}>{t("update_rates")}</Text>
          </Pressable>
        </View>

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
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.shiftTitle}>{t("loading")}</Text>
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

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.shiftTitle}>{t("no_upcoming_shifts")}</Text>
                <Text style={styles.shiftTime}>{t("no_upcoming_shifts_sub")}</Text>
              </View>

              <View style={styles.clock}>
                <Ionicons name="time-outline" size={18} color="#16A34A" />
              </View>
            </View>
          ) : (
            // Show the nearest accepted bookings as upcoming shifts
            upcomingShifts.map((s) => (
              <View key={s.id} style={styles.shiftCard}>
                <View style={styles.dateBox}>
                  <Text style={styles.month}>{s.month}</Text>
                  <Text style={styles.day}>{s.day}</Text>
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 26,
    fontWeight: "900",
    color: theme.colors.text,
    lineHeight: 32,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langBtn: {
    height: 32,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "transparent",
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.text,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8EEF8",
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.10)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 82,
    paddingRight: 20,
  },
  dropdownCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8EEF8",
  },
  dropdownItem: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  dropdownText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "700",
  },

  greeting: {
    marginTop: 10,
    fontWeight: "900",
    color: "#334155",
    lineHeight: 22,
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
    lineHeight: 20,
  },
  bigValue: {
    marginTop: 8,
    color: "white",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
  },
  bigDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 14,
  },
  bigBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  bottomStat: {
    flex: 1,
    minWidth: 0,
  },
  smallLabel: {
    color: "rgba(255,255,255,0.45)",
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 18,
  },
  smallValue: {
    marginTop: 6,
    color: "white",
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 22,
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
    textAlign: "center",
    lineHeight: 22,
  },
  tileSub: {
    marginTop: 6,
    color: theme.colors.muted,
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },

  sectionRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    lineHeight: 28,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: "900",
    textAlign: "right",
    flexShrink: 1,
    lineHeight: 22,
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
    lineHeight: 18,
  },
  day: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    lineHeight: 24,
  },

  shiftTitle: {
    fontWeight: "900",
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  shiftTime: {
    marginTop: 6,
    color: theme.colors.muted,
    fontWeight: "800",
    lineHeight: 20,
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