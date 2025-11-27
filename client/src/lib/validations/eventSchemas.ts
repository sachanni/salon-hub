import { z } from 'zod';

// Create Event Form Validation Schemas

export const eventBasicInfoSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  shortDescription: z.string()
    .min(10, 'Short description must be at least 10 characters')
    .max(500, 'Short description must be less than 500 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Start date must be today or in the future'),
  endDate: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  coverImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const eventVenueSchemaBase = z.object({
  venueType: z.enum(['salon', 'external', 'online'], {
    required_error: 'Venue type is required',
  }),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  venueCity: z.string().optional(),
  venueState: z.string().optional(),
  venuePincode: z.string().optional(),
});

export const eventVenueSchema = eventVenueSchemaBase.refine((data) => {
  if (data.venueType === 'online') return true;
  return data.venueName && data.venueAddress;
}, {
  message: 'Venue name and address are required for physical events',
  path: ['venueName'],
});

export const eventSettingsSchemaBase = z.object({
  maxCapacity: z.number()
    .int('Capacity must be a whole number')
    .min(1, 'Maximum capacity must be at least 1')
    .max(10000, 'Maximum capacity cannot exceed 10,000'),
  minCapacity: z.number()
    .int('Capacity must be a whole number')
    .min(1, 'Minimum capacity must be at least 1'),
  visibility: z.enum(['public', 'private', 'unlisted'], {
    required_error: 'Visibility is required',
  }),
});

export const eventSettingsSchema = eventSettingsSchemaBase.refine((data) => data.maxCapacity >= data.minCapacity, {
  message: 'Maximum capacity must be greater than or equal to minimum capacity',
  path: ['maxCapacity'],
});

// Merge first, then apply all refinements
export const createEventSchema = eventBasicInfoSchema
  .merge(eventVenueSchemaBase)
  .merge(eventSettingsSchemaBase)
  .refine((data) => {
    if (data.venueType === 'online') return true;
    return data.venueName && data.venueAddress;
  }, {
    message: 'Venue name and address are required for physical events',
    path: ['venueName'],
  })
  .refine((data) => data.maxCapacity >= data.minCapacity, {
    message: 'Maximum capacity must be greater than or equal to minimum capacity',
    path: ['maxCapacity'],
  });

// Registration Form Validation Schemas

export const registrationTicketSchema = z.object({
  selectedTickets: z.record(z.string(), z.number())
    .refine((tickets) => {
      const totalTickets = Object.values(tickets).reduce((sum, qty) => sum + qty, 0);
      return totalTickets > 0;
    }, 'Please select at least one ticket'),
});

export const registrationAttendeeSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format'),
  specialRequests: z.string()
    .max(500, 'Special requests must be less than 500 characters')
    .optional(),
});

export const registrationPaymentSchema = z.object({
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  paymentMethodId: z.string().optional(), // For Stripe payment method ID
  paymentIntentId: z.string().optional(), // For Stripe payment intent ID
});

export const fullRegistrationSchema = registrationTicketSchema
  .merge(registrationAttendeeSchema)
  .merge(registrationPaymentSchema);

// Type exports
export type EventBasicInfo = z.infer<typeof eventBasicInfoSchema>;
export type EventVenue = z.infer<typeof eventVenueSchema>;
export type EventSettings = z.infer<typeof eventSettingsSchema>;
export type CreateEventFormData = z.infer<typeof createEventSchema>;

export type RegistrationTickets = z.infer<typeof registrationTicketSchema>;
export type RegistrationAttendee = z.infer<typeof registrationAttendeeSchema>;
export type RegistrationPayment = z.infer<typeof registrationPaymentSchema>;
export type FullRegistrationData = z.infer<typeof fullRegistrationSchema>;
