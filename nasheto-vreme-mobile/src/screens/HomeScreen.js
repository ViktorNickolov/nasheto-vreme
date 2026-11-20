import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { getSessionUser } from "../auth/session";
import { logoutMobile } from "../api/http";

const modules = [
  { key: "profile", label: "Моят профил" },
  { key: "family", label: "Вашето семейство" },
  { key: "question", label: "Въпрос на деня" },
  { key: "moments", label: "Семейни моменти" },
  { key: "timeline", label: "Семейна хроника" },
  { key: "pdf", label: "Семейна PDF книга" }
];

export default function HomeScreen({ navigation }) {
  const user = getSessionUser();

  async function onLogout() {
    await logoutMobile();
    navigation.replace("Login");
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Нашето време</Text>
        <Text style={styles.subtitle}>{user ? `${user.firstName} ${user.lastName}` : "Изберете модул"}</Text>
        <Text style={styles.helperText}>Запазете красивите мигове и семейните разговори.</Text>
      </View>

      <View style={styles.menuCard}>
        {modules.map((module) => (
          <Pressable
            key={module.key}
            style={styles.moduleBtn}
            onPress={() => navigation.navigate("Module", { moduleKey: module.key, title: module.label })}
          >
            <Text style={styles.moduleBtnText}>{module.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.secondaryBtn} onPress={onLogout}>
        <Text style={styles.secondaryBtnText}>Изход</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    gap: 12,
    backgroundColor: "#f6f1e7"
  },
  headerCard: {
    backgroundColor: "#fffcf7",
    borderWidth: 1,
    borderColor: "#e2d8cb",
    borderRadius: 20,
    padding: 14,
    gap: 4,
    shadowColor: "#4f473f",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#5f4f41"
  },
  subtitle: {
    color: "#6f6256",
    fontSize: 14
  },
  helperText: {
    color: "#7d725f",
    fontSize: 12
  },
  menuCard: {
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: "#e2d8cb",
    borderRadius: 18,
    padding: 12,
    gap: 10,
    flex: 1
  },
  moduleBtn: {
    backgroundColor: "#e9eee2",
    borderWidth: 1,
    borderColor: "#cbd7be",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  moduleBtnText: {
    color: "#52614d",
    fontWeight: "700"
  },
  secondaryBtn: {
    marginTop: "auto",
    backgroundColor: "#d6e0cc",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfd0ac"
  },
  secondaryBtnText: {
    color: "#53604f",
    fontWeight: "700"
  }
});

