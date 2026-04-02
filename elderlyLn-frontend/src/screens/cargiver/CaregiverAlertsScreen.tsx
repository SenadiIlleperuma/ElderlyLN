import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import CaregiverBottomNav from "../../components/CaregiverBottomNav";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "CaregiverAlerts">;

type AlertItem = {
  id: string;
  type: "BOOKING" | "PAYMENT" | "SYSTEM" | "VERIFICATION" | "COMPLAINT" | "REMINDER";
  title: string;
  body: string;
  timeLabel: string;
  unread?: boolean;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
};

function parseNotificationDate(dateString: string) {
  const raw = String(dateString ?? "").trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const localDate = new Date(normalized);
  if (!Number.isNaN(localDate.getTime())) return localDate;

  const utcDate = new Date(`${normalized}Z`);
  if (!Number.isNaN(utcDate.getTime())) return utcDate;

  return null;
}

// Convert notification time into a simple relative label
function formatTimeAgo(dateString: string, t: any) {
  const now = new Date();
  const created = parseNotificationDate(dateString);

  if (!created) return t("just_now");

  const diffMs = Math.max(0, now.getTime() - created.getTime());

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return t("just_now");
  if (minutes < 60) return t("minutes_ago", { count: minutes, defaultValue: `${minutes} min ago` });
  if (hours < 24) return t("hours_ago", { count: hours, defaultValue: `${hours} hr ago` });
  return t("days_ago", { count: days, defaultValue: `${days} day(s) ago` });
}

function localizeNotificationTitle(type: AlertItem["type"], title: string, t: any) {
  const normalized = String(title ?? "").trim().toLowerCase();

  if (type === "BOOKING" && normalized === "new booking request") {
    return t("notif_new_booking_title", "New booking request");
  }

  if (type === "BOOKING" && normalized === "booking cancelled") {
    return t("notif_booking_cancelled_title", "Booking cancelled");
  }

  if (type === "BOOKING" && normalized === "booking completed") {
    return t("notif_booking_completed_title", "Booking completed");
  }

  if (type === "VERIFICATION" && normalized === "new caregiver verification request") {
    return t("notif_verification_request_title", "New caregiver verification request");
  }

  if (type === "VERIFICATION" && normalized === "verification approved") {
    return t("notif_verification_approved_title", "Verification approved");
  }

  if (type === "VERIFICATION" && normalized === "verification rejected") {
    return t("notif_verification_rejected_title", "Verification rejected");
  }

  if (type === "PAYMENT" && normalized === "payment received") {
    return t("notif_payment_received_title", "Payment received");
  }

  return title;
}

function localizeNotificationBody(type: AlertItem["type"], body: string, t: any) {
  const normalized = String(body ?? "").trim().toLowerCase();

  if (
    type === "BOOKING" &&
    normalized === "you have received a new booking request from a family."
  ) {
    return t("notif_new_booking_body", "You have received a new booking request from a family.");
  }

  if (
    type === "BOOKING" &&
    normalized === "a family has cancelled the booking request."
  ) {
    return t("notif_booking_cancelled_body", "A family has cancelled the booking request.");
  }

  if (
    type === "BOOKING" &&
    normalized === "the booking has been marked as completed."
  ) {
    return t("notif_booking_completed_body", "The booking has been marked as completed.");
  }

  if (
    type === "VERIFICATION" &&
    normalized.includes("has submitted documents for verification")
  ) {
    return t("notif_verification_request_body", "A caregiver has submitted documents for verification.");
  }

  if (
    type === "VERIFICATION" &&
    normalized === "your verification was approved."
  ) {
    return t("notif_verification_approved_body", "Your verification was approved.");
  }

  if (
    type === "VERIFICATION" &&
    normalized === "your verification was rejected. please re-upload and resubmit."
  ) {
    return t("notif_verification_rejected_body", "Your verification was rejected. Please re-upload and resubmit.");
  }

  if (
    type === "PAYMENT" &&
    normalized === "payment has been added to your account."
  ) {
    return t("notif_payment_received_body", "Payment has been added to your account.");
  }

  return body;
}

