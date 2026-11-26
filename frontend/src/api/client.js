import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Studio routes send the admin token; everything else sends the customer token.
const isStudioPath = (path) => path.startsWith("/admin");

export async function apiFetch(path, options = {}) {
  const studio = isStudioPath(path);
  const tokenKey = studio ? "adminToken" : "token";
  const token = localStorage.getItem(tokenKey);
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    toast.error("Something went wrong");
    throw new Error("Something went wrong");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.message || "Something went wrong";
    toast.error(message);
    if (res.status === 401 && token) {
      const keys = studio ? ["adminToken", "adminUser"] : ["token", "user"];
      keys.forEach((k) => localStorage.removeItem(k));
      window.location.assign(studio ? "/admin/login" : "/");
    }
    throw new Error(message);
  }

  return res.json();
}
