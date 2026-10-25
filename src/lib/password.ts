import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Formato guardado: salt:hash (hex)
export const hashPassword = (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

export const verifyPassword = (password: string, stored: string) => {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
}
