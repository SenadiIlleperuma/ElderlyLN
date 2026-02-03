import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const floatY = useRef(new Animated.Value(0)).current;

  const barX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -12,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );

    // Sliding loader bar
    const barAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(barX, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(barX, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );

    floatAnim.start();
    barAnim.start();

    const timer = setTimeout(() => {
      navigation.replace("LanguageSelect");
   }, 1500);

    return () => {
      clearTimeout(timer);
      floatAnim.stop();
      barAnim.stop();
    };
  }, [floatY, barX]);

  const barTranslateX = barX.interpolate({
    inputRange: [0, 1],
    outputRange: [-34, 90] 
  });

  return (
    <View style={styles.background}>
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ translateY: floatY }] }}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>E</Text>
          </View>
        </Animated.View>

        <Text style={styles.title}>{t("app_name")}</Text>
        <Text style={styles.subtitle}>{t("tagline")}</Text>

        <View style={{ height: 28 }} />

        <View style={styles.loaderTrack}>
          <Animated.View
            style={[styles.loaderBar, { transform: [{ translateX: barTranslateX }] }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.primary // your blue
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl
  },

  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.primary
  },

  title: {
    color: "white",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 6
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center"
  },

  loaderTrack: {
    width: 120,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden"
  },
  loaderBar: {
    width: 34,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)"
  }
});
