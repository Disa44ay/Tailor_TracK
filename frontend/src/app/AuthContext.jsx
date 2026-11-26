import { createContext, useContext, useState } from "react";
import { apiFetch } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  function persist(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    persist(data);
    return data;
  }

  async function signup({ firstName, lastName, phone, email, password, confirmPassword }) {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ firstName, lastName, phone, email, password, confirmPassword }),
    });
    persist(data);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, startSession: persist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
