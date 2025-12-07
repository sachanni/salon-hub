import { db } from "../db";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  permissions,
  shopRolePermissions,
  shopRoleAssignments,
  adminAuditLogs,
  salons,
  users,
  organizations,
  orgUsers,
  ShopRoleType,
  UserSalonPermissions,
  ShopAdminListItem,
} from "../../shared/schema";

export class RBACService {
  async getUserSalonRole(userId: string, salonId: string): Promise<ShopRoleType | null> {
    const salon = await db.query.salons.findFirst({
      where: eq(salons.id, salonId),
    });

    if (!salon) {
      return null;
    }

    if (salon.ownerId === userId) {
      return 'business_owner';
    }

    if (salon.orgId) {
      const orgUser = await db.query.orgUsers.findFirst({
        where: and(
          eq(orgUsers.orgId, salon.orgId),
          eq(orgUsers.userId, userId),
          eq(orgUsers.isActive, 1)
        ),
      });

      if (orgUser && orgUser.orgRole === 'owner') {
        return 'business_owner';
      }
    }

    const roleAssignment = await db
      .select()
      .from(shopRoleAssignments)
      .where(
        and(
          eq(shopRoleAssignments.userId, userId),
          eq(shopRoleAssignments.salonId, salonId),
          eq(shopRoleAssignments.isActive, 1)
        )
      )
      .limit(1);

    if (roleAssignment.length > 0) {
      return roleAssignment[0].role as ShopRoleType;
    }

    return null;
  }

  async getUserPermissions(userId: string, salonId: string): Promise<UserSalonPermissions | null> {
    const role = await this.getUserSalonRole(userId, salonId);

    if (!role) {
      return null;
    }

    const rolePerms = await db
      .select({
        code: permissions.code,
      })
      .from(shopRolePermissions)
      .innerJoin(permissions, eq(shopRolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(shopRolePermissions.role, role),
          eq(permissions.isActive, 1)
        )
      );

    return {
      userId,
      salonId,
      role,
      permissions: rolePerms.map(p => p.code),
      isBusinessOwner: role === 'business_owner',
    };
  }

  async hasPermission(userId: string, salonId: string, permissionCode: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, salonId);
    
    if (!userPermissions) {
      return false;
    }

