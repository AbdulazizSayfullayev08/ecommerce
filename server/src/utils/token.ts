import crypto from 'crypto';

export function generateOtp(length = 6): string {
  return crypto.randomInt(0, 10 ** length).toString().padStart(length, '0');
}

export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
