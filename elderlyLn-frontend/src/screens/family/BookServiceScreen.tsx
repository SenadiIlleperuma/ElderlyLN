import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import { api } from "../../api/api"; // ✅ your axios instance

type Props = NativeStackScreenProps<AuthStackParamList, "BookService">;

type Option = { value: number; label: string };

function formatDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function DurationSelect({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: number;
  options: Option[];
  onSelect: (hours: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>

      <Pressable style={styles.inputBox} onPress={() => setOpen(true)}>
        <Text style={styles.inputText}>{selected?.label ?? `${value} Hours`}</Text>
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
  const caregiver = route.params.caregiver;

  const caregiverId: string | null = caregiver?.caregiver_id ?? caregiver?.id ?? null;

  const platformFee = 250;

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const durationOptions: Option[] = useMemo(
    () => [2, 4, 6, 8, 12, 24].map((h) => ({ value: h, label: `${h} Hours` })),
    []
  );
  const [durationHours, setDurationHours] = useState<number>(4);

  const ratePerHour = Number(caregiver?.ratePerHour ?? caregiver?.expected_rate ?? 0);
  const serviceFee = ratePerHour * durationHours;
  const total = serviceFee + platformFee;

  const onChangeDate = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (event.type === "dismissed") return;
    if (selected) setDate(selected);
  };

  const onChangeTime = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setShowTimePicker(false);
    if (event.type === "dismissed") return;
    if (selected) setTime(selected);
  };

  const handleConfirm = async () => {
    try {
      if (!caregiverId) {
        Alert.alert("Caregiver missing", "Please go back and select a caregiver again.");
        return;
      }

      if (!date || !time) {
        Alert.alert("Missing details", "Please select a date and start time.");
        return;
      }

      const combined = new Date(date);
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);

      const payload = {
        caregiverId, 
        serviceDate: combined.toISOString(),
        notes: notes?.trim() || "",
      };

      console.log("REQ: POST /api/booking/create");
      console.log("Booking payload:", payload);

      await api.post("/booking/create", payload);

      Alert.alert("Booking request sent!", "The caregiver has been notified.");
      navigation.navigate("MyBookings", {});
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Booking failed. Please try again.";
      console.log("Booking create error:", err?.response?.data || err);
      Alert.alert("Booking failed", msg);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Book Service</Text>

        <Pressable onPress={() => {}} style={styles.headerBtn}>
          <Ionicons name="receipt-outline" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.caregiverCard}>
          <View style={styles.avatarMock} />
          <View style={{ flex: 1 }}>
            <Text style={styles.caregiverName}>{caregiver?.name ?? "Caregiver"}</Text>
            <Text style={styles.caregiverSub}>
              {(caregiver?.specialties?.[0] ?? "Care") + " Expert"}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Select Date</Text>
          <Pressable style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.inputText, !date && { color: theme.colors.muted }]}>
              {date ? formatDate(date) : "mm/dd/yyyy"}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.muted} />
          </Pressable>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Start Time</Text>
              <Pressable style={styles.inputBox} onPress={() => setShowTimePicker(true)}>
                <Text style={[styles.inputText, !time && { color: theme.colors.muted }]}>
                  {time ? formatTime(time) : "--:--"}
                </Text>
                <Ionicons name="time-outline" size={18} color={theme.colors.muted} />
              </Pressable>
            </View>

            <View style={{ flex: 1 }}>
              <DurationSelect
                label="Duration (Hours)"
                value={durationHours}
                options={durationOptions}
                onSelect={setDurationHours}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Notes (optional)</Text>
          <View style={[styles.inputBox, { alignItems: "flex-start" }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Need help with meal prep and companionship..."
              placeholderTextColor={theme.colors.muted}
              multiline
              style={{ flex: 1, minHeight: 70, color: theme.colors.text, fontWeight: "700" }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.muted}>
              Service Fee (Rs. {ratePerHour} x {durationHours}h)
            </Text>
            <Text style={styles.bold}>Rs. {serviceFee}</Text>
          </View>

          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={styles.muted}>Platform Fee</Text>
            <Text style={styles.bold}>Rs. {platformFee}</Text>
          </View>

          <View style={[styles.row, { marginTop: 18 }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs. {total}</Text>
          </View>

          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirm & Send Request</Text>
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
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
        />
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

  content: { padding: theme.spacing.xl },

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
  avatarMock: { width: 58, height: 58, borderRadius: 16, backgroundColor: "#E6F0FF" },
  caregiverName: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  caregiverSub: { marginTop: 2, fontSize: 13, fontWeight: "700", color: theme.colors.muted },

  formCard: {
    marginTop: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    padding: 18,
  },

  fieldLabel: { fontSize: 14, fontWeight: "900", color: theme.colors.text, marginBottom: 10 },

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
  inputText: { fontSize: 16, fontWeight: "800", color: theme.colors.text },

  divider: { height: 1, backgroundColor: theme.colors.border, marginTop: 18, marginBottom: 18 },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  muted: { color: theme.colors.muted, fontWeight: "700" },
  bold: { color: theme.colors.text, fontWeight: "900" },

  totalLabel: { fontSize: 18, fontWeight: "900", color: theme.colors.text },
  totalValue: { fontSize: 18, fontWeight: "900", color: theme.colors.primary },

  confirmBtn: {
    marginTop: 18,
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { color: "white", fontSize: 16, fontWeight: "900" },


  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 18 },
  modalCard: { backgroundColor: "white", borderRadius: 18, padding: 16, maxHeight: "70%" },
  modalTitle: { fontSize: 16, fontWeight: "900", color: theme.colors.text, marginBottom: 10 },
  optionRow: { paddingVertical: 14, paddingHorizontal: 10 },
  optionText: { fontSize: 15, fontWeight: "800", color: theme.colors.text },
  sep: { height: 1, backgroundColor: theme.colors.border },
});
