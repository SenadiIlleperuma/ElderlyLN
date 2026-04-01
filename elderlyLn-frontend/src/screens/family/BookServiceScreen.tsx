import React, { useMemo, useState } from "react";
import {View,Text,StyleSheet,Pressable,ScrollView,Modal,FlatList,Alert,Platform,TextInput,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "BookService">;

type Option = { value: number; label: string };

// Format the selected date for display in the booking form
function formatDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
// Format the selected time into a simple 12-hour display
function formatTime(d: Date) {
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}
// Reusable component for selecting the service duration
function DurationSelect({
  label,
  value,
  options,
  onSelect,
  t,
}: {
  label: string;
  value: number;
  options: Option[];
  onSelect: (hours: number) => void;
  t: any;
}) {
  const [open, setOpen] = useState(false);
  // Find the currently selected duration label to display
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>

      <Pressable style={styles.inputBox} onPress={() => setOpen(true)}>
        <Text style={styles.inputText}>{selected?.label ?? t("hours_label", { h: value })}</Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>

            <FlatList
              data={options}
              keyExtractor={(i) => String(i.value)}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {item.value === value ? (
                      <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                    ) : (
                      <View style={{ width: 18 }} />
                    )}
                    <Text style={styles.optionText}>{item.label}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function BookServiceScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const caregiver = route.params.caregiver;
  // Read the caregiver id safely from the navigation params
  const caregiverId: string | null = caregiver?.caregiver_id ?? caregiver?.id ?? null;

  // Fixed platform fee added to every booking(future changes)
  const platformFee = 250;

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
// Available duration options
  const durationOptions: Option[] = useMemo(
    () => [2, 4, 6, 8, 12, 24].map((h) => ({ value: h, label: t("hours_label", { h }) })),
    [t]
  );
  const [durationHours, setDurationHours] = useState<number>(4);
// Calculate the service fee based on caregiver's rate and selected duration
  const ratePerHour = Number(caregiver?.ratePerHour ?? caregiver?.expected_rate ?? 0);
  const serviceFee = ratePerHour * durationHours;
  const total = serviceFee + platformFee;

  // Handle date selection from the date picker
  const onChangeDate = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (event.type === "dismissed") return;
    if (selected) setDate(selected);
  };

  // Handle time selection from the time picker
  const onChangeTime = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setShowTimePicker(false);
    if (event.type === "dismissed") return;
    if (selected) setTime(selected);
  };
