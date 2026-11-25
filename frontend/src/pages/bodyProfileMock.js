// Backend now supports height/weight/age for real (merged 2026-11-21,
// commit 2892d48), but this mock stays as a harmless fallback for any
// environment whose local DB hasn't run that migration yet — the moment
// GET returns a non-null value, this is never read.
const STORAGE_KEY = "tailor-track:body-profile-mock";

export function getBodyProfileMock() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function setBodyProfileMock(values) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // localStorage unavailable (private mode, etc) — values just won't persist across reloads
  }
}
