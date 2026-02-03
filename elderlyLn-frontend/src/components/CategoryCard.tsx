import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

type CatIcon = React.ComponentProps<typeof Ionicons>["name"];

export default function CategoryCard({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: CatIcon;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "30.8%",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  label: { fontSize: 12, fontWeight: "900", color: theme.colors.text, textAlign: "center" },
});
