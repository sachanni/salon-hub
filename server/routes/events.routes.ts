import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { 
  events, eventTypes, eventSpeakers, eventSchedules, eventTicketTypes,
  eventGroupDiscounts, eventPromoCodes, eventRegistrations, eventRegistrationPayments,
  eventReviews, eventNotifications, eventNotificationPreferences, eventAnalyticsDaily, eventViews,
  salons, users,
  createEventSchema, updateEventSchema, createTicketTypeSchema, eventRegistrationSchema,
  eventReviewSchema, cancelRegistrationSchema
} from '@shared/schema';
import { eq, and, desc, asc, sql, gte, lte, like, inArray, count, or } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { populateUserFromSession } from '../middleware/auth';
import Razorpay from 'razorpay';

declare global {
  namespace Express {
    interface Request {
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
  }
}

function requireAuthenticatedUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

const router = Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

async function verifyEventOwnership(userId: string, eventId: string): Promise<boolean> {
  const event = await db.select({ salonId: events.salonId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  
  if (!event.length) return false;
  
  const salon = await db.select({ id: salons.id })
    .from(salons)
    .where(and(eq(salons.id, event[0].salonId), eq(salons.ownerId, userId)))
    .limit(1);
  
  return salon.length > 0;
}

function signQRCode(registrationId: string, eventId: string, attendeeEmail: string): string {
  const data = JSON.stringify({ 
    registrationId, 
    eventId, 
    attendeeEmail,
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex')
  });
  const signature = crypto
    .createHmac('sha256', process.env.QR_SIGNING_SECRET || 'default-qr-secret-CHANGE-IN-PRODUCTION')
    .update(data)
    .digest('hex');
  return Buffer.from(`${data}.${signature}`).toString('base64');
}

function verifyQRCode(qrCode: string): { 
  valid: boolean; 
  data?: { 
    registrationId: string; 
    eventId: string; 
    attendeeEmail: string;
    issuedAt: number;
    nonce: string;
  };
  error?: string;
} {
  try {
    const decoded = Buffer.from(qrCode, 'base64').toString('utf8');
    const [dataStr, providedSignature] = decoded.split('.');
    
    if (!dataStr || !providedSignature) {
      return { valid: false, error: 'Invalid QR code format' };
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.QR_SIGNING_SECRET || 'default-qr-secret-CHANGE-IN-PRODUCTION')
      .update(dataStr)
      .digest('hex');

    if (expectedSignature !== providedSignature) {
      return { valid: false, error: 'QR code signature verification failed' };
    }

    const data = JSON.parse(dataStr);
    
    // Validate required fields exist
    if (!data.registrationId || !data.eventId || !data.attendeeEmail || typeof data.issuedAt !== 'number' || !data.nonce) {
      return { valid: false, error: 'QR code payload is incomplete' };
    }
    
    // Validate timestamp - QR codes expire after 7 days
    const QR_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    const age = Date.now() - data.issuedAt;
    if (age > QR_EXPIRY_MS) {
      return { valid: false, error: 'QR code has expired' };
    }
    if (age < 0) {
      return { valid: false, error: 'QR code timestamp is invalid' };
    }
    
    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: 'QR code parsing failed' };
  }
}

function generateBookingId(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EVT-${year}-${random}`;
}

function generateQRCode(): string {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + 
    '-' + crypto.randomBytes(4).toString('hex');
}

router.get('/types', async (req, res) => {
  try {
    const types = await db.select().from(eventTypes).where(eq(eventTypes.isActive, 1)).orderBy(asc(eventTypes.orderIndex));
    res.json(types);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ message: 'Failed to fetch event types' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const { city, type, search, sort = 'date', page = '1', limit = '12' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 12, 50);
    const offset = (pageNum - 1) * limitNum;

    const whereConditions: any[] = [
      eq(events.status, 'published'),
      eq(events.visibility, 'public'),
      gte(events.startDate, new Date().toISOString().split('T')[0])
    ];

    if (city) {
      whereConditions.push(eq(events.venueCity, city as string));
    }
    if (type) {
      whereConditions.push(eq(events.eventTypeId, type as string));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      whereConditions.push(
        or(
          like(events.title, searchTerm),
          like(events.shortDescription, searchTerm),
          like(events.description, searchTerm)
        )
      );
    }

    let orderByClause: any = asc(events.startDate);
    if (sort === 'popular') {
      orderByClause = desc(events.currentRegistrations);
    }

    let query = db.select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      shortDescription: events.shortDescription,
      startDate: events.startDate,
      endDate: events.endDate,
      startTime: events.startTime,
      endTime: events.endTime,
      venueCity: events.venueCity,
      venueName: events.venueName,
      maxCapacity: events.maxCapacity,
      currentRegistrations: events.currentRegistrations,
      coverImageUrl: events.coverImageUrl,
      isFeatured: events.isFeatured,
      eventTypeId: events.eventTypeId,
      salonId: events.salonId,
    })
    .from(events)
    .where(and(...whereConditions))
    .orderBy(orderByClause)
    .limit(limitNum)
    .offset(offset);

    const eventList = await query;

    const eventIds = eventList.map(e => e.id);
    let ticketPrices: { eventId: string; minPrice: number | null }[] = [];
    if (eventIds.length > 0) {
      const ticketData = await db.select({
        eventId: eventTicketTypes.eventId,
        minPrice: sql<number>`MIN(${eventTicketTypes.basePricePaisa})`.as('min_price')
      })
      .from(eventTicketTypes)
      .where(and(
        inArray(eventTicketTypes.eventId, eventIds),
        eq(eventTicketTypes.isActive, 1)
      ))
      .groupBy(eventTicketTypes.eventId);
      ticketPrices = ticketData;
    }

    const priceMap = new Map(ticketPrices.map(t => [t.eventId, t.minPrice]));

    const eventsWithPrice = eventList.map(event => ({
      ...event,
      startingPricePaisa: priceMap.get(event.id) || 0,
      spotsLeft: event.maxCapacity - (event.currentRegistrations || 0)
    }));

    const totalResult = await db.select({ count: count() }).from(events).where(and(...whereConditions));
    const total = totalResult[0]?.count || 0;

    res.json({
      events: eventsWithPrice,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Public endpoint to fetch tickets for event registration
router.get('/:idOrSlug/tickets', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Find event by ID or slug
    const event = await db.select()
      .from(events)
      .where(and(
        sql`(${events.id} = ${idOrSlug} OR ${events.slug} = ${idOrSlug})`,
        eq(events.status, 'published')
      ))
      .limit(1);

    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventId = event[0].id;

    // Fetch active tickets for this event
    const tickets = await db.select({
      id: eventTicketTypes.id,
      name: eventTicketTypes.name,
      description: eventTicketTypes.description,
      price: eventTicketTypes.basePricePaisa,
      quantity: eventTicketTypes.quantityAvailable,
      quantitySold: eventTicketTypes.quantitySold,
      discountPercentage: eventTicketTypes.discountPercentage,
      discountLabel: eventTicketTypes.discountLabel,
      includes: eventTicketTypes.includes,
    })
      .from(eventTicketTypes)
      .where(and(
        eq(eventTicketTypes.eventId, eventId),
        eq(eventTicketTypes.isActive, 1)
      ))
      .orderBy(asc(eventTicketTypes.orderIndex));

    // Calculate available quantity for each ticket
    const ticketsWithAvailability = tickets.map(ticket => ({
      ...ticket,
      price: ticket.price / 100, // Convert paisa to rupees for frontend
      quantityAvailable: ticket.quantity ? ticket.quantity - (ticket.quantitySold || 0) : 999999,
      maxPerUser: 10 // Default limit per user
    }));

    res.json(ticketsWithAvailability);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

router.get('/public/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    const event = await db.select()
      .from(events)
      .where(and(
        sql`(${events.id} = ${idOrSlug} OR ${events.slug} = ${idOrSlug})`,
        eq(events.status, 'published')
      ))
      .limit(1);

    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventData = event[0];

    const [speakers, schedules, tickets, reviews, salon] = await Promise.all([
      db.select().from(eventSpeakers).where(eq(eventSpeakers.eventId, eventData.id)).orderBy(asc(eventSpeakers.orderIndex)),
      db.select().from(eventSchedules).where(eq(eventSchedules.eventId, eventData.id)).orderBy(asc(eventSchedules.orderIndex)),
      db.select().from(eventTicketTypes).where(and(eq(eventTicketTypes.eventId, eventData.id), eq(eventTicketTypes.isActive, 1))).orderBy(asc(eventTicketTypes.orderIndex)),
      db.select({
        id: eventReviews.id,
        overallRating: eventReviews.overallRating,
        reviewText: eventReviews.reviewText,
        createdAt: eventReviews.createdAt,
        userName: users.firstName
      })
      .from(eventReviews)
      .leftJoin(users, eq(eventReviews.userId, users.id))
      .where(and(eq(eventReviews.eventId, eventData.id), eq(eventReviews.status, 'approved')))
      .limit(10),
      db.select({ id: salons.id, name: salons.name, address: salons.address }).from(salons).where(eq(salons.id, eventData.salonId)).limit(1)
    ]);

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length 
      : 0;

    await db.insert(eventViews).values({
      eventId: eventData.id,
      sessionId: req.headers['x-session-id'] as string || null,
      source: req.query.source as string || 'direct',
      platform: req.headers['x-platform'] as string || 'web',
      referrer: req.headers.referer || null,
      deviceType: req.headers['x-device-type'] as string || 'desktop'
    });

    res.json({
      ...eventData,
      speakers,
      schedules,
      tickets,
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
      salon: salon[0] || null,
      spotsLeft: eventData.maxCapacity - (eventData.currentRegistrations || 0)
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ message: 'Failed to fetch event details' });
  }
});

router.get('/business/dashboard', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const userSalons = await db.select({ id: salons.id }).from(salons).where(eq(salons.ownerId, userId));
    const salonIds = userSalons.map(s => s.id);

    if (salonIds.length === 0) {
      return res.json({
        activeEvents: 0,
        totalRegistrations: 0,
        totalRevenue: 0,
        averageRating: 0,
        upcomingEvents: [],
        draftCount: 0
      });
    }

    const today = new Date().toISOString().split('T')[0];

    const [activeEventsResult, registrationsResult, revenueResult, ratingsResult, upcomingEvents, draftCountResult] = await Promise.all([
      db.select({ count: count() }).from(events).where(and(
        inArray(events.salonId, salonIds),
        eq(events.status, 'published'),
        gte(events.startDate, today)
      )),
      db.select({ total: sql<number>`COALESCE(SUM(1), 0)` }).from(eventRegistrations)
        .innerJoin(events, eq(eventRegistrations.eventId, events.id))
        .where(and(
          inArray(events.salonId, salonIds),
          eq(eventRegistrations.status, 'confirmed')
        )),
      db.select({ total: sql<number>`COALESCE(SUM(${eventRegistrations.totalAmountPaisa}), 0)` }).from(eventRegistrations)
        .innerJoin(events, eq(eventRegistrations.eventId, events.id))
        .where(and(
          inArray(events.salonId, salonIds),
          eq(eventRegistrations.paymentStatus, 'paid')
        )),
      db.select({ avg: sql<number>`COALESCE(AVG(${eventReviews.overallRating}), 0)` }).from(eventReviews)
        .innerJoin(events, eq(eventReviews.eventId, events.id))
        .where(inArray(events.salonId, salonIds)),
      db.select({
        id: events.id,
        title: events.title,
        startDate: events.startDate,
        startTime: events.startTime,
        maxCapacity: events.maxCapacity,
        currentRegistrations: events.currentRegistrations,
        coverImageUrl: events.coverImageUrl
      }).from(events).where(and(
        inArray(events.salonId, salonIds),
        eq(events.status, 'published'),
        gte(events.startDate, today)
      )).orderBy(asc(events.startDate)).limit(5),
      db.select({ count: count() }).from(events).where(and(
        inArray(events.salonId, salonIds),
        eq(events.status, 'draft')
      ))
    ]);

    res.json({
      activeEvents: activeEventsResult[0]?.count || 0,
      totalRegistrations: registrationsResult[0]?.total || 0,
      totalRevenue: revenueResult[0]?.total || 0,
      averageRating: Math.round((ratingsResult[0]?.avg || 0) * 10) / 10,
      upcomingEvents: upcomingEvents.map(e => ({
        ...e,
        spotsLeft: e.maxCapacity - (e.currentRegistrations || 0)
      })),
      draftCount: draftCountResult[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

router.get('/business/list', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { status, salonId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let salonIds: string[] = [];
    if (salonId) {
      salonIds = [salonId as string];
    } else {
      const userSalons = await db.select({ id: salons.id }).from(salons).where(eq(salons.ownerId, userId));
      salonIds = userSalons.map(s => s.id);
    }

    if (salonIds.length === 0) {
      return res.json({ events: [], pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 } });
    }

    let whereConditions = [inArray(events.salonId, salonIds)];
    if (status) {
      whereConditions.push(eq(events.status, status as string));
    }

    const eventList = await db.select().from(events)
      .where(and(...whereConditions))
      .orderBy(desc(events.createdAt))
      .limit(limitNum)
      .offset(offset);

    const totalResult = await db.select({ count: count() }).from(events).where(and(...whereConditions));
    const total = totalResult[0]?.count || 0;

    res.json({
      events: eventList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching business events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

router.get('/business/drafts', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const userSalons = await db.select({ id: salons.id }).from(salons).where(eq(salons.ownerId, userId));
    const salonIds = userSalons.map(s => s.id);

    if (salonIds.length === 0) {
      return res.json({ drafts: [], stats: { total: 0, ready: 0, needsAttention: 0 } });
    }

    const drafts = await db.select().from(events)
      .where(and(inArray(events.salonId, salonIds), eq(events.status, 'draft')))
      .orderBy(desc(events.updatedAt));

    const draftsWithStatus = drafts.map(draft => {
      const missingFields: string[] = [];
      if (!draft.description) missingFields.push('description');
      if (!draft.coverImageUrl) missingFields.push('cover_image');
      
      return {
        ...draft,
        completionStatus: missingFields.length === 0 ? 'ready' : 'incomplete',
        missingFields
      };
    });

    const ready = draftsWithStatus.filter(d => d.completionStatus === 'ready').length;
    const needsAttention = draftsWithStatus.filter(d => d.completionStatus === 'incomplete').length;

    res.json({
      drafts: draftsWithStatus,
      stats: {
        total: drafts.length,
        ready,
        needsAttention
      }
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ message: 'Failed to fetch drafts' });
  }
});

router.get('/business/past', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const userSalons = await db.select({ id: salons.id }).from(salons).where(eq(salons.ownerId, userId));
    const salonIds = userSalons.map(s => s.id);

    if (salonIds.length === 0) {
      return res.json({ events: [], stats: { totalEvents: 0, totalRegistrations: 0, totalRevenue: 0 } });
    }

    const today = new Date().toISOString().split('T')[0];

    const [pastEvents, statsResult] = await Promise.all([
      db.select().from(events)
        .where(and(
          inArray(events.salonId, salonIds),
          lte(events.endDate, today)
        ))
        .orderBy(desc(events.startDate))
        .limit(50),
      db.select({
        count: count(),
        registrations: sql<number>`COALESCE(SUM(${events.currentRegistrations}), 0)`,
      }).from(events)
        .where(and(inArray(events.salonId, salonIds), lte(events.endDate, today)))
    ]);

    res.json({
      events: pastEvents,
      stats: {
        totalEvents: statsResult[0]?.count || 0,
        totalRegistrations: statsResult[0]?.registrations || 0
      }
    });
  } catch (error) {
    console.error('Error fetching past events:', error);
    res.status(500).json({ message: 'Failed to fetch past events' });
  }
});

router.get('/business/:eventId', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { eventId } = req.params;

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventData = event[0];

    const [speakers, schedules, tickets, groupDiscounts, registrations, reviews] = await Promise.all([
      db.select().from(eventSpeakers).where(eq(eventSpeakers.eventId, eventId)).orderBy(asc(eventSpeakers.orderIndex)),
      db.select().from(eventSchedules).where(eq(eventSchedules.eventId, eventId)).orderBy(asc(eventSchedules.orderIndex)),
      db.select().from(eventTicketTypes).where(eq(eventTicketTypes.eventId, eventId)).orderBy(asc(eventTicketTypes.orderIndex)),
      db.select().from(eventGroupDiscounts).where(eq(eventGroupDiscounts.eventId, eventId)),
      db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId)).orderBy(desc(eventRegistrations.createdAt)).limit(100),
      db.select().from(eventReviews).where(eq(eventReviews.eventId, eventId)).orderBy(desc(eventReviews.createdAt)).limit(50)
    ]);

    const confirmedRegistrations = registrations.filter(r => r.status === 'confirmed');
    const totalRevenue = confirmedRegistrations.reduce((sum, r) => sum + r.totalAmountPaisa, 0);
    const checkedInCount = confirmedRegistrations.filter(r => r.checkedInAt).length;

    res.json({
      event: eventData,
      speakers,
      schedules,
      tickets,
      groupDiscounts,
      registrations,
      reviews,
      metrics: {
        totalRegistrations: confirmedRegistrations.length,
        totalRevenue,
        checkedInCount,
        averageRating: reviews.length > 0 
          ? Math.round(reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length * 10) / 10 
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ message: 'Failed to fetch event details' });
  }
});

router.post('/', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const validated = createEventSchema.parse(req.body);

    const salonCheck = await db.select({ id: salons.id, orgId: salons.orgId })
      .from(salons).where(and(eq(salons.id, validated.salonId), eq(salons.ownerId, userId)));
    if (!salonCheck.length) {
      return res.status(403).json({ message: 'Access denied to this salon' });
    }

    const slug = generateSlug(validated.title);

    const [newEvent] = await db.insert(events).values({
      salonId: validated.salonId,
      createdBy: userId,
      organizationId: salonCheck[0].orgId || null,
      title: validated.title,
      description: validated.description,
      shortDescription: validated.shortDescription,
      eventTypeId: validated.eventTypeId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      startTime: validated.startTime,
      endTime: validated.endTime,
      venueType: validated.venueType,
      venueName: validated.venueName,
      venueAddress: validated.venueAddress,
      venueCity: validated.venueCity,
      venueState: validated.venueState,
      venuePincode: validated.venuePincode,
      venueLatitude: validated.venueLatitude?.toString(),
      venueLongitude: validated.venueLongitude?.toString(),
      maxCapacity: validated.maxCapacity,
      minCapacity: validated.minCapacity,
      visibility: validated.visibility,
      coverImageUrl: validated.coverImageUrl,
      cancellationPolicy: validated.cancellationPolicy,
      slug,
      status: 'draft'
    }).returning();

    res.status(201).json(newEvent);
  } catch (error: any) {
    console.error('Error creating event:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create event' });
  }
});

router.put('/:eventId', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { eventId } = req.params;
    const validated = updateEventSchema.parse(req.body);

    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const ownerCheck = await db.select({ id: salons.id }).from(salons)
      .where(and(eq(salons.id, event[0].salonId), eq(salons.ownerId, userId)));
    if (!ownerCheck.length) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData: any = { updatedAt: new Date() };
    if (validated.title) updateData.title = validated.title;
    if (validated.description) updateData.description = validated.description;
    if (validated.shortDescription) updateData.shortDescription = validated.shortDescription;
    if (validated.eventTypeId) updateData.eventTypeId = validated.eventTypeId;
    if (validated.startDate) updateData.startDate = validated.startDate;
    if (validated.endDate) updateData.endDate = validated.endDate;
    if (validated.startTime) updateData.startTime = validated.startTime;
    if (validated.endTime) updateData.endTime = validated.endTime;
    if (validated.venueType) updateData.venueType = validated.venueType;
    if (validated.venueName) updateData.venueName = validated.venueName;
    if (validated.venueAddress) updateData.venueAddress = validated.venueAddress;
    if (validated.venueCity) updateData.venueCity = validated.venueCity;
    if (validated.venueState) updateData.venueState = validated.venueState;
    if (validated.venuePincode) updateData.venuePincode = validated.venuePincode;
    if (validated.venueLatitude) updateData.venueLatitude = validated.venueLatitude.toString();
    if (validated.venueLongitude) updateData.venueLongitude = validated.venueLongitude.toString();
    if (validated.maxCapacity) updateData.maxCapacity = validated.maxCapacity;
    if (validated.minCapacity) updateData.minCapacity = validated.minCapacity;
    if (validated.visibility) updateData.visibility = validated.visibility;
    if (validated.coverImageUrl) updateData.coverImageUrl = validated.coverImageUrl;
    if (validated.galleryImages) updateData.galleryImages = validated.galleryImages;
    if (validated.cancellationPolicy) updateData.cancellationPolicy = validated.cancellationPolicy;

    const [updated] = await db.update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating event:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update event' });
  }
});

router.post('/:eventId/publish', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { eventId } = req.params;

    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const ownerCheck = await db.select({ id: salons.id }).from(salons)
      .where(and(eq(salons.id, event[0].salonId), eq(salons.ownerId, userId)));
    if (!ownerCheck.length) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tickets = await db.select().from(eventTicketTypes).where(eq(eventTicketTypes.eventId, eventId));
    if (tickets.length === 0) {
      return res.status(400).json({ message: 'Cannot publish event without at least one ticket type' });
    }

    const [updated] = await db.update(events)
      .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error publishing event:', error);
    res.status(500).json({ message: 'Failed to publish event' });
  }
});

router.put('/business/:eventId/publish', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { eventId } = req.params;

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tickets = await db.select().from(eventTicketTypes).where(eq(eventTicketTypes.eventId, eventId));
    if (tickets.length === 0) {
      return res.status(400).json({ message: 'Cannot publish event without at least one ticket type' });
    }

    const [updated] = await db.update(events)
      .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error publishing event:', error);
    res.status(500).json({ message: 'Failed to publish event' });
  }
});

router.delete('/:eventId', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { eventId } = req.params;

    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const ownerCheck = await db.select({ id: salons.id }).from(salons)
      .where(and(eq(salons.id, event[0].salonId), eq(salons.ownerId, userId)));
    if (!ownerCheck.length) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const registrations = await db.select({ id: eventRegistrations.id })
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.status, 'confirmed')));
    
    if (registrations.length > 0) {
      return res.status(400).json({ message: 'Cannot delete event with confirmed registrations' });
    }

    await db.update(events).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(events.id, eventId));

    res.json({ message: 'Event cancelled successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

router.post('/:eventId/tickets', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { eventId } = req.params;
    const validated = createTicketTypeSchema.parse({ ...req.body, eventId });

    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const ownerCheck = await db.select({ id: salons.id }).from(salons)
      .where(and(eq(salons.id, event[0].salonId), eq(salons.ownerId, userId)));
    if (!ownerCheck.length) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const ticketData: any = {
      eventId: validated.eventId,
      name: validated.name,
      description: validated.description,
      basePricePaisa: validated.basePricePaisa,
      gstPercentage: validated.gstPercentage,
      discountPercentage: validated.discountPercentage,
      quantityAvailable: validated.quantityAvailable,
      saleStartDate: validated.saleStartDate,
      saleEndDate: validated.saleEndDate,
      includes: validated.includes || [],
      discountLabel: validated.discountLabel
    };
    
    const [newTicket] = await db.insert(eventTicketTypes).values(ticketData).returning();

    res.status(201).json(newTicket);
  } catch (error: any) {
    console.error('Error creating ticket type:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create ticket type' });
  }
});

// Public endpoint - customers can register without logging in
router.post('/:eventId/register', populateUserFromSession, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // Optional - will be null if not logged in
    const { eventId } = req.params;
    const validated = eventRegistrationSchema.parse({ ...req.body, eventId });

    const event = await db.select().from(events).where(and(
      eq(events.id, eventId),
      eq(events.status, 'published')
    )).limit(1);

    if (!event.length) {
      return res.status(404).json({ message: 'Event not found or not available for registration' });
    }

    const eventData = event[0];

    // CRITICAL SECURITY: Count confirmed + pending (non-expired) registrations toward capacity
    // This implements inventory hold mechanism to prevent overselling
    const registrationCounts = await db.select({
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`
    })
    .from(eventRegistrations)
    .where(and(
      eq(eventRegistrations.eventId, eventId),
      sql`(${eventRegistrations.status} = 'confirmed' OR (${eventRegistrations.status} = 'pending' AND (${eventRegistrations.expiresAt} IS NULL OR ${eventRegistrations.expiresAt} > NOW())))`
    ));
    
    const currentOccupancy = registrationCounts[0]?.count || 0;

    if (currentOccupancy >= eventData.maxCapacity) {
      return res.status(400).json({ message: 'Event is fully booked' });
    }

    const ticket = await db.select().from(eventTicketTypes).where(and(
      eq(eventTicketTypes.id, validated.ticketTypeId),
      eq(eventTicketTypes.eventId, eventId),
      eq(eventTicketTypes.isActive, 1)
    )).limit(1);

    if (!ticket.length) {
      return res.status(404).json({ message: 'Ticket type not found' });
    }

    const ticketData = ticket[0];
    let ticketPrice = ticketData.basePricePaisa;
    let discountAmount = 0;
    let promoCodeId = null;

    if (validated.promoCode) {
      const promo = await db.select().from(eventPromoCodes).where(and(
        eq(eventPromoCodes.code, validated.promoCode),
        eq(eventPromoCodes.isActive, 1),
        sql`(${eventPromoCodes.eventId} IS NULL OR ${eventPromoCodes.eventId} = ${eventId})`
      )).limit(1);

      if (promo.length && (!promo[0].maxUses || promo[0].currentUses! < promo[0].maxUses)) {
        const promoData = promo[0];
        if (promoData.discountType === 'percentage') {
          discountAmount = Math.floor(ticketPrice * Number(promoData.discountValue) / 100);
        } else {
          discountAmount = Math.min(Number(promoData.discountValue) * 100, ticketPrice);
        }
        promoCodeId = promoData.id;
      }
    }

    const priceAfterDiscount = ticketPrice - discountAmount;
    const gstAmount = Math.floor(priceAfterDiscount * Number(ticketData.gstPercentage) / 100);
    const totalAmount = priceAfterDiscount + gstAmount;

    const bookingId = generateBookingId();
    const qrCodeData = generateQRCode();
    
    const paymentWindowMinutes = 30;
    const expiresAt = new Date(Date.now() + paymentWindowMinutes * 60 * 1000);

    const [registration] = await db.insert(eventRegistrations).values({
      eventId,
      userId: userId,
      ticketTypeId: validated.ticketTypeId,
      bookingId,
      attendeeName: validated.attendeeName,
      attendeeEmail: validated.attendeeEmail,
      attendeePhone: validated.attendeePhone,
      attendeeAgeGroup: validated.attendeeAgeGroup,
      experienceLevel: validated.experienceLevel,
      dietaryPreference: validated.dietaryPreference,
      specialRequirements: validated.specialRequirements,
      ticketPricePaisa: ticketPrice,
      discountAmountPaisa: discountAmount,
      promoCodeId,
      gstAmountPaisa: gstAmount,
      totalAmountPaisa: totalAmount,
      qrCodeData,
      status: 'pending',
      paymentStatus: 'pending',
      expiresAt: expiresAt
    }).returning();

    res.status(201).json({
      registration,
      payment: {
        orderId: registration.id,
        amount: totalAmount,
        currency: 'INR',
        description: `${eventData.title} - ${ticketData.name}`
      }
    });
  } catch (error: any) {
    console.error('Error creating registration:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create registration' });
  }
});

