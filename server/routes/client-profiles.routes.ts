import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  clientProfiles, 
  clientNotes, 
  clientFormulas, 
  clientPhotos,
  profileVisibilitySettings,
  users,
  salons,
  staff,
  bookings,
  services
} from '@shared/schema';
import { eq, and, desc, asc, sql, inArray, like, or } from 'drizzle-orm';
import { z } from 'zod';
import multer from 'multer';
import { tempImageStorage } from '../services/tempImageStorage';
import { requireSalonAccess, requireStaffAccess, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

const isManagerOrOwner = (staffRoles: string[] | null): boolean => {
  if (!staffRoles) return false;
  return staffRoles.some(r => r.toLowerCase().includes('manager') || r.toLowerCase().includes('owner'));
};

const createClientProfileSchema = z.object({
  customerId: z.string(),
  hairType: z.string().optional(),
  hairCondition: z.string().optional(),
  hairLength: z.string().optional(),
  hairDensity: z.string().optional(),
  scalpCondition: z.string().optional(),
  skinType: z.string().optional(),
  skinConcerns: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  sensitivities: z.array(z.string()).optional(),
  contraindications: z.string().optional(),
  preferredStylistId: z.string().optional(),
  communicationStyle: z.string().optional(),
  beveragePreference: z.string().optional(),
  musicPreference: z.string().optional(),
  specialRequirements: z.string().optional(),
  preferredProducts: z.array(z.string()).optional(),
  dislikedProducts: z.array(z.string()).optional(),
  isVip: z.number().optional(),
  vipNotes: z.string().optional(),
});

const updateClientProfileSchema = createClientProfileSchema.partial();

const createClientNoteSchema = z.object({
  bookingId: z.string().optional(),
  serviceId: z.string().optional(),
  noteType: z.enum(['general', 'appointment', 'formula', 'complaint', 'compliment']).optional().default('general'),
  title: z.string().max(200).optional(),
  content: z.string().min(1),
  isPinned: z.number().optional(),
  isAlertNote: z.number().optional(),
  isVisibleToCustomer: z.number().optional(),
});

const createClientFormulaSchema = z.object({
  bookingId: z.string().optional(),
  formulaType: z.enum(['hair_color', 'highlights', 'treatment', 'perm', 'relaxer', 'other']),
  formulaName: z.string().min(1).max(200),
  baseColor: z.string().optional(),
  targetColor: z.string().optional(),
  developer: z.string().optional(),
  mixingRatio: z.string().optional(),
  processingTime: z.number().optional(),
  heatUsed: z.number().optional(),
  products: z.array(z.object({
    brand: z.string().optional(),
    name: z.string().optional(),
    shade: z.string().optional(),
    amount: z.string().optional(),
  })).optional(),
  applicationTechnique: z.string().optional(),
  sectioning: z.string().optional(),
  specialInstructions: z.string().optional(),
  resultNotes: z.string().optional(),
  resultRating: z.number().min(1).max(5).optional(),
  isActiveFormula: z.number().optional(),
  isCustomerFavorite: z.number().optional(),
});

const updateVisibilitySettingsSchema = z.object({
  visibilityMode: z.enum(['all', 'preferences_only', 'none', 'custom']).optional(),
  showHairProfile: z.number().optional(),
  showSkinProfile: z.number().optional(),
  showAllergies: z.number().optional(),
  showPreferences: z.number().optional(),
  showPhotos: z.number().optional(),
  showNotes: z.number().optional(),
  showFormulas: z.number().optional(),
  showVisitHistory: z.number().optional(),
  showProfileOnBooking: z.number().optional(),
  highlightAllergies: z.number().optional(),
  highlightVip: z.number().optional(),
});

router.get('/:salonId/clients', requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { search, page = '1', limit = '20', sortBy = 'lastVisitDate', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let whereCondition = eq(clientProfiles.salonId, salonId);

    const profiles = await db.query.clientProfiles.findMany({
      where: whereCondition,
      with: {
        customer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImageUrl: true,
          }
        },
        preferredStylist: {
          columns: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: sortOrder === 'asc' 
        ? asc(clientProfiles[sortBy as keyof typeof clientProfiles] || clientProfiles.lastVisitDate)
        : desc(clientProfiles[sortBy as keyof typeof clientProfiles] || clientProfiles.lastVisitDate),
      limit: limitNum,
      offset,
    });

    let filteredProfiles = profiles;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredProfiles = profiles.filter(p => 
        p.customer?.firstName?.toLowerCase().includes(searchLower) ||
        p.customer?.lastName?.toLowerCase().includes(searchLower) ||
        p.customer?.email?.toLowerCase().includes(searchLower) ||
        p.customer?.phone?.includes(search as string)
      );
    }

    const totalCount = await db.select({ count: sql<number>`count(*)` })
      .from(clientProfiles)
      .where(eq(clientProfiles.salonId, salonId));

    res.json({
      profiles: filteredProfiles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching client profiles:', error);
    res.status(500).json({ error: 'Failed to fetch client profiles' });
  }
});

router.get('/:salonId/clients/:customerId', requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, customerId } = req.params;

    const profile = await db.query.clientProfiles.findFirst({
      where: and(
        eq(clientProfiles.salonId, salonId),
        eq(clientProfiles.customerId, customerId)
      ),
      with: {
        customer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImageUrl: true,
          }
        },
        preferredStylist: {
          columns: {
            id: true,
            name: true,
          }
        },
        notes: {
          orderBy: [desc(clientNotes.isPinned), desc(clientNotes.createdAt)],
          limit: 50,
        },
        formulas: {
          orderBy: [desc(clientFormulas.isActiveFormula), desc(clientFormulas.createdAt)],
          limit: 20,
        },
        photos: {
          orderBy: desc(clientPhotos.createdAt),
          limit: 50,
        }
      }
    });

    if (!profile) {
      const customer = await db.query.users.findFirst({
        where: eq(users.id, customerId),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImageUrl: true,
        }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      return res.json({
        profile: null,
        customer,
        notes: [],
        formulas: [],
        photos: [],
        isNew: true
      });
    }

    res.json({
      profile,
      customer: profile.customer,
      notes: profile.notes,
      formulas: profile.formulas,
      photos: profile.photos,
      isNew: false
    });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    res.status(500).json({ error: 'Failed to fetch client profile' });
  }
});

