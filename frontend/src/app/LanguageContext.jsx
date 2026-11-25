import { createContext, useContext, useEffect, useState } from "react";

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "bn");

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  function toggleLang() {
    setLang((l) => (l === "bn" ? "en" : "bn"));
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
