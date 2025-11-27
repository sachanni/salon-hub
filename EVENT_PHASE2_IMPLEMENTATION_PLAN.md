# Event Management Phase 2 - High Priority Features
## Implementation Plan

**Date:** November 26, 2025  
**Target:** Production-ready Phase 2 features  
**Estimated Timeline:** 3-4 development days

---

## Feature 1: Mark Event Complete (Auto-send Certificates & Thank Yous)

### Overview
When an event ends, salon can mark it complete, triggering automated post-event communications and certificate generation.

### Database Schema Changes

```typescript
// Add to shared/schema.ts - events table
completedAt: timestamp("completed_at"),
completedBy: varchar("completed_by").references(() => users.id),
certificateTemplate: varchar("certificate_template").default('default'),
certificateEnabled: boolean("certificate_enabled").default(false),

// New table: event_certificates
export const eventCertificates = pgTable("event_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  registrationId: varchar("registration_id").notNull().references(() => eventRegistrations.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  certificateNumber: varchar("certificate_number", { length: 50 }).notNull().unique(),
  certificateUrl: text("certificate_url"),
  issuedAt: timestamp("issued_at").defaultNow(),
  downloadedAt: timestamp("downloaded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Backend Implementation

#### 1. Mark Event Complete API
**File:** `server/routes/events.routes.ts`

```typescript
// POST /api/events/:eventId/complete
router.post('/:eventId/complete', async (req, res) => {
  // 1. Validate event ownership
  // 2. Check event has ended
  // 3. Update event status to completed
  // 4. Get all attended registrations
  // 5. Generate certificates (if enabled)
  // 6. Send thank you emails
  // 7. Send feedback requests
  // 8. Calculate final analytics
  // 9. Return completion summary
});
```

#### 2. Certificate Generation Service
**File:** `server/services/certificateService.ts`

```typescript
export class CertificateService {
  async generateCertificate(
    eventId: string,
    registrationId: string,
    attendeeName: string
  ): Promise<string> {
    // Use @cloudinary or PDF generation library
    // 1. Load certificate template
    // 2. Add attendee name, event title, date
    // 3. Add certificate number
    // 4. Upload to cloud storage
    // 5. Save to database
    // 6. Return download URL
  }

  async bulkGenerateCertificates(eventId: string): Promise<number> {
    // Generate for all attended registrations
  }
}
```

#### 3. Post-Event Email Service
**File:** `server/services/postEventEmailService.ts`

```typescript
export class PostEventEmailService {
  async sendThankYouEmails(eventId: string): Promise<void> {
    // Get all attended registrations
    // For each attendee:
    //   - Send thank you email
    //   - Include certificate (if enabled)
    //   - Include event photos/materials
    //   - Include feedback link
    //   - Include discount code for future services
  }

  async sendFeedbackRequests(eventId: string): Promise<void> {
    // Send review request emails
    // Include star rating quick links
    // Link to full review page
  }
}
```

### Frontend Implementation

#### 1. Complete Event Modal
**File:** `client/src/components/events/CompleteEventModal.tsx`

```tsx
interface CompleteEventModalProps {
  event: Event;
  onComplete: () => void;
}

// Features:
// - Attendance summary display
// - Certificate generation toggle
// - Thank you email preview
// - Feedback request toggle
// - Custom message to attendees
// - Confirm completion button
```

#### 2. Event Detail Actions
**File:** Update `client/src/pages/EventDetails.tsx`

```tsx
// Add "Complete Event" button if:
// - Event has ended
// - User is event owner
// - Event is not already completed
// - At least 1 attendee checked in

<Button onClick={() => setShowCompleteModal(true)}>
  Mark Event Complete
