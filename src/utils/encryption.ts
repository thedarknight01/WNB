import { useSettingsStore } from '../core/store/useSettingsStore';
const LEGACY_KEY = 'v!su4l_b04rd_s3cr3t';
const FILE_PREFIX_V2 = 'WNB2:';
const FILE_PREFIX_V3 = 'WNB3:';
const LEGACY_FALLBACK_DERIVATION_KEY = 'WNB Studio local project key';
const DEVICE_KEY_STORAGE_KEY = 'wnb_device_key_v1';

const getOrCreateDeviceKey = () => {
  if (typeof window === 'undefined') return LEGACY_FALLBACK_DERIVATION_KEY;
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
    if (existing) return existing;
    const generated = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(16))).map(v => v.toString(16).padStart(2, '0')).join('');
    window.localStorage.setItem(DEVICE_KEY_STORAGE_KEY, generated);
    return generated;
  } catch {
    return LEGACY_FALLBACK_DERIVATION_KEY;
  }
};

const getDerivationKeyCandidates = () => {
  const pwd = useSettingsStore.getState().masterPassword;
  if (pwd) return [pwd];
  const deviceKey = getOrCreateDeviceKey();
  return deviceKey === LEGACY_FALLBACK_DERIVATION_KEY
    ? [deviceKey]
    : [deviceKey, LEGACY_FALLBACK_DERIVATION_KEY];
};

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const compress = async (str: string): Promise<Uint8Array> => {
  if (typeof CompressionStream === 'undefined') return new TextEncoder().encode(str);
  const stream = new Blob([str]).stream().pipeThrough(new (window as any).CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const decompress = async (bytes: Uint8Array): Promise<string> => {
  if (typeof DecompressionStream === 'undefined') return new TextDecoder().decode(bytes);
  const stream = new Blob([bytes as any]).stream().pipeThrough(new (window as any).DecompressionStream('gzip'));
  return await new Response(stream).text();
};

export const encryptData = async (data: string): Promise<string> => {
  const [activeKey] = getDerivationKeyCandidates();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(activeKey), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  
  // V3 uses Compression
  const compressed = await compress(data);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, compressed as any);
  
  return `${FILE_PREFIX_V3}${toBase64(new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]))}`;
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
  if (!value.startsWith(FILE_PREFIX_V2) && !value.startsWith(FILE_PREFIX_V3)) return decryptLegacy(value);
  
  const isV3 = value.startsWith(FILE_PREFIX_V3);
  const payload = fromBase64(value.slice(isV3 ? FILE_PREFIX_V3.length : FILE_PREFIX_V2.length));
  
  if (payload.length < 29) throw new Error('Invalid WNB file');
  const salt = payload.slice(0, 16);
  const iv = payload.slice(16, 28);
  const encrypted = payload.slice(28);
  
  let lastError: unknown = null;
  const candidates = getDerivationKeyCandidates();
  for (const candidate of candidates) {
    try {
      const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(candidate), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
      );
      const plainBytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
      if (isV3) {
        return await decompress(new Uint8Array(plainBytes));
      }
      return new TextDecoder().decode(plainBytes);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unable to decrypt data');
};
