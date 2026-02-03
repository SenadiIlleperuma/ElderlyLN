import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "CaregiverEditProfile">;

type Chip = { id: string; label: string };

export default function CaregiverEditProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const specialtiesList: Chip[] = useMemo(
    () => [
      { id: "full", label: t("spec_full_time") },
      { id: "part", label: t("spec_part_time") },
      { id: "nursing", label: t("spec_nursing_care") },
      { id: "companionship", label: t("spec_companionship") },
      { id: "special", label: t("spec_special_needs") },
    ],
    [t]
  );

  const languagesList: Chip[] = useMemo(
    () => [
      { id: "si", label: t("lang_si") },
      { id: "ta", label: t("lang_ta") },
      { id: "en", label: t("lang_en") },
    ],
    [t]
  );

  const [displayName, setDisplayName] = useState("Aruni Kumari");
  const [rate, setRate] = useState("1200");
  const [expYears, setExpYears] = useState("8");
  const [location, setLocation] = useState("Colombo");

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(["full", "part", "nursing"]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["si", "en"]);

  const toggle = (id: string, selected: string[], setSelected: (x: string[]) => void) => {
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id));
    else setSelected([...selected, id]);
  };

  const onSave = () => {
    Alert.alert(
      t("saved_demo_title"),
      `${t("saved_demo_msg")}\n\n${t("display_name")}: ${displayName}\n${t("hourly_rate_lkr")}: ${rate}\n${t("years_of_exp")}: ${expYears}\n${t("service_location")}: ${location}`
    );
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("edit_profile")}</Text>

        <Pressable style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          <View style={styles.dot} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.photoWrap}>
          <View style={styles.photo} />
          <Pressable
            onPress={() => Alert.alert(t("demo"), t("photo_change_demo"))}
            style={styles.cameraBtn}
          >
            <Ionicons name="camera" size={18} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.label}>{t("display_name")}</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
          placeholder={t("display_name_ph")}
          placeholderTextColor="#9aa3af"
        />

        <View style={styles.gridRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t("hourly_rate_lkr")}</Text>
            <TextInput
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
              style={styles.input}
              placeholder="1200"
              placeholderTextColor="#9aa3af"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t("years_of_exp")}</Text>
            <TextInput
              value={expYears}
              onChangeText={setExpYears}
              keyboardType="numeric"
              style={styles.input}
              placeholder="8"
              placeholderTextColor="#9aa3af"
            />
          </View>
        </View>

        {/* Location */}
        <Text style={styles.label}>{t("service_location")}</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          style={styles.input}
          placeholder={t("service_location_ph")}
          placeholderTextColor="#9aa3af"
        />

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>{t("specialties")}</Text>
        <View style={styles.chipsWrap}>
          {specialtiesList.map((c) => {
            const active = selectedSpecialties.includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => toggle(c.id, selectedSpecialties, setSelectedSpecialties)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t("languages_supported")}</Text>
        <View style={styles.chipsWrap}>
          {languagesList.map((c) => {
            const active = selectedLanguages.includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => toggle(c.id, selectedLanguages, setSelectedLanguages)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={onSave} style={styles.saveBtn}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveText}>{t("save_changes")}</Text>
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
    justifyContent: "space-between",
  },
  headerBtn: { 
    width: 40,
    height: 40, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  dot: { 
    position: "absolute", 
    top: 10, 
    right: 10, 
    width: 7, 
    height: 7, 
    borderRadius: 99, 
    backgroundColor: "#EF4444" 
  },

  content: { 
    padding: theme.spacing.xl, 
    paddingBottom: 110 
  },

  photoWrap: { 
    alignSelf: "center", 
    marginTop: 10, 
    marginBottom: 16 
  },
  photo: { 
    width: 140, 
    height: 140, 
    borderRadius: 22, 
    backgroundColor: "#EEF2F6" 
  },
  cameraBtn: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  label: { 
    marginTop: 10, 
    fontWeight: "900", 
    color: theme.colors.muted 
  },
  input: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: "800",
    color: theme.colors.text,
  },

  gridRow: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 6 
  },

  sectionTitle: { 
    marginTop: 16, 
    fontSize: 16, 
    fontWeight: "900", 
    color: theme.colors.text 
  },

  chipsWrap: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 10,
    marginTop: 12 
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: { 
    borderColor: theme.colors.primary, 
    backgroundColor: "#EEF2FF" 
  },
  chipText: { 
    fontWeight: "900", 
    color: theme.colors.muted, 
    fontSize: 12 
  },
  chipTextActive: { 
    color: theme.colors.primary 
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
  },
  saveBtn: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#0B1220",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  saveText: { 
    color: "#fff", 
    fontWeight: "900" 
  },
});
