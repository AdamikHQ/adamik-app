/**
 * Utility functions for working with localStorage
 * Safe for server-side rendering and handles errors gracefully
 */

/**
 * Get an item from localStorage with typed return value
 * @param key The localStorage key to retrieve
 * @param defaultValue The default value to return if the key doesn't exist
 * @returns The parsed value or defaultValue if not found
 */
export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;

  try {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? (JSON.parse(storedValue) as T) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Set an item in localStorage with proper serialization
 * @param key The localStorage key to set
 * @param value The value to store
 */
export const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error storing ${key} in localStorage:`, error);
  }
};

/**
 * Remove an item from localStorage
 * @param key The localStorage key to remove
 */
export const removeLocalStorageItem = (key: string): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};
