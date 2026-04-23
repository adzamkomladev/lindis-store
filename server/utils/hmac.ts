/**
 * Helper function to convert an ArrayBuffer to a hexadecimal string.
 */
const bufferToHex = (buffer: ArrayBuffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const createHmacSha512 = async (data: string, secretKey: string) => {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const encodedKey = encoder.encode(secretKey);

  // Import the key
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    encodedKey,
    {
      name: 'HMAC',
      hash: 'SHA-512'
    },
    false,
    ['sign']
  );

  // Sign the data
  const signature = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    encodedData
  );

  // Convert the result (ArrayBuffer) to a hex string
  return bufferToHex(signature);
}
