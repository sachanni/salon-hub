import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';
import { refreshTokens } from '../../shared/schema';
import { eq, and, gt, isNull, lt } from 'drizzle-orm';

// Get JWT secrets from environment - REQUIRED for production
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

// Enforce JWT secrets in production, warn in development
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables are required in production. ' +
      'Generate secure secrets with: openssl rand -base64 64'
    );
  } else {
    console.warn(
      '⚠️  WARNING: JWT_ACCESS_SECRET and/or JWT_REFRESH_SECRET not set. ' +
      'Using temporary secrets for development. All tokens will be invalidated on server restart. ' +
      'Set these environment variables for persistent authentication.'
    );
  }
}

// Use provided secrets or generate temporary ones for development
const FINAL_ACCESS_SECRET = ACCESS_TOKEN_SECRET || crypto.randomBytes(64).toString('hex');
const FINAL_REFRESH_SECRET = REFRESH_TOKEN_SECRET || crypto.randomBytes(64).toString('hex');

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface AccessTokenPayload {
  userId: string;
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

/**
 * Generate an access token (short-lived, 15 minutes)
 */
export function generateAccessToken(userId: string, email: string): string {
  const payload: AccessTokenPayload = {
    userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, FINAL_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'salonhub',
    audience: 'salonhub-api',
  });
}

/**
 * Generate a refresh token (long-lived, 7 days) and store in database
 */
export async function generateRefreshToken(
  userId: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<{ token: string; tokenId: string }> {
  // Create a unique token ID
  const tokenId = crypto.randomUUID();

  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    type: 'refresh',
  };

  const token = jwt.sign(payload, FINAL_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'salonhub',
    audience: 'salonhub-api',
  });

  // Calculate expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store refresh token in database for allowlisting
  await db.insert(refreshTokens).values({
    id: tokenId,
    userId,
    token,
    deviceInfo: deviceInfo || null,
    ipAddress: ipAddress || null,
    expiresAt,
  });

  return { token, tokenId };
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, FINAL_ACCESS_SECRET, {
      issuer: 'salonhub',
      audience: 'salonhub-api',
    }) as AccessTokenPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify and decode a refresh token, and check if it's in the database allowlist
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const decoded = jwt.verify(token, FINAL_REFRESH_SECRET, {
      issuer: 'salonhub',
      audience: 'salonhub-api',
    }) as RefreshTokenPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if token exists in database and is not revoked
    const storedToken = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.id, decoded.tokenId),
        eq(refreshTokens.token, token),
        gt(refreshTokens.expiresAt, new Date()),
        isNull(refreshTokens.revokedAt)
      ),
    });

    if (!storedToken) {
      throw new Error('Refresh token not found or has been revoked');
    }

    // Update last used timestamp
    await db
      .update(refreshTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(refreshTokens.id, decoded.tokenId));

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Revoke a refresh token (mark as revoked in database)
 */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, tokenId));
}

/**
 * Revoke all refresh tokens for a user (useful for logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(refreshTokens.userId, userId),
      isNull(refreshTokens.revokedAt)
    ));
}

/**
 * Cleanup expired and revoked tokens (run this periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await db
    .delete(refreshTokens)
    .where(
      lt(refreshTokens.expiresAt, new Date())
    )
    .returning({ id: refreshTokens.id });

  return result.length;
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}
