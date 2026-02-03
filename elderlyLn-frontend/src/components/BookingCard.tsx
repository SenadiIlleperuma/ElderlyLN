import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

type BookingStatus = "UPCOMING" | "COMPLETED";

export default function BookingCard({
    name, date, type, status,
}: {
    name: string;
    date: string;
  type: string;
  status: BookingStatus;
}) {
  const isUpcoming = status === "UPCOMING";

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={theme.colors.muted} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {date} • {type}
          </Text>
        </View>
      </View>

      <View style={[styles.badge, isUpcoming ? styles.badgeBlue : styles.badgeGreen]}>
        <Text style={[styles.badgeText, isUpcoming ? styles.textBlue : styles.textGreen]}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  left: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { 
    fontWeight: "900", 
    fontSize: 16, 
    color: theme.colors.text 
},
  meta: {
     marginTop: 4, 
     color: theme.colors.muted,
      fontWeight: "700" 
    },

  badge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  badgeBlue: { backgroundColor: "#DBEAFE" },
  badgeGreen: { backgroundColor: "#DCFCE7" },
  badgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  textBlue: { color: "#2563EB" },
  textGreen: { color: "#16A34A" },
});
