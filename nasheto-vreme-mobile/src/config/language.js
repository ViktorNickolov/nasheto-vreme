import React, { createContext, useContext } from "react";

const LanguageContext = createContext({
  appLanguage: "bg",
  setAppLanguage: () => {}
});

export function LanguageProvider({ value, children }) {
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage() {
  return useContext(LanguageContext);
}

