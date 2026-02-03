import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import { changeLanguage } from "../../i18n";

type Props = NativeStackScreenProps<AuthStackParamList, "LanguageSelect">;
type Lang = "en" | "si" | "ta";

const options: { key: Lang; titleKey: string; subtitle: string }[] = [
  { key: "en", titleKey: "english", subtitle: "English" },
  { key: "si", titleKey: "sinhala", subtitle: "සිංහල" },
  { key: "ta", titleKey: "tamil", subtitle: "தமிழ்" },
];

export default function LanguageSelectScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Lang>("en");

  useEffect(() => {
    const current = i18n.language as Lang;
    if (current === "en" || current === "si" || current === "ta") setSelected(current);
  }, []);

  const onContinue = async () => {
    await changeLanguage(selected);
    navigation.navigate("RoleSelect");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>{t("select_language")}</Text>
      <Text style={styles.p}>{t("choose_language")}</Text>

      <View style={{ height: 18 }} />

      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => setSelected(opt.key)}
            style={[styles.langCard, active && styles.langCardActive]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.langTitle}>{t(opt.titleKey)}</Text>
              <Text style={styles.langSub}>{opt.subtitle}</Text>
            </View>
            <View style={[styles.radio, active && styles.radioActive]} />
          </Pressable>
        );
      })}

      <Pressable onPress={onContinue} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>{t("continue")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xl },
  h1: { fontSize: 32, fontWeight: "800", color: theme.colors.text, marginTop: 18 },
  p: { marginTop: 10, fontSize: 16, color: theme.colors.muted },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
    marginBottom: 14,
  },
  langCardActive: { borderColor: theme.colors.primary, backgroundColor: "#EFF6FF" },
  langTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.text },
  langSub: { marginTop: 4, color: theme.colors.muted, fontSize: 14 },
  radio: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: theme.colors.border },
  radioActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryBtnText: { color: "white", fontSize: 16, fontWeight: "800" },
});
