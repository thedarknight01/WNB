const SECRET_KEY = 'v!su4l_b04rd_s3cr3t';

export const encryptData = (data: string): string => {
  // 1. Safely encode Unicode characters (like Emojis in your notebook)
  const encoded = encodeURIComponent(data);
  let result = '';
  
  // 2. Apply XOR cipher
  for (let i = 0; i < encoded.length; i++) {
    result += String.fromCharCode(encoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  
  // 3. Convert to Base64 to make it safely savable as a file
  return btoa(result);
};

export const decryptData = (hash: string): string => {
  // 1. Decode Base64
  const decoded = atob(hash);
  let result = '';
  
  // 2. Reverse the XOR cipher
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  
  // 3. Restore Unicode characters
  return decodeURIComponent(result);
};