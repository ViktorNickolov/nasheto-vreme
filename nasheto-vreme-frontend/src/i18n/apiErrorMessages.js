const API_ERROR_MESSAGES = {
  bg: {
    requestTimeout: "Заявката изтече. Моля, опитайте отново.",
    invalidJson: "Сървърът върна невалиден JSON отговор.",
    missingUploadedFileReference: "Липсва референция към качен файл."
  },
  en: {
    requestTimeout: "Request timed out. Please try again.",
    invalidJson: "Server returned invalid JSON response.",
    missingUploadedFileReference: "Missing uploaded file reference."
  }
};

export function getApiErrorMessage(key, language = "bg") {
  const dictionary = API_ERROR_MESSAGES[language] || API_ERROR_MESSAGES.bg;
  return dictionary[key] || API_ERROR_MESSAGES.en[key] || "Request failed.";
}

