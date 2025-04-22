import { getVersion } from "@tauri-apps/api/app";

export const checkIsDesktop = async (): Promise<boolean> => {
  try {
    await getVersion();
    console.log("Running as Tauri desktop app");
    return true;
  } catch (e) {
    console.log("Running as web app");
    return false;
  }
};