export default function CaregiverAlertsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load notifications from the backend
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setAlerts([]);
        return;
      }

      // Request the latest notifications and map them into UI data
      const response = await getMyNotifications();
      const mapped: AlertItem[] = (response.notifications || []).map((n: any) => ({
        id: String(n.notification_id ?? ""),
        type: n.type,
        title: localizeNotificationTitle(n.type, n.title, t),
        body: localizeNotificationBody(n.type, n.message, t),
        timeLabel: formatTimeAgo(n.created_at, t),
        unread: !n.is_read,
        relatedEntityType: n.related_entity_type,
        relatedEntityId: n.related_entity_id,
      }));

      setAlerts(mapped);
    } catch (error) {
      console.error("loadNotifications error:", error);
      Alert.alert(t("error_title", "Error"), t("failed_load_notifications", "Failed to load notifications."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Reload alerts whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  // Filter alerts based on the selected tab
  const visible = useMemo(() => {
    return alerts.filter((a) => (filter === "UNREAD" ? a.unread : true));
  }, [alerts, filter]);

  const unreadCount = alerts.filter((a) => a.unread).length;
  const hasUnread = unreadCount > 0;

  // Pick icon and color style based on alert type
  const iconFor = (type: AlertItem["type"]) => {
    switch (type) {
      case "BOOKING":
        return { name: "mail-outline" as const, bg: "#EEF2FF", fg: theme.colors.primary };
      case "PAYMENT":
        return { name: "cash-outline" as const, bg: "#EAFBF0", fg: "#16A34A" };
      case "REMINDER":
        return { name: "time-outline" as const, bg: "#E8F1FF", fg: "#2E6BFF" };
      case "VERIFICATION":
        return { name: "shield-checkmark-outline" as const, bg: "#ECFDF3", fg: "#039855" };
      case "COMPLAINT":
        return { name: "alert-circle-outline" as const, bg: "#FEF3F2", fg: "#D92D20" };
      case "SYSTEM":
      default:
        return {
          name: "information-circle-outline" as const,
          bg: "#F1F5F9",
          fg: "#0F172A",
        };
    }
  };

  // Mark a single alert as read and open its related screen
  const handleOpenAlert = async (item: AlertItem) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      if (item.unread) {
        await markNotificationAsRead(item.id);

        setAlerts((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, unread: false } : a))
        );
      }

      // Booking and payment alerts open job requests
      if (item.type === "BOOKING") {
        navigation.navigate("JobRequests");
        return;
      }

      // Verification alerts open profile editing
      if (item.type === "VERIFICATION") {
        navigation.navigate("CaregiverEditProfile");
        return;
      }

      if (item.type === "PAYMENT") {
        navigation.navigate("JobRequests");
        return;
      }
    } catch (error) {
      console.error("handleOpenAlert error:", error);
    }
  };

  // Mark every alert as read at once
  const handleMarkAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await markAllNotificationsAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, unread: false })));
    } catch (error) {
      console.error("handleMarkAllRead error:", error);
      Alert.alert(t("error_title", "Error"), t("failed_mark_all_read", "Failed to mark all alerts as read."));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("alerts")}</Text>

        <Pressable onPress={loadNotifications} style={styles.headerBtn}>
          <Ionicons name="refresh-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      <View style={styles.filterWrap}>
        <Pressable
          onPress={() => setFilter("ALL")}
          style={[styles.filterBtn, filter === "ALL" && styles.filterBtnActive]}
        >
          <Text style={[styles.filterText, filter === "ALL" && styles.filterTextActive]}>
            {t("all")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter("UNREAD")}
          style={[styles.filterBtn, filter === "UNREAD" && styles.filterBtnActive]}
        >
          <Text style={[styles.filterText, filter === "UNREAD" && styles.filterTextActive]}>
            {t("unread")} ({unreadCount})
          </Text>
        </Pressable>
      </View>

      {/* Show this button only when there is at least one unread alert */}
      {hasUnread && (
        <View style={styles.topActions}>
          <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn}>
            <Text style={styles.markReadText}>{t("mark_all_read", "Mark all read")}</Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.empty}>
            <Ionicons name="reload-outline" size={26} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>{t("loading_alerts", "Loading alerts...")}</Text>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={26} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>{t("no_alerts")}</Text>
            <Text style={styles.emptySub}>{t("no_alerts_sub")}</Text>
          </View>
        ) : (
          visible.map((a) => {
            const icon = iconFor(a.type);

            return (
              <Pressable
                key={a.id}
                onPress={() => handleOpenAlert(a)}
                style={[styles.card, a.unread && styles.cardUnread]}
              >
                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
                    <Ionicons name={icon.name} size={20} color={icon.fg} />
                  </View>

                  <View style={styles.textWrap}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title}>{a.title}</Text>
                      {a.unread && <View style={styles.inlineUnreadDot} />}
                    </View>

                    <Text style={styles.time}>{a.timeLabel}</Text>
                    <Text style={styles.body}>{a.body}</Text>

                    {a.type === "BOOKING" && (
                      <View style={styles.actionBtn}>
                        <Text style={styles.actionText}>{t("view_requests")}</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={theme.colors.primary}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      <CaregiverBottomNav active="alerts" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
  },

  filterWrap: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    marginHorizontal: theme.spacing.xl,
    marginTop: 14,
    borderRadius: 18,
    padding: 6,
    gap: 6,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "white",
  },
  filterText: {
    fontWeight: "900",
    fontSize: 12,
    color: theme.colors.muted,
    textTransform: "uppercase",
  },
  filterTextActive: {
    color: theme.colors.text,
  },

  topActions: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 10,
    alignItems: "flex-end",
  },
  markReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  markReadText: {
    fontWeight: "900",
    color: theme.colors.primary,
    fontSize: 13,
  },

  content: {
    padding: theme.spacing.xl,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  cardUnread: {
    borderColor: "#C7D2FE",
  },

  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  textWrap: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  inlineUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#ef4444",
    marginTop: 2,
  },

  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.text,
    lineHeight: 22,
  },
  time: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.muted,
    lineHeight: 18,
  },
  body: {
    marginTop: 8,
    color: "#475467",
    fontWeight: "700",
    lineHeight: 22,
  },

  actionBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  actionText: {
    fontWeight: "900",
    color: theme.colors.primary,
  },

  empty: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 10,
    fontWeight: "900",
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
  },
  emptySub: {
    marginTop: 6,
    color: theme.colors.muted,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
  },
});