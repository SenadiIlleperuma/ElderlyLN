import React, { useEffect, useState } from "react";
import { View,Text, StyleSheet,Pressable,TextInput, ScrollView, Alert,ActivityIndicator,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "EditProfile">;

export default function EditProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");

  const [original, setOriginal] = useState({
    fullName: "",
    phone: "",
    district: "",
    email: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const translateDistrict = (value: string) => {
    const raw = String(value || "").trim();
    if (!raw) return raw;

    return t(`district_${raw.toLowerCase().replace(/\s+/g, "_")}`, {
      defaultValue: raw,
    });
  };

 // Load the user's profile information
  const loadProfile = async () => {
    try {
      setLoading(true);
      // Make API call to fetch profile data
      const res = await api.get("/profile/me");

      const p = res.data;
      // Store loaded values both in form state and original state
      const next = {
        fullName: p.full_name ?? "",
        phone: p.phone_no ?? "",
        district: p.district ?? "",
        email: p.email ?? "",
      };

      setFullName(next.fullName);
      setPhone(next.phone);
      setDistrict(next.district);
      setEmail(next.email);

      setOriginal(next);
    } catch (err: any) {
      console.log("Load profile error:", err?.response?.data || err?.message);
      Alert.alert(t("error_title"), err?.response?.data?.message || t("failed_load_profile"));
    } finally {
      setLoading(false);
    }
  };
  // Load profile when screen opens
  useEffect(() => {
    loadProfile();
  }, []);

  // Save the current profile values to original state and enable editing mode
  const startEdit = () => {
    setOriginal({ fullName, phone, district, email });
    setIsEditing(true);
  };

  // Cancel the edit and revert to original values
  const cancelEdit = () => {
    setFullName(original.fullName);
    setPhone(original.phone);
    setDistrict(original.district);
    setEmail(original.email);
    setIsEditing(false);
  };

  // Validate and save the profile changes
  const saveProfile = async () => {
    // Check if any required fields are empty
    if (!fullName.trim() || !district.trim() || !email.trim() || !phone.trim()) {
      Alert.alert(t("missing_fields_title"), t("missing_fields_msg"));
      return;
    }

    try {
      setSaving(true);
      // Send the updated profile data to the server
      await api.put("/profile/me", {
        full_name: fullName.trim(),
        phone_no: phone.trim(),
        district: district.trim(),
        email: email.trim(),
      });

      Alert.alert(t("saved_title"), t("profile_updated_msg"));
      setIsEditing(false);
      await loadProfile();
    } catch (err: any) {
      console.log("Save profile error:", err?.response?.data || err?.message);
      Alert.alert(t("failed_title"), err?.response?.data?.message || t("could_not_update_profile"));
    } finally {
      setSaving(false);
    }
  };
// Temporarily deactivate the account with confirmation
  const deactivateAccount = () => {
    Alert.alert(
      t("deactivate_account_title"),
      t("deactivate_account_msg"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("deactivate_temporarily"),
          style: "destructive",
          onPress: async () => {
            try {
              // API call to deactivate the account
              await api.put("/profile/account/deactivate");
              await AsyncStorage.removeItem("token");

              Alert.alert(t("done_title"), t("account_deactivated_msg"));
              navigation.reset({
                index: 0,
                routes: [{ name: "Login", params: { role: "family" } }],
              });
            } catch (err: any) {
              console.log("Deactivate error:", err?.response?.data || err?.message);
              Alert.alert(t("failed_title"), err?.response?.data?.message || t("could_not_deactivate_account"));
            }
          },
        },
      ]
    );
  };
// Permanently delete the account with confirmation
  const deleteAccount = () => {
    Alert.alert(t("delete_account_title"), t("delete_account_msg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete_account_permanently"),
        style: "destructive",
        onPress: async () => {
          try {
            // API call to delete the account permanently
            await api.delete("/profile/account/delete");
            await AsyncStorage.removeItem("token");

            Alert.alert(t("deleted_title"), t("account_deleted_msg"));
            navigation.reset({
              index: 0,
              routes: [{ name: "Login", params: { role: "family" } }],
            });
          } catch (err: any) {
            console.log("Delete error:", err?.response?.data || err?.message);
            Alert.alert(t("failed_title"), err?.response?.data?.message || t("could_not_delete_account"));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("profile")}</Text>

        {!isEditing ? (
          <Pressable onPress={startEdit} style={styles.headerBtnRight}>
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.editText}>{t("edit")}</Text>
          </Pressable>
        ) : (
          <View style={styles.headerBtnRight} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: theme.colors.muted, fontWeight: "700" }}>
            {t("loading_profile")}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{fullName || "—"}</Text>
              <Text style={styles.sub}>{translateDistrict(district) || "—"}</Text>
            </View>

            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
              <Text style={styles.verifiedText}>{t("verified")}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("personal_details")}</Text>

            <Text style={styles.label}>{t("full_name")}</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              editable={isEditing}
              style={[styles.input, !isEditing && styles.inputDisabled]}
            />

            <Text style={styles.label}>{t("phone")}</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
              keyboardType="phone-pad"
              style={[styles.input, !isEditing && styles.inputDisabled]}
            />

            <Text style={styles.label}>{t("district")}</Text>
            <TextInput
              value={isEditing ? district : translateDistrict(district)}
              onChangeText={setDistrict}
              editable={isEditing}
              style={[styles.input, !isEditing && styles.inputDisabled]}
            />

            <Text style={styles.label}>{t("email")}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              keyboardType="email-address"
              style={[styles.input, !isEditing && styles.inputDisabled]}
              autoCapitalize="none"
            />

            {isEditing && (
              <View style={styles.editRow}>
                <Pressable onPress={cancelEdit} style={styles.cancelBtn} disabled={saving}>
                  <Text style={styles.cancelText}>{t("cancel")}</Text>
                </Pressable>

                <Pressable onPress={saveProfile} style={styles.saveBtn} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t("save")}</Text>}
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("account_actions")}</Text>

            <Pressable onPress={deactivateAccount} style={styles.actionBtn}>
              <Ionicons name="pause-circle-outline" size={18} color={theme.colors.text} />
              <Text style={styles.actionText}>{t("deactivate_temporarily")}</Text>
            </Pressable>

            <Pressable onPress={deleteAccount} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="white" />
              <Text style={styles.deleteText}>{t("delete_account_permanently")}</Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
    color: theme.colors.text,
  },
  headerBtnRight: {
    minWidth: 70,
    height: 40,
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
    gap: 6,
  },
  editText: { 
    color: theme.colors.primary, 
    fontWeight: "900" 
  },
  center: { 
    flex: 1,
    alignItems: "center", 
    justifyContent: "center" 
  },
  content: { 
    padding: theme.spacing.xl 
  },
  topCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  name: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  sub: { 
    marginTop: 3, 
    fontSize: 13, 
    fontWeight: "700", 
    color: theme.colors.muted
   },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  verifiedText: { 
    color: "#16A34A", 
    fontWeight: "900", 
    fontSize: 12 
  },
  card: {
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: "900",
    color: theme.colors.text, 
    marginBottom: 12 
  },
  label: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "900",
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: theme.colors.bg,
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
  },
  inputDisabled: { 
    opacity: 0.75 
  },
  editRow: { 
    flexDirection: "row",
    gap: 12, 
    marginTop: 16 
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "white",
  },
  cancelText: { 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  saveBtn: {
    flex: 1,
    borderRadius: theme.radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
  saveText: { 
    fontWeight: "900", 
    color: "white" 
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.bg,
    marginBottom: 12,
  },
  actionText: { 
    fontSize: 15, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#EF4444",
  },
  deleteText: { 
    color: "white", 
    fontSize: 15, 
    fontWeight: "900" 
  },
});