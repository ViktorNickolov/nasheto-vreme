import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { registerMobile } from "../api/http";
import { useAppLanguage } from "../config/language";

export default function RegisterScreen({ navigation }) {
  const { appLanguage } = useAppLanguage();
  const isEn = appLanguage === "en";
  const labels = isEn
    ? {
        title: "Create profile",
        subtitle: "Create a family space for your memories.",
        email: "Email",
        password: "Password",
        firstName: "First name",
        lastName: "Last name",
        family: "Family",
        submit: "Register",
        failed: "Registration failed."
      }
    : {
        title: "Създай профил",
        subtitle: "Направете семейно пространство за вашите спомени.",
        email: "Имейл",
        password: "Парола",
        firstName: "Име",
        lastName: "Фамилия",
        family: "Семейство",
        submit: "Регистрация",
        failed: "Регистрацията не бе успешна."
      };
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    familyName: "",
    inviteToken: ""
  });
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onRegister() {
    try {
      setError("");
      await registerMobile({
        ...form,
        familyName: form.familyName.trim(),
        inviteToken: form.inviteToken.trim()
      });
      navigation.replace("Home");
    } catch (err) {
      setError(err.message || labels.failed);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.title}>{labels.title}</Text>
        <Text style={styles.subtitle}>{labels.subtitle}</Text>
        <TextInput style={styles.input} placeholder={labels.email} placeholderTextColor="#8b7f70" autoCapitalize="none" value={form.email} onChangeText={(v) => update("email", v)} />
        <TextInput style={styles.input} placeholder={labels.password} placeholderTextColor="#8b7f70" secureTextEntry value={form.password} onChangeText={(v) => update("password", v)} />
        <TextInput style={styles.input} placeholder={labels.firstName} placeholderTextColor="#8b7f70" value={form.firstName} onChangeText={(v) => update("firstName", v)} />
        <TextInput style={styles.input} placeholder={labels.lastName} placeholderTextColor="#8b7f70" value={form.lastName} onChangeText={(v) => update("lastName", v)} />
        <TextInput style={styles.input} placeholder={labels.family} placeholderTextColor="#8b7f70" value={form.familyName} onChangeText={(v) => update("familyName", v)} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.primaryBtn} onPress={onRegister}>
          <Text style={styles.primaryBtnText}>{labels.submit}</Text>
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