router.post('/:salonId/clients', requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    const validation = createClientProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const existingProfile = await db.query.clientProfiles.findFirst({
      where: and(
        eq(clientProfiles.salonId, salonId),
        eq(clientProfiles.customerId, validation.data.customerId)
      )
    });

    if (existingProfile) {
      return res.status(400).json({ error: 'Client profile already exists for this customer' });
    }

    const customer = await db.query.users.findFirst({
      where: eq(users.id, validation.data.customerId)
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [profile] = await db.insert(clientProfiles).values({
      salonId,
      ...validation.data,
      createdBy: userId,
      updatedBy: userId,
    }).returning();

    res.status(201).json({ profile });
  } catch (error) {
    console.error('Error creating client profile:', error);
    res.status(500).json({ error: 'Failed to create client profile' });
  }
});

router.put('/:salonId/clients/:profileId', requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, profileId } = req.params;
    const userId = req.user?.id;

    const validation = updateClientProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const existingProfile = await db.query.clientProfiles.findFirst({
      where: and(
        eq(clientProfiles.id, profileId),
        eq(clientProfiles.salonId, salonId)
      )
    });

    if (!existingProfile) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const [updatedProfile] = await db.update(clientProfiles)
      .set({
        ...validation.data,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(clientProfiles.id, profileId))
      .returning();

    res.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating client profile:', error);
    res.status(500).json({ error: 'Failed to update client profile' });
  }
});

router.post('/:salonId/clients/:profileId/notes', requireStaffAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, profileId } = req.params;
    const userId = req.user?.id;

    const validation = createClientNoteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const profile = await db.query.clientProfiles.findFirst({
      where: and(
        eq(clientProfiles.id, profileId),
        eq(clientProfiles.salonId, salonId)
      )
    });

    if (!profile) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const staffMember = await db.query.staff.findFirst({
      where: and(
        eq(staff.salonId, salonId),
        eq(staff.userId, userId!)
      )
    });

    const [note] = await db.insert(clientNotes).values({
      clientProfileId: profileId,
      authorId: userId!,
      authorStaffId: staffMember?.id,
      ...validation.data,
    }).returning();

    res.status(201).json({ note });
  } catch (error) {
    console.error('Error creating client note:', error);
    res.status(500).json({ error: 'Failed to create client note' });
  }
});

