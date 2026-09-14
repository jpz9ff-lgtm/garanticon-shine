// Módulo único de consentimiento. Cualquier medición no necesaria debe pasar por aquí.
export type ConsentChoice = "accepted" | "rejected" | null;

const STORAGE_KEY = "cookie_consent";
export const CONSENT_EVENT = "garanticon:consent-change";

// Rutas donde nunca se mide, con o sin consentimiento.
const EXCLUDED_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/unsubscribe",
  "/mi-poliza",
  "/dealer",
];

// Cookies de medición conocidas que deben eliminarse sin aceptación o tras rechazo.
const NON_ESSENTIAL_COOKIES = ["session-id", "_flock", "flock-session"];

export const getConsent = (): ConsentChoice => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
};

export const setConsent = (choice: "accepted" | "rejected") => {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // almacenamiento no disponible
  }
  enforceConsent();
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
};

export const clearConsent = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorar
  }
  enforceConsent();
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
};

export const isExcludedPath = (path = window.location.pathname) =>
  EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

/** Verdadero solo si hay aceptación explícita y la ruta no está excluida. */
export const analyticsAllowed = (path = window.location.pathname) =>
  getConsent() === "accepted" && !isExcludedPath(path);

const deleteCookie = (name: string) => {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  const paths = ["/", window.location.pathname];
  for (const d of domains) {
    for (const p of paths) {
      document.cookie = `${name}=; Max-Age=0; path=${p}${d ? `; domain=${d}` : ""}`;
    }
  }
};

/** Elimina cookies de medición cuando no hay aceptación o la ruta está excluida. */
export const enforceConsent = () => {
  if (analyticsAllowed()) return;
  for (const name of NON_ESSENTIAL_COOKIES) deleteCookie(name);
};

/** Ruta normalizada sin query, fragmento ni identificadores, para medición permitida. */
export const normalizedPath = (path = window.location.pathname) =>
  path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
    .replace(/\/\d+/g, "/:id")
    .replace(/\/+$/, "") || "/";
