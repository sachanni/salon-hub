import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { db } from '../db';
import { events, eventRegistrations } from '../../shared/schema';
import { eq, and, ne } from 'drizzle-orm';

interface AttendeeExportData {
  bookingReference: string;
  name: string;
  email: string;
  phone: string;
  amountPaid: string;
  paymentStatus: string;
  registeredAt: string;
  checkedInAt: string;
  specialRequirements: string;
}

export class ExportService {
  private formatDate(dateStr: string | null, timeStr?: string | null): string {
    if (!dateStr) return '-';
    
    if (timeStr) {
      try {
        const [year, month, day] = dateStr.split('-');
        const [hour, minute] = timeStr.split(':');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        return date.toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return dateStr;
      }
    }
    
    return dateStr;
  }

  private formatTimestamp(date: Date | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatCurrency(amountInPaisa: number): string {
    return `₹${(amountInPaisa / 100).toFixed(2)}`;
  }

  async getEventWithRegistrations(eventId: string) {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      const error = new Error('Event not found') as Error & { statusCode?: number };
      error.statusCode = 404;
      throw error;
    }

    const registrations = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          ne(eventRegistrations.status, 'cancelled')
        )
      );

    return { event, registrations };
  }

  async exportAttendeesToExcel(eventId: string): Promise<Buffer> {
    const { event, registrations } = await this.getEventWithRegistrations(eventId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendees');

    worksheet.columns = [
      { header: 'Booking ID', key: 'bookingReference', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Amount Paid', key: 'amountPaid', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Registered', key: 'registeredAt', width: 20 },
      { header: 'Checked In', key: 'checkedInAt', width: 20 },
      { header: 'Special Requirements', key: 'specialRequirements', width: 40 },
    ];

    worksheet.insertRow(1, [`${event.title} - Attendee List`]);
    worksheet.mergeCells('A1:I1');
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    worksheet.insertRow(2, [`Event Date: ${this.formatDate(event.startDate, event.startTime)}`]);
    worksheet.mergeCells('A2:I2');
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    worksheet.insertRow(3, []);

    const headerRow = worksheet.getRow(4);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    registrations.forEach(reg => {
      const rowData: AttendeeExportData = {
        bookingReference: reg.bookingId,
        name: reg.attendeeName,
        email: reg.attendeeEmail,
        phone: reg.attendeePhone,
        amountPaid: this.formatCurrency(reg.totalAmountPaisa),
        paymentStatus: reg.paymentStatus || '-',
        registeredAt: this.formatTimestamp(reg.createdAt),
        checkedInAt: this.formatTimestamp(reg.checkedInAt),
        specialRequirements: reg.specialRequirements || '-',
      };
      
      const row = worksheet.addRow(rowData);
      
      if (row.number % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };
      }
    });

    const summaryStartRow = worksheet.rowCount + 3;
    
    worksheet.getCell(`A${summaryStartRow}`).value = 'Summary';
    worksheet.getCell(`A${summaryStartRow}`).font = { bold: true, size: 14 };
    
    const checkedInCount = registrations.filter(r => r.checkedInAt !== null).length;
    const totalRevenue = registrations.reduce((sum, r) => sum + r.totalAmountPaisa, 0);
    
    worksheet.getCell(`A${summaryStartRow + 1}`).value = 'Total Registrations:';
    worksheet.getCell(`B${summaryStartRow + 1}`).value = registrations.length;
    worksheet.getCell(`B${summaryStartRow + 1}`).font = { bold: true };
    
    worksheet.getCell(`A${summaryStartRow + 2}`).value = 'Checked In:';
    worksheet.getCell(`B${summaryStartRow + 2}`).value = checkedInCount;
    worksheet.getCell(`B${summaryStartRow + 2}`).font = { bold: true };
    
    worksheet.getCell(`A${summaryStartRow + 3}`).value = 'Attendance Rate:';
    worksheet.getCell(`B${summaryStartRow + 3}`).value = 
      `${registrations.length > 0 ? ((checkedInCount / registrations.length) * 100).toFixed(1) : 0}%`;
    worksheet.getCell(`B${summaryStartRow + 3}`).font = { bold: true };
    
    worksheet.getCell(`A${summaryStartRow + 4}`).value = 'Total Revenue:';
    worksheet.getCell(`B${summaryStartRow + 4}`).value = this.formatCurrency(totalRevenue);
    worksheet.getCell(`B${summaryStartRow + 4}`).font = { bold: true, color: { argb: 'FF059669' } };

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 4) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportAttendeesToPDF(eventId: string): Promise<Buffer> {
    const { event, registrations } = await this.getEventWithRegistrations(eventId);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        info: {
          Title: `${event.title} - Attendee List`,
          Author: 'SalonHub',
          Subject: 'Event Attendee Report'
        }
      });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).font('Helvetica-Bold').text(event.title, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(
        `Attendee List - ${this.formatDate(event.startDate, event.startTime)}`, 
        { align: 'center' }
      );
      doc.moveDown(2);

      const checkedInCount = registrations.filter(r => r.checkedInAt !== null).length;
      const totalRevenue = registrations.reduce((sum, r) => sum + r.totalAmountPaisa, 0);
      
      const boxY = doc.y;
      const boxWidth = 150;
      const boxHeight = 60;
      const spacing = 20;

      doc.rect(50, boxY, boxWidth, boxHeight).stroke();
      doc.fontSize(10).font('Helvetica').text('Total Registrations', 60, boxY + 10);
      doc.fontSize(24).font('Helvetica-Bold').text(registrations.length.toString(), 60, boxY + 28);

      doc.rect(50 + boxWidth + spacing, boxY, boxWidth, boxHeight).stroke();
      doc.fontSize(10).font('Helvetica').text('Checked In', 60 + boxWidth + spacing, boxY + 10);
      doc.fontSize(24).font('Helvetica-Bold').text(checkedInCount.toString(), 60 + boxWidth + spacing, boxY + 28);

      doc.rect(50 + (boxWidth + spacing) * 2, boxY, boxWidth, boxHeight).stroke();
      doc.fontSize(10).font('Helvetica').text('Total Revenue', 60 + (boxWidth + spacing) * 2, boxY + 10);
      doc.fontSize(16).font('Helvetica-Bold').text(
        this.formatCurrency(totalRevenue),
        60 + (boxWidth + spacing) * 2, 
        boxY + 28
      );

      doc.moveDown(5);

      const tableTop = doc.y;
      const rowHeight = 25;
      
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Name', 50, tableTop);
      doc.text('Email', 200, tableTop);
      doc.text('Phone', 350, tableTop);
      doc.text('Status', 480, tableTop);
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      doc.font('Helvetica').fontSize(9);
      let currentY = tableTop + 20;

      registrations.forEach((reg, index) => {
        if (currentY > 720) {
          doc.addPage();
          currentY = 50;
          
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Name', 50, currentY);
          doc.text('Email', 200, currentY);
          doc.text('Phone', 350, currentY);
          doc.text('Status', 480, currentY);
          
          doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).stroke();
          
          currentY += 20;
          doc.font('Helvetica').fontSize(9);
        }

        if (index % 2 === 1) {
          doc.rect(50, currentY - 2, 500, rowHeight).fill('#F3F4F6').stroke();
        }

        const isCheckedIn = reg.checkedInAt !== null;
        
        doc.fillColor('#000000');
        doc.text(reg.attendeeName, 50, currentY, { width: 140, ellipsis: true });
        doc.text(reg.attendeeEmail, 200, currentY, { width: 140, ellipsis: true });
        doc.text(reg.attendeePhone, 350, currentY);
        doc.fillColor(isCheckedIn ? '#059669' : '#6B7280');
        doc.text(isCheckedIn ? '✓ Checked In' : 'Registered', 480, currentY);
        doc.fillColor('#000000');

        currentY += rowHeight;
      });

      doc.fontSize(8).fillColor('#6B7280');
      doc.text(
        `Generated on ${new Date().toLocaleString('en-IN')} | SalonHub Event Management`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();
    });
  }

  async exportCheckInSheet(eventId: string): Promise<Buffer> {
    const { event, registrations } = await this.getEventWithRegistrations(eventId);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).font('Helvetica-Bold').text(event.title, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Check-In Sheet', { align: 'center' });
      doc.fontSize(10).text(this.formatDate(event.startDate, event.startTime), { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(9).fillColor('#6B7280');
      doc.text('Instructions: Check the box as each attendee arrives. Verify their name and booking ID.', {
        align: 'left'
      });
      doc.moveDown();
      doc.fillColor('#000000');

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Total Expected: ${registrations.length} attendee(s)`);
      doc.moveDown();

      registrations.forEach((reg, index) => {
        const y = doc.y;

        if (y > 700) {
          doc.addPage();
          
          doc.fontSize(18).font('Helvetica-Bold').text(event.title, { align: 'center' });
          doc.fontSize(12).font('Helvetica').text('Check-In Sheet (cont.)', { align: 'center' });
          doc.moveDown(2);
        }

        doc.rect(50, doc.y, 20, 20).stroke();

        doc.fontSize(8).fillColor('#6B7280');
        doc.text(`#${index + 1}`, 35, doc.y + 6, { width: 10 });
        doc.fillColor('#000000');

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(reg.attendeeName, 80, doc.y - 14);
        
        doc.fontSize(9).font('Helvetica');
        doc.text(reg.attendeeEmail, 80, doc.y + 2);
        doc.text(`Phone: ${reg.attendeePhone}`, 80, doc.y + 2);
        doc.text(`Booking: ${reg.bookingId}`, 80, doc.y + 2);
        
        doc.moveTo(50, doc.y + 5)
          .lineTo(550, doc.y + 5)
          .strokeColor('#E5E7EB')
          .stroke()
          .strokeColor('#000000');

        doc.moveDown(1.5);
      });

      if (doc.y < 650) {
        doc.moveDown(3);
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Staff Signature:', 50, doc.y);
        doc.moveTo(150, doc.y + 15).lineTo(350, doc.y + 15).stroke();
        
        doc.text('Date & Time:', 380, doc.y - 15);
        doc.moveTo(470, doc.y).lineTo(550, doc.y).stroke();
      }

      doc.end();
    });
  }
}