router.put('/:salonId/clients/:profileId/notes/:noteId', requireStaffAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, profileId, noteId } = req.params;
    const userId = req.user?.id;

    const validation = createClientNoteSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const note = await db.query.clientNotes.findFirst({
      where: and(
        eq(clientNotes.id, noteId),
        eq(clientNotes.clientProfileId, profileId)
      ),
      with: {
        clientProfile: true
      }
    });

    if (!note || note.clientProfile.salonId !== salonId) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const staffMember = await db.query.staff.findFirst({
      where: and(
        eq(staff.salonId, salonId),
        eq(staff.userId, userId!)
      )
    });

    const isAuthorOrManager = note.authorId === userId || isManagerOrOwner(staffMember?.roles ?? null);

    if (!isAuthorOrManager) {
      return res.status(403).json({ error: 'Only the author or manager can edit this note' });
    }

    const [updatedNote] = await db.update(clientNotes)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(clientNotes.id, noteId))
      .returning();

    res.json({ note: updatedNote });
  } catch (error) {
    console.error('Error updating client note:', error);
    res.status(500).json({ error: 'Failed to update client note' });
  }
});

router.delete('/:salonId/clients/:profileId/notes/:noteId', requireStaffAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, profileId, noteId } = req.params;
    const userId = req.user?.id;

    const note = await db.query.clientNotes.findFirst({
      where: and(
        eq(clientNotes.id, noteId),
        eq(clientNotes.clientProfileId, profileId)
      ),
      with: {
        clientProfile: true
      }
    });

    if (!note || note.clientProfile.salonId !== salonId) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const staffMember = await db.query.staff.findFirst({
      where: and(
        eq(staff.salonId, salonId),
        eq(staff.userId, userId!)
      )
    });

    const isManager = isManagerOrOwner(staffMember?.roles ?? null);

    if (!isManager) {
      return res.status(403).json({ error: 'Only manager or owner can delete notes' });
    }

    await db.delete(clientNotes).where(eq(clientNotes.id, noteId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting client note:', error);
    res.status(500).json({ error: 'Failed to delete client note' });
  }
});

router.post('/:salonId/clients/:profileId/formulas', requireStaffAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, profileId } = req.params;
    const userId = req.user?.id;

    const validation = createClientFormulaSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const profile = await db.query.clientProfiles.findFirst({
      where: and(
        eq(clientProfiles.id, profileId),
        eq(clientProfiles.salonId, salonId)
      )
    });

    if (!profile) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const [formula] = await db.insert(clientFormulas).values({
      clientProfileId: profileId,
      createdBy: userId!,
      updatedBy: userId,
      ...validation.data,
    }).returning();

    res.status(201).json({ formula });
  } catch (error) {
    console.error('Error creating client formula:', error);
    res.status(500).json({ error: 'Failed to create client formula' });
  }
});

router.put('/:salonId/clients/:profileId/formulas/:formulaId', requireStaffAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, profileId, formulaId } = req.params;
    const userId = req.user?.id;

    const validation = createClientFormulaSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const formula = await db.query.clientFormulas.findFirst({
      where: and(
        eq(clientFormulas.id, formulaId),
        eq(clientFormulas.clientProfileId, profileId)
      ),
      with: {
        clientProfile: true
      }
    });

    if (!formula || formula.clientProfile.salonId !== salonId) {
      return res.status(404).json({ error: 'Formula not found' });
    }

    const staffMember = await db.query.staff.findFirst({
      where: and(
        eq(staff.salonId, salonId),
        eq(staff.userId, userId!)
      )
    });

    const isAuthorOrManager = formula.createdBy === userId || isManagerOrOwner(staffMember?.roles ?? null);

    if (!isAuthorOrManager) {
      return res.status(403).json({ error: 'Only the author or manager can edit this formula' });
    }

    const [updatedFormula] = await db.update(clientFormulas)
      .set({
        ...validation.data,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(clientFormulas.id, formulaId))
      .returning();

    res.json({ formula: updatedFormula });
  } catch (error) {
    console.error('Error updating client formula:', error);
    res.status(500).json({ error: 'Failed to update client formula' });
  }
});

