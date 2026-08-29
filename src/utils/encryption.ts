const LEGACY_KEY = 'v!su4l_b04rd_s3cr3t';
const FILE_PREFIX = 'WNB2:';
const DERIVATION_KEY = new TextEncoder().encode('WNB Studio local project key');

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

export const encryptData = async (data: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const baseKey = await crypto.subtle.importKey('raw', DERIVATION_KEY, 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(data));
  return `${FILE_PREFIX}${toBase64(new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]))}`;
};

const decryptLegacy = (hash: string) => {
  const decoded = atob(hash);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ LEGACY_KEY.charCodeAt(i % LEGACY_KEY.length));
  }
  return decodeURIComponent(result);
};

export const decryptData = async (value: string): Promise<string> => {
  if (!value.startsWith(FILE_PREFIX)) return decryptLegacy(value);
  const payload = fromBase64(value.slice(FILE_PREFIX.length));
  if (payload.length < 29) throw new Error('Invalid WNB file');
  const salt = payload.slice(0, 16);
  const iv = payload.slice(16, 28);
  const encrypted = payload.slice(28);
  const baseKey = await crypto.subtle.importKey('raw', DERIVATION_KEY, 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new TextDecoder().decode(plain);
};