// Handle booking confirmation, validate inputs and send booking request to the backend
  const handleConfirm = async () => {
    try {
      // Stop the booking process if caregiver id is missing 
      if (!caregiverId) {
        Alert.alert(t("caregiver_missing_title"), t("caregiver_missing_msg"));
        return;
      }

      // Ensure both date and time are selected before proceeding
      if (!date || !time) {
        Alert.alert(t("missing_details"), t("select_date_time_msg"));
        return;
      }
    // Combine the selected date and time into one service datetime
      const combined = new Date(date);
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    // Prepare the payload for the booking request
      const payload = {
        caregiverId,
        serviceDate: combined.toISOString(),
        notes: notes?.trim() || "",
      };
      
      console.log("REQ: POST /api/booking/create");
      // create the booking request to the backend 
      console.log("Booking payload:", payload);

      await api.post("/booking/create", payload);

      Alert.alert(t("booking_request_sent_title"), t("booking_request_sent_msg"));
      navigation.navigate("MyBookings", {});
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t("booking_failed_default");
      console.log("Booking create error:", err?.response?.data || err);
      Alert.alert(t("booking_failed_title"), msg);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("book_service")}</Text>

        <Pressable onPress={() => {}} style={styles.headerBtn}>
          <Ionicons name="receipt-outline" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.caregiverCard}>
          <View style={styles.avatarMock} />
          <View style={{ flex: 1 }}>
            <Text style={styles.caregiverName}>{caregiver?.name ?? t("caregiver_generic")}</Text>
            <Text style={styles.caregiverSub}>
              {(caregiver?.specialties?.[0] ?? t("care_other")) + " Expert"}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>{t("select_date")}</Text>
          <Pressable style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.inputText, !date && { color: theme.colors.muted }]}>
              {date ? formatDate(date) : "mm/dd/yyyy"}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.muted} />
          </Pressable>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{t("start_time")}</Text>
              <Pressable style={styles.inputBox} onPress={() => setShowTimePicker(true)}>
                <Text style={[styles.inputText, !time && { color: theme.colors.muted }]}>
                  {time ? formatTime(time) : "--:--"}
                </Text>
                <Ionicons name="time-outline" size={18} color={theme.colors.muted} />
              </Pressable>
            </View>

            <View style={{ flex: 1 }}>
              <DurationSelect
                label={t("duration_hours")}
                value={durationHours}
                options={durationOptions}
                onSelect={setDurationHours}
                t={t}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>{t("notes_optional")}</Text>
          <View style={[styles.inputBox, { alignItems: "flex-start" }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t("notes_placeholder_booking")}
              placeholderTextColor={theme.colors.muted}
              multiline
              style={{ flex: 1, minHeight: 70, color: theme.colors.text, fontWeight: "700" }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.muted}>
              {t("service_fee_calc", { rate: ratePerHour, hours: durationHours })}
            </Text>
            <Text style={styles.bold}>Rs. {serviceFee}</Text>
          </View>

          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={styles.muted}>{t("platform_fee")}</Text>
            <Text style={styles.bold}>Rs. {platformFee}</Text>
          </View>

          <View style={[styles.row, { marginTop: 18 }]}>
            <Text style={styles.totalLabel}>{t("total_amount")}</Text>
            <Text style={styles.totalValue}>Rs. {total}</Text>
          </View>

          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>{t("confirm_send_request")}</Text>
          </Pressable>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          value={date ?? new Date()}
          onChange={onChangeDate}
          display={Platform.OS === "ios" ? "spinner" : "default"}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          mode="time"
          value={time ?? new Date()}
          onChange={onChangeTime}
          display={Platform.OS === "ios" ? "spinner" : "default"}
        />
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
    color: theme.colors.text 
  },

  content: { 
    padding: theme.spacing.xl 
  },

  caregiverCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarMock: { 
    width: 58, 
    height: 58, 
    borderRadius: 16, 
    backgroundColor: "#E6F0FF"
   },
  caregiverName: { 
    fontSize: 16, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  caregiverSub: { 
    marginTop: 2, 
    fontSize: 13, 
    fontWeight: "700", 
    color: theme.colors.muted 
  },

  formCard: {
    marginTop: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    padding: 18,
  },

  fieldLabel: { 
    fontSize: 14, 
    fontWeight: "900", 
    color: theme.colors.text, 
    marginBottom: 10 
  },

  inputBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#F8FAFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: theme.colors.text 
  },

  divider: { 
    height: 1, 
    backgroundColor: theme.colors.border, 
    marginTop: 18, 
    marginBottom: 18 
  },

  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  muted: {
    color: theme.colors.muted, 
    fontWeight: "700" 
  },
  bold: { 
    color: theme.colors.text, 
    fontWeight: "900" 
  },

  totalLabel: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  totalValue: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: theme.colors.primary
   },

  confirmBtn: {
    marginTop: 18,
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "900" 
  },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.35)", 
    justifyContent: "center",
     padding: 18 
    },
  modalCard: { 
    backgroundColor: "white", 
    borderRadius: 18, 
    padding: 16,
     maxHeight: "70%" 
    },
  modalTitle: { 
    fontSize: 16, 
    fontWeight: "900", 
    color: theme.colors.text, 
    marginBottom: 10 
  },
  optionRow: { 
    paddingVertical: 14, 
    paddingHorizontal: 10 
  },
  optionText: { 
    fontSize: 15, 
    fontWeight: "800", 
    color: theme.colors.text 
  },
  sep: { 
    height: 1,
     backgroundColor: theme.colors.border
     },
});