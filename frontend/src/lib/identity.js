export function loadIdentity() {
  try {
    const raw = localStorage.getItem("rp_identity");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveIdentity(id) {
  localStorage.setItem("rp_identity", JSON.stringify(id));
}

export function clearIdentity() {
  localStorage.removeItem("rp_identity");
}

export function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("sk-SK", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function isPast(iso) {
  return new Date(iso).getTime() < Date.now();
}