router.post('/registrations/:registrationId/confirm-payment', populateUserFromSession, async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { paymentId, providerId, signature, method } = req.body;

    const registration = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, registrationId)).limit(1);
    if (!registration.length) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const regData = registration[0];

    await db.insert(eventRegistrationPayments).values({
      registrationId,
      amountPaisa: regData.totalAmountPaisa,
      paymentMethod: method || 'razorpay',
      paymentProvider: 'razorpay',
      providerOrderId: paymentId,
      providerPaymentId: providerId,
      providerSignature: signature,
      status: 'completed'
    });

    const [updatedReg] = await db.update(eventRegistrations)
      .set({ status: 'confirmed', paymentStatus: 'paid', updatedAt: new Date() })
      .where(eq(eventRegistrations.id, registrationId))
      .returning();

    await db.update(events)
      .set({ currentRegistrations: sql`${events.currentRegistrations} + 1` })
      .where(eq(events.id, regData.eventId));

    if (regData.promoCodeId) {
      await db.update(eventPromoCodes)
        .set({ currentUses: sql`${eventPromoCodes.currentUses} + 1` })
        .where(eq(eventPromoCodes.id, regData.promoCodeId));
    }

    res.json(updatedReg);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

router.get('/registrations/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const registration = await db.select({
      registration: eventRegistrations,
      event: events,
      ticket: eventTicketTypes
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .innerJoin(eventTicketTypes, eq(eventRegistrations.ticketTypeId, eventTicketTypes.id))
    .where(eq(eventRegistrations.bookingId, bookingId))
    .limit(1);

    if (!registration.length) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const data = registration[0];

    res.json({
      ...data.registration,
      event: {
        id: data.event.id,
        title: data.event.title,
        startDate: data.event.startDate,
        startTime: data.event.startTime,
        endTime: data.event.endTime,
        venueName: data.event.venueName,
        venueAddress: data.event.venueAddress,
        venueCity: data.event.venueCity,
        venueLatitude: data.event.venueLatitude,
        venueLongitude: data.event.venueLongitude,
        coverImageUrl: data.event.coverImageUrl
      },
      ticket: {
        name: data.ticket.name,
        description: data.ticket.description
      }
    });
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({ message: 'Failed to fetch registration' });
  }
});

