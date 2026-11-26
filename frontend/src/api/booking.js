import { apiFetch } from "./client.js";

// The backend returns { enquiry, items, messages }; the screens use one flat object.
const flatten = (d) => ({ ...d.enquiry, items: d.items, messages: d.messages });

// datetime-local inputs have no time zone. Send an ISO string so the server stores the
// time the person picked, not the server's zone.
const toIso = (value) => new Date(value).toISOString();
const withIsoDate = (body) => (body.proposed_at ? { ...body, proposed_at: toIso(body.proposed_at) } : body);

// Customer routes (see the backend contract for shapes).
export const getProfile = () => apiFetch("/me/profile");

export const createEnquiry = (body) =>
  apiFetch("/enquiries", { method: "POST", body: JSON.stringify(body) });
export const listEnquiries = () => apiFetch("/enquiries");
export const getEnquiry = async (id) => flatten(await apiFetch(`/enquiries/${id}`));
export const sendCustomerMessage = (id, body) =>
  apiFetch(`/enquiries/${id}/messages`, { method: "POST", body: JSON.stringify(withIsoDate(body)) });
export const markEnquirySeen = (id) =>
  apiFetch(`/enquiries/${id}/seen`, { method: "POST" });

// Admin routes, all under /api/admin.
export const adminLogin = (email, password) =>
  apiFetch("/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const adminCustomers = () => apiFetch("/admin/customers");
export const adminEnquiries = (status) =>
  apiFetch(`/admin/enquiries${status ? `?status=${status}` : ""}`);
export const adminEnquiry = async (id) => flatten(await apiFetch(`/admin/enquiries/${id}`));
export const adminSendMessage = (id, body) =>
  apiFetch(`/admin/enquiries/${id}/messages`, { method: "POST", body: JSON.stringify(withIsoDate(body)) });
export const adminConfirm = (id, consultationAt) =>
  apiFetch(`/admin/enquiries/${id}/confirm`, {
    method: "POST",
    body: JSON.stringify({ consultation_at: toIso(consultationAt) }),
  });
// Stats come back keyed by garment and fabric_type; the charts want { label, count }.
export const adminStats = async () => {
  const s = await apiFetch("/admin/stats");
  return {
    byGarment: s.by_garment.map((r) => ({ label: r.garment, count: r.count })),
    byFabric: s.by_fabric_type.map((r) => ({ label: r.fabric_type, count: r.count })),
  };
};
