import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { getDB } from '@/src/db/models';
import { User } from '@/src/db/models.interface';
import { verifyPassword } from './password';

export const SESSION_COOKIE = 'session';
const SESSION_HOURS = 8;

// En la DB solo se guarda el hash del token, nunca el token en claro
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const authenticate = (username: string, password: string): User | null => {
    const row = getDB()
        .prepare('SELECT id, username, name, password_hash FROM users WHERE username = ?')
        .get(username) as (User & { password_hash: string }) | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) return null;

    return { id: row.id, username: row.username, name: row.name };
}

export const createSession = async (userId: number) => {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

    getDB()
        .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
        .run(hashToken(token), userId, expiresAt.toISOString());

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: expiresAt
    });
}

export const getSessionUser = async (): Promise<User | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const user = getDB()
        .prepare(`
            SELECT u.id, u.username, u.name
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = ? AND s.expires_at > ?
        `)
        .get(hashToken(token), new Date().toISOString()) as User | undefined;

    return user ?? null;
}

export const deleteSession = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
        getDB().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    }
    cookieStore.delete(SESSION_COOKIE);
}
