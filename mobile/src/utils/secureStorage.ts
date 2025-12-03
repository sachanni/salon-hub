import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'salonhub_access_token',
  REFRESH_TOKEN: 'salonhub_refresh_token',
  USER: 'salonhub_user',
  ONBOARDING_COMPLETE: 'salonhub_onboarding_complete',
  PERMISSIONS: 'salonhub_permissions',
};

export const secureStorage = {
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async removeAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async setUser(user: any): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const userStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  async removeUser(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
  },

  async setOnboardingComplete(complete: boolean): Promise<void> {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.ONBOARDING_COMPLETE,
      complete ? 'true' : 'false'
    );
  },

  async getOnboardingComplete(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  },

  async setPermissions(permissions: any): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
  },

  async getPermissions(): Promise<any | null> {
    const permStr = await SecureStore.getItemAsync(STORAGE_KEYS.PERMISSIONS);
    return permStr ? JSON.parse(permStr) : null;
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
      SecureStore.deleteItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETE),
      SecureStore.deleteItemAsync(STORAGE_KEYS.PERMISSIONS),
    ]);
  },
};
