import { Router, Request, Response } from "express";
import { rbacService } from "../services/rbacService";
import { 
  checkSalonAccess, 
  requireBusinessOwner as rbacRequireBusinessOwner, 
  getSalonIdFromParams,
  getSalonIdFromBody,
  requireShopAdmin
} from "../middleware/rbacMiddleware";
import { 
  populateUserFromSession,
  requireSalonAccess,
  requireBusinessOwner
} from "../middleware/auth";
import { z } from "zod";
import { 
  assignShopRoleSchema, 
  revokeShopRoleSchema, 
  updateShopRoleSchema 
} from "../../shared/schema";

const router = Router();

// Apply authentication middleware to all routes
router.use(populateUserFromSession);

// Get list of shop admins - requires business owner or shop_admin access only
router.get(
  "/:salonId/admins", 
  requireSalonAccess(['owner']),
  async (req: Request, res: Response) => {
    try {
      const { salonId } = req.params;
      const salonPermissions = (req as any).salonPermissions;

      // Business owners always allowed, shop admins need explicit check
      const isBusinessOwner = salonPermissions?.isBusinessOwner === true;
      const isShopAdmin = salonPermissions?.role === 'shop_admin';
      
      // If not owner, check if they're a shop_admin via RBAC
      if (!isBusinessOwner) {
        const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const hasAccess = await rbacService.isShopAdmin(userId, salonId);
        if (!hasAccess) {
          return res.status(403).json({ 
            success: false, 
            message: "You do not have permission to view shop admins" 
          });
        }
      }

      const admins = await rbacService.getShopAdmins(salonId);

      return res.json({
        success: true,
        admins,
      });
    } catch (error) {
      console.error("Error fetching shop admins:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch shop admins" });
    }
  }
);

// Assign a role - requires business owner access
// URL now includes salonId for proper middleware protection
router.post(
  "/:salonId/assign",
  requireSalonAccess(['owner']),
  requireBusinessOwner(),
  async (req: Request, res: Response) => {
    try {
      const currentUserId = (req as any).user?.id;
      const { salonId } = req.params;

      const bodySchema = z.object({
        userId: z.string(),
        role: z.enum(['shop_admin', 'staff']),
        notes: z.string().optional(),
      });

      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data",
          errors: validation.error.errors 
        });
      }

      const { userId, role, notes } = validation.data;

      const result = await rbacService.assignRole(
        userId,
        salonId,
        role,
        currentUserId,
        notes,
        req.ip,
        req.get('user-agent')
      );

      if (!result.success) {
        return res.status(400).json({ success: false, message: result.error });
      }

      return res.json({
        success: true,
        message: `Successfully assigned ${role} role`,
        assignment: result.assignment,
      });
    } catch (error) {
      console.error("Error assigning role:", error);
      return res.status(500).json({ success: false, message: "Failed to assign role" });
    }
  }
);

// Revoke a role - requires business owner access
router.post(
  "/:salonId/revoke",
  requireSalonAccess(['owner']),
  requireBusinessOwner(),
  async (req: Request, res: Response) => {
    try {
      const currentUserId = (req as any).user?.id;
      const { salonId } = req.params;

      const bodySchema = z.object({
        userId: z.string(),
      });

      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data",
          errors: validation.error.errors 
        });
      }

      const { userId } = validation.data;

      const result = await rbacService.revokeRole(
        userId,
        salonId,
        currentUserId,
        req.ip,
        req.get('user-agent')
      );

      if (!result.success) {
        return res.status(400).json({ success: false, message: result.error });
      }

      return res.json({
        success: true,
        message: "Successfully revoked role",
      });
    } catch (error) {
      console.error("Error revoking role:", error);
      return res.status(500).json({ success: false, message: "Failed to revoke role" });
    }
  }
);

// Update a role - requires business owner access
router.post(
  "/:salonId/update-role",
  requireSalonAccess(['owner']),
  requireBusinessOwner(),
  async (req: Request, res: Response) => {
    try {
      const currentUserId = (req as any).user?.id;
      const { salonId } = req.params;

      const bodySchema = z.object({
        userId: z.string(),
        newRole: z.enum(['shop_admin', 'staff']),
        notes: z.string().optional(),
      });

      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data",
          errors: validation.error.errors 
        });
      }

      const { userId, newRole, notes } = validation.data;

      const result = await rbacService.updateRole(
        userId,
        salonId,
        newRole,
        currentUserId,
        notes,
        req.ip,
        req.get('user-agent')
      );

      if (!result.success) {
        return res.status(400).json({ success: false, message: result.error });
      }

      return res.json({
        success: true,
        message: `Successfully updated role to ${newRole}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      return res.status(500).json({ success: false, message: "Failed to update role" });
    }
  }
);

// Legacy routes for backward compatibility (deprecated - redirect to new routes)
router.post("/assign", async (req: Request, res: Response) => {
  const { salonId } = req.body;
  if (!salonId) {
    return res.status(400).json({ success: false, message: "salonId is required" });
  }
  return res.status(301).json({ 
    success: false, 
    message: "This endpoint is deprecated. Use POST /api/shop-admins/:salonId/assign instead" 
  });
});

router.post("/revoke", async (req: Request, res: Response) => {
  return res.status(301).json({ 
    success: false, 
    message: "This endpoint is deprecated. Use POST /api/shop-admins/:salonId/revoke instead" 
  });
});

router.post("/update", async (req: Request, res: Response) => {
  return res.status(301).json({ 
    success: false, 
    message: "This endpoint is deprecated. Use POST /api/shop-admins/:salonId/update-role instead" 
  });
});

// Get current user's permissions for a salon
router.get(
  "/:salonId/my-permissions",
  requireSalonAccess(['owner', 'manager', 'staff']),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { salonId } = req.params;
      
      // Return the permissions that were loaded by requireSalonAccess middleware
      const salonPermissions = (req as any).salonPermissions;
      
      if (!salonPermissions) {
        return res.status(403).json({ success: false, message: "You do not have access to this salon" });
      }

      return res.json({
        success: true,
        userId,
        salonId,
        role: salonPermissions.role,
        permissions: salonPermissions.permissions,
        isBusinessOwner: salonPermissions.isBusinessOwner,
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch permissions" });
    }
  }
);

// Get all salons the user has access to
router.get("/my-salons", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const salons = await rbacService.getSalonsForUser(userId);

    return res.json({
      success: true,
      salons,
    });
  } catch (error) {
    console.error("Error fetching user salons:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch salons" });
  }
});

// Get all available permission definitions (public catalog)
router.get("/permissions/all", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const allPermissions = await rbacService.getAllPermissions();

    const grouped: Record<string, typeof allPermissions> = {};
    for (const permission of allPermissions) {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    }

    return res.json({
      success: true,
      permissions: allPermissions,
      grouped,
    });
  } catch (error) {
    console.error("Error fetching all permissions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch permissions" });
  }
});

// Get permissions for a specific role (public catalog)
router.get("/permissions/role/:role", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { role } = req.params;
    if (!['business_owner', 'shop_admin', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const permissions = await rbacService.getRolePermissions(role as any);

    return res.json({
      success: true,
      role,
      permissions,
    });
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch role permissions" });
  }
});

// Get audit logs - requires business owner access (uses salon-scoped middleware)
router.get(
  "/:salonId/audit-logs",
  requireSalonAccess(['owner']),
  requireBusinessOwner(),
  async (req: Request, res: Response) => {
    try {
      const { salonId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const logs = await rbacService.getAuditLogs(salonId, limit, offset);

      return res.json({
        success: true,
        logs,
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
    }
  }
);

export default router;
