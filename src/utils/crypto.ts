/**
 * Simple encryption utilities for localStorage data
 * Uses AES-GCM with a device-derived key
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// Generate a device-specific key from fingerprint data
async function getDeviceKey(): Promise<CryptoKey> {
  // Create a device fingerprint from available browser data
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    'facefights-salt-v1'
  ].join('|');

  // Hash the fingerprint to create key material
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Import as a CryptoKey
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data for localStorage storage
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getDeviceKey();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt data from localStorage
 */
export async function decryptData(encryptedString: string): Promise<string> {
  try {
    const key = await getDeviceKey();

    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedString).split('').map(c => c.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedData
    );

    // Decode to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    throw error;
  }
}

/**
 * Safely store encrypted data in localStorage
 */
export async function secureStore(key: string, data: object): Promise<void> {
  const jsonString = JSON.stringify(data);
  const encrypted = await encryptData(jsonString);
  localStorage.setItem(key, encrypted);
}

/**
 * Safely retrieve and decrypt data from localStorage
 */
export async function secureRetrieve<T>(key: string): Promise<T | null> {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;

  try {
    const decrypted = await decryptData(encrypted);
    return JSON.parse(decrypted) as T;
  } catch {
    // If decryption fails (e.g., device changed), clear the data
    localStorage.removeItem(key);
    return null;
  }
}
