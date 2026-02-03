import AsyncStorage from "@react-native-async-storage/async-storage";

export async function setItem(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

export async function getItem(key: string) {
  return AsyncStorage.getItem(key);
}

export async function removeItem(key: string) {
  await AsyncStorage.removeItem(key);
}

export type StoredUser = {
  name: string;
  email: string;
  role: "family" | "caregiver" | "admin";
};

const USER_KEY = "APP_USER";

export async function saveUser(user: StoredUser) {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<StoredUser | null> {
  const raw = await getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function clearUser() {
  await removeItem(USER_KEY);
}
