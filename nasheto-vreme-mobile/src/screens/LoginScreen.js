import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { loginMobile } from "../api/http";
import { useAppLanguage } from "../config/language";

export default function LoginScreen({ navigation }) {
  const { appLanguage } = useAppLanguage();
  const isEn = appLanguage === "en";
  const labels = isEn
    ? {
        title: "Our Time",
        subtitle: "A calm and natural place for your family.",
        email: "Email",
        password: "Password",
        loginFailed: "Login failed.",
        login: "Login",
        registerLink: "No account? Register"
      }
    : {
        title: "Нашето време",
        subtitle: "Естествено и спокойно място за вашето семейство.",
        email: "Имейл",
        password: "Парола",
        loginFailed: "Входът не бе успешен.",
        login: "Вход",
        registerLink: "Нямате профил? Регистрация"
      };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onLogin() {
    try {
      setError("");
      await loginMobile({ email, password });
      navigation.replace("Home");
    } catch (err) {
      setError(err.message || labels.loginFailed);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.authCard}>
        <Text style={styles.title}>{labels.title}</Text>
        <Text style={styles.subtitle}>{labels.subtitle}</Text>
        <TextInput
          style={styles.input}
          placeholder={labels.email}
          placeholderTextColor="#8b7f70"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={labels.password}
          placeholderTextColor="#8b7f70"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.primaryBtn} onPress={onLogin}>
          <Text style={styles.primaryBtnText}>{labels.login}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>{labels.registerLink}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f6f1e7"
  },
  authCard: {
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
    fontSize: 28,
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
    alignItems: "center"
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700"
  },
  link: {
    color: "#6b7f64",
    textAlign: "center",
    marginTop: 6
  },
  error: {
    color: "#a54b45"
  }
});

