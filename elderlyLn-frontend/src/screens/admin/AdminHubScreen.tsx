import React, { useEffect, useMemo, useState } from "react";
import {View,Text,StyleSheet,Pressable, FlatList,Modal, TextInput, Alert, ActivityIndicator,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import { api } from "../../api/api"; 
type Props = NativeStackScreenProps<AuthStackParamList, "AdminHub">;

// Data shown in the caregiver verification queue
type QueueItem = {
  id: string; 
  name: string; 
  requestedAt: string | null;
  docsCount: number;
};

// Complaint details shown in the complaints tab
type ComplaintItem = {
  complaint_id: string;
  status: "Submitted" | "Under Review" | "Closed" | string;
  submitted_at: string;
  description: string;
  family_name?: string;
  caregiver_name?: string;
};

export default function AdminHubScreen({ navigation }: Props) {
  const { t } = useTranslation();
  // Switch between verification requests and complaints
  const [tab, setTab] = useState<"verification" | "complaints">("verification");

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  const [showDispute, setShowDispute] = useState(false);
  const [note, setNote] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);

  const complaintsCount = complaints.length;

  const fetchQueue = async () => {
    try {
      setLoadingQueue(true);
      // Request the latest verification queue from the backend
      const res = await api.get("/governance/admin/verificationQueue");
      setQueue(res.data || []);
    } catch (e: any) {
      console.log("Queue error:", e?.response?.data || e?.message);
      Alert.alert(t("error_title"), e?.response?.data?.message || t("failed_load_verification_queue"));
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      // Request complaint data from the backend
      const res = await api.get("/governance/complaints");
      setComplaints(res.data || []);
    } catch (e: any) {
      console.log("Complaints error:", e?.response?.data || e?.message);
      Alert.alert(t("error_title"), e?.response?.data?.message || t("failed_load_complaints"));
    } finally {
      setLoadingComplaints(false);
    }
  };

  // Load both tabs when the screen is opened
  useEffect(() => {
    fetchQueue();
    fetchComplaints();
  }, []);

  // Open the selected caregiver's verification details screen
  const openVerify = (caregiverId: string) => {
    navigation.navigate("VerifyCaregiver", { caregiverId });
  };

  // Open the complaint resolution modal for the selected complaint
  const openResolveModal = (c: ComplaintItem) => {
    setSelectedComplaint(c);
    setShowDispute(true);
  };

// Mark the complaint as resolved with an internal note
  const resolve = async () => {
    try {
      if (!selectedComplaint) return;

      // Prevent resolving a complaint without a note
      if (!note.trim()) {
        Alert.alert(t("note_required_title"), t("note_required_msg"));
        return;
      }

      // Send the complaint resolution update to the backend
      await api.put(`/governance/resolveComplaint/${selectedComplaint.complaint_id}`, {
        resolutionNote: note.trim(),
        newStatus: "Closed",
      });

      setShowDispute(false);
      setNote("");
      setSelectedComplaint(null);
      fetchComplaints();
      Alert.alert(t("marked_resolved_demo"));
    } catch (e: any) {
      console.log("Resolve error:", e?.response?.data || e?.message);
      Alert.alert(t("error_title"), e?.response?.data?.message || t("failed_resolve_complaint"));
    }
  };

  const renderQueueItem = ({ item, index }: { item: QueueItem; index: number }) => {
    // Highlight the first queue item as the active card style 
    const active = index === 0;
    return (
      <Pressable onPress={() => openVerify(item.id)} style={[styles.queueCard, active && styles.queueActive]}>
        <View style={styles.circle}>
          <Text style={styles.circleText}>{(item.name?.[0] || "?").toUpperCase()}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.queueName}>{item.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
            <Text style={styles.queueMeta}>{t("pending").toUpperCase()}</Text>
            <Text style={styles.queueDot}>•</Text>
            <Text style={styles.queueDocs}>
              {item.docsCount} {t("docs")}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
      </Pressable>
    );
  };

  // Render each complaint card in the complaints tab 
  const renderComplaintItem = ({ item }: { item: ComplaintItem }) => {
    const isPending = item.status !== "Closed";
    return (
      <Pressable onPress={() => openResolveModal(item)} style={styles.complaintCard}>
        <View style={[styles.pendingPill, !isPending && { backgroundColor: "#DCFCE7" }]}>
          <Text style={[styles.pendingText, !isPending && { color: "#166534" }]}>
            {isPending ? t("pending") : t("resolved")}
          </Text>
        </View>

        <Text style={styles.complaintDate}>{String(item.submitted_at).slice(0, 10)}</Text>

        <Text style={styles.family}>
          {item.family_name ? item.family_name : t("family_generic")} {item.caregiver_name ? `→ ${item.caregiver_name}` : ""}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          "{item.description}"
        </Text>
      </Pressable>
    );
  };

  const headerRight = useMemo(() => {
    return (
      <Pressable
        style={styles.iconBtn}
        onPress={() => {
          fetchQueue();
          fetchComplaints();
        }}
      >
        <Ionicons name="refresh-outline" size={22} color={theme.colors.text} />
      </Pressable>
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("admin_hub")}</Text>

        {headerRight}
      </View>
 
      {/* //Tab buttons to switch between verification requests and complaints */}
      <View style={styles.segmentWrap}>
        <Pressable onPress={() => setTab("verification")} style={[styles.segmentBtn, tab === "verification" && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === "verification" && styles.segmentTextActive]}>{t("verification_queue")}</Text>
        </Pressable>

        <Pressable onPress={() => setTab("complaints")} style={[styles.segmentBtn, tab === "complaints" && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === "complaints" && styles.segmentTextActive]}>
            {t("complaints")} ({complaintsCount})
          </Text>
        </Pressable>
      </View>

      {tab === "verification" ? (
        loadingQueue ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator />
          </View>
        ) : (
          // Show caregivers waiting for admin verification
          <FlatList
            contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 24 }}
            data={queue}
            keyExtractor={(x) => x.id}
            renderItem={renderQueueItem}
            ListEmptyComponent={
              <View style={{ paddingTop: 30, alignItems: "center" }}>
                <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>{t("no_pending_verification_requests")}</Text>
              </View>
            }
          />
        )
      ) : loadingComplaints ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        //Show complaint records and allow admins to resolve them
        <FlatList
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 24 }}
          data={complaints}
          keyExtractor={(x) => x.complaint_id}
          renderItem={renderComplaintItem}
          ListEmptyComponent={
            <View style={{ paddingTop: 30, alignItems: "center" }}>
              <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>{t("no_complaints_yet")}</Text>
            </View>
          }
        />
      )}

      {/* //Modal used to add an internal note before resolving a complaint */}
      <Modal visible={showDispute} transparent animationType="fade" onRequestClose={() => setShowDispute(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("dispute_resolution")}</Text>
              <Pressable
                onPress={() => {
                  setShowDispute(false);
                  setSelectedComplaint(null);
                  setNote("");
                }}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{t("complaint_summary")}</Text>
              <Text style={styles.summaryText} numberOfLines={4}>
                "{selectedComplaint?.description || "-"}"
              </Text>
              <Text style={{ marginTop: 8, fontWeight: "800", color: theme.colors.muted }}>
                {t("status")}: {selectedComplaint?.status || "-"}
              </Text>
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
              <Pressable
                onPress={() => {
                  setShowDispute(false);
                  setSelectedComplaint(null);
                  setNote("");
                }}
                style={styles.closeBtn}
              >
                <Text style={styles.closeText}>{t("close")}</Text>
              </Pressable>

              <Pressable onPress={resolve} style={styles.resolveBtn}>
                <Text style={styles.resolveText}>{t("mark_resolved")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  segmentWrap: {
    marginTop: 14,
    marginHorizontal: theme.spacing.xl,
    backgroundColor: "#EEF2F6",
    padding: 6,
    borderRadius: 16,
    flexDirection: "row",
    gap: 6,
  },
  segmentBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  segmentActive: { backgroundColor: "#fff" },
  segmentText: { fontWeight: "900", color: theme.colors.muted },
  segmentTextActive: { color: theme.colors.text },

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
  queueActive: { borderColor: "#2E6BFF", borderWidth: 2 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 99,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
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
    padding: 16, 
    marginBottom: 12 
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