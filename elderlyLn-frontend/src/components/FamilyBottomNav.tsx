import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

type TabKey = "home" | "search" | "bookings" | "profile";

export default function FamilyBottomNav({
  active,
  navigation
}: {
  active: TabKey;
  navigation: any;
}) {
  const Item = ({
    keyName,
    label,
    icon
  }: {
    keyName: TabKey;
    label: string;
    icon: string;
  }) => {
    const focused = active === keyName;
    const color = focused ? theme.colors.primary : "#98A2B3";

    return (
      <Pressable
        onPress={() => {
          if (keyName === "home") navigation.navigate("FamilyHome");
          if (keyName === "search") navigation.navigate("FindCaregiver");
          if (keyName === "bookings") navigation.navigate("MyBookings");
          if (keyName === "profile") navigation.navigate("EditProfile"); // placeholder if you don’t have FamilyProfile yet
        }}
        style={styles.tab}
      >
        <Ionicons name={icon as any} size={22} color={color} />
        <Text style={[styles.label, { color }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.bar}>
      <Item keyName="home" label="Home" icon={active === "home" ? "home" : "home-outline"} />
      <Item keyName="search" label="Search" icon={active === "search" ? "search" : "search-outline"} />
      <Item keyName="bookings" label="Bookings" icon={active === "bookings" ? "calendar" : "calendar-outline"} />
      <Item keyName="profile" label="Profile" icon={active === "profile" ? "person" : "person-outline"} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  tab: { alignItems: "center", gap: 4 },
  label: { fontSize: 12, fontWeight: "700" }
});