router.delete('/:salonId/clients/:profileId/formulas/:formulaId', requireStaffAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, profileId, formulaId } = req.params;
    const userId = req.user?.id;

    const formula = await db.query.clientFormulas.findFirst({
      where: and(
        eq(clientFormulas.id, formulaId),
        eq(clientFormulas.clientProfileId, profileId)
      ),
      with: {
        clientProfile: true
      }
    });

    if (!formula || formula.clientProfile.salonId !== salonId) {
      return res.status(404).json({ error: 'Formula not found' });
    }

    const staffMember = await db.query.staff.findFirst({
      where: and(
        eq(staff.salonId, salonId),
        eq(staff.userId, userId!)
      )
    });

    const isManager = isManagerOrOwner(staffMember?.roles ?? null);

    if (!isManager) {
      return res.status(403).json({ error: 'Only manager or owner can delete formulas' });
    }

    await db.delete(clientFormulas).where(eq(clientFormulas.id, formulaId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting client formula:', error);
    res.status(500).json({ error: 'Failed to delete client formula' });
  }
});

router.post('/:salonId/clients/:profileId/photos', requireStaffAccess, upload.single('photo'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, profileId } = req.params;
    const userId = req.user?.id;
    const { photoType, caption, serviceType, bookingId, formulaId, isVisibleToCustomer, isPortfolioPhoto, consentGiven } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    const profile = await db.query.clientProfiles.findFirst({
      where: and(
        eq(clientProfiles.id, profileId),
        eq(clientProfiles.salonId, salonId)
      )
    });

    if (!profile) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const { publicUrl: photoUrl } = tempImageStorage.uploadImage(req.file.buffer, req.file.mimetype);

    const [photo] = await db.insert(clientPhotos).values({
      clientProfileId: profileId,
      photoType: photoType || 'after',
      photoUrl,
      caption,
      serviceType,
      bookingId: bookingId || null,
      formulaId: formulaId || null,
      isVisibleToCustomer: parseInt(isVisibleToCustomer) || 1,
      isPortfolioPhoto: parseInt(isPortfolioPhoto) || 0,
      consentGiven: parseInt(consentGiven) || 0,
      uploadedBy: userId!,
      takenAt: new Date(),
    }).returning();

    res.status(201).json({ photo });
  } catch (error) {
    console.error('Error uploading client photo:', error);
    res.status(500).json({ error: 'Failed to upload client photo' });
  }
});

router.delete('/:salonId/clients/:profileId/photos/:photoId', requireStaffAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, profileId, photoId } = req.params;
    const userId = req.user?.id;

    const photo = await db.query.clientPhotos.findFirst({
      where: and(
        eq(clientPhotos.id, photoId),
        eq(clientPhotos.clientProfileId, profileId)
      ),
      with: {
        clientProfile: true
      }
    });

    if (!photo || photo.clientProfile.salonId !== salonId) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const staffMember = await db.query.staff.findFirst({
      where: and(
        eq(staff.salonId, salonId),
        eq(staff.userId, userId!)
      )
    });

    const isUploaderOrManager = photo.uploadedBy === userId || isManagerOrOwner(staffMember?.roles ?? null);

    if (!isUploaderOrManager) {
      return res.status(403).json({ error: 'Only the uploader or manager can delete this photo' });
    }

    await db.delete(clientPhotos).where(eq(clientPhotos.id, photoId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting client photo:', error);
    res.status(500).json({ error: 'Failed to delete client photo' });
  }
});

router.get('/:salonId/visibility-settings', requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    let settings = await db.query.profileVisibilitySettings.findFirst({
      where: eq(profileVisibilitySettings.salonId, salonId)
    });

    if (!settings) {
      const [newSettings] = await db.insert(profileVisibilitySettings).values({
        salonId,
      }).returning();
      settings = newSettings;
    }

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching visibility settings:', error);
    res.status(500).json({ error: 'Failed to fetch visibility settings' });
  }
});

router.put('/:salonId/visibility-settings', requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    const validation = updateVisibilitySettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    let settings = await db.query.profileVisibilitySettings.findFirst({
      where: eq(profileVisibilitySettings.salonId, salonId)
    });

    if (!settings) {
      const [newSettings] = await db.insert(profileVisibilitySettings).values({
        salonId,
        ...validation.data,
        updatedBy: userId,
      }).returning();
      return res.json({ settings: newSettings });
    }

    const [updatedSettings] = await db.update(profileVisibilitySettings)
      .set({
        ...validation.data,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(profileVisibilitySettings.salonId, salonId))
      .returning();

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Error updating visibility settings:', error);
    res.status(500).json({ error: 'Failed to update visibility settings' });
  }
});

