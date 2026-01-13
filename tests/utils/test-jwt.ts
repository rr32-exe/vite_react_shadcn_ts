// Minimal JWT helpers for tests (mirrors worker implementation)
import { TextEncoder } from 'util';
const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  const b64 = Buffer.from(binary, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeStr(str: string) {
  return base64UrlEncode(encoder.encode(str));
}

async function hmacSha256Base64Url(secret: string, data: string) {
  const crypto = await import('crypto');
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  return base64UrlEncode(new Uint8Array(sig));
}

export async function signJwtForTest(payload: any, secret: string, expiresInSec = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  payload.iat = now;
  payload.exp = now + expiresInSec;
  const toSign = `${base64UrlEncodeStr(JSON.stringify(header))}.${base64UrlEncodeStr(JSON.stringify(payload))}`;
  const signature = await hmacSha256Base64Url(secret, toSign);
  return `${toSign}.${signature}`;
}

export async function verifyJwtForTest(token: string, secret: string) {
  const parts = token.split('.');
  const [headerB64, payloadB64, sig] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expected = await hmacSha256Base64Url(secret, data);
  if (expected !== sig) return null;
  const payloadJson = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  const payload = JSON.parse(payloadJson);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) return null;
  return payload;
}