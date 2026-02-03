import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { AuthStackParamList, BookingRow } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "JobRequests">;

function cleanText(v: any) {
  const s = String(v ?? "").trim();
  if (!s || s === "not_set" || s === "null" || s === "undefined") return "";
  return s;
}

function isToday(d: Date) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isTomorrow(d: Date) {
  const now = new Date();
  const t = new Date(now);
  t.setDate(now.getDate() + 1);
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function stableMatchPercent(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 88 + (h % 12);
}

export default function JobRequestsScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<BookingRow[]>([]);

  const dateLabel = (serviceDate: string) => {
    const d = new Date(serviceDate);
    if (Number.isNaN(d.getTime())) return t("dash_value");
    if (isToday(d)) return t("today");
    if (isTomorrow(d)) return t("tomorrow");
    return d.toLocaleDateString();
  };

  const fetchRequests = useCallback(async () => {
    try {
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
        caregiver_expected_rate:
          typeof r.caregiver_expected_rate === "number"
            ? r.caregiver_expected_rate
            : r.caregiver_expected_rate ?? null,
      }));

      setRows(mapped);
    } catch (err: any) {
      console.log("Fetch job requests error:", err?.response?.data || err?.message);
      Alert.alert(t("error_title"), err?.response?.data?.message || t("failed_load_requests"));
    }
  }, [t]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchRequests();
      setLoading(false);
    })();
  }, [fetchRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, [fetchRequests]);

  const requestedCount = useMemo(() => rows.filter((r) => r.booking_status === "Requested").length, [rows]);

  const openDetails = (booking: BookingRow) => {
    navigation.navigate("RequestDetails", { booking });
  };

  const renderItem = ({ item }: { item: BookingRow }) => {
    const name = cleanText(item.family_name) || t("family_generic");
    const district = cleanText(item.family_district);
    const serviceType = cleanText(item.caregiver_service_type);
    const label = dateLabel(item.service_date);
    const match = stableMatchPercent(item.booking_id);

    return (
      <Pressable style={styles.card} onPress={() => openDetails(item)}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.matchChip}>
            <Text style={styles.matchText}>{t("match_percent", { p: match })}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.muted} />
            <Text style={styles.metaText}>{label}</Text>
          </View>

          {!!district && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={theme.colors.muted} />
              <Text style={styles.metaText}>{district}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <Text style={styles.tagText}>
            {serviceType ? serviceType.toUpperCase() : t("job_full_time_tag")}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.detailsText}>{t("details")}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("job_requests")}</Text>

        <Pressable style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          {requestedCount > 0 && <View style={styles.dot} />}
        </Pressable>
      </View>

      <View style={styles.banner}>
        <Ionicons name="sparkles-outline" size={18} color="#A64B00" />
        <Text style={styles.bannerText}>
          {requestedCount > 0
            ? t("new_matching_requests_banner", { count: requestedCount })
            : t("no_new_requests")}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: theme.colors.muted, fontWeight: "700" }}>
            {t("loading_requests")}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 24 }}
          data={rows}
          keyExtractor={(x) => x.booking_id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="clipboard-outline" size={28} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>{t("no_requests_yet")}</Text>
              <Text style={styles.emptySub}>{t("no_requests_yet_sub")}</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
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
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: theme.colors.text },
  dot: { position: "absolute", top: 11, right: 12, width: 7, height: 7, borderRadius: 99, backgroundColor: "#EF4444" },

  banner: {
    marginTop: 12,
    marginHorizontal: theme.spacing.xl,
    backgroundColor: "#FFF7E6",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  bannerText: { fontWeight: "900", color: "#A64B00" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  emptyBox: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  emptyTitle: { fontWeight: "900", color: theme.colors.text, fontSize: 16 },
  emptySub: { color: theme.colors.muted, fontWeight: "700", textAlign: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },

  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: "900", color: theme.colors.text, flex: 1 },

  matchChip: {
    backgroundColor: "#EAFBF1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchText: { color: "#128A4C", fontWeight: "900", fontSize: 12 },

  metaRow: { marginTop: 12, gap: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontWeight: "800", color: theme.colors.muted },

  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 14 },

  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tagText: { color: theme.colors.primary, fontWeight: "900", letterSpacing: 1 },
  detailsText: { fontWeight: "900", color: theme.colors.muted },
});
