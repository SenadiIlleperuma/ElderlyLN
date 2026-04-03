import React, { useCallback, useState } from "react";
import { View,Text,StyleSheet,Pressable,ScrollView,ActivityIndicator,RefreshControl,Modal,} from "react-native";
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

// Languages options shown in the family home header
const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "si", label: "සිංහල", short: "SI" },
  { code: "ta", label: "தமிழ்", short: "TA" },
];

// Format booking dates for the recent bookings section
function formatShortDate(iso: string, language: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsSi = ["ජන", "පෙබ", "මාර්", "අප්‍රේ", "මැයි", "ජූනි", "ජූලි", "අගෝ", "සැප්", "ඔක්", "නොවැ", "දෙසැ"];
  const monthsTa = ["ஜன", "பிப்", "மார்", "ஏப்", "மே", "ஜூன்", "ஜூலை", "ஆக்", "செப்", "அக்", "நவ", "டிச"];

  const day = d.getDate();
  const year = d.getFullYear();

  const lang = String(language || "en").toLowerCase();
  const isSinhala = lang.startsWith("si");
  const isTamil = lang.startsWith("ta");

  const monthName = isSinhala
    ? monthsSi[d.getMonth()]
    : isTamil
    ? monthsTa[d.getMonth()]
    : monthsEn[d.getMonth()];

  return `${day} ${monthName} ${year}`;
}

// Clean and normalize booking data for display
function clean(v: any) {
  const s = String(v ?? "").trim();
  if (!s || s === "not_set" || s === "null" || s === "undefined") return "";
  return s;
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
    "english": "lang_en",
    "tamil": "lang_ta",
  };

  return map[normalized] || null;
}

function translateDisplayValue(value: string, t: (key: string, options?: any) => string) {
  const key = mapDisplayValueToTranslationKey(value);
  return key ? t(key) : value;
}

// Convert backend booking status into simplified UI status
function toUiStatus(s: BookingRow["booking_status"]): BookingStatusUI {
  if (s === "Completed") return "COMPLETED";
  if (s === "Accepted") return "UPCOMING";
  return "REQUESTED";
}

