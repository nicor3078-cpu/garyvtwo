import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USER_API_KEY: "gary_user_api_key",
  MEMORY_VAULT: "gary_memory_vault",
  CONVERSATIONS: "gary_conversations",
  CURRENT_CONVERSATION: "gary_current_conversation",
};

export interface MemoryVault {
  name: string;
  birthday: string;
  interests: string;
  grade: string;
}

export async function getUserApiKey(): Promise<string | null> {
  try {
    const key = await AsyncStorage.getItem(KEYS.USER_API_KEY);
    return key && key.trim().length > 0 ? key.trim() : null;
  } catch {
    return null;
  }
}

export async function setUserApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_API_KEY, key.trim());
}

export async function clearUserApiKey(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER_API_KEY);
}

export async function getMemoryVault(): Promise<MemoryVault> {
  try {
    const data = await AsyncStorage.getItem(KEYS.MEMORY_VAULT);
    if (data) return JSON.parse(data);
    return { name: "", birthday: "", interests: "", grade: "" };
  } catch {
    return { name: "", birthday: "", interests: "", grade: "" };
  }
}

export async function saveMemoryVault(vault: MemoryVault): Promise<void> {
  await AsyncStorage.setItem(KEYS.MEMORY_VAULT, JSON.stringify(vault));
}

export { KEYS };
