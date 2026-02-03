import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "RoleSelect">;

type Role = "family" | "caregiver" | "admin";

export default function RoleSelectScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Role>("family");

  const goLogin = () => navigation.navigate("Login", { role: selected });
  const goRegister = () => navigation.navigate("Register", { role: selected });

  const Card = ({
    role,
    title,
    desc
  }: {
    role: Role;
    title: string;
    desc: string;
  }) => {
    const active = selected === role;
    return (
      <Pressable
        onPress={() => setSelected(role)}
        style={[styles.roleCard, active && styles.roleCardActive]}
      >
        <View style={styles.iconBox}>
          
          <Text style={styles.iconText}>
            {role === "family" ? "👥" : role === "caregiver" ? "🧑‍⚕️" : "🛡️"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleDesc}>{desc}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 10 }}>
  <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>← Back</Text>
</Pressable>

      <Text style={styles.h1}>{t("join_as")}</Text>
      <Text style={styles.p}>{t("join_as_desc")}</Text>

      <View style={{ height: 18 }} />

      <Card role="family" title={t("role_family")} desc={t("role_family_desc")} />
      <Card role="caregiver" title={t("role_caregiver")} desc={t("role_caregiver_desc")} />
      <Card role="admin" title={t("role_admin")} desc={t("role_admin_desc")} />

      <View style={{ height: 10 }} />

      <Pressable onPress={goLogin} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>{t("sign_in")}</Text>
      </Pressable>

      <Pressable onPress={goRegister} style={styles.linkBtn}>
        <Text style={styles.linkText}>
          {t("no_account")} <Text style={{ color: theme.colors.primary, fontWeight: "800" }}>{t("sign_up")}</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
     backgroundColor: theme.colors.bg, 
     padding: theme.spacing.xl 
    },
  h1: { 
    fontSize: 32, 
    fontWeight: "900", 
    color: theme.colors.text,
     marginTop: 18 
    },
  p: { 
    marginTop: 10, 
    fontSize: 16, 
    color: theme.colors.muted 
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 14,
    backgroundColor: theme.colors.bg
  },
  roleCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "#EFF6FF"
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  iconText: { 
    fontSize: 22
  },
  roleTitle: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  roleDesc: { 
    marginTop: 4, 
    fontSize: 14, 
    color: theme.colors.muted 
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center"
  },
  primaryBtnText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "900" 
  },
  linkBtn: { 
    marginTop: 16, 
    alignItems: "center" 
  },
  linkText: { 
    color: theme.colors.muted, 
    fontSize: 14 
  }
});
