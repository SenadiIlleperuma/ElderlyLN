import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { useTranslation } from "react-i18next";

type TabKey = "home" | "search" | "bookings" | "profile";

export default function FamilyBottomNav({
  active,
  navigation
}: {
  active: TabKey;
  navigation: any;
}) {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  // Reusable bottom navigation item used for each family tab
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
          // Navigates to the relevant screen based on the selected tab
          if (keyName === "home") navigation.navigate("FamilyHome");
          if (keyName === "search") navigation.navigate("FindCaregiver");
          if (keyName === "bookings") navigation.navigate("MyBookings");
          if (keyName === "profile") navigation.navigate("EditProfile");
        }}
        style={styles.tab}
      >
        <Ionicons name={icon as any} size={22} color={color} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={[
            styles.label,
            isTamil && styles.labelTamil,
            { color }
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.bar}>
      <Item
        keyName="home"
        label={t("nav_home")}
        icon={active === "home" ? "home" : "home-outline"}
      />
      <Item
        keyName="search"
        label={t("nav_search")}
        icon={active === "search" ? "search" : "search-outline"}
      />
      <Item
        keyName="bookings"
        label={t("nav_bookings")}
        icon={active === "bookings" ? "calendar" : "calendar-outline"}
      />
      <Item
        keyName="profile"
        label={t("nav_profile")}
        icon={active === "profile" ? "person" : "person-outline"}
      />
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
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  },
  labelTamil: {
    fontSize: 11
  }
});