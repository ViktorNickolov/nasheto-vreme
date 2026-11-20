import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "nv_mobile_refresh_token";

export async function saveRefreshToken(token) {
  if (!token) {
    await clearRefreshToken();
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function loadRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken() {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

