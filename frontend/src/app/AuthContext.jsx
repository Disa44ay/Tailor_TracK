import { createContext, useContext, useState } from "react";
import { apiFetch } from "../api/client.js";

// Two sessions can live on one device at once: a customer and the studio admin.
// Each has its own storage keys, so one never overwrites the other's token.
const CUSTOMER = { token: "token", user: "user" };
const STUDIO = { token: "adminToken", user: "adminUser" };

function read(keys) {
  const stored = localStorage.getItem(keys.user);
  return { token: localStorage.getItem(keys.token) || "", user: stored ? JSON.parse(stored) : null };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => read(CUSTOMER));
  const [studio, setStudio] = useState(() => read(STUDIO));

  function store(keys, data, setSession) {
    localStorage.setItem(keys.token, data.token);
    localStorage.setItem(keys.user, JSON.stringify(data.user));
    setSession({ token: data.token, user: data.user });
  }

  function clear(keys, setSession) {
    localStorage.removeItem(keys.token);
    localStorage.removeItem(keys.user);
    setSession({ token: "", user: null });
  }

  // A studio account signing in through the customer form lands in the studio slot.
  function sessionFor(data) {
    return data.user.role === "admin" ? [STUDIO, setStudio] : [CUSTOMER, setCustomer];
  }

  async function login(email, password) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const [keys, setSession] = sessionFor(data);
    store(keys, data, setSession);
    return data;
  }

  async function signup({ firstName, lastName, phone, email, password, confirmPassword }) {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ firstName, lastName, phone, email, password, confirmPassword }),
    });
    store(CUSTOMER, data, setCustomer);
    return data;
  }

  const value = {
    user: customer.user,
    token: customer.token,
    adminUser: studio.user,
    adminToken: studio.token,
    login,
    signup,
    logout: () => clear(CUSTOMER, setCustomer),
    startAdminSession: (data) => store(STUDIO, data, setStudio),
    logoutAdmin: () => clear(STUDIO, setStudio),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
