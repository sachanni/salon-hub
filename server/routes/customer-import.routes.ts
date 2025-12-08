import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db } from '../db';
import {
  customerImportBatches,
  importedCustomers,
  welcomeOffers,
  invitationCampaigns,
  invitationMessages,
  welcomeOfferRedemptions,
  IMPORT_BATCH_STATUSES,
  IMPORTED_CUSTOMER_STATUSES,
} from '@shared/schema';
import { eq, and, desc, sql, gte, lte, count, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { requireSalonAccess, populateUserFromSession, type AuthenticatedRequest } from '../middleware/auth';
import {
  parseCSVContent,
  detectColumns,
  previewImport,
  executeImport,
  getImportBatches,
  getImportBatch,
  getImportedCustomers,
  findImportedCustomerByPhone,
  linkCustomerToUser,
  updateCustomerStatus,
  type ColumnMapping,
  type ImportPreview,
} from '../services/customerImportService';
import { normalizePhoneNumber } from '../services/twilioService';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['text/csv', 'application/csv', 'text/plain'];
    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

router.use(populateUserFromSession);

const columnMappingSchema = z.object({
  nameColumn: z.string().min(1),
  phoneColumn: z.string().min(1),
  emailColumn: z.string().optional(),
});

router.post(
  '/:salonId/customers/import/preview',
  requireSalonAccess(['owner', 'shop_admin']),
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const content = file.buffer.toString('utf-8');
      let rows: Array<Record<string, string>>;
      
      try {
        rows = parseCSVContent(content);
      } catch (e: any) {
        return res.status(400).json({ error: e.message || 'Failed to parse CSV file' });
      }

      if (rows.length === 0) {
        return res.status(400).json({ error: 'CSV file is empty' });
      }

      if (rows.length > 10000) {
        return res.status(400).json({ error: 'CSV file exceeds maximum of 10,000 rows' });
      }

      const headers = Object.keys(rows[0]);
      const detectedMapping = detectColumns(headers);

      let mapping: ColumnMapping;
      if (req.body.mapping) {
        try {
          mapping = columnMappingSchema.parse(JSON.parse(req.body.mapping));
        } catch (e) {
          return res.status(400).json({ error: 'Invalid column mapping provided' });
        }
      } else if (detectedMapping) {
        mapping = detectedMapping;
      } else {
        return res.status(400).json({
          error: 'Could not auto-detect columns. Please provide column mapping.',
          headers,
          hint: 'Required columns: name, phone. Optional: email',
        });
      }

      const preview = await previewImport(salonId, rows, mapping, 20);

      res.json({
        fileName: file.originalname,
        headers,
        detectedMapping,
        mapping,
        preview,
        rowCount: rows.length,
      });
    } catch (error: any) {
      console.error('CSV preview error:', error);
      res.status(500).json({ error: error.message || 'Failed to preview import' });
    }
  }
);

router.post(
  '/:salonId/customers/import',
  requireSalonAccess(['owner', 'shop_admin']),
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;
      const userId = req.user?.id;
      const file = req.file;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let mapping: ColumnMapping;
      try {
        mapping = columnMappingSchema.parse(JSON.parse(req.body.mapping));
      } catch (e) {
        return res.status(400).json({ error: 'Column mapping is required for import' });
      }

      const content = file.buffer.toString('utf-8');
      let rows: Array<Record<string, string>>;
      
      try {
        rows = parseCSVContent(content);
      } catch (e: any) {
        return res.status(400).json({ error: e.message || 'Failed to parse CSV file' });
      }

      if (rows.length === 0) {
        return res.status(400).json({ error: 'CSV file is empty' });
      }

      if (rows.length > 10000) {
        return res.status(400).json({ error: 'CSV file exceeds maximum of 10,000 rows' });
      }

      const result = await executeImport(salonId, userId, file.originalname, rows, mapping);

      res.json({
        success: true,
        batchId: result.batchId,
        totalRecords: result.totalRecords,
        successfulImports: result.successfulImports,
        failedImports: result.failedImports,
        duplicateSkipped: result.duplicateSkipped,
        errors: result.errors.slice(0, 50),
      });
    } catch (error: any) {
      console.error('CSV import error:', error);
      res.status(500).json({ error: error.message || 'Failed to import customers' });
    }
  }
);

router.get(
  '/:salonId/customers/import/batches',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;
      const batches = await getImportBatches(salonId);
      res.json(batches);
    } catch (error: any) {
      console.error('Get import batches error:', error);
      res.status(500).json({ error: 'Failed to fetch import batches' });
    }
  }
);

router.get(
  '/:salonId/customers/import/batches/:batchId',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { batchId } = req.params;
      const batch = await getImportBatch(batchId);
      
      if (!batch) {
        return res.status(404).json({ error: 'Import batch not found' });
      }

      res.json(batch);
    } catch (error: any) {
      console.error('Get import batch error:', error);
      res.status(500).json({ error: 'Failed to fetch import batch' });
    }
  }
);

router.get(
  '/:salonId/customers/imported',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;
      const { status, search, page = '1', limit = '50' } = req.query;

      const result = await getImportedCustomers(salonId, {
        status: status as string | undefined,
        search: search as string | undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json(result);
    } catch (error: any) {
      console.error('Get imported customers error:', error);
      res.status(500).json({ error: 'Failed to fetch imported customers' });
    }
  }
);

router.delete(
  '/:salonId/customers/imported/:customerId',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, customerId } = req.params;

      const [customer] = await db
        .select()
        .from(importedCustomers)
        .where(and(
          eq(importedCustomers.id, customerId),
          eq(importedCustomers.salonId, salonId)
        ));

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      await db.delete(importedCustomers).where(eq(importedCustomers.id, customerId));

      res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error: any) {
      console.error('Delete imported customer error:', error);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  }
);

router.get(
  '/:salonId/customers/import/stats',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(importedCustomers)
        .where(eq(importedCustomers.salonId, salonId));

      const [weekResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(importedCustomers)
        .where(and(
          eq(importedCustomers.salonId, salonId),
          gte(importedCustomers.createdAt, weekAgo)
        ));

      const [monthResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(importedCustomers)
        .where(and(
          eq(importedCustomers.salonId, salonId),
          gte(importedCustomers.createdAt, monthAgo)
        ));

      const statusCounts = await db
        .select({
          status: importedCustomers.status,
          count: sql<number>`count(*)`,
        })
        .from(importedCustomers)
        .where(eq(importedCustomers.salonId, salonId))
        .groupBy(importedCustomers.status);

      const statusMap = statusCounts.reduce((acc, { status, count }) => {
        acc[status] = Number(count);
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalImported: Number(totalResult?.count || 0),
        importedThisWeek: Number(weekResult?.count || 0),
        importedThisMonth: Number(monthResult?.count || 0),
        byStatus: {
          pending: statusMap.pending || 0,
          invited: statusMap.invited || 0,
          registered: statusMap.registered || 0,
          expired: statusMap.expired || 0,
        },
        conversionRate: statusMap.registered 
          ? ((statusMap.registered / Number(totalResult?.count || 1)) * 100).toFixed(1)
          : '0.0',
      });
    } catch (error: any) {
      console.error('Get import stats error:', error);
      res.status(500).json({ error: 'Failed to fetch import statistics' });
    }
  }
);

export function registerCustomerImportRoutes(app: any) {
  app.use('/api/salons', router);
}

export default router;