</Button>
```

#### 3. Certificates List (Customer)
**File:** `client/src/pages/MyCertificates.tsx`

```tsx
// New page showing all earned certificates
// - Grid/list view
// - Download buttons
// - Share to LinkedIn/social
// - Print option
```

### API Endpoints Summary

```
POST   /api/events/:eventId/complete           # Mark event complete
GET    /api/events/:eventId/certificates       # List event certificates
POST   /api/events/:eventId/certificates/bulk  # Bulk generate
GET    /api/customers/certificates             # Customer's certificates
GET    /api/certificates/:id/download          # Download certificate
```

### Testing Checklist

- [ ] Event owner can mark event complete
- [ ] Non-owner cannot mark event complete
- [ ] Cannot complete event before end time
- [ ] Certificates generated for attended registrations only
- [ ] Thank you emails sent to all attendees
- [ ] Feedback request emails sent
- [ ] Certificate downloads work
- [ ] Completion cannot be reversed (or only by admin)
- [ ] Analytics calculated after completion

---

## Feature 2: Reschedule/Cancel Events

### Database Schema Changes

```typescript
// Add to events table
rescheduledFrom: varchar("rescheduled_from").references(() => events.id),
rescheduledTo: varchar("rescheduled_to").references(() => events.id),
cancelledAt: timestamp("cancelled_at"),
cancelledBy: varchar("cancelled_by").references(() => users.id),
cancellationReason: text("cancellation_reason"),
cancellationCompensation: jsonb("cancellation_compensation"), // {type, amount, code}

// Add to event_registrations table
notifiedOfReschedule: boolean("notified_of_reschedule").default(false),
acceptedReschedule: boolean("accepted_reschedule"),
rescheduleResponseAt: timestamp("reschedule_response_at"),
```

### Backend Implementation

#### 1. Reschedule Event API
**File:** `server/routes/events.routes.ts`

```typescript
// POST /api/events/:eventId/reschedule
router.post('/:eventId/reschedule', async (req, res) => {
  const { newDate, newStartTime, newEndTime, notifyAttendees, allowCancellations } = req.body;
  
  // 1. Validate ownership
  // 2. Check event not already started
  // 3. Validate new date/time
  // 4. Update event details
  // 5. Log reschedule in event history
  // 6. Send notifications to all registrants
  // 7. If allowCancellations: Enable free cancellation window
  // 8. Return updated event
});
```

#### 2. Cancel Event API
**File:** `server/routes/events.routes.ts`

```typescript
// POST /api/events/:eventId/cancel
router.post('/:eventId/cancel', async (req, res) => {
  const { reason, compensationType, compensationValue } = req.body;
  
  // 1. Validate ownership
  // 2. Check event not already completed
  // 3. Get all non-cancelled registrations
  // 4. Process full refunds for all
  // 5. Apply compensation (credit/discount)
  // 6. Update event status to cancelled
  // 7. Send cancellation emails
  // 8. Return cancellation summary
});
```

#### 3. Reschedule Notification Service
**File:** `server/services/rescheduleService.ts`

```typescript
export class RescheduleService {
  async notifyAttendeesOfReschedule(
    eventId: string,
    oldDate: Date,
    newDate: Date
  ): Promise<void> {
    // Send email/SMS to all registrants
    // Include:
    // - Old date vs new date
    // - Option to cancel if can't attend
    // - Calendar update (.ics)
    // - Apology message
  }

  async processCancellationRequests(eventId: string): Promise<void> {
    // Handle attendees who can't make new date
    // Auto-approve cancellations
    // Issue full refunds
  }
}
```

### Frontend Implementation

#### 1. Reschedule Event Modal
**File:** `client/src/components/events/RescheduleEventModal.tsx`

```tsx
interface RescheduleModalProps {
  event: Event;
  onReschedule: (data: RescheduleData) => void;
}

// Features:
// - Current date/time display
// - New date/time picker
// - Reason for reschedule (optional message)
// - "Allow free cancellations" checkbox
// - Attendee notification preview
// - Impact summary (# of attendees affected)
// - Confirm reschedule button
```

#### 2. Cancel Event Modal
**File:** `client/src/components/events/CancelEventModal.tsx`

```tsx
interface CancelModalProps {
  event: Event;
  onCancel: (data: CancelData) => void;
}

