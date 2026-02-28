import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";

import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyCaregiver">;

type DocRow = {
  document_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size_kb: number | null;
  mime_type: string | null;
  verification_status: string;
  uploaded_at: string;
};

function formatDate(d: any) {
  if (!d) return "-";
  try {
    return String(d).slice(0, 10);
  } catch {
    return "-";
  }
}

function formatKb(kb: number | null) {
  if (!kb || kb <= 0) return "—";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function mapStatusLabel(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING_VERIFICATION") return "Pending Verification";
  if (s === "VERIFIED") return "Verified";
  if (s === "REJECTED") return "Rejected";
  return status || "-";
}

function getStatusMeta(status: string) {
  const s = String(status || "").toUpperCase();

  if (s === "VERIFIED") {
    return { color: "#16A34A", icon: "checkmark-circle" as const };
  }
  if (s === "REJECTED") {
    return { color: "#EF4444", icon: "close-circle" as const };
  }
  // pending states
  return { color: "#F97316", icon: "time" as const };
}

export default function VerifyCaregiverScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { caregiverId } = route.params;

  const [loading, setLoading] = useState(true);
  const [caregiverName, setCaregiverName] = useState<string>("-");
  const [appliedOn, setAppliedOn] = useState<string>("-");
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [profileStatus, setProfileStatus] = useState<string>("PENDING_VERIFICATION");

  const statusLabel = useMemo(() => mapStatusLabel(profileStatus), [profileStatus]);
  const statusMeta = useMemo(() => getStatusMeta(profileStatus), [profileStatus]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/governance/admin/caregiver/${caregiverId}`);
      const caregiver = res.data?.caregiver;
      const documents = Array.isArray(res.data?.documents) ? res.data.documents : [];

      setCaregiverName(caregiver?.full_name || "-");
      setProfileStatus(caregiver?.profile_status || "PENDING_VERIFICATION");
      setDocs(documents);


      setAppliedOn(caregiver?.requested_at ? formatDate(caregiver.requested_at) : "-");
    } catch (e: any) {
      console.log("Caregiver details error:", e?.response?.data || e?.message);
      Alert.alert(t("error") || "Error", e?.response?.data?.message || "Failed to load caregiver details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [caregiverId]);

  const openDoc = async (url: string) => {
    try {
      if (!url) return Alert.alert(t("error") || "Error", "No document URL found.");
      await WebBrowser.openBrowserAsync(url);
    } catch {

      const ok = await Linking.canOpenURL(url);
      if (!ok) return Alert.alert(t("error") || "Error", "Cannot open this document.");
      await Linking.openURL(url);
    }
  };

  const updateStatus = async (newStatus: "VERIFIED" | "REJECTED") => {
    try {
      await api.put(`/governance/admin/caregiver/${caregiverId}/status`, {
        newStatus,
        note: newStatus === "VERIFIED" ? "Approved by admin" : "Rejected by admin",
      });

      Alert.alert(
        newStatus === "VERIFIED" ? (t("approved") || "Approved") : (t("rejected") || "Rejected"),
        newStatus === "VERIFIED" ? (t("approved_msg") || "Caregiver marked as verified.") : (t("rejected_msg") || "Caregiver rejected.")
      );

      navigation.goBack();
    } catch (e: any) {
      console.log("Update status error:", e?.response?.data || e?.message);
      Alert.alert(t("error") || "Error", e?.response?.data?.message || "Failed to update caregiver status");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("verify_documents") || "Verify Documents"}</Text>

        <Pressable style={styles.iconBtn} onPress={fetchDetails}>
          <Ionicons name="refresh-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 120 }}>
        {/* Caregiver top card */}
        <View style={styles.topCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(caregiverName?.[0] || "?").toUpperCase()}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{caregiverName}</Text>

            <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.muted} />
              <Text style={styles.meta}>{t("applied_on_date") || "Applied on"}: {appliedOn}</Text>
            </View>

            <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name={statusMeta.icon} size={16} color={statusMeta.color} />
              <Text style={[styles.meta, { color: statusMeta.color }]}>{t("status") || "Status"}: {statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Quick stats */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("profile_status") || "Profile Status"}</Text>
            <Text style={[styles.statValue, { color: statusMeta.color }]}>{statusLabel}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("submitted_documents") || "Submitted Documents"}</Text>
            <Text style={styles.statValue}>{docs.length}</Text>
          </View>
        </View>

        {/* Documents */}
        <Text style={styles.sectionTitle}>{t("submitted_documents") || "Submitted Documents"}</Text>

        <View style={styles.docsBox}>
          {docs.length === 0 ? (
            <View style={{ padding: 14 }}>
              <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>
                {t("no_docs_uploaded") || "No documents uploaded yet"}
              </Text>
            </View>
          ) : (
            docs.map((d) => (
              <Pressable key={d.document_id} style={styles.docRow} onPress={() => openDoc(d.file_url)}>
                <View style={styles.docIcon}>
                  <Ionicons name="document-text-outline" size={20} color="#2E6BFF" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.docName} numberOfLines={1}>{d.file_name}</Text>
                  <Text style={styles.docMeta}>
                    {String(d.document_type)} • {formatKb(d.file_size_kb)} • {formatDate(d.uploaded_at)} • {String(d.verification_status)}
                  </Text>
                </View>

                <Pressable onPress={() => openDoc(d.file_url)} style={styles.openBtn}>
                  <Ionicons name="open-outline" size={18} color={theme.colors.muted} />
                </Pressable>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => updateStatus("REJECTED")} style={styles.rejectBtn}>
          <Ionicons name="close" size={18} color="#EF4444" />
          <Text style={styles.rejectText}>{t("reject") || "Reject"}</Text>
        </Pressable>

        <Pressable onPress={() => updateStatus("VERIFIED")} style={styles.approveBtn}>
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
          <Text style={styles.approveText}>{t("approve") || "Approve"}</Text>
        </Pressable>
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

  topCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { 
    fontWeight: "900", 
    color: theme.colors.muted,
     fontSize: 18 
    },

  name: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  meta: { 
    color: theme.colors.muted, 
    fontWeight: "800" 
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statLabel: { 
    color: theme.colors.muted, 
    fontWeight: "900",
     fontSize: 12
     },
  statValue: {
     marginTop: 8, 
     fontWeight: "900", 
     fontSize: 16, 
     color: theme.colors.text
     },

  sectionTitle: { 
    marginTop: 18, 
    fontSize: 16, 
    fontWeight: "900", 
    color: theme.colors.text 
  },

  docsBox: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E8F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  docName: { 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  docMeta: { 
    marginTop: 4, 
    color: theme.colors.muted, 
    fontWeight: "800", 
    fontSize: 12 
  },
  openBtn: { 
    width: 40, 
    height: 40,
     borderRadius: 14, 
     alignItems: "center", 
     justifyContent: "center"
     },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: "row",
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  rejectText: { fontWeight: "900", color: "#EF4444" },
  approveBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2E6BFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  approveText: { fontWeight: "900", color: "#fff" },
});