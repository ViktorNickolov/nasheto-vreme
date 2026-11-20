import Constants from "expo-constants";

const fallbackApiBaseUrl = "http://localhost:8088/api/v1";

export function getApiBaseUrl() {
  return (
    Constants.expoConfig?.extra?.apiBaseUrl ||
    Constants.manifest2?.extra?.expoClient?.extra?.apiBaseUrl ||
    fallbackApiBaseUrl
  );
}