// Features:
// - Cancellation reason (required)
// - Compensation type selector:
//   - Salon credit (amount input)
//   - Discount code (% off input)
//   - Refund only
// - Apology message to attendees
// - Refund summary (total amount)
// - "I understand this cannot be undone" checkbox
// - Confirm cancellation button (red, destructive)
```

#### 3. Event Actions Menu
**File:** Update event management UI

```tsx
// Add to event detail page actions
<DropdownMenu>
  <DropdownMenuItem onClick={() => setShowRescheduleModal(true)}>
    <Calendar className="mr-2" />
    Reschedule Event
  </DropdownMenuItem>
  <DropdownMenuItem 
    onClick={() => setShowCancelModal(true)}
    className="text-destructive"
  >
    <XCircle className="mr-2" />
    Cancel Event
  </DropdownMenuItem>
</DropdownMenu>
```

#### 4. Customer Reschedule Response
**File:** `client/src/pages/RescheduleNotification.tsx`

```tsx
// Email link leads here
// Shows:
// - Original date vs new date
// - Options:
//   - "I can attend the new date" (update calendar)
//   - "I cannot attend" (offer full refund)
// - Map with new venue (if changed)
```

### API Endpoints Summary

```
POST   /api/events/:eventId/reschedule              # Reschedule event
POST   /api/events/:eventId/cancel                  # Cancel event
GET    /api/events/:eventId/reschedule-responses    # View responses
PATCH  /api/registrations/:id/reschedule-response   # Accept/decline new date
GET    /api/events/:eventId/cancellation-summary    # Refund summary
```

### Testing Checklist

- [ ] Event owner can reschedule future events
- [ ] Cannot reschedule past events
- [ ] All attendees notified of reschedule
- [ ] Attendees can accept or decline new date
- [ ] Free cancellation enabled if option selected
- [ ] Calendar updates sent (.ics with new date)
- [ ] Event owner can cancel event
- [ ] Full refunds processed for all registrations
- [ ] Compensation applied correctly
- [ ] Cancelled events hidden from discovery
- [ ] Cancellation emails sent to all
- [ ] Reputation impact tracked (for excessive cancellations)

---

## Feature 3: Automated Reminder Emails

### Database Schema Changes

```typescript
// New table: event_reminders
export const eventReminders = pgTable("event_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  reminderType: varchar("reminder_type", { length: 50 }).notNull(), // '1_week', '3_days', '1_day', '2_hours'
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  status: varchar("status", { length: 20 }).default('pending'), // 'pending', 'sent', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Add to events table
reminderSettings: jsonb("reminder_settings").default({
  enabled: true,
  timings: ['1_week', '3_days', '1_day', '2_hours']
}),

// Add to event_registrations table
lastReminderSentAt: timestamp("last_reminder_sent_at"),
remindersSent: integer("reminders_sent").default(0),
```

### Backend Implementation

#### 1. Reminder Scheduling Service
**File:** `server/services/reminderScheduler.ts`

```typescript
import cron from 'node-cron';

export class ReminderScheduler {
  // Run every hour to check for due reminders
  startScheduler() {
    cron.schedule('0 * * * *', async () => {
      await this.processReminders();
    });
  }

  async processReminders() {
    // 1. Get all events happening in next 2 weeks
    // 2. For each event, check reminder settings
    // 3. Calculate when reminders should be sent
    // 4. Create reminder records if don't exist
    // 5. Send reminders that are due now
  }

  async scheduleRemindersForEvent(eventId: string) {
    // Called when event is published
    // Creates all reminder records based on event settings
  }
}
```

#### 2. Reminder Email Service
**File:** `server/services/reminderEmailService.ts`

```typescript
export class ReminderEmailService {
  async sendEventReminder(
    eventId: string,
    reminderType: string
  ): Promise<number> {
    // Get all registered, non-cancelled attendees
    // For each attendee:
    const emailData = {
      subject: this.getReminderSubject(reminderType),
      event: eventDetails,
      attendee: attendeeDetails,
      qrCode: registration.qrCode,
      calendarLink: generateIcs(event),
      directions: generateDirectionsLink(event, attendee),
      weatherForecast: await getWeatherForecast(event), // if within 3 days
    };
    
    await sendEmail(attendee.email, 'event-reminder', emailData);
    
    // Update reminder sent status
    // Return count of emails sent
  }

  private getReminderSubject(type: string): string {
    const subjects = {
      '1_week': 'Your event is coming up next week!',
      '3_days': 'Just 3 days until your event!',
      '1_day': 'Tomorrow is the big day!',
      '2_hours': 'Your event starts in 2 hours!',
    };
    return subjects[type];
  }

  async sendCustomReminder(
    eventId: string,
    subject: string,
    message: string
  ): Promise<number> {
    // Manual reminder from salon
    // Custom subject and message
  }
}
```

#### 3. Reminder Management API
**File:** `server/routes/events.routes.ts`

```typescript
// GET /api/events/:eventId/reminders - List scheduled reminders
router.get('/:eventId/reminders', async (req, res) => {
  // Return all reminders for event with status
});

// POST /api/events/:eventId/reminders/send - Send manual reminder
router.post('/:eventId/reminders/send', async (req, res) => {
  const { subject, message, recipientFilter } = req.body;
  // Send custom reminder to selected attendees
});

// PATCH /api/events/:eventId/reminder-settings - Update settings
router.patch('/:eventId/reminder-settings', async (req, res) => {
  const { enabled, timings } = req.body;
  // Update event reminder preferences
});
```

### Frontend Implementation

#### 1. Reminder Settings in Event Creation
**File:** Update `client/src/pages/CreateEvent.tsx`

```tsx
// Add to Step 4 (Final Details)
<Card>
  <CardHeader>
    <CardTitle>Automated Reminders</CardTitle>
    <CardDescription>
      Automatically remind attendees before the event
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Enable Reminders</Label>
        <Switch 
          checked={reminderSettings.enabled}
          onCheckedChange={(checked) => 
            setReminderSettings({...reminderSettings, enabled: checked})
          }
        />
      </div>
      
      {reminderSettings.enabled && (
        <div className="space-y-2">
          <Label>Send reminders:</Label>
          <div className="space-y-2">
            <Checkbox 
              checked={reminderSettings.timings.includes('1_week')}
              label="1 week before"
            />
            <Checkbox 
              checked={reminderSettings.timings.includes('3_days')}
              label="3 days before"
            />
            <Checkbox 
              checked={reminderSettings.timings.includes('1_day')}
              label="1 day before"
            />
            <Checkbox 
              checked={reminderSettings.timings.includes('2_hours')}
              label="2 hours before"
            />
          </div>
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

#### 2. Manual Reminder Modal
**File:** `client/src/components/events/SendReminderModal.tsx`

```tsx
interface SendReminderModalProps {
  event: Event;
  registrations: EventRegistration[];
}

// Features:
// - Custom subject line
// - Custom message textarea
// - Recipient filter:
//   - All registered attendees
//   - Only those who haven't checked in yet
//   - Specific attendees (multi-select)
// - Preview email
// - Send button
// - Confirmation: "Sending to X attendees"
```

#### 3. Reminder Status Dashboard
**File:** Update `client/src/pages/EventDetails.tsx`

```tsx
// Add "Reminders" tab to event details
<Tabs>
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="registrations">Registrations</TabsTrigger>
    <TabsTrigger value="reminders">Reminders</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
  
  <TabsContent value="reminders">
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Reminders</CardTitle>
        <Button onClick={() => setShowManualReminderModal(true)}>
          Send Custom Reminder
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Scheduled For</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reminders.map(reminder => (
              <TableRow>
                <TableCell>{reminder.reminderType}</TableCell>
                <TableCell>{formatDate(reminder.scheduledFor)}</TableCell>
                <TableCell>
                  <Badge variant={reminder.status === 'sent' ? 'success' : 'default'}>
                    {reminder.status}
                  </Badge>
                </TableCell>
                <TableCell>{reminder.recipientCount} attendees</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

### Email Templates

**File:** `server/templates/event-reminder-1-week.html`
**File:** `server/templates/event-reminder-3-days.html`
**File:** `server/templates/event-reminder-1-day.html`
**File:** `server/templates/event-reminder-2-hours.html`

Each template includes:
- Event name and date
- Countdown timer
- Venue address with map
- What to bring
- QR code for check-in
- Add to calendar button
- Contact information
- Weather forecast (for 1-day and 2-hour reminders)

### API Endpoints Summary

```
GET    /api/events/:eventId/reminders              # List scheduled reminders
POST   /api/events/:eventId/reminders/send         # Send manual reminder
PATCH  /api/events/:eventId/reminder-settings      # Update settings
GET    /api/reminders/status                       # System-wide reminder status
POST   /api/reminders/process                      # Trigger manual processing (admin)
```

### Testing Checklist

- [ ] Cron job runs every hour
- [ ] Reminders scheduled when event published
- [ ] 1-week reminder sent correctly
- [ ] 3-day reminder sent correctly
- [ ] 1-day reminder sent correctly
- [ ] 2-hour reminder sent correctly
- [ ] Reminders not sent to cancelled registrations
- [ ] Manual reminder can be sent
- [ ] Reminder settings can be updated
- [ ] Email templates render correctly
- [ ] QR codes included in emails
- [ ] Calendar links work
- [ ] Weather forecast included (when applicable)
- [ ] Reminder status tracked in database
- [ ] Failed reminders logged and retried

---

## Feature 4: Export Attendee Lists

### Backend Implementation

#### 1. Export Service
**File:** `server/services/exportService.ts`

```typescript
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ExportService {
  async exportAttendeesToExcel(eventId: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendees');
    
    // Headers
    worksheet.columns = [
      { header: 'Registration #', key: 'bookingReference', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Tickets', key: 'numberOfAttendees', width: 10 },
      { header: 'Amount Paid', key: 'amountPaid', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Registration Date', key: 'registeredAt', width: 20 },
      { header: 'Check-in Status', key: 'attendanceStatus', width: 15 },
      { header: 'Check-in Time', key: 'checkedInAt', width: 20 },
      { header: 'Special Requirements', key: 'specialRequirements', width: 40 },
    ];
    
    // Get registrations
    const registrations = await getEventRegistrations(eventId);
    
    // Add rows
    registrations.forEach(reg => {
      worksheet.addRow({
        bookingReference: reg.bookingReference,
        name: reg.primaryContactName,
        email: reg.primaryContactEmail,
        phone: reg.primaryContactPhone,
        numberOfAttendees: reg.numberOfAttendees,
        amountPaid: `₹${(reg.totalInPaisa / 100).toFixed(2)}`,
        paymentStatus: reg.paymentStatus,
        registeredAt: formatDate(reg.registeredAt),
        attendanceStatus: reg.attendanceStatus,
        checkedInAt: reg.checkedInAt ? formatDate(reg.checkedInAt) : '-',
        specialRequirements: reg.specialRequirements || '-',
      });
    });
    
    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Summary at bottom
    const summaryRow = worksheet.rowCount + 2;
    worksheet.getCell(`A${summaryRow}`).value = 'Summary';
    worksheet.getCell(`A${summaryRow}`).font = { bold: true };
    worksheet.getCell(`A${summaryRow + 1}`).value = 'Total Registrations:';
    worksheet.getCell(`B${summaryRow + 1}`).value = registrations.length;
    worksheet.getCell(`A${summaryRow + 2}`).value = 'Checked In:';
    worksheet.getCell(`B${summaryRow + 2}`).value = 
      registrations.filter(r => r.attendanceStatus === 'checked_in').length;
    worksheet.getCell(`A${summaryRow + 3}`).value = 'Total Revenue:';
    worksheet.getCell(`B${summaryRow + 3}`).value = 
      `₹${(registrations.reduce((sum, r) => sum + r.totalInPaisa, 0) / 100).toFixed(2)}`;
    
    return await workbook.xlsx.writeBuffer();
  }

  async exportAttendeesToPDF(eventId: string): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    const event = await getEvent(eventId);
    const registrations = await getEventRegistrations(eventId);
    
    // Header
    doc.fontSize(20).text(event.title, { align: 'center' });
    doc.fontSize(12).text(`Attendee List - ${formatDate(event.eventDate)}`, { align: 'center' });
    doc.moveDown();
    
    // Summary boxes
    doc.fontSize(10);
    const boxY = doc.y;
    doc.rect(50, boxY, 150, 60).stroke();
    doc.text('Total Registrations', 60, boxY + 10);
    doc.fontSize(24).text(registrations.length.toString(), 60, boxY + 25);
    
    doc.rect(220, boxY, 150, 60).stroke();
    doc.fontSize(10).text('Checked In', 230, boxY + 10);
    doc.fontSize(24).text(
      registrations.filter(r => r.attendanceStatus === 'checked_in').length.toString(),
      230, boxY + 25
    );
    
    doc.rect(390, boxY, 150, 60).stroke();
    doc.fontSize(10).text('Total Revenue', 400, boxY + 10);
    doc.fontSize(16).text(
      `₹${(registrations.reduce((sum, r) => sum + r.totalInPaisa, 0) / 100).toFixed(2)}`,
      400, boxY + 25
    );
    
    doc.moveDown(5);
    
    // Table
    doc.fontSize(10);
    const tableTop = doc.y;
    const itemHeight = 25;
    
    // Headers
    doc.font('Helvetica-Bold');
    doc.text('Name', 50, tableTop);
    doc.text('Email', 200, tableTop);
    doc.text('Phone', 350, tableTop);
    doc.text('Status', 480, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    
    // Rows
    doc.font('Helvetica');
    let currentY = tableTop + 20;
    
    registrations.forEach((reg, i) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }
      
      doc.text(reg.primaryContactName, 50, currentY, { width: 140 });
      doc.text(reg.primaryContactEmail, 200, currentY, { width: 140 });
      doc.text(reg.primaryContactPhone, 350, currentY);
      doc.text(reg.attendanceStatus === 'checked_in' ? '✓' : '-', 480, currentY);
      
      currentY += itemHeight;
    });
    
    doc.end();
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  async exportCheckInSheet(eventId: string): Promise<Buffer> {
    // Simple PDF with large checkboxes for manual check-in
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    const event = await getEvent(eventId);
    const registrations = await getEventRegistrations(eventId);
    
    doc.fontSize(16).text(`${event.title} - Check-In Sheet`, { align: 'center' });
    doc.fontSize(10).text(formatDate(event.eventDate), { align: 'center' });
    doc.moveDown(2);
    
    registrations.forEach((reg, index) => {
      const y = doc.y;
      
      // Checkbox
      doc.rect(50, y, 15, 15).stroke();
      
      // Name and details
      doc.fontSize(12).text(reg.primaryContactName, 75, y);
      doc.fontSize(9).text(reg.primaryContactEmail, 75, y + 12);
      doc.text(`${reg.numberOfAttendees} ticket(s)`, 400, y + 5);
      
      doc.moveDown(2);
      
      if (doc.y > 750) {
        doc.addPage();
      }
    });
    
    doc.end();
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
}
```

#### 2. Export API Endpoints
**File:** `server/routes/events.routes.ts`

```typescript
// GET /api/events/:eventId/export/attendees?format=excel
router.get('/:eventId/export/attendees', async (req, res) => {
  const { format = 'excel' } = req.query;
  const eventId = req.params.eventId;
  
  // Validate ownership
  const event = await getEvent(eventId);
  if (!canUserManageEvent(req.user, event)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const exportService = new ExportService();
  
  try {
    let buffer: Buffer;
    let filename: string;
    let mimeType: string;
    
    if (format === 'excel') {
      buffer = await exportService.exportAttendeesToExcel(eventId);
      filename = `${slugify(event.title)}-attendees-${Date.now()}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'pdf') {
      buffer = await exportService.exportAttendeesToPDF(eventId);
      filename = `${slugify(event.title)}-attendees-${Date.now()}.pdf`;
      mimeType = 'application/pdf';
    } else if (format === 'checkin') {
      buffer = await exportService.exportCheckInSheet(eventId);
      filename = `${slugify(event.title)}-checkin-sheet-${Date.now()}.pdf`;
      mimeType = 'application/pdf';
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export attendee list' });
  }
});

// GET /api/events/:eventId/export/report
router.get('/:eventId/export/report', async (req, res) => {
  // Comprehensive event report with analytics
  const report = await generateEventReport(eventId);
  // Return PDF with charts, stats, attendee list, revenue breakdown
});
```

### Frontend Implementation

#### 1. Export Button Component
**File:** `client/src/components/events/ExportAttendees.tsx`

```tsx
export function ExportAttendees({ eventId }: { eventId: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'excel' | 'pdf' | 'checkin'>('excel');
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/events/${eventId}/export/attendees?format=${format}`,
        { method: 'GET' }
      );
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendees-${eventId}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Attendee list downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Could not download attendee list',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export Attendees'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => { setFormat('excel'); handleExport(); }}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setFormat('pdf'); handleExport(); }}>
          <FileText className="mr-2 h-4 w-4" />
          PDF Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setFormat('checkin'); handleExport(); }}>
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Check-In Sheet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 2. Add to Event Management Pages
**File:** Update `client/src/pages/EventCheckIn.tsx`

```tsx
// Add export button to header
<div className="flex items-center justify-between">
  <h1>Check-In: {event.title}</h1>
  <div className="flex gap-2">
    <ExportAttendees eventId={eventId} />
    <Button onClick={() => startScanning()}>
      <QrCode className="mr-2" />
      Scan QR Code
    </Button>
  </div>
</div>
```

### Required npm Packages

```bash
npm install exceljs pdfkit @types/pdfkit
```

### API Endpoints Summary

```
GET    /api/events/:eventId/export/attendees?format=excel|pdf|checkin
GET    /api/events/:eventId/export/report  # Full event report (bonus)
```

### Testing Checklist

- [ ] Excel export includes all attendee data
- [ ] Excel export has proper formatting
- [ ] Excel export includes summary section
- [ ] PDF export renders correctly
- [ ] PDF export handles pagination
- [ ] Check-in sheet has large checkboxes
- [ ] Check-in sheet is printer-friendly
- [ ] Only event owner can export
- [ ] Export handles large attendee lists (500+)
- [ ] Downloads work on all browsers
- [ ] File naming is descriptive
- [ ] Empty events export gracefully

---

## Implementation Order

### Week 1: Foundation
**Days 1-2:**
1. Database schema updates
2. Export attendee lists (easiest, most needed)
3. Install required packages (exceljs, pdfkit)

**Days 3-4:**
4. Mark event complete
5. Certificate generation system
6. Post-event emails

### Week 2: Advanced Features
**Days 5-6:**
7. Automated reminder system
8. Reminder scheduling (cron job)
9. Reminder email templates

**Days 7-8:**
10. Reschedule event functionality
11. Cancel event functionality
12. Refund processing for cancellations

### Week 3: Polish & Testing
**Days 9-10:**
13. Frontend components for all features
14. Integration testing
15. Email template design and testing
16. Bug fixes and optimization

---

## Dependencies & Packages

```bash
# Install required packages
npm install exceljs pdfkit @types/pdfkit node-cron @types/node-cron
```

---

## Environment Variables

```env
# Add to .env if not present
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
CLOUDINARY_CLOUD_NAME=your_cloud_name  # For certificate images
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Success Metrics

After implementation, track:
- **Completion Rate:** % of events marked complete within 24 hours
- **Certificate Downloads:** % of attendees who download certificate
- **Reminder Open Rates:** Email open rate for each reminder type
- **Cancellation Impact:** % of events rescheduled vs cancelled
- **Export Usage:** How often salons export attendee lists
- **No-Show Reduction:** Before/after reminder system implementation

---

## Risk Mitigation

1. **Email Delivery Issues**
   - Use SendGrid with dedicated IP
   - Implement retry logic
   - Monitor delivery rates
   - Fallback to SMS for critical reminders

2. **Large File Exports**
   - Implement streaming for 1000+ attendees
   - Add progress indicators
   - Consider async generation with download link

3. **Cron Job Reliability**
   - Use PM2 or supervisor for process management
   - Add monitoring/alerts for failed jobs
   - Log all reminder sends

4. **Refund Processing Delays**
   - Clear communication about 5-7 day timeline
   - Razorpay webhook handling for status updates
   - Retry failed refunds automatically

---

## Next Steps After Phase 2

Once these high-priority features are complete, consider:
- Waitlist management system
- Recurring event series
- Multi-day events
- Event merchandise/add-ons
- Live streaming integration
- Post-event community features
