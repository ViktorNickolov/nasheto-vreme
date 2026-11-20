import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { registerMobile } from "../api/http";

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    familyName: ""
  });
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onRegister() {
    try {
      setError("");
      await registerMobile(form);
      navigation.replace("Home");
    } catch (err) {
      setError(err.message || "Регистрацията не бе успешна.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.title}>Създай профил</Text>
        <Text style={styles.subtitle}>Направете семейно пространство за вашите спомени.</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#8b7f70" autoCapitalize="none" value={form.email} onChangeText={(v) => update("email", v)} />
        <TextInput style={styles.input} placeholder="Парола" placeholderTextColor="#8b7f70" secureTextEntry value={form.password} onChangeText={(v) => update("password", v)} />
        <TextInput style={styles.input} placeholder="Име" placeholderTextColor="#8b7f70" value={form.firstName} onChangeText={(v) => update("firstName", v)} />
        <TextInput style={styles.input} placeholder="Фамилия" placeholderTextColor="#8b7f70" value={form.lastName} onChangeText={(v) => update("lastName", v)} />
        <TextInput style={styles.input} placeholder="Семейство" placeholderTextColor="#8b7f70" value={form.familyName} onChangeText={(v) => update("familyName", v)} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.primaryBtn} onPress={onRegister}>
          <Text style={styles.primaryBtnText}>Регистрация</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f6f1e7"
  },
  formCard: {
    backgroundColor: "#fffcf7",
    borderWidth: 1,
    borderColor: "#e1d8cb",
    borderRadius: 22,
    padding: 18,
    gap: 12,
    shadowColor: "#4f473f",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#5f4f41",
    marginBottom: 2
  },
  subtitle: {
    color: "#6f6256",
    fontSize: 13,
    marginBottom: 4
  },
  input: {
    backgroundColor: "#fbf7f1",
    borderWidth: 1,
    borderColor: "#e1d8cb",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  primaryBtn: {
    backgroundColor: "#6f8469",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700"
  },
  error: {
    color: "#a54b45"
  }
});

