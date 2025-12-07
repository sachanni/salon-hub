import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { verifyAccessToken, extractBearerToken } from "../utils/jwt";
import { rbacService } from "../services/rbacService";

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

function getJWTSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return JWT_SECRET;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any;
    
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
      email: user.email || '',
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
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRequiredRole = req.user.roles.some((role: string) => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Middleware to populate req.user from session OR JWT token (hybrid authentication)
// This provides backward compatibility with existing session-based auth while supporting new JWT tokens
export async function populateUserFromSession(req: any, res: Response, next: NextFunction) {
  // Skip if user is already populated (e.g., by Passport)
  if (req.user) {
    return next();
  }

  // Try JWT token first (for mobile apps and API clients)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = extractBearerToken(authHeader);
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const dbUser = await storage.getUserById(decoded.userId);
        
        if (dbUser) {
          const userRoles = await storage.getUserRoles(dbUser.id);
          const orgMemberships = await storage.getUserOrganizations(dbUser.id);
          
          req.user = {
            id: dbUser.id,
            email: dbUser.email || '',
            roles: userRoles.map(role => role.name),
            orgMemberships,
            authMethod: 'jwt' // Track which auth method was used
          };
          
          return next();
        }
      } catch (error) {
        // JWT verification failed, fall through to session check
        console.debug('JWT verification failed, trying session:', error);
      }
    }
  }

  // Fall back to session-based auth (for web browsers)
  if (!req.session?.userId) {
    return next(); // Let downstream middleware handle auth errors
  }

  try {
    const userId = req.session.userId;
    const dbUser = await storage.getUserById(userId);
    
    if (!dbUser) {
      return next();
    }

    const userRoles = await storage.getUserRoles(userId);
    const orgMemberships = await storage.getUserOrganizations(userId);
    
    req.user = {
      id: userId,
      email: dbUser.email || '',
      roles: userRoles.map(role => role.name),
      orgMemberships,
      authMethod: 'session' // Track which auth method was used
    };
    
    next();
  } catch (error) {
    console.error('Failed to populate user from session:', error);
    next();
  }
}

// Super admin middleware - requires super_admin role
export function requireSuperAdmin() {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isSuperAdmin = req.user.roles?.includes('super_admin');
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    next();
  };
}

export function requireSalonAccess(allowedOrgRoles: string[] = ['owner', 'manager'], requiredPermission?: string | string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const salonId = req.params.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID required' });
    }

    try {
      const userId = req.user.id;
      
      const permissions = await rbacService.getUserPermissions(userId, salonId);
      
      if (permissions) {
        req.salonPermissions = permissions;
        
        if (requiredPermission) {
          const codes = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
          const hasPermission = codes.some(code => permissions.permissions.includes(code));
          
          if (!hasPermission) {
            return res.status(403).json({ error: 'You do not have permission to perform this action' });
          }
        }
        
        next();
        return;
      }

      const salon = await storage.getSalonById(salonId);
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }

      if (salon.ownerId === userId) {
        const ownerPermissions = await rbacService.getRolePermissions('business_owner');
        req.salonPermissions = {
          userId,
          salonId,
          role: 'business_owner' as const,
          permissions: ownerPermissions,
          isBusinessOwner: true,
        };
        next();
        return;
      }

      const hasAccess = req.user.orgMemberships?.some((membership: any) => 
        membership.orgId === salon.orgId && 
        allowedOrgRoles.includes(membership.orgRole)
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this salon' });
      }

      const orgRole = req.user.orgMemberships?.find((m: any) => m.orgId === salon.orgId)?.orgRole;
      const role = orgRole === 'owner' ? 'business_owner' : 'shop_admin';
      const rolePermissions = await rbacService.getRolePermissions(role);
      
      req.salonPermissions = {
        userId,
        salonId,
        role: role as 'business_owner' | 'shop_admin' | 'staff',
        permissions: rolePermissions,
        isBusinessOwner: role === 'business_owner',
      };

      if (requiredPermission) {
        const codes = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
        const hasPermission = codes.some(code => rolePermissions.includes(code));
        
        if (!hasPermission) {
          return res.status(403).json({ error: 'You do not have permission to perform this action' });
        }
      }

      next();
    } catch (error) {
      console.error('Salon access check failed:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

export function requireStaffAccess() {
  return async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const salonId = req.params.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID required' });
    }

    try {
      const userId = req.user.id;
      
      const permissions = await rbacService.getUserPermissions(userId, salonId);
      if (permissions) {
        req.salonPermissions = permissions;
        next();
        return;
      }

      const isStaff = await storage.isUserStaffOfSalon(userId, salonId);
      
      const salon = await storage.getSalonById(salonId);
      const hasManagerAccess = salon && req.user.orgMemberships?.some((membership: any) => 
        membership.orgId === salon.orgId && 
        ['owner', 'manager'].includes(membership.orgRole)
      );

      if (!isStaff && !hasManagerAccess) {
        return res.status(403).json({ error: 'Access denied - must be staff member or have management access' });
      }

      if (hasManagerAccess) {
        const orgRole = req.user.orgMemberships?.find((m: any) => m.orgId === salon?.orgId)?.orgRole;
        const role = orgRole === 'owner' ? 'business_owner' : 'shop_admin';
        const rolePermissions = await rbacService.getRolePermissions(role);
        req.salonPermissions = {
          userId,
          salonId,
          role: role as 'business_owner' | 'shop_admin' | 'staff',
          permissions: rolePermissions,
          isBusinessOwner: role === 'business_owner',
        };
      } else if (isStaff) {
        const staffPermissions = await rbacService.getRolePermissions('staff');
        req.salonPermissions = {
          userId,
          salonId,
          role: 'staff' as const,
          permissions: staffPermissions,
          isBusinessOwner: false,
        };
      }

      next();
    } catch (error) {
      console.error('Staff access check failed:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

export function requirePermission(permissionCode: string | string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    if (!req.salonPermissions) {
      return res.status(403).json({ error: 'Salon access not established' });
    }

    const codes = Array.isArray(permissionCode) ? permissionCode : [permissionCode];
    const hasPermission = codes.some(code => req.salonPermissions.permissions.includes(code));

    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }

    next();
  };
}

export function requireBusinessOwner() {
  return async (req: any, res: Response, next: NextFunction) => {
    if (!req.salonPermissions) {
      return res.status(403).json({ error: 'Salon access not established' });
    }

    if (!req.salonPermissions.isBusinessOwner) {
      return res.status(403).json({ error: 'Only business owners can perform this action' });
    }

    next();
  };
}

// Export the type for use in route files
export type { AuthenticatedRequest };