import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = {
  upsertUser: (name, email) => axios.post(`${API}/users`, { name, email }).then((r) => r.data),
  listTrainings: () => axios.get(`${API}/trainings`).then((r) => r.data),
  createTraining: (payload) => axios.post(`${API}/trainings`, payload).then((r) => r.data),
  createRecurringTrainings: (payload) => axios.post(`${API}/trainings/recurring`, payload).then((r) => r.data),
  join: (id, name, email) => axios.post(`${API}/trainings/${id}/join`, { name, email }).then((r) => r.data),
  leave: (id, name, email) => axios.post(`${API}/trainings/${id}/leave`, { name, email }).then((r) => r.data),
  dashboard: (email) => axios.get(`${API}/users/${encodeURIComponent(email)}/dashboard`).then((r) => r.data),
  getConfig: () => axios.get(`${API}/config`).then((r) => r.data),
  adminReport: (adminEmail) => axios.get(`${API}/admin/report`, { params: { admin_email: adminEmail } }).then((r) => r.data),
  resetPermanentka: (adminEmail, email) => axios.post(`${API}/admin/reset-permanentka`, { admin_email: adminEmail, email }).then((r) => r.data),
  adjustPermanentka: (adminEmail, email, amount) => axios.post(`${API}/admin/permanentka-adjust`, { admin_email: adminEmail, email, amount }).then((r) => r.data),
  updateTraining: (id, payload) => axios.put(`${API}/trainings/${id}`, payload).then((r) => r.data),
  deleteTraining: (id, adminEmail) => axios.delete(`${API}/trainings/${id}`, { params: { admin_email: adminEmail } }).then((r) => r.data),
};
