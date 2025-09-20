import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    orgMemberships?: Array<{
      orgId: string;
      orgRole: string;
      organization: {
        id: string;
        name: string;
        type: string;
      };
    }>;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  orgMemberships?: Array<{
    orgId: string;
    orgRole: string;
    organization: {
      id: string;
      name: string;
      type: string;
    };
  }>;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch user details with organization memberships
    const user = await storage.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user roles
    const userRoles = await storage.getUserRoles(user.id);
    const roles = userRoles.map(role => role.name);

    // Get organization memberships
    const orgMemberships = await storage.getUserOrganizations(user.id);
    
    req.user = {
      id: user.id,
      email: user.email,
      roles,
      orgMemberships
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRequiredRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export function requireSalonAccess(allowedOrgRoles: string[] = ['owner', 'manager']) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const salonId = req.params.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID required' });
    }

    try {
      // Get salon and verify user has access
      const salon = await storage.getSalonById(salonId);
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }

      // Check if user belongs to the salon's organization with appropriate role
      const hasAccess = req.user.orgMemberships?.some(membership => 
        membership.orgId === salon.orgId && 
        allowedOrgRoles.includes(membership.orgRole)
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this salon' });
      }

      next();
    } catch (error) {
      console.error('Salon access check failed:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

export function requireStaffAccess() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const salonId = req.params.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID required' });
    }

    try {
      // Check if user is staff member of this salon OR has manager/owner access
      const isStaff = await storage.isUserStaffOfSalon(req.user.id, salonId);
      
      const salon = await storage.getSalonById(salonId);
      const hasManagerAccess = salon && req.user.orgMemberships?.some(membership => 
        membership.orgId === salon.orgId && 
        ['owner', 'manager'].includes(membership.orgRole)
      );

      if (!isStaff && !hasManagerAccess) {
        return res.status(403).json({ error: 'Access denied - must be staff member or have management access' });
      }

      next();
    } catch (error) {
      console.error('Staff access check failed:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

// Export the type for use in route files
export type { AuthenticatedRequest };