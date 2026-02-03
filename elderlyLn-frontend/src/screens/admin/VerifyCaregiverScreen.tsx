import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyCaregiver">;

export default function VerifyCaregiverScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { caregiver } = route.params;

  const statusCard = (title: string, status: "AUTO_PASS" | "MANUAL_REVIEW") => {
    const auto = status === "AUTO_PASS";
    const color = auto ? "#16A34A" : "#F97316";
    return (
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>{title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
          <Ionicons name={auto ? "checkmark-circle" : "shield-checkmark-outline"} size={18} color={color} />
          <Text style={[styles.statusValue, { color }]}>{auto ? t("auto_pass") : t("manual_review")}</Text>
        </View>
      </View>
    );
  };

  const approve = () => {
    Alert.alert(t("approved_demo"), t("approved_demo_msg"));
    navigation.goBack();
  };

  const reject = () => {
    Alert.alert(t("rejected_demo"), t("rejected_demo_msg"));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("verify_documents")}</Text>

        <Pressable style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          <View style={styles.dot} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 120 }}>
        <View style={styles.topRow}>
          <View style={styles.photo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{caregiver.name}</Text>
            <Text style={styles.applied}>{caregiver.appliedDateLabel}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
          {statusCard(t("nic_verified"), caregiver.nicStatus)}
          {statusCard(t("police_report"), caregiver.policeStatus)}
        </View>

        <Text style={styles.sectionTitle}>{t("submitted_documents")}</Text>

        <View style={styles.docsBox}>
          {caregiver.docs.map((d) => (
            <View key={d.id} style={styles.docRow}>
              <View style={styles.docIcon}>
                <Ionicons name="document-text-outline" size={20} color="#2E6BFF" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>{d.filename}</Text>
                <Text style={styles.docSize}>{d.sizeLabel}</Text>
              </View>

              <Pressable onPress={() => Alert.alert(t("download_demo"), d.filename)} style={styles.downloadBtn}>
                <Ionicons name="download-outline" size={20} color={theme.colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={reject} style={styles.rejectBtn}>
          <Ionicons name="close" size={18} color="#EF4444" />
          <Text style={styles.rejectText}>{t("reject")}</Text>
        </Pressable>

        <Pressable onPress={approve} style={styles.approveBtn}>
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
          <Text style={styles.approveText}>{t("approve")}</Text>
        </Pressable>
      </View>
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

  topRow: { 
    flexDirection: "row", 
    gap: 12, 
    alignItems: "center" 
  },
  photo: { 
    width: 54, 
    height: 54, 
    borderRadius: 18, 
    backgroundColor: "#EEF2F6" 
  },
  name: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  applied: {
    marginTop: 4, 
    color: theme.colors.muted, 
    fontWeight: "800" 
  },

  statusCard: { 
    flex: 1, 
    backgroundColor: "#fff", 
    borderRadius: 18, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  statusTitle: { 
    color: theme.colors.muted, 
    fontWeight: "900", 
    fontSize: 12
   },
  statusValue: { 
    fontWeight: "900" 
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
    borderColor: theme.colors.border 
  },
  docRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    padding: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border 
  },
  docIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: "#E8F1FF", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  docName: { 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  docSize: { 
    marginTop: 4, 
    color: theme.colors.muted, 
    fontWeight: "800" 
  },
  downloadBtn: { 
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
    gap: 12 
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
    gap: 8 
  },

  rejectText: { 
    fontWeight: "900", 
    color: "#EF4444" 
  },
  approveBtn: { 
    flex: 1, 
    height: 52, 
    borderRadius: 16,
    backgroundColor: "#2E6BFF", 
    alignItems: "center", 
    justifyContent: "center", 
    flexDirection: "row", 
    gap: 8
   },
  approveText: { 
    fontWeight: "900", 
    color: "#fff" 
  },
});
