import { relations } from "drizzle-orm/relations";
import { bookings, payments, users, salons, services } from "./schema";

export const paymentsRelations = relations(payments, ({one}) => ({
	booking: one(bookings, {
		fields: [payments.bookingId],
		references: [bookings.id]
	}),
}));

export const bookingsRelations = relations(bookings, ({one, many}) => ({
	payments: many(payments),
	service: one(services, {
		fields: [bookings.serviceId],
		references: [services.id]
	}),
}));

export const salonsRelations = relations(salons, ({one}) => ({
	user: one(users, {
		fields: [salons.ownerId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	salons: many(salons),
}));

export const servicesRelations = relations(services, ({many}) => ({
	bookings: many(bookings),
}));