router.post('/registrations/:registrationId/cancel', populateUserFromSession, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { registrationId } = req.params;
    const { reason } = cancelRegistrationSchema.parse(req.body);

    const registration = await db.select().from(eventRegistrations).where(and(
      eq(eventRegistrations.id, registrationId),
      eq(eventRegistrations.userId, userId),
      eq(eventRegistrations.status, 'confirmed')
    )).limit(1);

    if (!registration.length) {
      return res.status(404).json({ message: 'Registration not found or already cancelled' });
    }

    const regData = registration[0];

    const event = await db.select().from(events).where(eq(events.id, regData.eventId)).limit(1);
    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventData = event[0];
    const eventDate = new Date(eventData.startDate);
    const today = new Date();
    const daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let refundPercentage = 0;
    const policy = eventData.cancellationPolicy as { "7_plus_days": number; "3_to_6_days": number; "1_to_2_days": number; "same_day": number };
    
    if (daysUntilEvent >= 7) {
      refundPercentage = policy["7_plus_days"] || 100;
    } else if (daysUntilEvent >= 3) {
      refundPercentage = policy["3_to_6_days"] || 75;
    } else if (daysUntilEvent >= 1) {
      refundPercentage = policy["1_to_2_days"] || 50;
    } else {
      refundPercentage = policy["same_day"] || 0;
    }

    const refundAmount = Math.floor(regData.totalAmountPaisa * refundPercentage / 100);

    const [updated] = await db.update(eventRegistrations)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        refundAmountPaisa: refundAmount,
        refundStatus: refundAmount > 0 ? 'pending' : 'not_applicable',
        updatedAt: new Date()
      })
      .where(eq(eventRegistrations.id, registrationId))
      .returning();

    await db.update(events)
      .set({ currentRegistrations: sql`GREATEST(${events.currentRegistrations} - 1, 0)` })
      .where(eq(events.id, regData.eventId));

    res.json({
      registration: updated,
      refund: {
        percentage: refundPercentage,
        amount: refundAmount,
        daysUntilEvent
      }
    });
  } catch (error: any) {
    console.error('Error cancelling registration:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to cancel registration' });
  }
});