    return userPermissions.permissions.includes(permissionCode);
  }

  async hasAnyPermission(userId: string, salonId: string, permissionCodes: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, salonId);
    
    if (!userPermissions) {
      return false;
    }

    return permissionCodes.some(code => userPermissions.permissions.includes(code));
  }

  async hasAllPermissions(userId: string, salonId: string, permissionCodes: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, salonId);
    
    if (!userPermissions) {
      return false;
    }

    return permissionCodes.every(code => userPermissions.permissions.includes(code));
  }

  async isBusinessOwner(userId: string, salonId: string): Promise<boolean> {
    const role = await this.getUserSalonRole(userId, salonId);
    return role === 'business_owner';
  }

  async isShopAdmin(userId: string, salonId: string): Promise<boolean> {
    const role = await this.getUserSalonRole(userId, salonId);
    return role === 'shop_admin' || role === 'business_owner';
  }

  async canAccessSalon(userId: string, salonId: string): Promise<boolean> {
    const role = await this.getUserSalonRole(userId, salonId);
    return role !== null;
  }

  async assignRole(
    targetUserId: string,
    salonId: string,
    role: 'shop_admin' | 'staff',
    assignedByUserId: string,
    notes?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string; assignment?: any }> {
    const isOwner = await this.isBusinessOwner(assignedByUserId, salonId);
    if (!isOwner) {
      return { success: false, error: 'Only business owners can assign roles' };
    }

    const existingAssignment = await db
      .select()
      .from(shopRoleAssignments)
      .where(
        and(
          eq(shopRoleAssignments.userId, targetUserId),
          eq(shopRoleAssignments.salonId, salonId),
          eq(shopRoleAssignments.isActive, 1)
        )
      )
      .limit(1);

    if (existingAssignment.length > 0) {
      return { success: false, error: 'User already has an active role for this salon' };
    }

    const [newAssignment] = await db
      .insert(shopRoleAssignments)
      .values({
        userId: targetUserId,
        salonId,
        role,
        assignedBy: assignedByUserId,
        notes,
        isActive: 1,
      })
      .returning();

    await this.logAction(
      assignedByUserId,
      salonId,
      'role_assigned',
      targetUserId,
      null,
      { role },
      ipAddress,
      userAgent
    );

    return { success: true, assignment: newAssignment };
  }

  async revokeRole(
    targetUserId: string,
    salonId: string,
    revokedByUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    const isOwner = await this.isBusinessOwner(revokedByUserId, salonId);
    if (!isOwner) {
      return { success: false, error: 'Only business owners can revoke roles' };
    }

    const existingAssignment = await db
      .select()
      .from(shopRoleAssignments)
      .where(
        and(
          eq(shopRoleAssignments.userId, targetUserId),
          eq(shopRoleAssignments.salonId, salonId),
          eq(shopRoleAssignments.isActive, 1)
        )
      )
      .limit(1);

    if (existingAssignment.length === 0) {
      return { success: false, error: 'No active role found for this user' };
    }

    const previousRole = existingAssignment[0].role;

    await db
      .update(shopRoleAssignments)
      .set({
        isActive: 0,
        revokedAt: new Date(),
        revokedBy: revokedByUserId,
      })
      .where(eq(shopRoleAssignments.id, existingAssignment[0].id));

    await this.logAction(
      revokedByUserId,
      salonId,
      'role_revoked',
      targetUserId,
      { role: previousRole },
      null,
      ipAddress,
      userAgent
    );

    return { success: true };
  }

  async updateRole(
    targetUserId: string,
    salonId: string,
    newRole: 'shop_admin' | 'staff',
    updatedByUserId: string,
    notes?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    const isOwner = await this.isBusinessOwner(updatedByUserId, salonId);
    if (!isOwner) {
      return { success: false, error: 'Only business owners can update roles' };
    }

    const existingAssignment = await db
      .select()
      .from(shopRoleAssignments)
      .where(
        and(
          eq(shopRoleAssignments.userId, targetUserId),
          eq(shopRoleAssignments.salonId, salonId),
          eq(shopRoleAssignments.isActive, 1)
        )
      )
      .limit(1);

    if (existingAssignment.length === 0) {
      return { success: false, error: 'No active role found for this user' };
    }

    const previousRole = existingAssignment[0].role;

    await db
      .update(shopRoleAssignments)
      .set({
        role: newRole,
        notes: notes || existingAssignment[0].notes,
      })
      .where(eq(shopRoleAssignments.id, existingAssignment[0].id));

    await this.logAction(
      updatedByUserId,
      salonId,
      'role_updated',
      targetUserId,
      { role: previousRole },
      { role: newRole },
      ipAddress,
      userAgent
    );

    return { success: true };
  }

  async getShopAdmins(salonId: string): Promise<ShopAdminListItem[]> {
    const assignments = await db
      .select({
        id: shopRoleAssignments.id,
        userId: shopRoleAssignments.userId,
        role: shopRoleAssignments.role,
        assignedAt: shopRoleAssignments.assignedAt,
        isActive: shopRoleAssignments.isActive,
        assignedBy: shopRoleAssignments.assignedBy,
        userName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username}, 'Unknown')`,
        userEmail: users.email,
        userPhone: users.phone,
        userProfileImage: users.profileImageUrl,
      })
      .from(shopRoleAssignments)
      .innerJoin(users, eq(shopRoleAssignments.userId, users.id))
      .where(
        and(
          eq(shopRoleAssignments.salonId, salonId),
          eq(shopRoleAssignments.isActive, 1)
        )
      );

    const result: ShopAdminListItem[] = [];

    for (const assignment of assignments) {
      let assignedByName: string | null = null;
      
      if (assignment.assignedBy) {
        const assigner = await db.query.users.findFirst({
          where: eq(users.id, assignment.assignedBy),
        });
        if (assigner) {
          assignedByName = `${assigner.firstName || ''} ${assigner.lastName || ''}`.trim() || assigner.username || 'Unknown';
        }
      }

      result.push({
        userId: assignment.userId,
        userName: assignment.userName,
        userEmail: assignment.userEmail,
        userPhone: assignment.userPhone,
        userProfileImage: assignment.userProfileImage,
        role: assignment.role as 'shop_admin' | 'staff',
        assignedAt: assignment.assignedAt?.toISOString() || new Date().toISOString(),
        assignedByName,
        isActive: assignment.isActive === 1,
      });
    }

    return result;
  }

  async getSalonsForUser(userId: string): Promise<{ salonId: string; salonName: string; role: ShopRoleType }[]> {
    const ownedSalons = await db
      .select({
        salonId: salons.id,
        salonName: salons.name,
      })
      .from(salons)
      .where(eq(salons.ownerId, userId));

    const assignedSalons = await db
      .select({
        salonId: shopRoleAssignments.salonId,
        role: shopRoleAssignments.role,
        salonName: salons.name,
      })
      .from(shopRoleAssignments)
      .innerJoin(salons, eq(shopRoleAssignments.salonId, salons.id))
      .where(
        and(
          eq(shopRoleAssignments.userId, userId),
          eq(shopRoleAssignments.isActive, 1)
        )
      );

    const result: { salonId: string; salonName: string; role: ShopRoleType }[] = [];

    for (const salon of ownedSalons) {
      result.push({
        salonId: salon.salonId,
        salonName: salon.salonName,
        role: 'business_owner',
      });
    }

    for (const assignment of assignedSalons) {
      if (!result.some(r => r.salonId === assignment.salonId)) {
        result.push({
          salonId: assignment.salonId,
          salonName: assignment.salonName,
          role: assignment.role as ShopRoleType,
        });
      }
    }

    return result;
  }

  async getAllPermissions(): Promise<typeof permissions.$inferSelect[]> {
    return db.select().from(permissions).where(eq(permissions.isActive, 1));
  }

  async getRolePermissions(role: ShopRoleType): Promise<string[]> {
    const perms = await db
      .select({ code: permissions.code })
      .from(shopRolePermissions)
      .innerJoin(permissions, eq(shopRolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(shopRolePermissions.role, role),
          eq(permissions.isActive, 1)
        )
      );

    return perms.map(p => p.code);
  }

  private async logAction(
    userId: string,
    salonId: string | null,
    action: string,
    targetUserId: string | null,
    previousValue: any,
    newValue: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await db.insert(adminAuditLogs).values({
      userId,
      salonId,
      action,
      targetUserId,
      previousValue,
      newValue,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Public method to log privileged actions for audit trail
   * Use this for logging booking changes, staff edits, service modifications, etc.
   */
  async logPrivilegedAction(params: {
    userId: string;
    salonId: string;
    action: string;
    targetUserId?: string;
    resourceType?: string;
    resourceId?: string;
    previousValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const { 
      userId, 
      salonId, 
      action, 
      targetUserId, 
      resourceType,
      resourceId,
      previousValue, 
      newValue, 
      ipAddress, 
      userAgent 
    } = params;

    // Enrich the log with resource information
    const enrichedPreviousValue = previousValue ? {
      ...previousValue,
      _resourceType: resourceType,
      _resourceId: resourceId,
    } : resourceType ? { _resourceType: resourceType, _resourceId: resourceId } : null;

    await db.insert(adminAuditLogs).values({
      userId,
      salonId,
      action,
      targetUserId: targetUserId || null,
      previousValue: enrichedPreviousValue,
      newValue,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log common privileged actions with standard formats
   */
  async logBookingAction(
    userId: string,
    salonId: string,
    bookingId: string,
    action: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'booking_rescheduled',
    previousData?: any,
    newData?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logPrivilegedAction({
      userId,
      salonId,
      action,
      resourceType: 'booking',
      resourceId: bookingId,
      previousValue: previousData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logServiceAction(
    userId: string,
    salonId: string,
    serviceId: string,
    action: 'service_created' | 'service_updated' | 'service_deleted',
    previousData?: any,
    newData?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logPrivilegedAction({
      userId,
      salonId,
      action,
      resourceType: 'service',
      resourceId: serviceId,
      previousValue: previousData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logStaffAction(
    userId: string,
    salonId: string,
    staffId: string,
    action: 'staff_created' | 'staff_updated' | 'staff_deleted',
    previousData?: any,
    newData?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logPrivilegedAction({
      userId,
      salonId,
      action,
      resourceType: 'staff',
      resourceId: staffId,
      previousValue: previousData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async logSettingsAction(
    userId: string,
    salonId: string,
    settingType: string,
    action: 'settings_updated',
    previousData?: any,
    newData?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logPrivilegedAction({
      userId,
      salonId,
      action,
      resourceType: 'settings',
      resourceId: settingType,
      previousValue: previousData,
      newValue: newData,
      ipAddress,
      userAgent,
    });
  }

  async getAuditLogs(
    salonId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<typeof adminAuditLogs.$inferSelect[]> {
    return db
      .select()
      .from(adminAuditLogs)
      .where(eq(adminAuditLogs.salonId, salonId))
      .orderBy(sql`${adminAuditLogs.createdAt} DESC`)
      .limit(limit)
      .offset(offset);
  }
}

export const rbacService = new RBACService();
