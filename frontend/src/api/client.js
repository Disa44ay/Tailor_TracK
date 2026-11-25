import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
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
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/");
    }
    throw new Error(message);
  }

  return res.json();
}