router.post('/:eventId/reviews', populateUserFromSession, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { eventId } = req.params;
    const validated = eventReviewSchema.parse({ ...req.body, eventId });

    const registration = await db.select().from(eventRegistrations).where(and(
      eq(eventRegistrations.id, validated.registrationId),
      eq(eventRegistrations.userId, userId),
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.status, 'confirmed')
    )).limit(1);

    if (!registration.length) {
      return res.status(403).json({ message: 'You must have attended this event to leave a review' });
    }

    const existingReview = await db.select().from(eventReviews).where(and(
      eq(eventReviews.registrationId, validated.registrationId)
    )).limit(1);

    if (existingReview.length) {
      return res.status(400).json({ message: 'You have already reviewed this event' });
    }

    const [newReview] = await db.insert(eventReviews).values({
      eventId,
      registrationId: validated.registrationId,
      userId,
      overallRating: validated.overallRating,
      instructorRating: validated.instructorRating,
      contentRating: validated.contentRating,
      venueRating: validated.venueRating,
      valueRating: validated.valueRating,
      organizationRating: validated.organizationRating,
      likedAspects: validated.likedAspects || [],
      reviewText: validated.reviewText,
      reviewPhotos: validated.reviewPhotos || [],
      status: 'pending'
    }).returning();

    res.status(201).json(newReview);
  } catch (error: any) {
    console.error('Error creating review:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create review' });
  }
});

