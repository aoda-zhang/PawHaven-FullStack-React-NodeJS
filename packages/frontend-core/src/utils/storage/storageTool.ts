/**
 * Utility for managing browser localStorage with JSON serialization and error handling.
 * All methods are wrapped in try-catch blocks to handle quota exceeded and other storage errors.
 */
export const storageTool = {
  /**
   * Stores a value in localStorage with JSON serialization.
   *
   * @param key - The storage key
   * @param value - The value to store (will be JSON.stringified)
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Get errors in localStorage set value:', error);
    }
  },

  /**
   * Retrieves a value from localStorage and attempts to parse it as JSON.
   * Falls back to returning the raw string if JSON parsing fails.
   *
   * @param key - The storage key
   * @returns The parsed value as type T, the raw string, or null if not found
   */
  get<T>(key: string): T | string | null {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Get errors in localStorage get item:', error);
      return null;
    }
  },

  /**
   * Retrieves a value from localStorage without JSON parsing.
   *
   * @param key - The storage key
   * @returns The raw string value or null if not found
   */
  getRaw(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Get errors in localStorage getRaw:', error);
      return null;
    }
  },

  /**
   * Checks if a key exists in localStorage.
   *
   * @param key - The storage key to check
   * @returns True if the key exists, false otherwise
   */
  has(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error('Get errors in localStorage has check:', error);
      return false;
    }
  },

  /**
   * Removes a specific key from localStorage.
   *
   * @param key - The storage key to remove
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Get errors in localStorage remove item:', error);
    }
  },

  /**
   * Clears all data from both localStorage and sessionStorage.
   */
  clearAll(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Get errors in localStorage delete all items:', error);
    }
  },
};
