import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { useTranslation } from "react-i18next";

type Props = {
  active: "home" | "alerts" | "profile";
  navigation: any;
};

export default function CaregiverBottomNav({ active, navigation }: Props) {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  // Reusable bottom navigation item for caregiver screens
  const Item = ({
    tab,
    icon,
    label
  }: {
    tab: Props["active"];
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }) => {
    const isActive = active === tab;
    const color = isActive ? theme.colors.primary : "#94A3B8";

    return (
      <Pressable
        style={styles.item}
        onPress={() => {
          // Navigates to the matching caregiver screen based on the selected tab
          if (tab === "home") navigation.navigate("CaregiverHome");
          if (tab === "alerts") navigation.navigate("CaregiverAlerts");
          if (tab === "profile") navigation.navigate("CaregiverEditProfile");
        }}
      >
        <Ionicons name={icon} size={22} color={color} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
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
    <View style={styles.wrap}>
      <Item tab="home" icon="grid-outline" label={t("nav_home")} />
      <Item tab="alerts" icon="notifications-outline" label={t("nav_alerts")} />
      <Item tab="profile" icon="person-outline" label={t("nav_profile")} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 10
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  labelTamil: {
    fontSize: 10
  }
});