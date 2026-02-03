import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "FindCaregiver">;
type Option = { value: string; label: string };

function SelectField({
  label,
  valueLabel,
  placeholder,
  options,
  onSelect,
}: {
  label: string;
  valueLabel?: string;
  placeholder: string;
  options: Option[];
  onSelect: (opt: Option) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginTop: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.selectBox}>
        <Text style={[styles.selectText, !valueLabel && { color: theme.colors.muted }]}>
          {valueLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(i) => i.value}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  style={styles.optionRow}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function FindCaregiverScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const SERVICE_TYPE_DB_MAP: Record<string, string> = {
    cook_and_care: "Cooking + looking after",
    care_only: "Looking after",
    supervise_only: "Supervising",
    all_around: "All-around",
    other: "", 
  };

  const TIME_PERIOD_DB_MAP: Record<string, string> = {
    hourly: "Hourly",
    half_day: "Half-day",
    full_day: "Full-day",
    live_in: "Live-in", 
    other: "",
  };

  
 const districtKeys = [
    ["anywhere", t("district_anywhere")],
  ["ampara", t("district_ampara")],
  ["anuradhapura", t("district_anuradhapura")],
  ["badulla", t("district_badulla")],
  ["batticaloa", t("district_batticaloa")],
  ["colombo", t("district_colombo")],
  ["galle", t("district_galle")],
  ["gampaha", t("district_gampaha")],
  ["hambantota", t("district_hambantota")],
  ["jaffna", t("district_jaffna")],
  ["kalutara", t("district_kalutara")],
  ["kandy", t("district_kandy")],
  ["kegalle", t("district_kegalle")],
  ["kilinochchi", t("district_kilinochchi")],
  ["kurunegala", t("district_kurunegala")],
  ["mannar", t("district_mannar")],
  ["matale", t("district_matale")],
  ["matara", t("district_matara")],
  ["moneragala", t("district_moneragala")],
  ["mullaitivu", t("district_mullaitivu")],
  ["nuwara_eliya", t("district_nuwara_eliya")],
  ["polonnaruwa", t("district_polonnaruwa")],
  ["puttalam", t("district_puttalam")],
  ["ratnapura", t("district_ratnapura")],
  ["trincomalee", t("district_trincomalee")],
  ["vavuniya", t("district_vavuniya")],
] as const;
  const districtOptions: Option[] = useMemo(
    () => districtKeys.map(([value, label]) => ({ value, label })),
    [t]
  );

  const careCategoryOptions: Option[] = useMemo(
    () => [
      { value: "elderly", label: t("care_elderly") },
      { value: "child", label: t("care_child") },
      { value: "disability", label: t("care_disability") },
      { value: "patient", label: t("care_patient") },
      { value: "palliative", label: t("care_palliative") },
      { value: "domestic", label: t("care_domestic") },
      { value: "other", label: t("care_other") },
    ],
    [t]
  );

  const serviceTypeOptions: Option[] = useMemo(
    () => [
      { value: "cook_and_care", label: t("cook_and_care") },
      { value: "care_only", label: t("care_only") },
      { value: "supervise_only", label: t("supervise_only") },
      { value: "all_around", label: t("all_around") },
      { value: "other", label: t("other") },
    ],
    [t]
  );

  const timePeriodOptions: Option[] = useMemo(
    () => [
      { value: "half_day", label: t("half_day") },
      { value: "full_day", label: t("full_day") },
      { value: "hourly", label: t("hourly") },
      { value: "live_in", label: t("live_in") },
      { value: "other", label: t("other") },
    ],
    [t]
  );

  const [district, setDistrict] = useState<Option>(districtOptions[0]);
  const [careCategory, setCareCategory] = useState<Option | null>(null);
  const [serviceType, setServiceType] = useState<Option | null>(null);
  const [timePeriod, setTimePeriod] = useState<Option | null>(null);
  const [needs, setNeeds] = useState("");

  const onSearch = async () => {
    setLoading(true);
    try {
      const districtValue = district.value === "anywhere" ? "" : district.value;
      const careCategoryValue = careCategory?.value || "";
      const serviceTypeCode = serviceType?.value || "";
      const timePeriodCode = timePeriod?.value || "";

      const serviceTypeDB = SERVICE_TYPE_DB_MAP[serviceTypeCode] ?? "";
      const timePeriodDB = TIME_PERIOD_DB_MAP[timePeriodCode] ?? "";

      const payload = {
        district: districtValue,
        careCategory: careCategoryValue === "other" ? "" : careCategoryValue,
        serviceType: serviceTypeDB,   
        timePeriod: timePeriodDB,    
        needs: needs.trim(),
      };

      console.log("Sending search request:", payload);

      const res = await api.post("/matching/search", payload);
      const matches = res.data?.matches || [];

      console.log(`Received ${matches.length} matches`);

      if (matches.length === 0) {
        Alert.alert("No Matches", "No caregivers found. Try different filters.");
      } else {
        navigation.navigate("TopMatches", {
          filters: payload,
          matches,
        });
      }
    } catch (err: any) {
      console.error("Search error:", err?.response?.data || err?.message || err);
      Alert.alert("Error", err?.response?.data?.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("find_caregiver")}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Ionicons name="filter" size={18} color={theme.colors.primary} />
          <Text style={styles.bannerText}>{t("filter_tip")}</Text>
        </View>

        <SelectField
          label={t("district_label")}
          valueLabel={district?.label}
          placeholder={t("district_placeholder")}
          options={districtOptions}
          onSelect={setDistrict}
        />

        <SelectField
          label={t("care_category_label")}
          valueLabel={careCategory?.label}
          placeholder={t("care_category_placeholder")}
          options={careCategoryOptions}
          onSelect={setCareCategory}
        />

        <SelectField
          label={t("service_type_label")}
          valueLabel={serviceType?.label}
          placeholder={t("service_type_placeholder")}
          options={serviceTypeOptions}
          onSelect={setServiceType}
        />

        <SelectField
          label={t("time_period_label")}
          valueLabel={timePeriod?.label}
          placeholder={t("time_period_placeholder")}
          options={timePeriodOptions}
          onSelect={setTimePeriod}
        />

        <Text style={[styles.label, { marginTop: 18 }]}>{t("specific_needs")}</Text>
        <TextInput
          value={needs}
          onChangeText={setNeeds}
          placeholder={t("specific_needs_placeholder")}
          placeholderTextColor={theme.colors.muted}
          style={styles.textArea}
          multiline
        />

        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={onSearch} style={styles.searchBtn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.searchBtnText}>{t("search_matches")}</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </>
          )}
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
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: theme.colors.text },
  content: { padding: theme.spacing.xl },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: theme.radius.lg,
    padding: 14,
  },
  bannerText: { flex: 1, color: theme.colors.primary, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "900", color: theme.colors.text, marginBottom: 8 },
  selectBox: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "white",
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 15,
    color: theme.colors.text,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  searchBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  searchBtnText: { color: "white", fontSize: 16, fontWeight: "900" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 18 },
  modalCard: { backgroundColor: "white", borderRadius: 18, padding: 16, maxHeight: "70%" },
  modalTitle: { fontSize: 16, fontWeight: "900", color: theme.colors.text, marginBottom: 10 },
  optionRow: { paddingVertical: 14, paddingHorizontal: 10 },
  optionText: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  sep: { height: 1, backgroundColor: theme.colors.border },
});