export default function FamilyHomeScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();

  const [fullName, setFullName] = useState<string>("");
  const [recent, setRecent] = useState<BookingRow[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Determine the currently selected language
  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  // Load the user's full name from AsyncStorage for the greeting message
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

  const translateDistrict = useCallback(
    (value: any) => {
      const raw = clean(value);
      if (!raw) return "";
      return t(`district_${raw.toLowerCase().replace(/\s+/g, "_")}`, {
        defaultValue: raw,
      });
    },
    [t]
  );

  const translateServiceType = useCallback(
    (value: any) => {
      const raw = clean(value);
      if (!raw) return t("service_type");
      return translateDisplayValue(raw, t);
    },
    [t]
  );

 // Load a small set of recent bookings for the home screen
  const fetchRecentBookings = async () => {
    try {
      setLoadingRecent(true);
      // Request the user's bookings from the backend
      const res = await api.get("/booking/myBookings");
      const all: BookingRow[] = Array.isArray(res.data) ? res.data : [];

      const filtered = all.filter(
        (b) =>
          b.booking_status === "Requested" ||
          b.booking_status === "Accepted" ||
          b.booking_status === "Completed"
      );

      setRecent(filtered.slice(0, 2));
    } catch (err: any) {
      console.log("Home recent bookings error:", err?.response?.data || err?.message);
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  };

 // Refresh the greeting and recent bookings when the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadUserName();
      fetchRecentBookings();
    }, [])
  );

 // Refresh handler for pull-to-refresh, reloads the user's name and recent bookings
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserName();
    await fetchRecentBookings();
    setRefreshing(false);
  }, []);

  // Handle changing the app's language and save it locally
  const handleChangeLanguage = async (langCode: string) => {
    try {
      await i18n.changeLanguage(langCode);
      await AsyncStorage.setItem("app_language", langCode);
      setLanguageModalVisible(false);
    } catch (error) {
      console.log("Language change error:", error);
    }
  };

 //  Return the translated label for each simplified booking status
  const statusLabel = (s: BookingStatusUI) => {
    if (s === "UPCOMING") return t("status_upcoming");
    if (s === "COMPLETED") return t("status_completed");
    return t("status_requested");
  };

  // 
  const Badge = ({ status }: { status: BookingStatusUI }) => {
    const bg = status === "UPCOMING" ? "#E8F1FF" : status === "COMPLETED" ? "#E7F8EE" : "#FFF2E0";
    const txt = status === "UPCOMING" ? "#2E6BFF" : status === "COMPLETED" ? "#1F8A4C" : "#B25B00";
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: txt }]}>{statusLabel(status)}</Text>
      </View>
    );
  };

 // Handle user logout
  const onLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user", "role", "session"]);
    navigation.reset({ index: 0, routes: [{ name: "RoleSelect" }] });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>E</Text>
        </View>

        <Text style={styles.headerTitle}>{t("nav_home")}</Text>

        <View style={styles.headerActions}>
          <Pressable onPress={() => setLanguageModalVisible(true)} style={styles.langBtn}>
            <Ionicons name="globe-outline" size={18} color="#94A3B8" />
            <Text style={styles.langBtnText}>{currentLanguage.short}</Text>
            <Ionicons name="chevron-down" size={14} color="#94A3B8" />
          </Pressable>

          <Pressable onPress={onLogout} style={styles.headerBtn}>
            <Ionicons name="log-out-outline" size={20} color={theme.colors.muted} />
          </Pressable>
        </View>
      </View>

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

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
         {/* Greeting card with user's name and quick access to profile */}
        <View style={styles.greetCard}>
          <View style={styles.greetIcon}>
            <Text style={{ fontSize: 22 }}>🏠</Text>
          </View>

          <View style={styles.greetTextWrap}>
            <Text style={styles.greetTitle}>
              {t("hello_name", { name: fullName?.trim() ? fullName : t("guest") })}
            </Text>
            <Text style={styles.greetSub}>
              {t("welcome_portal")}
            </Text>
          </View>

          <Pressable onPress={() => navigation.navigate("EditProfile")} style={styles.profileBtn}>
            <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>

          {/* Search for caregivers */}
        <View style={styles.bigCard}>
          <Text style={styles.bigTitle}>{t("find_support")}</Text>
          <Text style={styles.bigSub}>
            {t("find_support_sub")}
          </Text>

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

        {loadingRecent ? (
          <View style={{ paddingVertical: 18, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: theme.colors.muted, fontWeight: "800" }}>
              {t("loading_bookings")}
            </Text>
          </View>
        ) : recent.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyRecentTitle}>{t("no_bookings_yet")}</Text>
            <Text style={styles.emptyRecentSub}>
              {t("no_bookings_sub")}
            </Text>
          </View>
        ) : (
          // Show the most recent bookings with a quick status view
          recent.map((b) => {
            const uiStatus = toUiStatus(b.booking_status);
            const caregiverName = clean(b.caregiver_name) || t("caregiver_generic");
            const date = formatShortDate(b.service_date, i18n.language);
            const service = translateServiceType(b.caregiver_service_type);
            const district = translateDistrict(b.caregiver_district);

            return (
              <Pressable
                key={b.booking_id}
                onPress={() => navigation.navigate("MyBookings", {})}
                style={styles.bookingCard}
              >
                <View style={styles.avatar} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.bookingName}>{caregiverName}</Text>
                  <Text style={styles.bookingMeta}>
                    {date} • {service}
                  </Text>
                  {!!district && <Text style={styles.bookingMeta}>{district}</Text>}
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
  safe: { 
    flex: 1,
   backgroundColor: theme.colors.bg 
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "white", fontWeight: "900", fontSize: 16 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
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
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.10)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 82,
    paddingRight: 18,
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
  content: { 
    padding: theme.spacing.lg 
  },
  greetCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
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
  greetTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  greetTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.text,
    lineHeight: 22,
  },
  greetSub: {
    marginTop: 4,
    fontSize: 12.5,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bigCard: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    padding: theme.spacing.xl,
  },
  bigTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 26,
  },
  bigSub: {
    marginTop: 8,
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
  },
  searchPill: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchPillText: {
    fontWeight: "900",
    color: theme.colors.primary,
    fontSize: 15,
  },
  sectionRow: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.text,
    lineHeight: 22,
  },
  link: {
    fontWeight: "800",
    color: theme.colors.primary,
    flexShrink: 1,
    textAlign: "right",
  },

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
  bookingName: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.text,
    lineHeight: 20,
  },
  bookingMeta: {
    marginTop: 3,
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 18,
  },
  badge: { 
    paddingHorizontal: 10, 
    paddingVertical: 6,
    borderRadius: 999 
  },
  badgeText: { 
    fontSize: 11.5, 
    fontWeight: "900" 
  },
  emptyRecent: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  emptyRecentTitle: {
    fontWeight: "900",
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyRecentSub: {
    marginTop: 6,
    color: theme.colors.muted,
    fontWeight: "700",
    lineHeight: 20,
  },
});