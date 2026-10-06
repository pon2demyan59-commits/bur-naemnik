export const SAVE_KEY = 'bur-naemnik.save.v1';
const SETTINGS_KEY = 'bur-naemnik.settings.v1';
export function readSave(storage) {
  try {
    const save = JSON.parse((storage ?? globalThis.localStorage).getItem(SAVE_KEY));
    return save?.version === 1 && save.progress && typeof save.progress === 'object' && !Array.isArray(save.progress)
      && typeof save.progress.location === 'string' && save.progress.location.length > 0 ? save : null;
  } catch { return null; }
}
export function readSettings() {
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return { sound: value.sound !== false, music: value.music !== false };
  } catch { return { sound: true, music: true }; }
}
export function writeSettings(value) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(value)); return true; }
  catch { return false; }
}
