import { db } from '../db';
import { 
  customerImportBatches, 
  importedCustomers, 
  InsertCustomerImportBatch, 
  InsertImportedCustomer,
  IMPORT_BATCH_STATUSES,
  IMPORTED_CUSTOMER_STATUSES
} from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { normalizePhoneNumber, isValidPhoneNumber } from './twilioService';
import { z } from 'zod';

const importRowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).transform(s => s.trim()),
  phone: z.string().min(10, 'Phone number too short').max(20),
  email: z.string().email('Invalid email format').optional().or(z.literal('')).transform(s => s || null),
});

export interface ImportError {
  rowNumber: number;
  originalData: Record<string, string>;
  errors: string[];
}

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: ImportError[];
  preview: Array<{
    rowNumber: number;
    name: string;
    phone: string;
    normalizedPhone: string;
    email: string | null;
    isDuplicate: boolean;
    isValid: boolean;
  }>;
}

export interface ImportResult {
  batchId: string;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  duplicateSkipped: number;
  errors: ImportError[];
}

export interface ColumnMapping {
  nameColumn: string;
  phoneColumn: string;
  emailColumn?: string;
}

export function parseCSVContent(content: string): Array<Record<string, string>> {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = parseCSVLine(lines[0]);
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

export function detectColumns(headers: string[]): ColumnMapping | null {
  const namePatterns = ['name', 'customer_name', 'customer name', 'full_name', 'full name', 'client_name', 'client name'];
  const phonePatterns = ['phone', 'mobile', 'phone_number', 'phone number', 'mobile_number', 'mobile number', 'contact', 'cell'];
  const emailPatterns = ['email', 'email_address', 'email address', 'e-mail'];

  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  
  let nameColumn = headers.find((_, i) => namePatterns.some(p => lowerHeaders[i].includes(p)));
  let phoneColumn = headers.find((_, i) => phonePatterns.some(p => lowerHeaders[i].includes(p)));
  let emailColumn = headers.find((_, i) => emailPatterns.some(p => lowerHeaders[i].includes(p)));

  if (!nameColumn || !phoneColumn) {
    return null;
  }

  return {
    nameColumn,
    phoneColumn,
    emailColumn,
  };
}

export async function previewImport(
  salonId: string,
  rows: Array<Record<string, string>>,
  mapping: ColumnMapping,
  maxPreviewRows: number = 10
): Promise<ImportPreview> {
  const errors: ImportError[] = [];
  const preview: ImportPreview['preview'] = [];
  let validRows = 0;
  let invalidRows = 0;
  let duplicateRows = 0;

  const existingPhones = await getExistingPhones(salonId);
  const seenPhones = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;
    
    const rawData = {
      name: row[mapping.nameColumn] || '',
      phone: row[mapping.phoneColumn] || '',
      email: mapping.emailColumn ? row[mapping.emailColumn] || '' : '',
    };

    const rowErrors: string[] = [];
    let normalizedPhone = '';
    let isValid = true;
    let isDuplicate = false;

    if (!rawData.name.trim()) {
      rowErrors.push('Name is required');
      isValid = false;
    }

    if (!rawData.phone.trim()) {
      rowErrors.push('Phone number is required');
      isValid = false;
    } else {
      try {
        normalizedPhone = normalizePhoneNumber(rawData.phone);
        
        if (existingPhones.has(normalizedPhone)) {
          isDuplicate = true;
          duplicateRows++;
        } else if (seenPhones.has(normalizedPhone)) {
          isDuplicate = true;
          duplicateRows++;
        } else {
          seenPhones.add(normalizedPhone);
        }
      } catch (e: any) {
        rowErrors.push(e.message || 'Invalid phone number format');
        isValid = false;
      }
    }

    if (rawData.email && rawData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawData.email.trim())) {
        rowErrors.push('Invalid email format');
        isValid = false;
      }
    }

    if (!isValid) {
      invalidRows++;
      errors.push({
        rowNumber,
        originalData: rawData,
        errors: rowErrors,
      });
    } else if (!isDuplicate) {
      validRows++;
    }

    if (preview.length < maxPreviewRows) {
      preview.push({
        rowNumber,
        name: rawData.name.trim(),
        phone: rawData.phone.trim(),
        normalizedPhone,
        email: rawData.email?.trim() || null,
        isDuplicate,
        isValid: isValid && !isDuplicate,
      });
    }
  }

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    duplicateRows,
    errors: errors.slice(0, 100),
    preview,
  };
}

async function getExistingPhones(salonId: string): Promise<Set<string>> {
  const existing = await db
    .select({ normalizedPhone: importedCustomers.normalizedPhone })
    .from(importedCustomers)
    .where(eq(importedCustomers.salonId, salonId));
  
  return new Set(existing.map(e => e.normalizedPhone));
}

