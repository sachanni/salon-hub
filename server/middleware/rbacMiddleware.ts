import { Request, Response, NextFunction } from "express";
import { rbacService } from "../services/rbacService";

declare global {
  namespace Express {
    interface Request {
      salonPermissions?: {
        userId: string;
        salonId: string;
        role: 'business_owner' | 'shop_admin' | 'staff';
        permissions: string[];
        isBusinessOwner: boolean;
      };
    }
  }
}

export const checkSalonAccess = (getSalonId: (req: Request) => string | undefined) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId || (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      const salonId = getSalonId(req);
      if (!salonId) {
        return res.status(400).json({ success: false, message: "Salon ID is required" });
      }

      const permissions = await rbacService.getUserPermissions(userId, salonId);
      if (!permissions) {
        return res.status(403).json({ success: false, message: "You do not have access to this salon" });
      }

      req.salonPermissions = permissions;
      next();
    } catch (error) {
      console.error("Error checking salon access:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
};

export const requirePermission = (permissionCode: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.salonPermissions) {
        return res.status(403).json({ success: false, message: "Salon access not established" });
      }

      const codes = Array.isArray(permissionCode) ? permissionCode : [permissionCode];
      const hasPermission = codes.some(code => req.salonPermissions!.permissions.includes(code));

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: "You do not have permission to perform this action" 
        });
      }

      next();
    } catch (error) {
      console.error("Error checking permission:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
};

export const requireAllPermissions = (permissionCodes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.salonPermissions) {
        return res.status(403).json({ success: false, message: "Salon access not established" });
      }

      const hasAllPermissions = permissionCodes.every(code => 
        req.salonPermissions!.permissions.includes(code)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({ 
          success: false, 
          message: "You do not have all required permissions for this action" 
        });
      }

      next();
    } catch (error) {
      console.error("Error checking permissions:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
};

export const requireBusinessOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.salonPermissions) {
      return res.status(403).json({ success: false, message: "Salon access not established" });
    }

    if (!req.salonPermissions.isBusinessOwner) {
      return res.status(403).json({ 
        success: false, 
        message: "Only business owners can perform this action" 
      });
    }

    next();
  } catch (error) {
    console.error("Error checking business owner status:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const requireShopAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.salonPermissions) {
      return res.status(403).json({ success: false, message: "Salon access not established" });
    }

    const role = req.salonPermissions.role;
    if (role !== 'shop_admin' && role !== 'business_owner') {
      return res.status(403).json({ 
        success: false, 
        message: "Only shop admins and business owners can perform this action" 
      });
    }

    next();
  } catch (error) {
    console.error("Error checking shop admin status:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getSalonIdFromParams = (req: Request): string | undefined => {
  return req.params.salonId || req.params.id;
};

export const getSalonIdFromBody = (req: Request): string | undefined => {
  return req.body.salonId;
};

export const getSalonIdFromQuery = (req: Request): string | undefined => {
  return req.query.salonId as string | undefined;
};

export const getSalonIdFromAny = (req: Request): string | undefined => {
  return req.params.salonId || req.params.id || req.body.salonId || req.query.salonId as string;
};

export const loadSalonPermissions = (getSalonId: (req: Request) => string | undefined = getSalonIdFromAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId || (req as any).user?.id;
      if (!userId) {
        return next();
      }

      const salonId = getSalonId(req);
      if (!salonId) {
        return next();
      }

      const permissions = await rbacService.getUserPermissions(userId, salonId);
      if (permissions) {
        req.salonPermissions = permissions;
      }

      next();
    } catch (error) {
      console.error("Error loading salon permissions:", error);
      next();
    }
  };
};
