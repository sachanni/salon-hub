import type { Response, NextFunction } from "express";
import { extractBearerToken, verifyAccessToken } from "../utils/jwt";

export async function authenticateMobileUser(req: any, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    
    const decoded = await verifyAccessToken(token);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
