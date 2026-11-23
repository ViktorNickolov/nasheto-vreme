const API_ERROR_MESSAGES = {
  bg: {
    requestTimeout: "Заявката изтече. Моля, опитайте отново.",
    invalidJson: "Сървърът върна невалиден JSON отговор.",
    missingFileReference: "Липсва референция към файл.",
    genericRequestFailed: "Неуспешна заявка."
  },
  en: {
    requestTimeout: "Request timed out. Please try again.",
    invalidJson: "Server returned invalid JSON response.",
    missingFileReference: "Missing file reference.",
    genericRequestFailed: "Request failed."
  }
};

export function getApiErrorMessage(key, language = "bg") {
  const dictionary = API_ERROR_MESSAGES[language] || API_ERROR_MESSAGES.bg;
  return dictionary[key] || API_ERROR_MESSAGES.en[key] || "Request failed.";
}

