import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import CaregiverBottomNav from "../../components/CaregiverBottomNav";

type Props = NativeStackScreenProps<AuthStackParamList, "CaregiverAlerts">;

type AlertItem = {
  id: string;
  type: "REQUEST" | "SYSTEM" | "PAYMENT" | "REMINDER";
  titleKey: string;
  body: string;
  timeLabel: string;
  unread?: boolean;
};

export default function CaregiverAlertsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const alerts = useMemo<AlertItem[]>(
    () => [
      {
        id: "a1",
        type: "REQUEST",
        titleKey: "alert_new_request",
        body: t("alert_new_request_body"),
        timeLabel: t("alert_time_now"),
        unread: true
      },
      {
        id: "a2",
        type: "REMINDER",
        titleKey: "alert_shift_reminder",
        body: t("alert_shift_reminder_body"),
        timeLabel: t("alert_time_1h"),
        unread: true
      },
      {
        id: "a3",
        type: "PAYMENT",
        titleKey: "alert_payment_processed",
        body: t("alert_payment_processed_body"),
        timeLabel: t("alert_time_yesterday"),
        unread: false
      },
      {
        id: "a4",
        type: "SYSTEM",
        titleKey: "alert_profile_tip",
        body: t("alert_profile_tip_body"),
        timeLabel: t("alert_time_2d"),
        unread: false
      }
    ],
    [t]
  );

  const visible = alerts.filter((a) => (filter === "UNREAD" ? a.unread : true));

  const iconFor = (type: AlertItem["type"]) => {
    switch (type) {
      case "REQUEST":
        return { name: "mail-outline" as const, bg: "#EEF2FF", fg: theme.colors.primary };
      case "PAYMENT":
        return { name: "cash-outline" as const, bg: "#EAFBF0", fg: "#16A34A" };
      case "REMINDER":
        return { name: "time-outline" as const, bg: "#E8F1FF", fg: "#2E6BFF" };
      default:
        return { name: "information-circle-outline" as const, bg: "#F1F5F9", fg: "#0F172A" };
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("alerts")}</Text>

        <Pressable style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          <View style={styles.dot} />
        </Pressable>
      </View>

      <View style={styles.filterWrap}>
        <Pressable
          onPress={() => setFilter("ALL")}
          style={[styles.filterBtn, filter === "ALL" && styles.filterBtnActive]}
        >
          <Text style={[styles.filterText, filter === "ALL" && styles.filterTextActive]}>{t("all")}</Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter("UNREAD")}
          style={[styles.filterBtn, filter === "UNREAD" && styles.filterBtnActive]}
        >
          <Text style={[styles.filterText, filter === "UNREAD" && styles.filterTextActive]}>{t("unread")}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={26} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>{t("no_alerts")}</Text>
            <Text style={styles.emptySub}>{t("no_alerts_sub")}</Text>
          </View>
        ) : (
          visible.map((a) => {
            const icon = iconFor(a.type);

            return (
              <View key={a.id} style={[styles.card, a.unread && styles.cardUnread]}>
                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
                    <Ionicons name={icon.name} size={20} color={icon.fg} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title}>{t(a.titleKey)}</Text>
                      <Text style={styles.time}>{a.timeLabel}</Text>
                    </View>
                    <Text style={styles.body}>{a.body}</Text>

                    {a.type === "REQUEST" && (
                      <Pressable onPress={() => navigation.navigate("JobRequests")} style={styles.actionBtn}>
                        <Text style={styles.actionText}>{t("view_requests")}</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
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
    backgroundColor: theme.colors.bg 
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerBtn: { 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  headerTitle: { 
    flex: 1, 
    textAlign: "center", 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.text 
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

  filterWrap: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    marginHorizontal: theme.spacing.xl,
    marginTop: 14,
    borderRadius: 18,
    padding: 6,
    gap: 6
  },
  filterBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 14, 
    alignItems: "center" 
  },
  filterBtnActive: { 
    backgroundColor: "white" 
  },
  filterText: { 
    fontWeight: "900", 
    fontSize: 12, 
    color: theme.colors.muted, 
    textTransform: "uppercase" 
  },
  filterTextActive: { 
    color: theme.colors.text 
  },

  content: { 
    padding: theme.spacing.xl 
  },

  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12
  },
  cardUnread: { 
    borderColor: "#C7D2FE" 
  },

  row: { 
    flexDirection: "row", 
    gap: 12, 
    alignItems: "flex-start" 
  },
  iconWrap: { 
    width: 44, 
    height: 44, 
    borderRadius: 16, 
    alignItems: "center", 
    justifyContent: "center" 
  },

  titleRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
     gap: 10 
    },
  title: { 
    fontSize: 14, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  time: { 
    fontSize: 12, 
    fontWeight: "800",
    color: theme.colors.muted 
  },

  body: { 
    marginTop: 6, 
    color: "#475467", 
    fontWeight: "700", 
    lineHeight: 18 
  },

  actionBtn: { 
    marginTop: 10, 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    alignSelf: "flex-start" 
  },
  actionText: { 
    fontWeight: "900", 
    color: theme.colors.primary 
  },

  empty: { 
    marginTop: 80, 
    alignItems: "center" 
  },
  emptyTitle: { 
    marginTop: 10, 
    fontWeight: "900", 
    fontSize: 16, 
    color: theme.colors.text 
  },
  emptySub: { 
    marginTop: 6, 
    color: theme.colors.muted, 
    fontWeight: "700", 
    textAlign: "center" 
  }
});
