import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

export default function LoginScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { role } = route.params;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(() => {
    if (role === "caregiver") return t("login_subtitle_caregiver");
    if (role === "admin") return t("login_subtitle_admin");
    return t("login_subtitle_family");
  }, [role, t]);

  const goToHomeByRole = (userRole: string) => {
    if (userRole === "family") navigation.reset({ index: 0, routes: [{ name: "FamilyHome" }] });
    else if (userRole === "caregiver") navigation.reset({ index: 0, routes: [{ name: "CaregiverHome" }] });
    else navigation.reset({ index: 0, routes: [{ name: "AdminHome" }] });
  };

  const onLogin = async () => {
    const e = email.trim().toLowerCase();

    if (!e || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    if (!isValidEmail(e)) {
      Alert.alert("Error", "Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email: e, password });

      const token = res.data?.token;
      const userRole = res.data?.role;
      const userId = res.data?.user_id;
      const userEmail = res.data?.email || e;

      if (!token || !userRole || !userId) {
        Alert.alert("Error", "Invalid server response (missing token/role/user_id).");
        return;
      }

      await AsyncStorage.setItem("token", token);

      let full_name = "";
      let district = "";

      try {
        const me = await api.get("/auth/me");
        full_name = me.data?.full_name || "";
        district = me.data?.district || "";
      } catch (err) {
        console.log("WARN: /auth/me failed, continuing...");
      }

      const user = {
        user_id: userId,
        role: userRole,
        email: userEmail,
        full_name,
        district,
      };

      console.log("Login: saving user =", user);

      await AsyncStorage.setItem("user", JSON.stringify(user));

      if (userRole !== role) {
        Alert.alert("Notice", `You logged in as ${userRole}. Redirecting...`);
      }

      goToHomeByRole(userRole);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Login failed.";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 10 }}>
        <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>← Back</Text>
      </Pressable>

      <View style={styles.panel}>
        <Text style={styles.pill}>{role.toUpperCase()} LOGIN</Text>

        <Text style={styles.h1}>{t("welcome_back")}</Text>
        <Text style={styles.p}>{subtitle}</Text>

        <Text style={styles.label}>{t("email")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={[styles.label, { marginTop: 14 }]}>{t("password")}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          secureTextEntry
          editable={!loading}
        />

        <Pressable onPress={onLogin} style={[styles.primaryBtn, loading && { opacity: 0.7 }]} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>{t("sign_in")}</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Register", { role })} style={styles.bottomLink}>
          <Text style={styles.bottomText}>
            {t("no_account")} <Text style={styles.bottomStrong}>{t("sign_up")}</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xl },
  panel: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 22 },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    color: theme.colors.primary,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
  },
  h1: { marginTop: 12, fontSize: 34, fontWeight: "900", color: theme.colors.text },
  p: { marginTop: 10, fontSize: 16, color: theme.colors.muted },
  label: { marginTop: 22, fontSize: 14, fontWeight: "800", color: theme.colors.text },
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
    marginTop: 18,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: { color: "white", fontSize: 16, fontWeight: "900" },
  bottomLink: { marginTop: 18, alignItems: "center" },
  bottomText: { color: theme.colors.muted, fontSize: 14 },
  bottomStrong: { color: theme.colors.primary, fontWeight: "900" },
});