router.get('/:salonId/clients/:customerId/booking-popup', requireStaffAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, customerId } = req.params;

    const settings = await db.query.profileVisibilitySettings.findFirst({
      where: eq(profileVisibilitySettings.salonId, salonId)
    });

    if (!settings?.showProfileOnBooking) {
      return res.json({ showPopup: false });
    }

    const profile = await db.query.clientProfiles.findFirst({
      where: and(
        eq(clientProfiles.salonId, salonId),
        eq(clientProfiles.customerId, customerId)
      ),
      with: {
        customer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          }
        },
        preferredStylist: {
          columns: {
            id: true,
            name: true,
          }
        },
        notes: {
          where: eq(clientNotes.isAlertNote, 1),
          orderBy: desc(clientNotes.createdAt),
          limit: 5,
        }
      }
    });

    if (!profile) {
      return res.json({ 
        showPopup: false,
        isNewClient: true 
      });
    }

    const recentNotes = await db.query.clientNotes.findMany({
      where: eq(clientNotes.clientProfileId, profile.id),
      orderBy: desc(clientNotes.createdAt),
      limit: 3,
    });

    res.json({
      showPopup: true,
      profile: {
        id: profile.id,
        customerName: `${profile.customer?.firstName || ''} ${profile.customer?.lastName || ''}`.trim(),
        customerImage: profile.customer?.profileImageUrl,
        isVip: profile.isVip === 1,
        allergies: profile.allergies || [],
        sensitivities: profile.sensitivities || [],
        specialRequirements: profile.specialRequirements,
        preferredStylist: profile.preferredStylist?.fullName,
        totalVisits: profile.totalVisits,
        lastVisitDate: profile.lastVisitDate,
      },
      alertNotes: profile.notes,
      recentNotes,
      highlightAllergies: settings.highlightAllergies === 1,
      highlightVip: settings.highlightVip === 1,
    });
  } catch (error) {
    console.error('Error fetching booking popup data:', error);
    res.status(500).json({ error: 'Failed to fetch booking popup data' });
  }
});

router.get('/:salonId/clients/search', requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
      return res.json({ customers: [] });
    }

    const searchTerm = `%${q}%`;

    const customers = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      profileImageUrl: users.profileImageUrl,
    })
    .from(users)
    .where(
      or(
        sql`LOWER(${users.firstName}) LIKE LOWER(${searchTerm})`,
        sql`LOWER(${users.lastName}) LIKE LOWER(${searchTerm})`,
        sql`LOWER(${users.email}) LIKE LOWER(${searchTerm})`,
        sql`${users.phone} LIKE ${searchTerm}`
      )
    )
    .limit(10);

    const customerIds = customers.map(c => c.id);
    
    let existingProfiles: { customerId: string }[] = [];
    if (customerIds.length > 0) {
      existingProfiles = await db.select({ customerId: clientProfiles.customerId })
        .from(clientProfiles)
        .where(and(
          eq(clientProfiles.salonId, salonId),
          inArray(clientProfiles.customerId, customerIds)
        ));
    }

    const existingCustomerIds = new Set(existingProfiles.map(p => p.customerId));

    const customersWithStatus = customers.map(c => ({
      ...c,
      hasProfile: existingCustomerIds.has(c.id)
    }));

    res.json({ customers: customersWithStatus });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

