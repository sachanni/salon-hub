import type { Response, NextFunction } from "express";
import { extractBearerToken, verifyAccessToken } from "../utils/jwt";
import { storage } from "../storage";

export async function authenticateChatUser(req: any, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.session?.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = { id: user.id };
        return next();
      }
    }

    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      try {
        const decoded = await verifyAccessToken(token);
        req.user = { id: decoded.userId };
        return next();
      } catch (tokenError) {
      }
    }

    res.status(401).json({ error: "Authentication required" });
  } catch (error) {
    console.error("Chat authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}