router.get('/business/notifications', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const notifications = await db.select()
      .from(eventNotifications)
      .where(eq(eventNotifications.userId, userId))
      .orderBy(desc(eventNotifications.createdAt))
      .limit(50);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.put('/business/notifications/:notificationId/read', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { notificationId } = req.params;

    await db.update(eventNotifications)
      .set({ isRead: 1, readAt: new Date() })
      .where(and(eq(eventNotifications.id, notificationId), eq(eventNotifications.userId, userId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

router.get('/business/analytics', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { startDate, endDate } = req.query;
    const start = startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate as string || new Date().toISOString().split('T')[0];

    const userSalons = await db.select({ id: salons.id }).from(salons).where(eq(salons.ownerId, userId));
    const salonIds = userSalons.map(s => s.id);

    if (salonIds.length === 0) {
      return res.json({ dailyStats: [], summary: { totalRevenue: 0, totalRegistrations: 0, totalViews: 0 } });
    }

    const eventIds = await db.select({ id: events.id }).from(events).where(inArray(events.salonId, salonIds));
    const eventIdList = eventIds.map(e => e.id);

    if (eventIdList.length === 0) {
      return res.json({ dailyStats: [], summary: { totalRevenue: 0, totalRegistrations: 0, totalViews: 0 } });
    }

    const dailyStats = await db.select()
      .from(eventAnalyticsDaily)
      .where(and(
        inArray(eventAnalyticsDaily.eventId, eventIdList),
        gte(eventAnalyticsDaily.date, start),
        lte(eventAnalyticsDaily.date, end)
      ))
      .orderBy(asc(eventAnalyticsDaily.date));

    const summary = dailyStats.reduce((acc, day) => ({
      totalRevenue: acc.totalRevenue + (day.totalRevenuePaisa || 0),
      totalRegistrations: acc.totalRegistrations + (day.newRegistrations || 0),
      totalViews: acc.totalViews + (day.pageViews || 0)
    }), { totalRevenue: 0, totalRegistrations: 0, totalViews: 0 });

    res.json({
      dailyStats,
      summary
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

router.post('/business/:eventId/check-in', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { eventId } = req.params;
    const { qrCode, bookingId } = req.body;

    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const ownerCheck = await db.select({ id: salons.id }).from(salons)
      .where(and(eq(salons.id, event[0].salonId), eq(salons.ownerId, userId)));
    if (!ownerCheck.length) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let registration;
    if (qrCode) {
      // Verify the signed QR code
      const verification = verifyQRCode(qrCode);
      if (!verification.valid || !verification.data) {
        return res.status(400).json({ 
          message: verification.error || 'Invalid or tampered QR code' 
        });
      }

      // Ensure the QR code is for this event
      if (verification.data.eventId !== eventId) {
        return res.status(400).json({ message: 'QR code does not match this event' });
      }

      // Fetch the registration using the verified data and cross-check with database
      registration = await db.select().from(eventRegistrations).where(and(
        eq(eventRegistrations.id, verification.data.registrationId),
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.status, 'confirmed')
      )).limit(1);
      
      // Verify the registration exists and matches the QR code data
      if (registration.length === 0) {
        return res.status(404).json({ message: 'Registration not found or not confirmed' });
      }
      
      // Cross-check email to prevent QR code substitution
      if (registration[0].attendeeEmail !== verification.data.attendeeEmail) {
        return res.status(400).json({ message: 'QR code data does not match registration' });
      }
      
      // Check redemption status to prevent replay attacks
      if (registration[0].checkedInAt) {
        return res.status(400).json({ 
          message: 'Already checked in', 
          checkedInAt: registration[0].checkedInAt 
        });
      }
    } else if (bookingId) {
      registration = await db.select().from(eventRegistrations).where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.bookingId, bookingId),
        eq(eventRegistrations.status, 'confirmed')
      )).limit(1);
    } else {
      return res.status(400).json({ message: 'QR code or booking ID required' });
    }

    if (!registration || !registration.length) {
      return res.status(404).json({ message: 'Registration not found or not confirmed' });
    }

    // Additional check for bookingId path
    if (registration[0].checkedInAt) {
      return res.status(400).json({ message: 'Already checked in', checkedInAt: registration[0].checkedInAt });
    }

    // Transactional update to prevent race conditions
    const [updated] = await db.update(eventRegistrations)
      .set({ checkedInAt: new Date(), checkedInBy: userId, updatedAt: new Date() })
      .where(and(
        eq(eventRegistrations.id, registration[0].id),
        sql`${eventRegistrations.checkedInAt} IS NULL` // Ensure not already checked in
      ))
      .returning();
    
    // If no rows updated, someone else checked in first (race condition)
    if (!updated) {
      return res.status(409).json({ message: 'Registration was just checked in by another user' });
    }

    res.json({
      success: true,
      registration: updated
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ message: 'Failed to check in' });
  }
});

router.get('/my-registrations', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const registrations = await db.select({
      registration: eventRegistrations,
      event: {
        id: events.id,
        title: events.title,
        startDate: events.startDate,
        startTime: events.startTime,
        venueName: events.venueName,
        venueCity: events.venueCity,
        coverImageUrl: events.coverImageUrl,
        status: events.status
      }
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .where(eq(eventRegistrations.userId, userId))
    .orderBy(desc(eventRegistrations.createdAt));

    res.json(registrations);
  } catch (error) {
    console.error('Error fetching my registrations:', error);
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

// Get Razorpay public key for client-side integration
router.get('/razorpay-key', (req: Request, res: Response) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID || '' });
});

// Create Razorpay payment order
router.post('/registrations/:registrationId/create-payment-order', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const userId = req.user?.id;
    
    const registration = await db.select().from(eventRegistrations)
      .where(eq(eventRegistrations.id, registrationId))
      .limit(1);
    
    if (!registration.length) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    const regData = registration[0];
    
    // Block payments for legacy guest registrations (userId is null)
    if (!regData.userId) {
      return res.status(403).json({ message: 'Guest registrations are not supported for payment. Please log in and create a new registration.' });
    }
    
    // Verify ownership - registration must belong to current user
    if (regData.userId !== userId) {
      return res.status(403).json({ message: 'Access denied - not your registration' });
    }
    
    // Check registration state - only pending/unpaid registrations can create orders
    if (regData.paymentStatus === 'paid' || regData.status === 'confirmed') {
      return res.status(400).json({ message: 'Registration already paid' });
    }
    
    // Check if order already exists for this registration
    if (regData.paymentOrderId) {
      return res.status(400).json({ message: 'Payment order already created', orderId: regData.paymentOrderId });
    }
    
    // CRITICAL SECURITY: Check registration expiration (payment window timeout)
    if (regData.expiresAt && new Date() > new Date(regData.expiresAt)) {
      await db.update(eventRegistrations)
        .set({ 
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: 'Payment window expired (30 minutes)',
          updatedAt: new Date()
        })
        .where(eq(eventRegistrations.id, registrationId));
      
      return res.status(400).json({ 
        message: 'Registration expired. Payment window was 30 minutes. Please register again.' 
      });
    }
    
    // CRITICAL SECURITY: Revalidate inventory, pricing, and promo codes atomically
    // This prevents TOCTOU attacks where conditions change between registration and payment
    // Use transaction to prevent race conditions in concurrent payment order creation
    
    const revalidationResult = await db.transaction(async (tx) => {
      // 1. Revalidate event capacity with row-level lock to prevent race conditions
      const event = await tx.select().from(events)
        .where(eq(events.id, regData.eventId))
        .for('update') // SELECT FOR UPDATE - locks the row to prevent concurrent modifications
        .limit(1);
      
      if (!event.length || event[0].status !== 'published') {
        throw new Error('EVENT_NOT_AVAILABLE');
      }
      
      const eventData = event[0];
      
      // Count confirmed + pending (non-expired) registrations toward capacity
      const registrationCounts = await tx.select({
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`
      })
      .from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, regData.eventId),
        sql`(${eventRegistrations.status} = 'confirmed' OR (${eventRegistrations.status} = 'pending' AND (${eventRegistrations.expiresAt} IS NULL OR ${eventRegistrations.expiresAt} > NOW())))`
      ));
      
      const currentOccupancy = registrationCounts[0]?.count || 0;
      
      if (currentOccupancy > eventData.maxCapacity) {
        throw new Error('EVENT_FULLY_BOOKED');
      }
      
      return { eventData, currentOccupancy };
    }).catch((error) => {
      if (error.message === 'EVENT_NOT_AVAILABLE') {
        return { error: 'Event no longer available for registration' };
      }
      if (error.message === 'EVENT_FULLY_BOOKED') {
        return { error: 'Event is now fully booked' };
      }
      throw error;
    });
    
    if ('error' in revalidationResult) {
      return res.status(400).json({ message: revalidationResult.error });
    }
    
    const { eventData } = revalidationResult;
    
    // 2. Revalidate ticket pricing
    const ticket = await db.select().from(eventTicketTypes)
      .where(and(
        eq(eventTicketTypes.id, regData.ticketTypeId),
        eq(eventTicketTypes.isActive, 1)
      ))
      .limit(1);
    
    if (!ticket.length) {
      return res.status(400).json({ message: 'Ticket type no longer available' });
    }
    
    const currentTicketPrice = ticket[0].basePricePaisa;
    
    if (currentTicketPrice !== regData.ticketPricePaisa) {
      return res.status(400).json({ 
        message: 'Ticket price has changed since registration. Please register again with current pricing.',
        oldPrice: regData.ticketPricePaisa / 100,
        newPrice: currentTicketPrice / 100
      });
    }
    
    // 3. Revalidate promo code and RECALCULATE amounts with current values
    let finalDiscountAmount = 0;
    if (regData.promoCodeId) {
      const promo = await db.select().from(eventPromoCodes)
        .where(and(
          eq(eventPromoCodes.id, regData.promoCodeId),
          eq(eventPromoCodes.isActive, 1)
        ))
        .limit(1);
      
      if (!promo.length) {
        return res.status(400).json({ 
          message: 'Promo code is no longer valid. Please register again without the promo code or with a valid code.' 
        });
      }
      
      const promoData = promo[0];
      
      // Check promo usage limits
      if (promoData.maxUses && promoData.currentUses! >= promoData.maxUses) {
        return res.status(400).json({ 
          message: 'Promo code has reached its usage limit. Please register again without the promo code.' 
        });
      }
      
      // RECALCULATE discount with current values (don't trust stored values)
      if (promoData.discountType === 'percentage') {
        finalDiscountAmount = Math.floor(currentTicketPrice * Number(promoData.discountValue) / 100);
      } else {
        finalDiscountAmount = Math.min(Number(promoData.discountValue) * 100, currentTicketPrice);
      }
    }
    
    // CRITICAL: Recalculate final amount with current prices and promo
    // This ensures Razorpay order is created with current valid amount, not stale stored amount
    const finalPriceAfterDiscount = currentTicketPrice - finalDiscountAmount;
    const finalGstAmount = Math.floor(finalPriceAfterDiscount * Number(ticket[0].gstPercentage) / 100);
    const finalTotalAmount = finalPriceAfterDiscount + finalGstAmount;
    
    // CRITICAL: Atomically reserve the spot BEFORE calling external Razorpay API
    // This prevents race conditions in capacity checking
    const reservationId = `PENDING_${Date.now()}_${registrationId}`;
    const reservationResult = await db.update(eventRegistrations)
      .set({ 
        paymentOrderId: reservationId,
        ticketPricePaisa: currentTicketPrice,
        discountAmountPaisa: finalDiscountAmount,
        gstAmountPaisa: finalGstAmount,
        totalAmountPaisa: finalTotalAmount,
        updatedAt: new Date() 
      })
      .where(and(
        eq(eventRegistrations.id, registrationId),
        sql`${eventRegistrations.paymentOrderId} IS NULL` // Only if no order exists
      ))
      .returning();
    
    if (!reservationResult.length) {
      return res.status(409).json({ message: 'Payment order already exists or registration modified concurrently' });
    }
    
    // Now call Razorpay API with the recalculated amount (outside critical section)
    let razorpayOrder;
    try {
      const options = {
        amount: finalTotalAmount, // Use recalculated amount, not stored amount
        currency: 'INR',
        receipt: `reg_${registrationId}`,
        notes: {
          registrationId,
          eventId: regData.eventId,
          attendeeEmail: regData.attendeeEmail
        }
      };
      
      razorpayOrder = await razorpay.orders.create(options);
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      
      // Rollback: Clear the pending reservation
      await db.update(eventRegistrations)
        .set({ paymentOrderId: null, updatedAt: new Date() })
        .where(eq(eventRegistrations.id, registrationId));
      
      return res.status(500).json({ message: 'Failed to create payment order. Please try again.' });
    }
    
    // Update with actual Razorpay order ID (replace pending reservation)
    await db.update(eventRegistrations)
      .set({ paymentOrderId: razorpayOrder.id, updatedAt: new Date() })
      .where(eq(eventRegistrations.id, registrationId));
    
    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      registrationId
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Verify Razorpay payment
router.post('/registrations/:registrationId/verify-payment', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user?.id;
    
    // Fetch registration with current state
    const registration = await db.select().from(eventRegistrations)
      .where(eq(eventRegistrations.id, registrationId))
      .limit(1);
    
    if (!registration.length) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    const regData = registration[0];
    
    // Block payment verification for legacy guest registrations
    if (!regData.userId) {
      return res.status(403).json({ message: 'Guest registrations are not supported for payment. Please log in and create a new registration.' });
    }
    
    // Verify ownership - registration must belong to current user
    if (regData.userId !== userId) {
      return res.status(403).json({ message: 'Access denied - not your registration' });
    }
    
    // Verify registration is pending and unpaid
    if (regData.paymentStatus === 'paid' || regData.status === 'confirmed') {
      return res.status(400).json({ message: 'Registration already confirmed' });
    }
    
    // CRITICAL SECURITY: Check registration expiration before accepting payment
    // This prevents payment window bypass where user pays after expiration
    if (regData.expiresAt && new Date() > new Date(regData.expiresAt)) {
      await db.update(eventRegistrations)
        .set({ 
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: 'Payment window expired (30 minutes). Payment attempted after expiration.',
          updatedAt: new Date()
        })
        .where(eq(eventRegistrations.id, registrationId));
      
      return res.status(400).json({ 
        message: 'Registration expired. Payment window was 30 minutes. Please create a new registration with current pricing.' 
      });
    }
    
    // Verify the order ID matches what was created for this registration
    if (regData.paymentOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Order ID mismatch' });
    }
    
    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign)
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }
    
    // Check for duplicate payment - ensure payment ID hasn't been used
    const existingPayment = await db.select().from(eventRegistrationPayments)
      .where(eq(eventRegistrationPayments.providerPaymentId, razorpay_payment_id))
      .limit(1);
    
    if (existingPayment.length) {
      return res.status(400).json({ message: 'Payment already processed' });
    }
    
    // CRITICAL SECURITY: Fetch Razorpay order and revalidate amount before accepting payment
    // This prevents stale order replay attacks where user pays old amount after price changes
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    } catch (error) {
      console.error('Error fetching Razorpay order:', error);
      return res.status(400).json({ message: 'Invalid payment order' });
    }
    
    // Revalidate ticket pricing and recalculate expected amount
    const ticket = await db.select().from(eventTicketTypes)
      .where(and(
        eq(eventTicketTypes.id, regData.ticketTypeId),
        eq(eventTicketTypes.isActive, 1)
      ))
      .limit(1);
    
    if (!ticket.length) {
      return res.status(400).json({ 
        message: 'Ticket type no longer available. Payment cannot be accepted.' 
      });
    }
    
    const currentTicketPrice = ticket[0].basePricePaisa;
    let expectedDiscountAmount = 0;
    
    // Revalidate promo code if one was used
    if (regData.promoCodeId) {
      const promo = await db.select().from(eventPromoCodes)
        .where(and(
          eq(eventPromoCodes.id, regData.promoCodeId),
          eq(eventPromoCodes.isActive, 1)
        ))
        .limit(1);
      
      if (!promo.length) {
        return res.status(400).json({ 
          message: 'Promo code is no longer valid. Payment cannot be accepted. Please register again.' 
        });
      }
      
      const promoData = promo[0];
      
      // Check promo usage limits
      if (promoData.maxUses && promoData.currentUses! >= promoData.maxUses) {
        return res.status(400).json({ 
          message: 'Promo code has reached its usage limit. Payment cannot be accepted. Please register again.' 
        });
      }
      
      // Recalculate discount
      if (promoData.discountType === 'percentage') {
        expectedDiscountAmount = Math.floor(currentTicketPrice * Number(promoData.discountValue) / 100);
      } else {
        expectedDiscountAmount = Math.min(Number(promoData.discountValue) * 100, currentTicketPrice);
      }
    }
    
    // Recalculate expected total
    const priceAfterDiscount = currentTicketPrice - expectedDiscountAmount;
    const expectedGstAmount = Math.floor(priceAfterDiscount * Number(ticket[0].gstPercentage) / 100);
    const expectedTotalAmount = priceAfterDiscount + expectedGstAmount;
    
    // CRITICAL: Verify Razorpay order amount matches recalculated amount
    // This is the definitive check that prevents stale order replay attacks
    const razorpayOrderAmount = Number(razorpayOrder.amount);
    if (razorpayOrderAmount !== expectedTotalAmount) {
      return res.status(400).json({ 
        message: 'Payment amount mismatch. Ticket pricing or promo code has changed since payment order was created. Please create a new registration.',
        paidAmount: razorpayOrderAmount / 100,
        currentRequiredAmount: expectedTotalAmount / 100
      });
    }
    
    // Transactional update - confirm registration only if still pending
    const [updatedReg] = await db.update(eventRegistrations)
      .set({ 
        status: 'confirmed', 
        paymentStatus: 'paid',
        paymentTransactionId: razorpay_payment_id,
        updatedAt: new Date() 
      })
      .where(and(
        eq(eventRegistrations.id, registrationId),
        eq(eventRegistrations.paymentStatus, 'pending') // Only update if still pending
      ))
      .returning();
    
    // If no rows updated, payment was already processed (race condition)
    if (!updatedReg) {
      return res.status(409).json({ message: 'Registration payment already confirmed by another request' });
    }
    
    // Create payment record
    await db.insert(eventRegistrationPayments).values({
      registrationId,
      amountPaisa: updatedReg.totalAmountPaisa,
      paymentMethod: 'razorpay',
      paymentProvider: 'razorpay',
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
      providerSignature: razorpay_signature,
      status: 'completed'
    });
    
    // Generate proper QR code with registration details
    const qrCode = signQRCode(registrationId, updatedReg.eventId, updatedReg.attendeeEmail);
    await db.update(eventRegistrations)
      .set({ qrCodeData: qrCode })
      .where(eq(eventRegistrations.id, registrationId));
    
    res.json({
      success: true,
      registration: { ...updatedReg, qrCodeData: qrCode }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
});

// Export attendees list
router.get('/:eventId/export/attendees', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { format = 'excel' } = req.query;

    // Validate format before processing
    if (format !== 'excel' && format !== 'pdf' && format !== 'checkin') {
      return res.status(400).json({ message: 'Invalid format. Use excel, pdf, or checkin' });
    }

    // Check if event exists first (distinct 404 vs 403)
    const [event] = await db.select({ id: events.id, salonId: events.salonId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify event ownership
    const isOwner = await verifyEventOwnership(req.user!.id, eventId);
    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to export attendees for this event' });
    }

    const { ExportService } = await import('../services/exportService');
    const exportService = new ExportService();

    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    if (format === 'excel') {
      buffer = await exportService.exportAttendeesToExcel(eventId);
      filename = `attendees-${eventId}-${Date.now()}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'pdf') {
      buffer = await exportService.exportAttendeesToPDF(eventId);
      filename = `attendees-${eventId}-${Date.now()}.pdf`;
      mimeType = 'application/pdf';
    } else {
      buffer = await exportService.exportCheckInSheet(eventId);
      filename = `checkin-sheet-${eventId}-${Date.now()}.pdf`;
      mimeType = 'application/pdf';
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting attendees:', error);
    
    // Handle typed errors with proper HTTP status codes
    const err = error as Error & { statusCode?: number };
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Failed to export attendee list';
    
    res.status(statusCode).json({ message });
  }
});

// Speakers Management Endpoints (Business)
router.get('/business/:eventId/speakers', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const speakers = await db.select()
      .from(eventSpeakers)
      .where(eq(eventSpeakers.eventId, eventId))
      .orderBy(asc(eventSpeakers.orderIndex));

    res.json(speakers);
  } catch (error) {
    console.error('Error fetching speakers:', error);
    res.status(500).json({ message: 'Failed to fetch speakers' });
  }
});

router.post('/business/:eventId/speakers', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, title, bio, photoUrl, orderIndex } = req.body;

    const [speaker] = await db.insert(eventSpeakers).values({
      eventId,
      name,
      title,
      bio: bio || null,
      photoUrl: photoUrl || null,
      orderIndex: orderIndex || 1,
    }).returning();

    res.json(speaker);
  } catch (error) {
    console.error('Error adding speaker:', error);
    res.status(500).json({ message: 'Failed to add speaker' });
  }
});

