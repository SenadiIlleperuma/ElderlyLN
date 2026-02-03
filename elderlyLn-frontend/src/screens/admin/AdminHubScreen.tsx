import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "AdminHub">;

type QueueItem = {
  id: string;
  name: string;
  timeAgo: string;
  docsCount: number;
};

type ComplaintItem = {
  id: string;
  status: "PENDING" | "RESOLVED";
  date: string;
  familyName: string;
  summary: string;
};

const QUEUE: QueueItem[] = [
  { id: "q1", name: "Hasini Perera", timeAgo: "2 HOURS AGO", docsCount: 3 },
  { id: "q2", name: "Malith Silva", timeAgo: "5 HOURS AGO", docsCount: 2 },
  { id: "q3", name: "Sunil Rajapaksha", timeAgo: "1 DAY AGO", docsCount: 4 },
];

const COMPLAINTS: ComplaintItem[] = [
  { id: "c1", status: "PENDING", date: "2024-05-18", familyName: "The Fonseka Family", summary: "Punctuality issues during morning shift" },
];

export default function AdminHubScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"verification" | "complaints">("verification");

  const [showDispute, setShowDispute] = useState(false);
  const [note, setNote] = useState("");

  const openVerify = (name: string) => {
    navigation.navigate("VerifyCaregiver", {
      caregiver: {
        id: "cg_" + name.toLowerCase().replace(/\s+/g, "_"),
        name,
        appliedDateLabel: t("applied_on_date"),
        nicStatus: "AUTO_PASS",
        policeStatus: "MANUAL_REVIEW",
        docs: [
          { id: "d1", filename: "Nursing_Certificate.pdf", sizeLabel: "2.4 MB", type: "pdf" },
          { id: "d2", filename: "Police_Clearance.jpg", sizeLabel: "1.1 MB", type: "jpg" },
          { id: "d3", filename: "Reference_Letter.pdf", sizeLabel: "840 KB", type: "pdf" },
        ],
      },
    });
  };

  const resolve = () => {
    setShowDispute(false);
    Alert.alert(t("marked_resolved_demo"), note ? `${t("internal_note")}: ${note}` : t("no_note"));
    setNote("");
  };

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("admin_hub")}</Text>

        <Pressable style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          <View style={styles.dot} />
        </Pressable>
      </View>

      <View style={styles.segmentWrap}>
        <Pressable onPress={() => setTab("verification")} style={[styles.segmentBtn, tab === "verification" && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === "verification" && styles.segmentTextActive]}>{t("verification_queue")}</Text>
        </Pressable>
        <Pressable onPress={() => setTab("complaints")} style={[styles.segmentBtn, tab === "complaints" && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === "complaints" && styles.segmentTextActive]}>
            {t("complaints")} ({COMPLAINTS.length})
          </Text>
        </Pressable>
      </View>

      {tab === "verification" ? (
        <FlatList
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 24 }}
          data={QUEUE}
          keyExtractor={(x) => x.id}
          renderItem={({ item, index }) => {
            const active = index === 0;
            return (
              <Pressable onPress={() => openVerify(item.name)} style={[styles.queueCard, active && styles.queueActive]}>
                <View style={styles.circle}>
                  <Text style={styles.circleText}>{item.name[0]}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.queueName}>{item.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <Text style={styles.queueMeta}>{item.timeAgo}</Text>
                    <Text style={styles.queueDot}>•</Text>
                    <Text style={styles.queueDocs}>{item.docsCount} {t("docs")}</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
              </Pressable>
            );
          }}
        />
      ) : (
        <View style={{ padding: theme.spacing.xl }}>
          <Pressable onPress={() => setShowDispute(true)} style={styles.complaintCard}>
            <View style={styles.pendingPill}>
              <Text style={styles.pendingText}>{t("pending")}</Text>
            </View>
            <Text style={styles.complaintDate}>{COMPLAINTS[0].date}</Text>

            <Text style={styles.family}>{COMPLAINTS[0].familyName}</Text>
            <Text style={styles.summary}>"{COMPLAINTS[0].summary}"</Text>
          </Pressable>

          <Modal visible={showDispute} transparent animationType="fade" onRequestClose={() => setShowDispute(false)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t("dispute_resolution")}</Text>
                  <Pressable onPress={() => setShowDispute(false)} style={styles.modalClose}>
                    <Ionicons name="close" size={20} color={theme.colors.text} />
                  </Pressable>
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>{t("complaint_summary")}</Text>
                  <Text style={styles.summaryText}>"{COMPLAINTS[0].summary}"</Text>
                </View>

                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={t("add_internal_note")}
                  placeholderTextColor="#9aa3af"
                  multiline
                  style={styles.input}
                />

                <View style={styles.actions}>
                  <Pressable onPress={() => setShowDispute(false)} style={styles.closeBtn}>
                    <Text style={styles.closeText}>{t("close")}</Text>
                  </Pressable>

                  <Pressable onPress={resolve} style={styles.resolveBtn}>
                    <Text style={styles.resolveText}>{t("mark_resolved")}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
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
  iconBtn: { 
    width: 44, 
    height: 44, 
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
    position: "absolute", 
    top: 11, 
    right: 12, 
    width: 7, 
    height: 7, 
    borderRadius: 99, 
    backgroundColor: "#EF4444" 
  },

  segmentWrap: {
    marginTop: 14,
    marginHorizontal: theme.spacing.xl,
    backgroundColor: "#EEF2F6",
    padding: 6,
    borderRadius: 16,
    flexDirection: "row",
    gap: 6,
  },
  segmentBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 14, 
    alignItems: "center" 
  },
  segmentActive: { 
    backgroundColor: "#fff" 
  },
  segmentText: { 
    fontWeight: "900", 
    color: theme.colors.muted 
  },
  segmentTextActive: { 
    color: theme.colors.text 
  },

  queueCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  queueActive: { 
    borderColor: "#2E6BFF", 
    borderWidth: 2 
  },

  circle: { 
    width: 44, 
    height: 44, 
    borderRadius: 99, 
    backgroundColor: "#F3F4F6", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  circleText: { 
    fontWeight: "900", 
    color: theme.colors.muted
   },

  queueName: { 
    fontWeight: "900", 
    fontSize: 16, 
    color: theme.colors.text 
  },
  queueMeta: { 
    fontWeight: "800", 
    color: theme.colors.muted, 
    fontSize: 12 
  },
  queueDot: { 
    color: theme.colors.muted, 
    fontWeight: "900" 
  },
  queueDocs: { 
    color: "#2E6BFF", 
    fontWeight: "900", 
    fontSize: 12 
  },

  complaintCard: { 
    backgroundColor: "#FFF7F7", 
    borderWidth: 1, 
    borderColor: "#FECACA", 
    borderRadius: 18, 
    padding: 16 
  },
  pendingPill: { 
    alignSelf: "flex-start", 
    backgroundColor: "#FDE2E2", 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 999 
  },
  pendingText: { 
    fontWeight: "900", 
    color: "#B91C1C" 
  },
  complaintDate: { 
    position: "absolute", 
    top: 16, 
    right: 16, 
    color: theme.colors.muted, 
    fontWeight: "800" 
  },
  family: { 
    marginTop: 12, 
    fontWeight: "900", 
    color: theme.colors.text, 
    fontSize: 16 
  },
  summary: { 
    marginTop: 6, 
    color: theme.colors.muted, 
    fontWeight: "700" 
  },

  modalBackdrop: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.45)", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 18 
  },
  modalCard: { 
    width: "100%", 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    padding: 16 
  },
  modalHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  modalClose: { 
    width: 40, 
    height: 40, 
    borderRadius: 14, 
    backgroundColor: "#F3F4F6", 
    alignItems: "center", 
    justifyContent: "center" 
  },

  summaryBox: { 
    marginTop: 14, 
    backgroundColor: "#FFF1F2", 
    borderRadius: 16, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: "#FECACA" 
  },
  summaryLabel: { 
    fontWeight: "900", 
    color: "#B91C1C", 
    fontSize: 12 
  },
  summaryText: { 
    marginTop: 6, 
    fontWeight: "800", 
    color: "#B91C1C" 
  },

  input: { 
    marginTop: 14, 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    borderRadius: 16, 
    padding: 12, 
    minHeight: 96, 
    fontWeight: "700", 
    color: theme.colors.text 
  },

  actions: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 16 
  },
  closeBtn: { 
    flex: 1, 
    height: 52, 
    borderRadius: 16, 
    backgroundColor: "#F3F4F6", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  closeText: { 
    fontWeight: "900", 
    color: theme.colors.muted 
  },
  resolveBtn: { 
    flex: 1, 
    height: 52, 
    borderRadius: 16, 
    backgroundColor: "#16A34A", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  resolveText: { 
    fontWeight: "900", 
    color: "#fff" 
  },
});
