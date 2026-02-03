import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/RootNavigator"; // or correct path
import "./src/i18n";
export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
