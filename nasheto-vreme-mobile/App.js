import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ModuleScreen from "./src/screens/ModuleScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#f4efe4" },
          headerTintColor: "#4f473f",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#f6f1e7" }
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Вход" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Регистрация" }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Нашето време" }} />
        <Stack.Screen
          name="Module"
          component={ModuleScreen}
          options={({ route }) => ({ title: route.params?.title || "Модул" })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

