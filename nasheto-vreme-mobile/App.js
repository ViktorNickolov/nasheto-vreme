import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ModuleScreen from "./src/screens/ModuleScreen";
import { LanguageProvider } from "./src/config/language";

const Stack = createNativeStackNavigator();

function detectAppLanguage() {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase() || "";
    return locale.startsWith("en") ? "en" : "bg";
  } catch {
    return "bg";
  }
}

function screenTitle(bgText, enText, appLanguage) {
  return appLanguage === "en" ? enText : bgText;
}

export default function App() {
  const [appLanguage, setAppLanguage] = useState(() => detectAppLanguage());
  const languageToggleLabel = appLanguage === "bg" ? "EN" : "БГ";
  const commonScreenOptions = useMemo(() => ({
    // Keep room for header actions (e.g. language toggle) on narrow devices.
    headerTitleAlign: "left",
    headerBackTitleVisible: false,
    headerStyle: { backgroundColor: "#f4efe4" },
    headerTintColor: "#4f473f",
    headerTitleStyle: { fontWeight: "700" },
    contentStyle: { backgroundColor: "#f6f1e7" }
  }), []);

  return (
    <LanguageProvider value={{ appLanguage, setAppLanguage }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            ...commonScreenOptions,
            headerRight: () => (
              <Pressable
                style={styles.languageToggleBtn}
                onPress={() => setAppLanguage((current) => (current === "bg" ? "en" : "bg"))}
              >
                <Text style={styles.languageToggleText}>{languageToggleLabel}</Text>
              </Pressable>
            )
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: screenTitle("Вход", "Login", appLanguage) }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: screenTitle("Регистрация", "Register", appLanguage) }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: screenTitle("Нашето време", "Our Time", appLanguage) }} />
          <Stack.Screen
            name="Module"
            component={ModuleScreen}
            options={({ route }) => ({ title: route.params?.title || screenTitle("Модул", "Module", appLanguage) })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  languageToggleBtn: {
    minWidth: 48,
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#d4c7b7",
    backgroundColor: "#efe4d5",
    alignItems: "center",
    justifyContent: "center"
  },
  languageToggleText: {
    color: "#5f4f41",
    fontSize: 12,
    fontWeight: "700"
  }
});