router.put('/business/:eventId/speakers/:speakerId', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId, speakerId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, title, bio, photoUrl } = req.body;

    const [speaker] = await db.update(eventSpeakers)
      .set({ name, title, bio: bio || null, photoUrl: photoUrl || null })
      .where(and(eq(eventSpeakers.id, speakerId), eq(eventSpeakers.eventId, eventId)))
      .returning();

    if (!speaker) return res.status(404).json({ message: 'Speaker not found' });

    res.json(speaker);
  } catch (error) {
    console.error('Error updating speaker:', error);
    res.status(500).json({ message: 'Failed to update speaker' });
  }
});

router.delete('/business/:eventId/speakers/:speakerId', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId, speakerId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await db.delete(eventSpeakers)
      .where(and(eq(eventSpeakers.id, speakerId), eq(eventSpeakers.eventId, eventId)));

    res.json({ message: 'Speaker deleted successfully' });
  } catch (error) {
    console.error('Error deleting speaker:', error);
    res.status(500).json({ message: 'Failed to delete speaker' });
  }
});

// Tickets Management Endpoints (Business)
router.get('/business/:eventId/tickets', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tickets = await db.select()
      .from(eventTicketTypes)
      .where(eq(eventTicketTypes.eventId, eventId))
      .orderBy(asc(eventTicketTypes.orderIndex));

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

router.post('/business/:eventId/tickets', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, basePricePaisa, quantityAvailable, orderIndex } = req.body;

    const [ticket] = await db.insert(eventTicketTypes).values({
      eventId,
      name,
      description: description || null,
      basePricePaisa,
      quantityAvailable: quantityAvailable || null,
      quantitySold: 0,
      orderIndex: orderIndex || 1,
    }).returning();

    res.json(ticket);
  } catch (error) {
    console.error('Error adding ticket:', error);
    res.status(500).json({ message: 'Failed to add ticket' });
  }
});

