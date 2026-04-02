import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";

type BookingStatus = "UPCOMING" | "COMPLETED" | "REQUESTED";

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
  };

  return map[normalized] || null;
}

function translateDisplayValue(value: string, t: (key: string, options?: any) => string) {
  const key = mapDisplayValueToTranslationKey(value);
  return key ? t(key) : value;
}

export default function BookingCard({
    name, date, type, status,
}: {
    name: string;
    date: string;
    type: string;
    status: BookingStatus;
}) {
  const { t, i18n } = useTranslation();

  // Determines whether the current booking should use upcoming styling
  const isUpcoming = status === "UPCOMING";

  const localizedStatus =
    status === "UPCOMING"
      ? t("status_upcoming")
      : status === "COMPLETED"
      ? t("status_completed")
      : t("status_requested");

  const localizedDate = formatShortDate(date, i18n.language);
  const localizedType = translateDisplayValue(type, t);

  return (
    // Reusable booking summary card used in booking-related screens
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={theme.colors.muted} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {localizedDate} • {localizedType}
          </Text>
        </View>
      </View>

      <View style={[styles.badge, isUpcoming ? styles.badgeBlue : styles.badgeGreen]}>
        <Text style={[styles.badgeText, isUpcoming ? styles.textBlue : styles.textGreen]}>
          {localizedStatus}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  left: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { 
    fontWeight: "900", 
    fontSize: 16, 
    color: theme.colors.text 
  },
  meta: {
     marginTop: 4, 
     color: theme.colors.muted,
      fontWeight: "700" 
    },

  badge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  badgeBlue: { backgroundColor: "#DBEAFE" },
  badgeGreen: { backgroundColor: "#DCFCE7" },
  badgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  textBlue: { color: "#2563EB" },
  textGreen: { color: "#16A34A" },
});