export async function executeImport(
  salonId: string,
  userId: string,
  fileName: string,
  rows: Array<Record<string, string>>,
  mapping: ColumnMapping
): Promise<ImportResult> {
  const [batch] = await db.insert(customerImportBatches).values({
    salonId,
    importedBy: userId,
    fileName,
    totalRecords: rows.length,
    status: IMPORT_BATCH_STATUSES.PROCESSING,
  }).returning();

  const errors: ImportError[] = [];
  let successfulImports = 0;
  let failedImports = 0;
  let duplicateSkipped = 0;

  const existingPhones = await getExistingPhones(salonId);
  const seenPhones = new Set<string>();

  const BATCH_SIZE = 100;
  
  for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
    const batchRows = rows.slice(batchStart, batchStart + BATCH_SIZE);
    const validRecords: InsertImportedCustomer[] = [];

    for (let i = 0; i < batchRows.length; i++) {
      const row = batchRows[i];
      const rowNumber = batchStart + i + 2;
      
      const rawData = {
        name: row[mapping.nameColumn] || '',
        phone: row[mapping.phoneColumn] || '',
        email: mapping.emailColumn ? row[mapping.emailColumn] || '' : '',
      };

      const rowErrors: string[] = [];
      let normalizedPhone = '';
      let isValid = true;

      if (!rawData.name.trim()) {
        rowErrors.push('Name is required');
        isValid = false;
      }

      if (!rawData.phone.trim()) {
        rowErrors.push('Phone number is required');
        isValid = false;
      } else {
        try {
          normalizedPhone = normalizePhoneNumber(rawData.phone);
        } catch (e: any) {
          rowErrors.push(e.message || 'Invalid phone number format');
          isValid = false;
        }
      }

      if (rawData.email && rawData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawData.email.trim())) {
          rowErrors.push('Invalid email format');
          isValid = false;
        }
      }

      if (!isValid) {
        failedImports++;
        errors.push({
          rowNumber,
          originalData: rawData,
          errors: rowErrors,
        });
        continue;
      }

      if (existingPhones.has(normalizedPhone) || seenPhones.has(normalizedPhone)) {
        duplicateSkipped++;
        continue;
      }

      seenPhones.add(normalizedPhone);
      validRecords.push({
        salonId,
        importBatchId: batch.id,
        customerName: rawData.name.trim(),
        phone: rawData.phone.trim(),
        email: rawData.email?.trim() || null,
        normalizedPhone,
        status: IMPORTED_CUSTOMER_STATUSES.PENDING,
      });
    }

    if (validRecords.length > 0) {
      try {
        await db.insert(importedCustomers).values(validRecords);
        successfulImports += validRecords.length;
      } catch (e: any) {
        console.error('Batch insert error:', e);
        failedImports += validRecords.length;
        errors.push({
          rowNumber: batchStart + 2,
          originalData: { batch: `Rows ${batchStart + 2} - ${batchStart + batchRows.length + 1}` },
          errors: [`Batch insert failed: ${e.message}`],
        });
      }
    }
  }

  await db.update(customerImportBatches)
    .set({
      status: IMPORT_BATCH_STATUSES.COMPLETED,
      successfulImports,
      failedImports,
      duplicateSkipped,
      errorLog: errors.length > 0 ? errors : null,
      completedAt: new Date(),
    })
    .where(eq(customerImportBatches.id, batch.id));

  return {
    batchId: batch.id,
    totalRecords: rows.length,
    successfulImports,
    failedImports,
    duplicateSkipped,
    errors,
  };
}

export async function getImportBatches(salonId: string) {
  return db
    .select()
    .from(customerImportBatches)
    .where(eq(customerImportBatches.salonId, salonId))
    .orderBy(sql`${customerImportBatches.createdAt} DESC`);
}

export async function getImportBatch(batchId: string) {
  const [batch] = await db
    .select()
    .from(customerImportBatches)
    .where(eq(customerImportBatches.id, batchId));
  return batch;
}

export async function getImportedCustomers(
  salonId: string,
  options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { status, search, page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  const whereCondition = status 
    ? and(eq(importedCustomers.salonId, salonId), eq(importedCustomers.status, status))
    : eq(importedCustomers.salonId, salonId);

  const results = await db
    .select()
    .from(importedCustomers)
    .where(whereCondition)
    .orderBy(sql`${importedCustomers.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(importedCustomers)
    .where(whereCondition);

  return {
    customers: results,
    total: Number(countResult?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult?.count || 0) / limit),
  };
}

export async function findImportedCustomerByPhone(normalizedPhone: string): Promise<{
  customer: typeof importedCustomers.$inferSelect | null;
  salonId: string | null;
}> {
  const [customer] = await db
    .select()
    .from(importedCustomers)
    .where(eq(importedCustomers.normalizedPhone, normalizedPhone))
    .limit(1);

  return {
    customer: customer || null,
    salonId: customer?.salonId || null,
  };
}

export async function linkCustomerToUser(
  importedCustomerId: string,
  userId: string
): Promise<void> {
  await db.update(importedCustomers)
    .set({
      linkedUserId: userId,
      status: IMPORTED_CUSTOMER_STATUSES.REGISTERED,
      registeredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(importedCustomers.id, importedCustomerId));
}

export async function updateCustomerStatus(
  customerId: string,
  status: string
): Promise<void> {
  await db.update(importedCustomers)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === IMPORTED_CUSTOMER_STATUSES.INVITED ? { invitedAt: new Date() } : {}),
    })
    .where(eq(importedCustomers.id, customerId));
}