router.put('/business/:eventId/tickets/:ticketId', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId, ticketId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, basePricePaisa, quantityAvailable } = req.body;

    const [ticket] = await db.update(eventTicketTypes)
      .set({ 
        name, 
        description: description || null, 
        basePricePaisa, 
        quantityAvailable: quantityAvailable || null 
      })
      .where(and(eq(eventTicketTypes.id, ticketId), eq(eventTicketTypes.eventId, eventId)))
      .returning();

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
});

router.delete('/business/:eventId/tickets/:ticketId', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId, ticketId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await db.delete(eventTicketTypes)
      .where(and(eq(eventTicketTypes.id, ticketId), eq(eventTicketTypes.eventId, eventId)));

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Failed to delete ticket' });
  }
});

// Schedule Management Endpoints (Business)
router.get('/business/:eventId/schedule', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const scheduleItems = await db.select()
      .from(eventSchedules)
      .where(eq(eventSchedules.eventId, eventId))
      .orderBy(asc(eventSchedules.orderIndex));

    res.json(scheduleItems);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Failed to fetch schedule' });
  }
});

router.post('/business/:eventId/schedule', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, startTime, endTime, orderIndex } = req.body;

    const [scheduleItem] = await db.insert(eventSchedules).values({
      eventId,
      title,
      description: description || null,
      startTime,
      endTime,
      orderIndex: orderIndex || 1,
    }).returning();

    res.json(scheduleItem);
  } catch (error) {
    console.error('Error adding schedule item:', error);
    res.status(500).json({ message: 'Failed to add schedule item' });
  }
});

router.put('/business/:eventId/schedule/:scheduleId', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId, scheduleId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, startTime, endTime } = req.body;

    const [scheduleItem] = await db.update(eventSchedules)
      .set({ 
        title, 
        description: description || null, 
        startTime, 
        endTime 
      })
      .where(and(eq(eventSchedules.id, scheduleId), eq(eventSchedules.eventId, eventId)))
      .returning();

    if (!scheduleItem) return res.status(404).json({ message: 'Schedule item not found' });

    res.json(scheduleItem);
  } catch (error) {
    console.error('Error updating schedule item:', error);
    res.status(500).json({ message: 'Failed to update schedule item' });
  }
});

router.delete('/business/:eventId/schedule/:scheduleId', populateUserFromSession, requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const { eventId, scheduleId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!(await verifyEventOwnership(userId, eventId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await db.delete(eventSchedules)
      .where(and(eq(eventSchedules.id, scheduleId), eq(eventSchedules.eventId, eventId)));

    res.json({ message: 'Schedule item deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule item:', error);
    res.status(500).json({ message: 'Failed to delete schedule item' });
  }
});

export default router;
