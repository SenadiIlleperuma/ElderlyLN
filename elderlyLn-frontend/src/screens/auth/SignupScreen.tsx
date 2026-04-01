import React, { useState } from "react";
import {View,Text,StyleSheet,TextInput, Pressable, Alert, ActivityIndicator,ScrollView,} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

// simple email regex for basic validation
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

// Clean the phone number before validation (remove spaces, dashes) and validate Sri lankan phone numbers (10 digits)
const normalizePhone = (p: string) => p.replace(/\s+/g, "").replace(/-/g, "");
const isValidPhoneLK = (p: string) => /^[0-9]{10}$/.test(p);

export default function SignupScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { role } = route.params;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  //Check password strength: min 8 chars, at least 1 uppercase, 1 lowercase, and 1 number
  const passwordError = (pw: string) => {
    if (!pw || pw.length < 8) return t("password_min_length");
    if (!/[A-Z]/.test(pw)) return t("password_uppercase");
    if (!/[a-z]/.test(pw)) return t("password_lowercase");
    if (!/[0-9]/.test(pw)) return t("password_number");
    return null;
  };

  // Validate all inputs and show appropriate error messages
  const validateInputs = () => {
    if (!fullName.trim()) {
      Alert.alert(t("validation_error"), t("enter_full_name_msg"));
      return false;
    }

    const p = normalizePhone(phone.trim());
    if (!p || !isValidPhoneLK(p)) {
      Alert.alert(t("validation_error"), t("enter_valid_phone_msg"));
      return false;
    }

    if (!district.trim()) {
      Alert.alert(t("validation_error"), t("enter_district_msg"));
      return false;
    }

    const e = email.trim().toLowerCase();
    if (!e || !isValidEmail(e)) {
      Alert.alert(t("validation_error"), t("enter_valid_email_address_msg"));
      return false;
    }

    const pwErr = passwordError(password);
    if (pwErr) {
      Alert.alert(t("validation_error"), pwErr);
      return false;
    }

    return true;
  };

  //Submit the registration form after validation and handle API response
  const onSignup = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // Call the registration API with the form data
      await api.post("/auth/register", {
        role,
        email: email.trim().toLowerCase(),
        password,
        phone_no: normalizePhone(phone.trim()),
        full_name: fullName.trim(),
        district: district.trim(),
      });

      // On success, show a success message and navigate to the login screen
      Alert.alert(t("registration_successful_title"), t("registration_successful_msg"), [
        { text: t("ok"), onPress: () => navigation.navigate("Login", { role }) },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t("registration_failed_default");
      Alert.alert(t("registration_failed_title"), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 10 }}>
        <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>← {t("back")}</Text>
      </Pressable>

      <ScrollView style={styles.panel} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>{t("create_account")}</Text>
        <Text style={styles.p}>{t("create_account_subtitle")}</Text>

        <Text style={styles.label}>{t("full_name")}</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder={t("placeholder_full_name")}
          style={styles.input}
          editable={!loading}
        />

        <Text style={styles.label}>{t("phone")}</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder={t("placeholder_phone_lk")}
          style={styles.input}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <Text style={styles.label}>{t("district")}</Text>
        <TextInput
          value={district}
          onChangeText={setDistrict}
          placeholder={t("placeholder_district")}
          style={styles.input}
          editable={!loading}
        />

        <Text style={styles.label}>{t("email")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t("placeholder_email")}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <Text style={styles.label}>{t("create_password")}</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)} // Toggle password visibility
            style={styles.eyeBtn}
            disabled={loading}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={theme.colors.muted}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={onSignup}
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          disabled={loading}
        >
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

  passwordWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "white",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  eyeBtn: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
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