import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@messenger:access_token',
  REFRESH_TOKEN: '@messenger:refresh_token',
  USER_DATA: '@messenger:user_data',
};

/**
 * Сохранение токенов
 */
export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [KEYS.ACCESS_TOKEN, accessToken],
      [KEYS.REFRESH_TOKEN, refreshToken],
    ]);
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

/**
 * Получение access токена
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Получение refresh токена
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Сохранение данных пользователя
 */
export const saveUserData = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

/**
 * Получение данных пользователя
 */
export const getUserData = async (): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Очистка всех данных аутентификации
 */
export const clearAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.ACCESS_TOKEN,
      KEYS.REFRESH_TOKEN,
      KEYS.USER_DATA,
    ]);
  } catch (error) {
    console.error('Error clearing auth:', error);
    throw error;
  }
};

/**
 * Полная очистка хранилища
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

export default {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  saveUserData,
  getUserData,
  clearAuth,
  clearAll,
};
