import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
const normalizePhone = (p: string) => p.replace(/\s+/g, "").replace(/-/g, "");
const isValidPhoneLK = (p: string) => /^[0-9]{10}$/.test(p);

const passwordError = (pw: string) => {
  if (!pw || pw.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(pw)) return "Password must include at least 1 uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must include at least 1 lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must include at least 1 number.";
  return null;
};

export default function SignupScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { role } = route.params;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Please enter your full name.");
      return false;
    }

    const p = normalizePhone(phone.trim());
    if (!p || !isValidPhoneLK(p)) {
      Alert.alert("Validation Error", "Please enter a valid 10-digit phone number (07XXXXXXXX).");
      return false;
    }

    if (!district.trim()) {
      Alert.alert("Validation Error", "Please enter your district.");
      return false;
    }

    const e = email.trim().toLowerCase();
    if (!e || !isValidEmail(e)) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return false;
    }

    const pwErr = passwordError(password);
    if (pwErr) {
      Alert.alert("Validation Error", pwErr);
      return false;
    }

    return true;
  };

  const onSignup = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      await api.post("/auth/register", {
        role,
        email: email.trim().toLowerCase(),
        password,
        phone_no: normalizePhone(phone.trim()),
        full_name: fullName.trim(),
        district: district.trim(),
      });

      Alert.alert("Registration Successful", "Your account has been created. Please login.", [
        { text: "OK", onPress: () => navigation.navigate("Login", { role }) },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Unable to register. Please try again.";
      Alert.alert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 10 }}>
        <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>← Back</Text>
      </Pressable>

      <ScrollView style={styles.panel} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>{t("create_account")}</Text>
        <Text style={styles.p}>{t("create_account_subtitle")}</Text>

        <Text style={styles.label}>{t("full_name")}</Text>
        <TextInput value={fullName} onChangeText={setFullName} placeholder="John Doe" style={styles.input} editable={!loading} />

        <Text style={styles.label}>{t("phone")}</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="07X XXX XXXX"
          style={styles.input}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <Text style={styles.label}>{t("district")}</Text>
        <TextInput value={district} onChangeText={setDistrict} placeholder="Colombo" style={styles.input} editable={!loading} />

        <Text style={styles.label}>{t("email")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <Text style={styles.label}>{t("create_password")}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          style={styles.input}
          secureTextEntry
          editable={!loading}
        />

        <Pressable onPress={onSignup} style={[styles.primaryBtn, loading && { opacity: 0.7 }]} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>{t("create_account")}</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login", { role })} style={styles.bottomLink}>
          <Text style={styles.bottomText}>
            {t("already_have_account")} <Text style={styles.bottomStrong}>{t("sign_in_link")}</Text>
          </Text>
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xl },
  panel: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 22 },
  h1: { marginTop: 4, fontSize: 34, fontWeight: "900", color: theme.colors.text },
  p: { marginTop: 10, fontSize: 16, color: theme.colors.muted },
  label: { marginTop: 18, fontSize: 14, fontWeight: "800", color: theme.colors.text },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryBtn: {
    marginTop: 22,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryBtnText: { color: "white", fontSize: 16, fontWeight: "900" },
  bottomLink: { marginTop: 18, alignItems: "center", marginBottom: 20 },
  bottomText: { color: theme.colors.muted, fontSize: 14 },
  bottomStrong: { color: theme.colors.primary, fontWeight: "900" },
});
