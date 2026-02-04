import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "EditProfile">;

export default function EditProfileScreen({ navigation }: Props) {
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


  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile/me");

      const p = res.data;

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
      Alert.alert("Error", err?.response?.data?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);


  const startEdit = () => {
    setOriginal({ fullName, phone, district, email });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setFullName(original.fullName);
    setPhone(original.phone);
    setDistrict(original.district);
    setEmail(original.email);
    setIsEditing(false);
  };


  const saveProfile = async () => {
    if (!fullName.trim() || !district.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Missing fields", "Please fill all fields before saving.");
      return;
    }

    try {
      setSaving(true);

      await api.put("/profile/me", {
        full_name: fullName.trim(),
        phone_no: phone.trim(),
        district: district.trim(),
        email: email.trim(),
      });

      Alert.alert("Saved", "Profile updated.");
      setIsEditing(false);
      await loadProfile();
    } catch (err: any) {
      console.log("Save profile error:", err?.response?.data || err?.message);
      Alert.alert("Failed", err?.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateAccount = () => {
    Alert.alert(
      "Deactivate account?",
      "This will temporarily disable your account. You can activate again by logging in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await api.put("/profile/deactivate");
              await AsyncStorage.removeItem("token");

              Alert.alert("Done", "Account deactivated.");
              navigation.reset({ index: 0, routes: [{ name: "Login", params: { role: "family" } }] });
            } catch (err: any) {
              console.log("Deactivate error:", err?.response?.data || err?.message);
              Alert.alert("Failed", err?.response?.data?.message || "Could not deactivate account.");
            }
          },
        },
      ]
    );
  };

  
  const deleteAccount = () => {
    Alert.alert("Delete account permanently?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete permanently",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/profile/delete");
            await AsyncStorage.removeItem("token");

            Alert.alert("Deleted", "Account deleted permanently.");
            navigation.reset({ index: 0, routes: [{ name: "Login", params: { role: "family" } }] });
          } catch (err: any) {
            console.log("Delete error:", err?.response?.data || err?.message);
            Alert.alert("Failed", err?.response?.data?.message || "Could not delete account.");
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

        <Text style={styles.headerTitle}>Profile</Text>

        {!isEditing ? (
          <Pressable onPress={startEdit} style={styles.headerBtnRight}>
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        ) : (
          <View style={styles.headerBtnRight} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: theme.colors.muted, fontWeight: "700" }}>
            Loading profile...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>

          <View style={styles.topCard}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{fullName || "—"}</Text>
              <Text style={styles.sub}>{district || "—"}</Text>
            </View>

            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Details</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              editable={isEditing}
              style={[styles.input, !isEditing && styles.inputDisabled]}
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
              keyboardType="phone-pad"
              style={[styles.input, !isEditing && styles.inputDisabled]}
            />

            <Text style={styles.label}>District</Text>
            <TextInput
              value={district}
              onChangeText={setDistrict}
              editable={isEditing}
              style={[styles.input, !isEditing && styles.inputDisabled]}
            />

            <Text style={styles.label}>Email</Text>
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
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable onPress={saveProfile} style={styles.saveBtn} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Actions</Text>

            <Pressable onPress={deactivateAccount} style={styles.actionBtn}>
              <Ionicons name="pause-circle-outline" size={18} color={theme.colors.text} />
              <Text style={styles.actionText}>Deactivate temporarily</Text>
            </Pressable>

            <Pressable onPress={deleteAccount} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="white" />
              <Text style={styles.deleteText}>Delete account permanently</Text>
            </Pressable>

            
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: theme.colors.text },
  headerBtnRight: {
    minWidth: 70,
    height: 40,
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
    gap: 6,
  },
  editText: { color: theme.colors.primary, fontWeight: "900" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  content: { padding: theme.spacing.xl },

  topCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#E5E7EB" },
  name: { fontSize: 18, fontWeight: "900", color: theme.colors.text },
  sub: { marginTop: 3, fontSize: 13, fontWeight: "700", color: theme.colors.muted },

  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  verifiedText: { color: "#16A34A", fontWeight: "900", fontSize: 12 },

  card: {
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
  },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: theme.colors.text, marginBottom: 12 },

  label: { marginTop: 10, marginBottom: 8, fontSize: 13, fontWeight: "900", color: theme.colors.text },
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
  inputDisabled: { opacity: 0.75 },

  editRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "white",
  },
  cancelText: { fontWeight: "900", color: theme.colors.text },

  saveBtn: {
    flex: 1,
    borderRadius: theme.radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
  saveText: { fontWeight: "900", color: "white" },

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
  actionText: { fontSize: 15, fontWeight: "900", color: theme.colors.text },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#EF4444",
  },
  deleteText: { color: "white", fontSize: 15, fontWeight: "900" },

});
