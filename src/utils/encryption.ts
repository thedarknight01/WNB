import { useSettingsStore } from '../core/store/useSettingsStore';
const LEGACY_KEY = 'v!su4l_b04rd_s3cr3t';
const FILE_PREFIX_V2 = 'WNB2:';
const FILE_PREFIX_V3 = 'WNB3:';
const getDerivationKey = () => {
  const pwd = useSettingsStore.getState().masterPassword;
  return new TextEncoder().encode(pwd ? pwd : 'WNB Studio local project key');
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
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const baseKey = await crypto.subtle.importKey('raw', getDerivationKey(), 'PBKDF2', false, ['deriveKey']);
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
  
  const baseKey = await crypto.subtle.importKey('raw', getDerivationKey(), 'PBKDF2', false, ['deriveKey']);
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
  } else {
    return new TextDecoder().decode(plainBytes);
  }
};
