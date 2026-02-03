import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { AuthStackParamList, BookingRow } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "RequestDetails">;

function cleanText(v: any) {
  const s = String(v ?? "").trim();
  if (!s || s === "not_set" || s === "null" || s === "undefined") return "";
  return s;
}

function prettyDate(iso?: string, dashValue: string = "—") {
  if (!iso) return dashValue;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dashValue;
  return d.toLocaleString();
}

function needsToText(needs?: string[] | null) {
  if (!needs || !Array.isArray(needs) || needs.length === 0) return "";
  return needs.join(", ");
}

export default function RequestDetailsScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { booking } = route.params;

  const [saving, setSaving] = useState(false);

  const familyName = cleanText(booking.family_name) || t("family_generic");
  const district = cleanText(booking.family_district);

  const status = booking.booking_status || "Requested";

  const needsText = needsToText(booking.family_care_needs) || t("no_needs_provided");
  const scheduleText = cleanText(booking.caregiver_time_period) || t("dash_value");

  const salaryText =
    booking.caregiver_expected_rate != null && String(booking.caregiver_expected_rate).trim() !== ""
      ? t("salary_lkr_per_hr", { v: booking.caregiver_expected_rate })
      : t("dash_value");

  const requirements = useMemo(() => {
    const req: string[] = [];
    req.push(t("requirement_background_check"));

    const langs = cleanText(booking.caregiver_languages);
    if (langs) req.push(t("requirement_languages", { langs }));

    const st = cleanText(booking.caregiver_service_type);
    if (st) req.push(st);

    return req;
  }, [booking, t]);

  const canAcceptDecline = status === "Requested";
  const canComplete = status === "Accepted";

  const updateStatus = async (newStatus: "Accepted" | "Declined" | "Completed") => {
    try {
      setSaving(true);
      await api.put(`/booking/status/${booking.booking_id}`, { status: newStatus });
      Alert.alert(t("success_title"), t("booking_marked_as", { status: newStatus }));
      navigation.goBack();
    } catch (err: any) {
      console.log("Caregiver status update error:", err?.response?.data || err?.message);
      Alert.alert(t("failed_title"), err?.response?.data?.message || t("could_not_update_status"));
    } finally {
      setSaving(false);
    }
  };

  const confirmAction = (newStatus: "Accepted" | "Declined" | "Completed") => {
    Alert.alert(t("confirm_request_action_title", { status: newStatus }), t("are_you_sure"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("yes"), onPress: () => updateStatus(newStatus) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("request_info")}</Text>

        <Pressable style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
        <View style={styles.topCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={26} color={theme.colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.familyTitle}>{familyName}</Text>

              {!!district && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.muted} />
                  <Text style={styles.familySub}>{district}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.hr} />

          <View style={styles.needsHeader}>
            <Ionicons name="heart-outline" size={18} color="#EF4444" />
            <Text style={styles.sectionTitle}>{t("patient_needs")}</Text>
          </View>

          <Text style={styles.needsText}>{`"${needsText}"`}</Text>

          <View style={styles.smallCardsRow}>
            <View style={styles.smallCard}>
              <Text style={styles.smallCardLabel}>{t("schedule").toUpperCase()}</Text>
              <Text style={styles.smallCardValue}>{scheduleText}</Text>
            </View>

            <View style={styles.smallCard}>
              <Text style={styles.smallCardLabel}>{t("salary").toUpperCase()}</Text>
              <Text style={styles.smallCardValue}>{salaryText}</Text>
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={styles.sectionTitle}>{t("requirements")}</Text>
            <View style={{ marginTop: 10, gap: 10 }}>
              {requirements.map((r, idx) => (
                <View key={`${r}-${idx}`} style={styles.reqRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.reqText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={styles.sectionTitle}>{t("request_meta")}</Text>
            <Text style={styles.metaLine}>{t("status")}: {status}</Text>
            <Text style={styles.metaLine}>{t("service_date")}: {prettyDate(booking.service_date, t("dash_value"))}</Text>
            <Text style={styles.metaLine}>{t("requested")}: {prettyDate(booking.requested_at, t("dash_value"))}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {saving ? (
          <View style={styles.savingRow}>
            <ActivityIndicator />
            <Text style={{ marginLeft: 10, fontWeight: "800", color: theme.colors.muted }}>
              {t("updating")}
            </Text>
          </View>
        ) : (
          <>
            {canAcceptDecline && (
              <>
                <Pressable style={[styles.actionBtn, styles.declineBtn]} onPress={() => confirmAction("Declined")}>
                  <Ionicons name="close" size={18} color="#EF4444" />
                  <Text style={[styles.actionText, { color: "#EF4444" }]}>{t("decline")}</Text>
                </Pressable>

                <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={() => confirmAction("Accepted")}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={[styles.actionText, { color: "#fff" }]}>{t("accept")}</Text>
                </Pressable>
              </>
            )}

            {canComplete && (
              <Pressable style={[styles.actionBtn, styles.acceptBtn, { flex: 1 }]} onPress={() => confirmAction("Completed")}>
                <Ionicons name="checkmark-done" size={18} color="#fff" />
                <Text style={[styles.actionText, { color: "#fff" }]}>{t("mark_completed")}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
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
    backgroundColor: theme.colors.bg,
  },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: theme.colors.text },

  topCard: {
    margin: theme.spacing.xl,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  profileRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  familyTitle: { fontSize: 20, fontWeight: "900", color: theme.colors.text },
  familySub: { fontWeight: "800", color: theme.colors.muted },

  hr: { height: 1, backgroundColor: theme.colors.border, marginVertical: 16 },

  needsHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: theme.colors.text },

  needsText: { marginTop: 10, color: "#475467", fontWeight: "700", lineHeight: 20 },

  smallCardsRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  smallCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  smallCardLabel: { fontSize: 12, fontWeight: "900", color: theme.colors.muted },
  smallCardValue: { marginTop: 8, fontWeight: "900", color: theme.colors.text },

  reqRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bullet: { width: 7, height: 7, borderRadius: 99, backgroundColor: theme.colors.primary },
  reqText: { fontWeight: "800", color: "#475467", flex: 1 },

  metaLine: { marginTop: 8, fontWeight: "800", color: theme.colors.muted },

  bottomBar: {
    padding: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    flexDirection: "row",
    gap: 12,
  },

  savingRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },

  actionBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    flex: 1,
  },
  actionText: { fontWeight: "900", fontSize: 16 },

  declineBtn: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  acceptBtn: {
    backgroundColor: "#16A34A",
  },
});