router.get('/my-beauty-profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const profiles = await db.query.clientProfiles.findMany({
      where: eq(clientProfiles.customerId, userId),
      with: {
        salon: {
          columns: {
            id: true,
            name: true,
            imageUrl: true,
          }
        },
        preferredStylist: {
          columns: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!profiles || profiles.length === 0) {
      return res.json({ 
        profiles: [],
        hasProfiles: false,
        message: 'No beauty profile found. Your profile will be created when you book an appointment at a salon.'
      });
    }

    const profilesWithVisibleData = await Promise.all(profiles.map(async (profile) => {
      const settings = await db.query.profileVisibilitySettings.findFirst({
        where: eq(profileVisibilitySettings.salonId, profile.salonId)
      });

      const visibilityDefaults = {
        showHairProfile: 1,
        showSkinProfile: 1,
        showAllergies: 1,
        showPreferences: 1,
        showPhotos: 0,
        showNotes: 0,
        showFormulas: 0,
        showVisitHistory: 1,
      };

      const visibility = settings || visibilityDefaults;

      let visibleNotes: any[] = [];
      if (visibility.showNotes) {
        visibleNotes = await db.query.clientNotes.findMany({
          where: and(
            eq(clientNotes.clientProfileId, profile.id),
            eq(clientNotes.isVisibleToCustomer, 1)
          ),
          orderBy: desc(clientNotes.createdAt),
          limit: 10,
        });
      }

      let visiblePhotos: any[] = [];
      if (visibility.showPhotos) {
        visiblePhotos = await db.query.clientPhotos.findMany({
          where: and(
            eq(clientPhotos.clientProfileId, profile.id),
            eq(clientPhotos.isVisibleToCustomer, 1)
          ),
          orderBy: desc(clientPhotos.createdAt),
          limit: 20,
        });
      }

      let visibleFormulas: any[] = [];
      if (visibility.showFormulas) {
        visibleFormulas = await db.query.clientFormulas.findMany({
          where: and(
            eq(clientFormulas.clientProfileId, profile.id),
            eq(clientFormulas.isCustomerFavorite, 1)
          ),
          orderBy: desc(clientFormulas.createdAt),
          limit: 10,
        });
      }

      return {
        id: profile.id,
        salonId: profile.salonId,
        salon: profile.salon,
        isVip: profile.isVip === 1,
        hairProfile: visibility.showHairProfile ? {
          hairType: profile.hairType,
          hairCondition: profile.hairCondition,
          hairLength: profile.hairLength,
          hairDensity: profile.hairDensity,
          scalpCondition: profile.scalpCondition,
        } : null,
        skinProfile: visibility.showSkinProfile ? {
          skinType: profile.skinType,
          skinConcerns: profile.skinConcerns,
        } : null,
        allergies: visibility.showAllergies ? profile.allergies : null,
        sensitivities: visibility.showAllergies ? profile.sensitivities : null,
        preferences: visibility.showPreferences ? {
          preferredStylist: profile.preferredStylist?.name,
          preferredStylistId: profile.preferredStylistId,
          communicationStyle: profile.communicationStyle,
          beveragePreference: profile.beveragePreference,
          musicPreference: profile.musicPreference,
          specialRequirements: profile.specialRequirements,
          preferredProducts: profile.preferredProducts,
          dislikedProducts: profile.dislikedProducts,
        } : null,
        visitStats: visibility.showVisitHistory ? {
          totalVisits: profile.totalVisits,
          lastVisitDate: profile.lastVisitDate,
          totalSpentPaisa: profile.totalSpentPaisa,
        } : null,
        notes: visibleNotes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          noteType: note.noteType,
          createdAt: note.createdAt,
        })),
        photos: visiblePhotos.map(photo => ({
          id: photo.id,
          photoUrl: photo.photoUrl,
          thumbnailUrl: photo.thumbnailUrl,
          caption: photo.caption,
          photoType: photo.photoType,
          serviceType: photo.serviceType,
          takenAt: photo.takenAt,
        })),
        formulas: visibleFormulas.map(formula => ({
          id: formula.id,
          formulaName: formula.formulaName,
          formulaType: formula.formulaType,
          targetColor: formula.targetColor,
          resultNotes: formula.resultNotes,
          resultRating: formula.resultRating,
        })),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };
    }));

    const aggregatedProfile = {
      hairTypes: [...new Set(profilesWithVisibleData.filter(p => p.hairProfile?.hairType).map(p => p.hairProfile?.hairType))],
      skinTypes: [...new Set(profilesWithVisibleData.filter(p => p.skinProfile?.skinType).map(p => p.skinProfile?.skinType))],
      allAllergies: [...new Set(profilesWithVisibleData.flatMap(p => p.allergies || []))],
      allSensitivities: [...new Set(profilesWithVisibleData.flatMap(p => p.sensitivities || []))],
      totalVisitsAcrossSalons: profilesWithVisibleData.reduce((sum, p) => sum + (p.visitStats?.totalVisits || 0), 0),
      isVipAnywhere: profilesWithVisibleData.some(p => p.isVip),
    };

    res.json({ 
      profiles: profilesWithVisibleData,
      aggregated: aggregatedProfile,
      hasProfiles: true,
      salonCount: profiles.length
    });
  } catch (error) {
    console.error('Error fetching customer beauty profile:', error);
    res.status(500).json({ error: 'Failed to fetch beauty profile' });
  }
});

export default router;
