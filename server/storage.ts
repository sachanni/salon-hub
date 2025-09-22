import { 
  type User, type InsertUser, type UpsertUser,
  type Service, type InsertService,
  type Booking, type InsertBooking,
  type Payment, type InsertPayment,
  type Salon, type InsertSalon,
  type Role, type InsertRole,
  type Organization, type InsertOrganization,
  type UserRole, type InsertUserRole,
  type OrgUser, type InsertOrgUser,
  type Staff, type InsertStaff,
  type AvailabilityPattern, type InsertAvailabilityPattern,
  type TimeSlot, type InsertTimeSlot,
  type BookingSettings, type InsertBookingSettings,
  type StaffService, type InsertStaffService,
  type Resource, type InsertResource,
  type ServiceResource, type InsertServiceResource,
  type MediaAsset, type InsertMediaAsset,
  type TaxRate, type InsertTaxRate,
  type PayoutAccount, type InsertPayoutAccount,
  type PublishState, type InsertPublishState,
  type CustomerProfile, type InsertCustomerProfile, type UpdateCustomerNotesInput,
  // Financial system types
  type ExpenseCategory, type InsertExpenseCategory,
  type Expense, type InsertExpense,
  type CommissionRate, type InsertCommissionRate,
  type Commission, type InsertCommission,
  type Budget, type InsertBudget,
  type FinancialReport, type InsertFinancialReport,
  type TaxSetting, type InsertTaxSetting,
  // Communication system types
  type MessageTemplate, type InsertMessageTemplate,
  type CustomerSegment, type InsertCustomerSegment,
  type CommunicationCampaign, type InsertCommunicationCampaign,
  type CommunicationHistory, type InsertCommunicationHistory,
  type CommunicationPreferences, type InsertCommunicationPreferences,
  type ScheduledMessage, type InsertScheduledMessage,
  type CommunicationAnalytics, type InsertCommunicationAnalytics,
  // Inventory management system types
  type Vendor, type InsertVendor,
  type ProductCategory, type InsertProductCategory,
  type Product, type InsertProduct,
  type StockMovement, type InsertStockMovement,
  type PurchaseOrder, type InsertPurchaseOrder,
  type PurchaseOrderItem, type InsertPurchaseOrderItem,
  type ProductUsage, type InsertProductUsage,
  type ReorderRule, type InsertReorderRule,
  type InventoryAdjustment, type InsertInventoryAdjustment,
  type InventoryAdjustmentItem, type InsertInventoryAdjustmentItem,
  // A/B testing system types
  type AbTestCampaign, type InsertAbTestCampaign,
  type TestVariant, type InsertTestVariant,
  type TestMetric, type InsertTestMetric,
  type TestResult, type InsertTestResult,
  // A/B testing automation system types
  type AutomationConfiguration, type InsertAutomationConfiguration,
  type VariantGenerationRule, type InsertVariantGenerationRule,
  type PerformanceMonitoringSetting, type InsertPerformanceMonitoringSetting,
  type OptimizationRecommendation, type InsertOptimizationRecommendation,
  type AutomatedActionLog, type InsertAutomatedActionLog,
  type CampaignOptimizationInsight, type InsertCampaignOptimizationInsight,
  users, services, bookings, payments, salons, roles, organizations, userRoles, orgUsers,
  staff, availabilityPatterns, timeSlots, emailVerificationTokens,
  bookingSettings, staffServices, resources, serviceResources, mediaAssets, taxRates, payoutAccounts, publishState, customerProfiles,
  // Financial system tables
  expenseCategories, expenses, commissionRates, commissions, budgets, financialReports, taxSettings,
  // Communication system tables
  messageTemplates, customerSegments, communicationCampaigns, communicationHistory, 
  communicationPreferences, scheduledMessages, communicationAnalytics,
  // Inventory management system tables
  vendors, productCategories, products, stockMovements, purchaseOrders, purchaseOrderItems,
  productUsage, reorderRules, inventoryAdjustments, inventoryAdjustmentItems,
  // A/B testing system tables
  abTestCampaigns, testVariants, testMetrics, testResults,
  // A/B testing automation system tables
  automationConfigurations, variantGenerationRules, performanceMonitoringSettings,
  optimizationRecommendations, automatedActionLogs, campaignOptimizationInsights
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, isNull, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<void>;
  updateUserPreferences(userId: string, preferences: any): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>; // Required for Replit Auth
  
  // Role operations
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  getUserRoles(userId: string): Promise<Role[]>;
  assignUserRole(userId: string, roleId: string): Promise<void>;
  
  // Organization operations
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  addUserToOrganization(orgId: string, userId: string, role: string): Promise<void>;
  getUserOrganizations(userId: string): Promise<Array<{
    orgId: string;
    orgRole: string;
    organization: {
      id: string;
      name: string;
      type: string;
    };
  }>>;
  
  // Salon operations (additional methods)
  getSalonById(id: string): Promise<Salon | undefined>;
  getSalonsByOrgId(orgId: string): Promise<Salon[]>;
  isUserStaffOfSalon(userId: string, salonId: string): Promise<boolean>;
  
  // Email verification operations
  createVerificationToken(email: string, userId: string): Promise<string>;
  verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; userId?: string }>;
  markEmailAsVerified(userId: string): Promise<void>;
  
  // Salon operations
  getSalon(id: string): Promise<Salon | undefined>;
  getAllSalons(): Promise<Salon[]>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  updateSalon(id: string, updates: Partial<InsertSalon>): Promise<void>;
  
  // Service operations
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  getServicesBySalonId(salonId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<InsertService>): Promise<void>;
  deleteService(id: string): Promise<void>;
  
  // Booking operations
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<number>;
  updateBookingStatusWithCustomerValidation(bookingId: string, customerEmail: string, status: string): Promise<void>;
  updateBookingNotes(id: string, notes: string): Promise<number>;
  bulkUpdateBookingStatus(bookingIds: string[], status: string, salonId: string): Promise<number>;
  getBookingsBySalonId(salonId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Booking[]>;
  getCustomersBySalonId(salonId: string): Promise<any[]>;
  getSalonAnalytics(salonId: string, period: string): Promise<any>;
  
  // Conflict detection and rescheduling operations
  computeBookingTimeRange(bookingDate: string, bookingTime: string, durationMinutes: number): { start: Date, end: Date };
  findOverlappingBookings(salonId: string, staffId: string | null, start: Date, end: Date, excludeId?: string): Promise<Booking[]>;
  isStaffAvailable(salonId: string, staffId: string, start: Date, end: Date): Promise<boolean>;
  rescheduleBooking(id: string, fields: { bookingDate: string, bookingTime: string, staffId?: string }): Promise<Booking>;
  
  // Advanced Analytics Methods
  getAdvancedStaffAnalytics(salonId: string, period: string): Promise<any>;
  getClientRetentionAnalytics(salonId: string, period: string): Promise<any>;
  getServicePopularityAnalytics(salonId: string, period: string): Promise<any>;
  getBusinessIntelligenceMetrics(salonId: string, period: string): Promise<any>;
  getCohortAnalysis(salonId: string): Promise<any>;
  getCustomerSegmentation(salonId: string): Promise<any>;
  
  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByBookingId(bookingId: string): Promise<Payment | undefined>;
  getAllPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: string, completedAt?: Date): Promise<void>;
  updatePaymentOrderId(id: string, razorpayOrderId: string): Promise<void>;
  updatePaymentDetails(id: string, razorpayPaymentId: string, razorpaySignature: string): Promise<void>;
  getPaymentByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | undefined>;
  
  // Staff operations
  getStaff(id: string): Promise<Staff | undefined>;
  getStaffBySalonId(salonId: string): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, updates: Partial<InsertStaff>): Promise<void>;
  
  // Availability pattern operations
  getAvailabilityPattern(id: string): Promise<AvailabilityPattern | undefined>;
  getAvailabilityPatternsBySalonId(salonId: string): Promise<AvailabilityPattern[]>;
  getAvailabilityPatternsByStaffId(staffId: string): Promise<AvailabilityPattern[]>;
  createAvailabilityPattern(pattern: InsertAvailabilityPattern): Promise<AvailabilityPattern>;
  updateAvailabilityPattern(id: string, updates: Partial<InsertAvailabilityPattern>): Promise<void>;
  deleteAvailabilityPattern(id: string): Promise<void>;
  
  // Time slot operations
  getTimeSlot(id: string): Promise<TimeSlot | undefined>;
  getTimeSlotsByDateRange(salonId: string, startDate: string, endDate: string): Promise<TimeSlot[]>;
  getAvailableTimeSlots(salonId: string, date: string, staffId?: string): Promise<TimeSlot[]>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: string, updates: Partial<InsertTimeSlot>): Promise<void>;
  blockTimeSlot(id: string): Promise<void>;
  unblockTimeSlot(id: string): Promise<void>;
  
  // Availability generation
  generateTimeSlotsFromPattern(patternId: string, startDate: Date, endDate: Date): Promise<TimeSlot[]>;
  regenerateTimeSlotsForSalon(salonId: string, startDate: Date, endDate: Date): Promise<void>;

  // Business Profile Setup Operations
  
  // Booking settings operations
  getBookingSettings(salonId: string): Promise<BookingSettings | undefined>;
  createBookingSettings(settings: InsertBookingSettings): Promise<BookingSettings>;
  updateBookingSettings(salonId: string, updates: Partial<InsertBookingSettings>): Promise<void>;
  
  // Staff-service operations  
  getStaffService(staffId: string, serviceId: string): Promise<StaffService | undefined>;
  getStaffServicesBySalonId(salonId: string): Promise<StaffService[]>;
  getStaffServicesByStaffId(staffId: string): Promise<StaffService[]>;
  getStaffServicesByServiceId(serviceId: string): Promise<StaffService[]>;
  createStaffService(staffService: InsertStaffService): Promise<StaffService>;
  updateStaffService(staffId: string, serviceId: string, updates: Partial<InsertStaffService>): Promise<void>;
  deleteStaffService(staffId: string, serviceId: string): Promise<void>;
  
  // Resource operations
  getResource(id: string): Promise<Resource | undefined>;
  getResourcesBySalonId(salonId: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: string, salonId: string, updates: Partial<InsertResource>): Promise<void>;
  deleteResource(id: string, salonId: string): Promise<void>;
  
  // Service-resource operations
  getServiceResource(serviceId: string, resourceId: string): Promise<ServiceResource | undefined>;
  getServiceResourcesBySalonId(salonId: string): Promise<ServiceResource[]>;
  getServiceResourcesByServiceId(serviceId: string): Promise<ServiceResource[]>;
  getServiceResourcesByResourceId(resourceId: string): Promise<ServiceResource[]>;
  createServiceResource(serviceResource: InsertServiceResource): Promise<ServiceResource>;
  updateServiceResource(serviceId: string, resourceId: string, updates: Partial<InsertServiceResource>): Promise<void>;
  deleteServiceResource(serviceId: string, resourceId: string): Promise<void>;
  
  // Media asset operations
  getMediaAsset(id: string): Promise<MediaAsset | undefined>;
  getMediaAssetsBySalonId(salonId: string): Promise<MediaAsset[]>;
  getMediaAssetsByType(salonId: string, assetType: string): Promise<MediaAsset[]>;
  createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset>;
  updateMediaAsset(id: string, salonId: string, updates: Partial<InsertMediaAsset>): Promise<void>;
  setPrimaryMediaAsset(salonId: string, assetId: string): Promise<MediaAsset>;
  deleteMediaAsset(id: string, salonId: string): Promise<void>;
  
  // Tax rate operations
  getTaxRate(id: string): Promise<TaxRate | undefined>;
  getTaxRatesBySalonId(salonId: string): Promise<TaxRate[]>;
  getDefaultTaxRate(salonId: string): Promise<TaxRate | undefined>;
  createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate>;
  updateTaxRate(id: string, salonId: string, updates: Partial<InsertTaxRate>): Promise<void>;
  setDefaultTaxRate(salonId: string, taxRateId: string): Promise<void>;
  deleteTaxRate(id: string, salonId: string): Promise<void>;
  
  // Payout account operations
  getPayoutAccount(id: string): Promise<PayoutAccount | undefined>;
  getPayoutAccountsBySalonId(salonId: string): Promise<PayoutAccount[]>;
  getDefaultPayoutAccount(salonId: string): Promise<PayoutAccount | undefined>;
  createPayoutAccount(account: InsertPayoutAccount): Promise<PayoutAccount>;
  updatePayoutAccount(id: string, salonId: string, updates: Partial<InsertPayoutAccount>): Promise<void>;
  setDefaultPayoutAccount(salonId: string, accountId: string): Promise<void>;
  deletePayoutAccount(id: string, salonId: string): Promise<void>;
  
  // Publish state operations
  getPublishState(salonId: string): Promise<PublishState | undefined>;
  createPublishState(state: InsertPublishState): Promise<PublishState>;
  updatePublishState(salonId: string, updates: Partial<InsertPublishState>): Promise<void>;
  checkBusinessReadiness(salonId: string): Promise<{ isReady: boolean; missingRequirements: string[] }>;
  checkDashboardCompletion(salonId: string): Promise<{
    profile: { isComplete: boolean; missingFields?: string[] };
    services: { isComplete: boolean; count: number };
    staff: { isComplete: boolean; count: number };
    settings: { isComplete: boolean; missingFields?: string[] };
    media: { isComplete: boolean; count: number };
    overallProgress: number;
    nextStep?: string;
  }>;
  
  // Customer profile operations
  getCustomerProfile(salonId: string, customerEmail: string): Promise<CustomerProfile | undefined>;
  getCustomerProfileById(id: string): Promise<CustomerProfile | undefined>;
  getOrCreateCustomerProfile(salonId: string, customerEmail: string): Promise<CustomerProfile | undefined>;
  createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile>;
  updateCustomerProfile(id: string, salonId: string, updates: UpdateCustomerNotesInput): Promise<void>;
  getCustomerBookingHistory(salonId: string, customerEmail: string): Promise<any[]>;
  getCustomerStats(salonId: string, customerEmail: string): Promise<{
    totalBookings: number;
    totalSpent: number;
    lastVisit: string | null;
    favoriteServices: Array<{ serviceId: string; serviceName: string; count: number }>;
    averageSpend: number;
    bookingFrequency: string;
  }>;

  // Financial Reporting System Operations
  
  // Expense category operations
  getExpenseCategory(id: string): Promise<ExpenseCategory | undefined>;
  getExpenseCategoriesBySalonId(salonId: string): Promise<ExpenseCategory[]>;
  createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  updateExpenseCategory(id: string, salonId: string, updates: Partial<InsertExpenseCategory>): Promise<void>;
  deleteExpenseCategory(id: string, salonId: string): Promise<void>;
  createDefaultExpenseCategories(salonId: string): Promise<ExpenseCategory[]>;
  
  // Expense operations
  getExpense(id: string): Promise<Expense | undefined>;
  getExpensesBySalonId(salonId: string, filters?: { 
    categoryId?: string; 
    status?: string; 
    startDate?: string; 
    endDate?: string;
    createdBy?: string;
  }): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, salonId: string, updates: Partial<InsertExpense>): Promise<void>;
  approveExpense(id: string, approvedBy: string): Promise<void>;
  rejectExpense(id: string, approvedBy: string): Promise<void>;
  deleteExpense(id: string, salonId: string): Promise<void>;
  getExpensesByCategory(salonId: string, categoryId: string, period?: string): Promise<Expense[]>;
  getExpenseAnalytics(salonId: string, period: string): Promise<{
    totalExpenses: number;
    expensesByCategory: Array<{ categoryId: string; categoryName: string; amount: number; percentage: number }>;
    monthlyTrend: Array<{ month: string; amount: number }>;
    topVendors: Array<{ vendor: string; amount: number; count: number }>;
    pendingApprovals: number;
    taxDeductibleAmount: number;
  }>;
  
  // Commission rate operations
  getCommissionRate(id: string): Promise<CommissionRate | undefined>;
  getCommissionRatesBySalonId(salonId: string): Promise<CommissionRate[]>;
  getCommissionRatesByStaffId(staffId: string): Promise<CommissionRate[]>;
  getActiveCommissionRate(salonId: string, staffId?: string, serviceId?: string): Promise<CommissionRate | undefined>;
  createCommissionRate(rate: InsertCommissionRate): Promise<CommissionRate>;
  updateCommissionRate(id: string, salonId: string, updates: Partial<InsertCommissionRate>): Promise<void>;
  deactivateCommissionRate(id: string): Promise<void>;
  
  // Commission operations
  getCommission(id: string): Promise<Commission | undefined>;
  getCommissionsBySalonId(salonId: string, filters?: {
    staffId?: string;
    period?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Commission[]>;
  getCommissionsByStaffId(staffId: string, period?: string): Promise<Commission[]>;
  createCommission(commission: InsertCommission): Promise<Commission>;
  updateCommission(id: string, salonId: string, updates: Partial<InsertCommission>): Promise<void>;
  payCommissions(commissionIds: string[], paidBy: string, paymentMethod: string, paymentReference?: string): Promise<number>;
  calculateCommissionForBooking(bookingId: string): Promise<Commission | null>;
  getCommissionAnalytics(salonId: string, period: string): Promise<{
    totalCommissions: number;
    paidCommissions: number;
    pendingCommissions: number;
    commissionsByStaff: Array<{ staffId: string; staffName: string; earned: number; paid: number; pending: number }>;
    monthlyTrend: Array<{ month: string; amount: number }>;
    averageCommissionRate: number;
  }>;
  
  // Budget operations
  getBudget(id: string): Promise<Budget | undefined>;
  getBudgetsBySalonId(salonId: string, filters?: { categoryId?: string; budgetType?: string; isActive?: boolean }): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, salonId: string, updates: Partial<InsertBudget>): Promise<void>;
  updateBudgetSpentAmount(salonId: string, categoryId: string, additionalSpent: number): Promise<void>;
  deleteBudget(id: string, salonId: string): Promise<void>;
  getBudgetAnalytics(salonId: string, period: string): Promise<{
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
    budgetsByCategory: Array<{
      categoryId: string;
      categoryName: string;
      budgeted: number;
      spent: number;
      remaining: number;
      utilization: number;
      status: 'under' | 'on-track' | 'over';
    }>;
    alertingBudgets: Array<{ budgetId: string; name: string; utilization: number }>;
  }>;
  
  // Financial report operations
  getFinancialReport(id: string): Promise<FinancialReport | undefined>;
  getFinancialReportsBySalonId(salonId: string, filters?: { reportType?: string; reportPeriod?: string }): Promise<FinancialReport[]>;
  createFinancialReport(report: InsertFinancialReport): Promise<FinancialReport>;
  updateFinancialReport(id: string, salonId: string, updates: Partial<InsertFinancialReport>): Promise<void>;
  deleteFinancialReport(id: string, salonId: string): Promise<void>;
  generateProfitLossStatement(salonId: string, startDate: string, endDate: string): Promise<{
    period: { startDate: string; endDate: string };
    revenue: {
      serviceRevenue: number;
      otherRevenue: number;
      totalRevenue: number;
    };
    expenses: {
      operatingExpenses: Array<{ categoryId: string; categoryName: string; amount: number }>;
      totalOperatingExpenses: number;
      commissions: number;
      taxes: number;
      totalExpenses: number;
    };
    profitLoss: {
      grossProfit: number;
      grossProfitMargin: number;
      netProfit: number;
      netProfitMargin: number;
      ebitda: number;
    };
  }>;
  generateCashFlowStatement(salonId: string, startDate: string, endDate: string): Promise<{
    period: { startDate: string; endDate: string };
    operatingActivities: {
      netIncome: number;
      adjustments: Array<{ item: string; amount: number }>;
      totalOperatingCashFlow: number;
    };
    investingActivities: {
      equipmentPurchases: number;
      totalInvestingCashFlow: number;
    };
    financingActivities: {
      ownerWithdrawals: number;
      totalFinancingCashFlow: number;
    };
    netCashFlow: number;
  }>;
  
  // Tax setting operations
  getTaxSetting(id: string): Promise<TaxSetting | undefined>;
  getTaxSettingsBySalonId(salonId: string): Promise<TaxSetting[]>;
  getTaxSettingByType(salonId: string, taxType: string): Promise<TaxSetting | undefined>;
  createTaxSetting(setting: InsertTaxSetting): Promise<TaxSetting>;
  updateTaxSetting(id: string, salonId: string, updates: Partial<InsertTaxSetting>): Promise<void>;
  deleteTaxSetting(id: string, salonId: string): Promise<void>;
  calculateTaxLiability(salonId: string, period: string): Promise<{
    period: string;
    grossRevenue: number;
    taxableRevenue: number;
    taxBreakdown: Array<{
      taxType: string;
      taxName: string;
      rate: number;
      taxableAmount: number;
      taxOwed: number;
    }>;
    totalTaxOwed: number;
    nextFilingDates: Array<{ taxType: string; dueDate: string }>;
  }>;
  
  // Comprehensive financial analytics
  getFinancialKPIs(salonId: string, period: string): Promise<{
    revenue: {
      totalRevenue: number;
      averageBookingValue: number;
      revenuePerCustomer: number;
      revenueGrowthRate: number;
    };
    expenses: {
      totalExpenses: number;
      expenseRatio: number;
      costPerService: number;
      expenseGrowthRate: number;
    };
    profitability: {
      grossProfitMargin: number;
      netProfitMargin: number;
      breakEvenPoint: number;
      returnOnInvestment: number;
    };
    efficiency: {
      revenuePerStaff: number;
      serviceUtilizationRate: number;
      averageServiceTime: number;
      staffProductivity: number;
    };
  }>;
  getFinancialForecast(salonId: string, months: number): Promise<{
    forecast: Array<{
      month: string;
      projectedRevenue: number;
      projectedExpenses: number;
      projectedProfit: number;
      confidence: number;
    }>;
    assumptions: {
      revenueGrowthRate: number;
      seasonalFactors: Array<{ month: number; factor: number }>;
      costInflationRate: number;
    };
    scenarios: {
      optimistic: { totalRevenue: number; totalProfit: number };
      realistic: { totalRevenue: number; totalProfit: number };
      pessimistic: { totalRevenue: number; totalProfit: number };
    };
  }>;

  // =================================
  // COMMUNICATION SYSTEM OPERATIONS
  // =================================
  
  // Message template operations
  getMessageTemplate(id: string): Promise<MessageTemplate | undefined>;
  getMessageTemplatesBySalonId(salonId: string, type?: string): Promise<MessageTemplate[]>;
  getDefaultMessageTemplate(salonId: string, type: string): Promise<MessageTemplate | undefined>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: string, salonId: string, updates: Partial<InsertMessageTemplate>): Promise<void>;
  deleteMessageTemplate(id: string, salonId: string): Promise<void>;
  createDefaultMessageTemplates(salonId: string): Promise<MessageTemplate[]>;
  
  // Customer segment operations
  getCustomerSegment(id: string): Promise<CustomerSegment | undefined>;
  getCustomerSegmentsBySalonId(salonId: string): Promise<CustomerSegment[]>;
  createCustomerSegment(segment: InsertCustomerSegment): Promise<CustomerSegment>;
  updateCustomerSegment(id: string, salonId: string, updates: Partial<InsertCustomerSegment>): Promise<void>;
  deleteCustomerSegment(id: string, salonId: string): Promise<void>;
  updateSegmentCustomerCount(segmentId: string): Promise<void>;
  getCustomersInSegment(segmentId: string, salonId: string): Promise<User[]>;
  
  // Communication campaign operations
  getCommunicationCampaign(id: string): Promise<CommunicationCampaign | undefined>;
  getCommunicationCampaignsBySalonId(salonId: string, filters?: { status?: string; type?: string }): Promise<CommunicationCampaign[]>;
  createCommunicationCampaign(campaign: InsertCommunicationCampaign): Promise<CommunicationCampaign>;
  updateCommunicationCampaign(id: string, salonId: string, updates: Partial<InsertCommunicationCampaign>): Promise<void>;
  deleteCommunicationCampaign(id: string, salonId: string): Promise<void>;
  startCommunicationCampaign(id: string): Promise<void>;
  pauseCommunicationCampaign(id: string): Promise<void>;
  completeCommunicationCampaign(id: string): Promise<void>;
  updateCampaignStats(campaignId: string, stats: {
    messagesSent?: number;
    messagesDelivered?: number;
    messagesOpened?: number;
    messagesClicked?: number;
    messagesFailed?: number;
    unsubscribes?: number;
  }): Promise<void>;
  
  // Communication history operations
  getCommunicationHistory(id: string): Promise<CommunicationHistory | undefined>;
  getCommunicationHistoryBySalonId(salonId: string, filters?: {
    customerId?: string;
    campaignId?: string;
    bookingId?: string;
    type?: string;
    channel?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CommunicationHistory[]>;
  getCommunicationHistoryByCustomer(customerId: string, salonId: string): Promise<CommunicationHistory[]>;
  createCommunicationHistory(history: InsertCommunicationHistory): Promise<CommunicationHistory>;
  updateCommunicationHistory(id: string, updates: {
    status?: string;
    providerId?: string;
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    failureReason?: string;
    metadata?: any;
  }): Promise<void>;
  
  // Communication preferences operations
  getCommunicationPreferences(customerId: string, salonId: string): Promise<CommunicationPreferences | undefined>;
  createCommunicationPreferences(preferences: InsertCommunicationPreferences): Promise<CommunicationPreferences>;
  updateCommunicationPreferences(customerId: string, salonId: string, updates: Partial<InsertCommunicationPreferences>): Promise<void>;
  unsubscribeFromCommunications(customerId: string, salonId: string, reason?: string): Promise<void>;
  getUnsubscribedCustomers(salonId: string): Promise<string[]>; // Return customer IDs
  
  // Scheduled message operations
  getScheduledMessage(id: string): Promise<ScheduledMessage | undefined>;
  getScheduledMessagesBySalonId(salonId: string, filters?: {
    status?: string;
    type?: string;
    scheduledBefore?: Date;
  }): Promise<ScheduledMessage[]>;
  getScheduledMessagesDue(beforeTime?: Date): Promise<ScheduledMessage[]>;
  createScheduledMessage(message: InsertScheduledMessage): Promise<ScheduledMessage>;
  updateScheduledMessage(id: string, updates: Partial<InsertScheduledMessage>): Promise<void>;
  markScheduledMessageSent(id: string, providerId?: string): Promise<void>;
  markScheduledMessageFailed(id: string, reason: string): Promise<void>;
  cancelScheduledMessage(id: string): Promise<void>;
  rescheduleMessage(id: string, newScheduleTime: Date): Promise<void>;
  
  // Communication analytics operations
  getCommunicationAnalytics(salonId: string, filters?: {
    campaignId?: string;
    channel?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CommunicationAnalytics[]>;
  createCommunicationAnalytics(analytics: InsertCommunicationAnalytics): Promise<CommunicationAnalytics>;
  updateCommunicationAnalytics(id: string, updates: Partial<InsertCommunicationAnalytics>): Promise<void>;
  getCommunicationDashboardMetrics(salonId: string, period: string): Promise<{
    totalMessagesSent: number;
    totalMessagesDelivered: number;
    totalMessagesOpened: number;
    totalMessagesClicked: number;
    totalMessagesFailed: number;
    emailOpenRate: number;
    emailClickRate: number;
    smsDeliveryRate: number;
    unsubscribeRate: number;
    activeCampaigns: number;
    topPerformingCampaigns: Array<{
      campaignId: string;
      campaignName: string;
      openRate: number;
      clickRate: number;
      messagesSent: number;
    }>;
    channelPerformance: Array<{
      channel: string;
      messagesSent: number;
      deliveryRate: number;
      engagementRate: number;
    }>;
    recentActivity: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: Date;
    }>;
  }>;
  
  // Booking notification automation
  scheduleBookingNotifications(bookingId: string): Promise<void>;
  cancelBookingNotifications(bookingId: string): Promise<void>;
  sendBookingConfirmation(bookingId: string): Promise<boolean>;
  sendBookingReminder(bookingId: string, reminderType: '24h' | '2h'): Promise<boolean>;
  sendBookingCancellation(bookingId: string): Promise<boolean>;
  sendFollowUpMessage(bookingId: string): Promise<boolean>;
  
  // Template processing and personalization
  processTemplate(templateContent: string, variables: Record<string, any>): Promise<string>;
  getTemplateVariables(salonId: string, bookingId?: string, customerId?: string): Promise<Record<string, any>>;

  // =================================
  // INVENTORY MANAGEMENT OPERATIONS
  // =================================
  
  // Vendor operations
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorsBySalonId(salonId: string): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, salonId: string, updates: Partial<InsertVendor>): Promise<void>;
  deleteVendor(id: string, salonId: string): Promise<void>;
  
  // Product category operations
  getProductCategory(id: string): Promise<ProductCategory | undefined>;
  getProductCategoriesBySalonId(salonId: string): Promise<ProductCategory[]>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: string, salonId: string, updates: Partial<InsertProductCategory>): Promise<void>;
  deleteProductCategory(id: string, salonId: string): Promise<void>;
  createDefaultProductCategories(salonId: string): Promise<ProductCategory[]>;
  
  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProductsBySalonId(salonId: string, filters?: {
    categoryId?: string;
    vendorId?: string;
    isActive?: boolean;
    lowStock?: boolean;
    search?: string;
  }): Promise<Product[]>;
  getProductBySKU(salonId: string, sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, salonId: string, updates: Partial<InsertProduct>): Promise<void>;
  updateProductStock(id: string, salonId: string, newStock: number, reason: string, staffId?: string): Promise<void>;
  deleteProduct(id: string, salonId: string): Promise<void>;
  getLowStockProducts(salonId: string): Promise<Product[]>;
  getExpiringProducts(salonId: string, daysAhead?: number): Promise<Product[]>;
  
  // Stock movement operations
  getStockMovement(id: string): Promise<StockMovement | undefined>;
  getStockMovementsBySalonId(salonId: string, filters?: {
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    staffId?: string;
  }): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getProductStockHistory(productId: string, limit?: number): Promise<StockMovement[]>;
  
  // Purchase order operations
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  getPurchaseOrdersBySalonId(salonId: string, filters?: {
    vendorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PurchaseOrder[]>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, salonId: string, updates: Partial<InsertPurchaseOrder>): Promise<void>;
  submitPurchaseOrder(id: string, submittedBy: string): Promise<void>;
  receivePurchaseOrder(id: string, receivedBy: string, items: Array<{ productId: string; receivedQuantity: number }>): Promise<void>;
  cancelPurchaseOrder(id: string, cancelledBy: string): Promise<void>;
  generatePurchaseOrderNumber(salonId: string): Promise<string>;
  
  // Purchase order item operations
  getPurchaseOrderItem(id: string): Promise<PurchaseOrderItem | undefined>;
  getPurchaseOrderItemsByOrderId(orderId: string): Promise<PurchaseOrderItem[]>;
  createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  updatePurchaseOrderItem(id: string, updates: Partial<InsertPurchaseOrderItem>): Promise<void>;
  deletePurchaseOrderItem(id: string): Promise<void>;
  
  // Product usage operations
  getProductUsage(id: string): Promise<ProductUsage | undefined>;
  getProductUsagesBySalonId(salonId: string): Promise<ProductUsage[]>;
  getProductUsagesByServiceId(serviceId: string): Promise<ProductUsage[]>;
  getProductUsagesByProductId(productId: string): Promise<ProductUsage[]>;
  createProductUsage(usage: InsertProductUsage): Promise<ProductUsage>;
  updateProductUsage(id: string, salonId: string, updates: Partial<InsertProductUsage>): Promise<void>;
  deleteProductUsage(id: string, salonId: string): Promise<void>;
  calculateServiceProductCost(serviceId: string): Promise<number>;
  trackProductUsageForBooking(bookingId: string): Promise<void>;
  
  // Reorder rule operations
  getReorderRule(id: string): Promise<ReorderRule | undefined>;
  getReorderRulesBySalonId(salonId: string): Promise<ReorderRule[]>;
  getReorderRuleByProductId(productId: string): Promise<ReorderRule | undefined>;
  createReorderRule(rule: InsertReorderRule): Promise<ReorderRule>;
  updateReorderRule(id: string, salonId: string, updates: Partial<InsertReorderRule>): Promise<void>;
  deleteReorderRule(id: string, salonId: string): Promise<void>;
  checkReorderRequirements(salonId: string): Promise<Array<{
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    reorderQuantity: number;
    vendorId?: string;
    vendorName?: string;
    estimatedCost: number;
  }>>;
  triggerAutomaticReorders(salonId: string): Promise<number>; // Returns number of POs created
  
  // Inventory adjustment operations
  getInventoryAdjustment(id: string): Promise<InventoryAdjustment | undefined>;
  getInventoryAdjustmentsBySalonId(salonId: string, filters?: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<InventoryAdjustment[]>;
  createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment>;
  updateInventoryAdjustment(id: string, salonId: string, updates: Partial<InsertInventoryAdjustment>): Promise<void>;
  submitInventoryAdjustment(id: string, submittedBy: string): Promise<void>;
  approveInventoryAdjustment(id: string, approvedBy: string): Promise<void>;
  generateAdjustmentNumber(salonId: string): Promise<string>;
  
  // Inventory adjustment item operations
  getInventoryAdjustmentItem(id: string): Promise<InventoryAdjustmentItem | undefined>;
  getInventoryAdjustmentItemsByAdjustmentId(adjustmentId: string): Promise<InventoryAdjustmentItem[]>;
  createInventoryAdjustmentItem(item: InsertInventoryAdjustmentItem): Promise<InventoryAdjustmentItem>;
  updateInventoryAdjustmentItem(id: string, updates: Partial<InsertInventoryAdjustmentItem>): Promise<void>;
  deleteInventoryAdjustmentItem(id: string): Promise<void>;
  
  // Inventory analytics and reporting
  getInventoryDashboardMetrics(salonId: string): Promise<{
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    reorderRequiredCount: number;
    expiringProductsCount: number;
    topCategories: Array<{ categoryId: string; categoryName: string; productCount: number; stockValue: number }>;
    recentMovements: Array<{ 
      id: string; 
      productName: string; 
      type: string; 
      quantity: number; 
      date: Date;
      staffName?: string;
    }>;
    monthlyUsageTrends: Array<{ month: string; usageValue: number; count: number }>;
    vendorPerformance: Array<{ 
      vendorId: string; 
      vendorName: string; 
      orderCount: number; 
      totalValue: number; 
      avgDeliveryTime: number;
      rating: number;
    }>;
  }>;
  
  getInventoryAnalytics(salonId: string, period: string): Promise<{
    overview: {
      totalStockValue: number;
      stockTurnoverRate: number;
      averageLeadTime: number;
      wastePercentage: number;
      stockAccuracy: number;
    };
    topMovingProducts: Array<{
      productId: string;
      productName: string;
      category: string;
      usageCount: number;
      usageValue: number;
      turnoverRate: number;
    }>;
    slowMovingProducts: Array<{
      productId: string;
      productName: string;
      lastUsed: Date | null;
      stockValue: number;
      daysOnHand: number;
    }>;
    categoryAnalysis: Array<{
      categoryId: string;
      categoryName: string;
      productCount: number;
      stockValue: number;
      usageValue: number;
      profitMargin: number;
    }>;
    costAnalysis: {
      totalPurchaseCost: number;
      totalUsageCost: number;
      averageCostPerService: number;
      costTrends: Array<{ month: string; purchaseCost: number; usageCost: number }>;
    };
    wasteAnalysis: {
      totalWaste: number;
      wasteByReason: Array<{ reason: string; quantity: number; value: number }>;
      topWastedProducts: Array<{ productId: string; productName: string; wasteQuantity: number; wasteValue: number }>;
    };
  }>;
  
  getProductProfitabilityAnalysis(salonId: string, period: string): Promise<Array<{
    productId: string;
    productName: string;
    category: string;
    purchaseCost: number;
    sellingPrice: number;
    usageInServices: number;
    revenueGenerated: number;
    profitMargin: number;
    roi: number;
    recommendations: string[];
  }>>;
  
  getInventoryForecast(salonId: string, months: number): Promise<{
    forecast: Array<{
      month: string;
      projectedUsage: Array<{
        productId: string;
        productName: string;
        estimatedUsage: number;
        estimatedCost: number;
        recommendedOrderQuantity: number;
      }>;
      totalEstimatedCost: number;
    }>;
    assumptions: {
      seasonalFactors: Array<{ month: number; factor: number }>;
      growthRate: number;
      leadTimes: Array<{ vendorId: string; avgLeadTime: number }>;
    };
  }>;

  // ====================================
  // A/B TESTING SYSTEM OPERATIONS
  // ====================================
  
  // A/B Test Campaign Operations
  getAbTestCampaign(id: string): Promise<AbTestCampaign | undefined>;
  getAbTestCampaignsBySalonId(salonId: string, filters?: { status?: string; testType?: string }): Promise<AbTestCampaign[]>;
  createAbTestCampaign(campaign: InsertAbTestCampaign): Promise<AbTestCampaign>;
  updateAbTestCampaign(id: string, updates: Partial<InsertAbTestCampaign>): Promise<void>;
  deleteAbTestCampaign(id: string): Promise<void>;

  // Test Variant Operations
  getTestVariant(id: string): Promise<TestVariant | undefined>;
  getTestVariantsByTestId(testCampaignId: string): Promise<TestVariant[]>;
  createTestVariant(variant: InsertTestVariant): Promise<TestVariant>;
  updateTestVariant(id: string, updates: Partial<InsertTestVariant>): Promise<void>;
  deleteTestVariant(id: string): Promise<void>;

  // Test Metrics Operations
  getTestMetric(id: string): Promise<TestMetric | undefined>;
  getTestMetricsByVariantId(variantId: string, dateRange?: { start: string; end: string }): Promise<TestMetric[]>;
  getTestMetricsByTestId(testCampaignId: string, dateRange?: { start: string; end: string }): Promise<TestMetric[]>;
  createTestMetric(metric: InsertTestMetric): Promise<TestMetric>;
  updateTestMetric(id: string, updates: Partial<InsertTestMetric>): Promise<void>;
  bulkCreateTestMetrics(metrics: InsertTestMetric[]): Promise<TestMetric[]>;

  // Test Results Operations
  getTestResult(id: string): Promise<TestResult | undefined>;
  getTestResultByTestId(testCampaignId: string): Promise<TestResult | undefined>;
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  updateTestResult(id: string, updates: Partial<InsertTestResult>): Promise<void>;

  // Analytics and Aggregation Methods
  getAbTestPerformanceSummary(testCampaignId: string): Promise<{
    totalParticipants: number;
    variants: Array<{
      variantId: string;
      variantName: string;
      openRate: number;
      clickRate: number;
      conversionRate: number;
      bookingRate: number;
      isWinner: boolean;
    }>;
  }>;
  getAbTestCampaignAnalytics(salonId: string, period: string): Promise<{
    totalTests: number;
    activeTests: number;
    completedTests: number;
    averageImprovement: number;
    topPerformingVariants: Array<{
      variantId: string;
      variantName: string;
      testName: string;
      performanceMetric: number;
      improvement: number;
    }>;
  }>;

  // ====================================
  // A/B TESTING AUTOMATION SYSTEM OPERATIONS
  // ====================================

  // Automation Configuration Operations
  getAutomationConfiguration(id: string): Promise<AutomationConfiguration | undefined>;
  getAutomationConfigurationBySalonId(salonId: string): Promise<AutomationConfiguration | undefined>;
  createAutomationConfiguration(config: InsertAutomationConfiguration): Promise<AutomationConfiguration>;
  updateAutomationConfiguration(id: string, updates: Partial<InsertAutomationConfiguration>): Promise<void>;
  deleteAutomationConfiguration(id: string): Promise<void>;

  // Variant Generation Rule Operations
  getVariantGenerationRule(id: string): Promise<VariantGenerationRule | undefined>;
  getVariantGenerationRulesBySalonId(salonId: string, filters?: { ruleType?: string; isActive?: number }): Promise<VariantGenerationRule[]>;
  getVariantGenerationRulesByConfigId(configId: string): Promise<VariantGenerationRule[]>;
  createVariantGenerationRule(rule: InsertVariantGenerationRule): Promise<VariantGenerationRule>;
  updateVariantGenerationRule(id: string, updates: Partial<InsertVariantGenerationRule>): Promise<void>;
  deleteVariantGenerationRule(id: string): Promise<void>;

  // Performance Monitoring Setting Operations
  getPerformanceMonitoringSetting(id: string): Promise<PerformanceMonitoringSetting | undefined>;
  getPerformanceMonitoringSettingsBySalonId(salonId: string): Promise<PerformanceMonitoringSetting[]>;
  getPerformanceMonitoringSettingsByConfigId(configId: string): Promise<PerformanceMonitoringSetting[]>;
  createPerformanceMonitoringSetting(setting: InsertPerformanceMonitoringSetting): Promise<PerformanceMonitoringSetting>;
  updatePerformanceMonitoringSetting(id: string, updates: Partial<InsertPerformanceMonitoringSetting>): Promise<void>;
  deletePerformanceMonitoringSetting(id: string): Promise<void>;

  // Optimization Recommendation Operations
  getOptimizationRecommendation(id: string): Promise<OptimizationRecommendation | undefined>;
  getOptimizationRecommendationsBySalonId(salonId: string, filters?: { 
    status?: string; 
    recommendationType?: string; 
    createdAfter?: Date; 
    createdBefore?: Date; 
  }): Promise<OptimizationRecommendation[]>;
  getOptimizationRecommendationsByCampaignId(campaignId: string): Promise<OptimizationRecommendation[]>;
  getOptimizationRecommendationsByTestCampaignId(testCampaignId: string): Promise<OptimizationRecommendation[]>;
  createOptimizationRecommendation(recommendation: InsertOptimizationRecommendation): Promise<OptimizationRecommendation>;
  updateOptimizationRecommendation(id: string, updates: Partial<InsertOptimizationRecommendation>): Promise<void>;
  deleteOptimizationRecommendation(id: string): Promise<void>;
  updateExpiredOptimizationRecommendations(): Promise<number>;

  // Automated Action Log Operations
  getAutomatedActionLog(id: string): Promise<AutomatedActionLog | undefined>;
  getAutomatedActionLogsBySalonId(salonId: string, filters?: { 
    actionType?: string; 
    status?: string; 
    limit?: number; 
  }): Promise<AutomatedActionLog[]>;
  getAutomatedActionLogsByConfigId(configId: string): Promise<AutomatedActionLog[]>;
  createAutomatedActionLog(log: InsertAutomatedActionLog): Promise<AutomatedActionLog>;
  updateAutomatedActionLog(id: string, updates: Partial<InsertAutomatedActionLog>): Promise<void>;
  deleteAutomatedActionLogsBefore(cutoffDate: Date): Promise<number>;

  // Campaign Optimization Insight Operations
  getCampaignOptimizationInsight(id: string): Promise<CampaignOptimizationInsight | undefined>;
  getCampaignOptimizationInsightsBySalonId(salonId: string, filters?: { 
    insightType?: string; 
    status?: string; 
    isActionable?: number; 
    createdAfter?: Date; 
  }): Promise<CampaignOptimizationInsight[]>;
  createCampaignOptimizationInsight(insight: InsertCampaignOptimizationInsight): Promise<CampaignOptimizationInsight>;
  updateCampaignOptimizationInsight(id: string, updates: Partial<InsertCampaignOptimizationInsight>): Promise<void>;
  deleteCampaignOptimizationInsight(id: string): Promise<void>;

  // Additional helper methods for automation
  getTestMetricByVariantAndDate(variantId: string, date: Date): Promise<TestMetric | undefined>;
  getCommunicationHistoryByVariantId(variantId: string): Promise<CommunicationHistory[]>;
  getCommunicationHistoryByTemplateId(templateId: string, filters?: { startDate?: string; endDate?: string }): Promise<CommunicationHistory[]>;
  getCommunicationHistoryBySalonId(salonId: string, filters?: { startDate?: string; endDate?: string }): Promise<CommunicationHistory[]>;
  getCommunicationHistoryBySegment(segmentId: string, filters?: { startDate?: string; endDate?: string }): Promise<CommunicationHistory[]>;
  getMessageTemplatesBySalonId(salonId: string): Promise<MessageTemplate[]>;
  getCustomerSegmentsBySalonId(salonId: string): Promise<CustomerSegment[]>;
  deleteTestMetricsBefore(cutoffDate: Date): Promise<number>;

  // Customer Dashboard API Operations
  getCustomerAppointments(customerId: string, filters?: {
    status?: "upcoming" | "completed" | "cancelled" | "all";
    limit?: number;
    offset?: number;
  }): Promise<{
    appointments: Array<{
      id: string;
      salonId: string;
      salonName: string;
      serviceId: string;
      serviceName: string;
      staffId: string;
      staffName: string;
      bookingDate: string;
      bookingTime: string;
      status: "upcoming" | "completed" | "cancelled";
      totalAmountPaisa: number;
      currency: string;
      duration: number;
      notes?: string;
      createdAt: string;
    }>;
    total: number;
    hasMore: boolean;
  }>;

  getCustomerProfileWithStats(customerId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    profileImageUrl?: string;
    preferences: {
      favoriteServices: string[];
      preferredStaff: string[];
      communicationPreferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
    };
    stats: {
      totalBookings: number;
      totalSpentPaisa: number;
      memberSince: string;
      lastBookingDate?: string;
      favoriteService?: string;
    };
  }>;

  getCustomerPaymentHistory(customerId: string): Promise<{
    payments: Array<{
      id: string;
      bookingId: string;
      salonName: string;
      serviceName: string;
      amountPaisa: number;
      currency: string;
      status: "completed" | "pending" | "failed" | "refunded";
      paymentMethod: string;
      transactionDate: string;
      receiptUrl?: string;
    }>;
    total: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Generate username if not provided
    if (!user.username && user.email) {
      user.username = user.email.split('@')[0] + '_' + Date.now().toString().slice(-6);
    }
    
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<void> {
    await db.update(users).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(users.id, id));
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    // For now, we'll store preferences in the users table as a JSON column
    // In the future, we might want a separate preferences table
    await db.update(users).set({
      // Add a preferences column to the users table if needed, or store in customerProfiles
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    
    // Note: Since we don't have a preferences column in users table yet,
    // we'll implement this functionality later or use a different approach
    // For now, this method will just update the updatedAt timestamp
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Role operations
  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRolesList = await db.select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      createdAt: roles.createdAt,
    }).from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    
    return userRolesList;
  }

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    await db.insert(userRoles).values({ userId, roleId });
  }

  // Organization operations
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrg] = await db.insert(organizations).values(organization).returning();
    return newOrg;
  }

  async addUserToOrganization(orgId: string, userId: string, role: string): Promise<void> {
    await db.insert(orgUsers).values({ orgId, userId, orgRole: role });
  }

  async getUserOrganizations(userId: string): Promise<Array<{
    orgId: string;
    orgRole: string;
    organization: {
      id: string;
      name: string;
      type: string;
    };
  }>> {
    const userOrgs = await db
      .select({
        orgId: orgUsers.orgId,
        orgRole: orgUsers.orgRole,
        orgName: organizations.name,
        orgId2: organizations.id,
        orgDescription: organizations.description
      })
      .from(orgUsers)
      .innerJoin(organizations, eq(orgUsers.orgId, organizations.id))
      .where(eq(orgUsers.userId, userId));

    return userOrgs.map(org => ({
      orgId: org.orgId,
      orgRole: org.orgRole,
      organization: {
        id: org.orgId2,
        name: org.orgName,
        type: 'salon' // Default type for now
      }
    }));
  }

  async getSalonById(id: string): Promise<Salon | undefined> {
    return this.getSalon(id);
  }

  async getSalonsByOrgId(orgId: string): Promise<Salon[]> {
    return await db.select().from(salons).where(and(
      eq(salons.orgId, orgId),
      eq(salons.isActive, 1)
    ));
  }

  async isUserStaffOfSalon(userId: string, salonId: string): Promise<boolean> {
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.userId, userId), eq(staff.salonId, salonId)));
    return !!staffMember;
  }

  // Salon operations
  async getSalon(id: string): Promise<Salon | undefined> {
    const [salon] = await db.select().from(salons).where(eq(salons.id, id));
    return salon || undefined;
  }

  async getAllSalons(): Promise<Salon[]> {
    return await db.select().from(salons).where(eq(salons.isActive, 1));
  }

  async createSalon(salon: InsertSalon): Promise<Salon> {
    const [newSalon] = await db.insert(salons).values(salon).returning();
    return newSalon;
  }

  async updateSalon(id: string, updates: Partial<InsertSalon>): Promise<void> {
    await db.update(salons).set(updates).where(eq(salons.id, id));
  }

  // Service operations
  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, 1));
  }

  async getServicesBySalonId(salonId: string): Promise<Service[]> {
    return await db.select().from(services).where(and(
      eq(services.salonId, salonId),
      eq(services.isActive, 1)
    ));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<void> {
    await db.update(services).set(updates).where(eq(services.id, id));
  }

  async deleteService(id: string): Promise<void> {
    await db.update(services).set({ isActive: 0 }).where(eq(services.id, id));
  }

  // Booking operations
  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBookingStatus(id: string, status: string): Promise<number> {
    const result = await db.update(bookings).set({ status }).where(eq(bookings.id, id));
    return result.rowCount || 0;
  }

  async updateBookingStatusWithCustomerValidation(bookingId: string, customerEmail: string, status: string): Promise<void> {
    const result = await db
      .update(bookings)
      .set({ status })
      .where(and(
        eq(bookings.id, bookingId),
        eq(bookings.customerEmail, customerEmail)
      ));
    
    if (result.rowCount === 0) {
      throw new Error('Booking not found or access denied');
    }
  }

  async updateBookingNotes(id: string, notes: string): Promise<number> {
    const result = await db.update(bookings).set({ notes }).where(eq(bookings.id, id));
    return result.rowCount || 0;
  }

  async bulkUpdateBookingStatus(bookingIds: string[], status: string, salonId: string): Promise<number> {
    const result = await db
      .update(bookings)
      .set({ status })
      .where(and(
        inArray(bookings.id, bookingIds),
        eq(bookings.salonId, salonId) // Security: ensure bookings belong to the salon
      ));
    return result.rowCount || 0;
  }

  async getBookingsBySalonId(salonId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Booking[]> {
    try {
      const conditions = [eq(bookings.salonId, salonId)];

      // Add status filter if provided
      if (filters?.status) {
        conditions.push(eq(bookings.status, filters.status));
      }

      // Add date range filters if provided
      if (filters?.startDate) {
        conditions.push(gte(bookings.bookingDate, filters.startDate));
      }
      if (filters?.endDate) {
        conditions.push(lte(bookings.bookingDate, filters.endDate));
      }

      return await db
        .select()
        .from(bookings)
        .where(and(...conditions))
        .orderBy(desc(bookings.createdAt));
    } catch (error) {
      console.error('Error fetching bookings by salon ID:', error);
      throw error;
    }
  }

  async getCustomersBySalonId(salonId: string): Promise<any[]> {
    try {
      // Get unique customers from bookings for this salon
      const customers = await db
        .select({
          name: bookings.customerName,
          email: bookings.customerEmail,
          phone: bookings.customerPhone,
          totalBookings: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(${bookings.totalAmountPaisa})`,
          lastBookingDate: sql<string>`max(${bookings.bookingDate})`,
          lastBookingStatus: sql<string>`max(${bookings.status})`,
          lastCreated: sql<string>`max(${bookings.createdAt})`
        })
        .from(bookings)
        .where(eq(bookings.salonId, salonId))
        .groupBy(bookings.customerEmail, bookings.customerName, bookings.customerPhone)
        .orderBy(desc(sql`max(${bookings.createdAt})`));

      return customers.map(customer => ({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalBookings: Number(customer.totalBookings) || 0,
        totalSpentPaisa: Number(customer.totalSpent) || 0,
        lastBookingDate: customer.lastBookingDate,
        lastBookingStatus: customer.lastBookingStatus
      }));
    } catch (error) {
      console.error('Error fetching customers by salon ID:', error);
      throw error;
    }
  }

  // Conflict detection and rescheduling operations
  computeBookingTimeRange(bookingDate: string, bookingTime: string, durationMinutes: number): { start: Date, end: Date } {
    // Parse the booking date and time into a start Date object
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const start = new Date(bookingDate);
    start.setHours(hours, minutes, 0, 0);
    
    // Calculate end time by adding duration
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    
    return { start, end };
  }

  async findOverlappingBookings(salonId: string, staffId: string | null, start: Date, end: Date, excludeId?: string): Promise<Booking[]> {
    try {
      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];
      const startTimeStr = start.toTimeString().substring(0, 5); // HH:MM format
      const endTimeStr = end.toTimeString().substring(0, 5);
      
      const conditions = [
        eq(bookings.salonId, salonId),
        // Only check for non-cancelled bookings
        and(
          sql`${bookings.status} != 'cancelled'`,
          sql`${bookings.status} != 'completed'`
        ),
        // Check date range overlap
        or(
          and(
            eq(bookings.bookingDate, startDateStr),
            sql`${bookings.bookingTime} < ${endTimeStr}`,
            sql`(${bookings.bookingTime}::time + interval '90 minutes') > ${startTimeStr}::time`
          ),
          and(
            gte(bookings.bookingDate, startDateStr),
            lte(bookings.bookingDate, endDateStr)
          )
        )
      ];

      // If staffId is provided, check for that specific staff member
      if (staffId) {
        conditions.push(eq(bookings.staffId, staffId));
      }

      // Exclude the current booking if rescheduling
      if (excludeId) {
        conditions.push(sql`${bookings.id} != ${excludeId}`);
      }

      const overlappingBookings = await db
        .select()
        .from(bookings)
        .where(and(...conditions));

      return overlappingBookings;
    } catch (error) {
      console.error('Error finding overlapping bookings:', error);
      throw error;
    }
  }

  async isStaffAvailable(salonId: string, staffId: string, start: Date, end: Date): Promise<boolean> {
    try {
      // Check if staff exists and is active
      const staffMember = await db
        .select()
        .from(staff)
        .where(and(
          eq(staff.id, staffId),
          eq(staff.salonId, salonId),
          eq(staff.isActive, 1)
        ));

      if (staffMember.length === 0) {
        return false; // Staff member doesn't exist or is inactive
      }

      // Check for conflicting bookings
      const conflicts = await this.findOverlappingBookings(salonId, staffId, start, end);
      return conflicts.length === 0;
    } catch (error) {
      console.error('Error checking staff availability:', error);
      return false;
    }
  }

  async rescheduleBooking(id: string, fields: { bookingDate: string, bookingTime: string, staffId?: string }): Promise<Booking> {
    return await db.transaction(async (tx) => {
      try {
        // Get the current booking with row-level locking to prevent concurrent modifications
        const [currentBooking] = await tx.select().from(bookings).where(eq(bookings.id, id)).for('update');
        if (!currentBooking) {
          throw new Error('Booking not found');
        }

        // Get service duration for conflict checking (with locking to ensure consistency)
        const [service] = await tx.select().from(services).where(eq(services.id, currentBooking.serviceId)).for('update');
        if (!service) {
          throw new Error('Associated service not found');
        }

        // Calculate new time range
        const { start, end } = this.computeBookingTimeRange(fields.bookingDate, fields.bookingTime, service.durationMinutes);

        const targetStaffId = fields.staffId || currentBooking.staffId;
        
        // Check for conflicting bookings using locked queries to prevent race conditions
        const conflictQuery = tx
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.salonId, currentBooking.salonId),
              sql`${bookings.id} != ${id}`, // Exclude current booking
              or(
                eq(bookings.status, 'confirmed'),
                eq(bookings.status, 'pending')
              ),
              // Date and time overlap conditions
              sql`DATE(${bookings.bookingDate}) = DATE(${fields.bookingDate})`,
              sql`(
                (TIME(${bookings.bookingTime}) < TIME(${fields.bookingTime}) AND 
                 TIME(ADDTIME(${bookings.bookingTime}, SEC_TO_TIME(COALESCE((
                   SELECT ${services.durationMinutes} * 60 
                   FROM ${services} 
                   WHERE ${services.id} = ${bookings.serviceId}
                 ), 3600)))) > TIME(${fields.bookingTime}))
                OR
                (TIME(${bookings.bookingTime}) < TIME(ADDTIME(${fields.bookingTime}, SEC_TO_TIME(${service.durationMinutes * 60}))) AND 
                 TIME(${bookings.bookingTime}) >= TIME(${fields.bookingTime}))
                OR
                (TIME(${bookings.bookingTime}) = TIME(${fields.bookingTime}))
              )`,
              ...(targetStaffId ? [eq(bookings.staffId, targetStaffId)] : [])
            )
          )
          .for('update'); // Lock conflicting bookings to prevent race conditions

        const conflictingBookings = await conflictQuery;
        
        if (conflictingBookings.length > 0) {
          throw new Error('Time slot conflicts with existing booking');
        }

        // If staff is being changed, verify the new staff exists and is active (with locking)
        if (targetStaffId && targetStaffId !== currentBooking.staffId) {
          const [staffMember] = await tx
            .select()
            .from(staff)
            .where(and(
              eq(staff.id, targetStaffId),
              eq(staff.salonId, currentBooking.salonId),
              eq(staff.isActive, 1)
            ))
            .for('update');

          if (!staffMember) {
            throw new Error('Staff member not found or inactive');
          }
        }

        // Update the booking
        const updateData: Partial<typeof bookings.$inferInsert> = {
          bookingDate: fields.bookingDate,
          bookingTime: fields.bookingTime,
        };

        if (fields.staffId !== undefined) {
          updateData.staffId = fields.staffId;
        }

        const [updatedBooking] = await tx
          .update(bookings)
          .set(updateData)
          .where(eq(bookings.id, id))
          .returning();

        return updatedBooking;
      } catch (error) {
        console.error('Error rescheduling booking:', error);
        throw error;
      }
    });
  }

  async getSalonAnalytics(salonId: string, period: string): Promise<any> {
    try {
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      const previousStartDate = new Date();
      const previousEndDate = new Date();
      
      // Today's date for daily metrics
      const today = new Date().toISOString().split('T')[0];
      
      switch (period) {
        case 'daily':
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          previousStartDate.setDate(endDate.getDate() - 2);
          previousEndDate.setDate(endDate.getDate() - 1);
          break;
        case 'weekly':
        case 'week':
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          previousStartDate.setDate(endDate.getDate() - 14);
          previousEndDate.setDate(endDate.getDate() - 7);
          break;
        case 'monthly':
        case 'month':
        case '30d':
          startDate.setMonth(endDate.getMonth() - 1);
          previousStartDate.setMonth(endDate.getMonth() - 2);
          previousEndDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarterly':
        case 'quarter':
        case '90d':
          startDate.setMonth(endDate.getMonth() - 3);
          previousStartDate.setMonth(endDate.getMonth() - 6);
          previousEndDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'yearly':
        case 'year':
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          previousStartDate.setFullYear(endDate.getFullYear() - 2);
          previousEndDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1); // Default to month
          previousStartDate.setMonth(endDate.getMonth() - 2);
          previousEndDate.setMonth(endDate.getMonth() - 1);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
      const previousEndDateStr = previousEndDate.toISOString().split('T')[0];

      // Get current period stats
      const bookingStats = await db
        .select({
          totalBookings: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          confirmedBookings: sql<number>`count(case when ${bookings.status} = 'confirmed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ));

      // Get previous period stats for comparison
      const previousBookingStats = await db
        .select({
          totalBookings: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          confirmedBookings: sql<number>`count(case when ${bookings.status} = 'confirmed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, previousStartDateStr),
          lte(bookings.bookingDate, previousEndDateStr)
        ));

      // Get today's specific data
      const todayStats = await db
        .select({
          todayBookings: sql<number>`count(*)`,
          todayRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          todayConfirmed: sql<number>`count(case when ${bookings.status} = 'confirmed' then 1 end)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.bookingDate, today)
        ));

      // Get active staff count
      const activeStaffCount = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(staff)
        .where(and(
          eq(staff.salonId, salonId),
          eq(staff.isActive, 1)
        ));

      // Get popular services
      const popularServices = await db
        .select({
          serviceName: services.name,
          bookingCount: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(services.id, services.name)
        .orderBy(desc(sql`count(*)`))
        .limit(5);

      // Get booking trends by day
      const bookingTrends = await db
        .select({
          date: bookings.bookingDate,
          bookingCount: sql<number>`count(*)`,
          revenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(bookings.bookingDate)
        .orderBy(asc(bookings.bookingDate));

      // Get staff performance
      const staffPerformance = await db
        .select({
          staffName: staff.name,
          bookingCount: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(bookings)
        .leftJoin(staff, eq(bookings.staffId, staff.id))
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(staff.id, staff.name)
        .orderBy(desc(sql`count(*)`));

      const stats = bookingStats[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0
      };

      const previousStats = previousBookingStats[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0
      };

      const todayData = todayStats[0] || {
        todayBookings: 0,
        todayRevenue: 0,
        todayConfirmed: 0
      };

      const staffCount = activeStaffCount[0]?.count || 0;

      // Calculate trends and percentages
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? { percentage: 100, trend: 'up' } : { percentage: 0, trend: 'neutral' };
        const change = ((current - previous) / previous) * 100;
        return {
          percentage: Math.abs(change),
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
        };
      };

      const currentBookings = Number(stats.totalBookings) || 0;
      const currentRevenue = Number(stats.totalRevenue) || 0;
      const previousBookings = Number(previousStats.totalBookings) || 0;
      const previousRevenue = Number(previousStats.totalRevenue) || 0;

      const bookingsTrend = calculateTrend(currentBookings, previousBookings);
      const revenueTrend = calculateTrend(currentRevenue, previousRevenue);

      // Calculate average booking value
      const averageBookingValue = currentBookings > 0 ? currentRevenue / currentBookings : 0;
      const previousAverageBookingValue = previousBookings > 0 ? previousRevenue / previousBookings : 0;
      const averageValueTrend = calculateTrend(averageBookingValue, previousAverageBookingValue);

      return {
        period,
        startDate: startDateStr,
        endDate: endDateStr,
        overview: {
          // Current period data
          totalBookings: currentBookings,
          totalRevenuePaisa: currentRevenue,
          confirmedBookings: Number(stats.confirmedBookings) || 0,
          cancelledBookings: Number(stats.cancelledBookings) || 0,
          completedBookings: Number(stats.completedBookings) || 0,
          cancellationRate: currentBookings > 0 
            ? ((Number(stats.cancelledBookings) || 0) / currentBookings * 100).toFixed(2)
            : '0.00',
          
          // Today's specific data
          todayBookings: Number(todayData.todayBookings) || 0,
          todayRevenuePaisa: Number(todayData.todayRevenue) || 0,
          todayConfirmed: Number(todayData.todayConfirmed) || 0,
          
          // Staff metrics
          activeStaffCount: Number(staffCount),
          
          // Average values
          averageBookingValuePaisa: Math.round(averageBookingValue),
          
          // Trending data with percentages
          bookingsTrend: {
            percentage: bookingsTrend.percentage.toFixed(1),
            direction: bookingsTrend.trend,
            previousPeriodValue: previousBookings
          },
          revenueTrend: {
            percentage: revenueTrend.percentage.toFixed(1),
            direction: revenueTrend.trend,
            previousPeriodValue: previousRevenue
          },
          averageValueTrend: {
            percentage: averageValueTrend.percentage.toFixed(1),
            direction: averageValueTrend.trend,
            previousPeriodValue: Math.round(previousAverageBookingValue)
          }
        },
        popularServices: popularServices.map(service => ({
          serviceName: service.serviceName,
          bookingCount: Number(service.bookingCount) || 0,
          totalRevenuePaisa: Number(service.totalRevenue) || 0
        })),
        bookingTrends: bookingTrends.map(trend => ({
          date: trend.date,
          bookingCount: Number(trend.bookingCount) || 0,
          revenuePaisa: Number(trend.revenue) || 0
        })),
        staffPerformance: staffPerformance
          .filter(performer => performer.staffName) // Filter out null staff names
          .map(performer => ({
            staffName: performer.staffName,
            bookingCount: Number(performer.bookingCount) || 0,
            totalRevenuePaisa: Number(performer.totalRevenue) || 0,
            utilization: staffCount > 0 ? ((Number(performer.bookingCount) || 0) / currentBookings * 100).toFixed(1) : '0.0'
          }))
      };
    } catch (error) {
      console.error('Error fetching salon analytics:', error);
      throw error;
    }
  }

  // Advanced Staff Analytics
  async getAdvancedStaffAnalytics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate, previousStartDate, previousEndDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
      const previousEndDateStr = previousEndDate.toISOString().split('T')[0];

      // Get detailed staff performance metrics
      const staffMetrics = await db
        .select({
          staffId: staff.id,
          staffName: staff.name,
          totalBookings: sql<number>`count(${bookings.id})`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          averageBookingValue: sql<number>`avg(${bookings.totalAmountPaisa})`,
          workingDays: sql<number>`count(distinct ${bookings.bookingDate})`,
          firstBookingDate: sql<string>`min(${bookings.bookingDate})`,
          lastBookingDate: sql<string>`max(${bookings.bookingDate})`
        })
        .from(staff)
        .leftJoin(bookings, and(
          eq(bookings.staffId, staff.id),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .where(and(
          eq(staff.salonId, salonId),
          eq(staff.isActive, 1)
        ))
        .groupBy(staff.id, staff.name);

      // Calculate utilization and efficiency metrics
      const staffAnalytics = staffMetrics.map(staff => {
        const totalBookings = Number(staff.totalBookings) || 0;
        const completedBookings = Number(staff.completedBookings) || 0;
        const cancelledBookings = Number(staff.cancelledBookings) || 0;
        const totalRevenue = Number(staff.totalRevenue) || 0;
        const workingDays = Number(staff.workingDays) || 0;
        const averageBookingValue = Number(staff.averageBookingValue) || 0;

        const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100) : 0;
        const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings * 100) : 0;
        const bookingsPerDay = workingDays > 0 ? (totalBookings / workingDays) : 0;
        const revenuePerDay = workingDays > 0 ? (totalRevenue / workingDays) : 0;

        return {
          staffId: staff.staffId,
          staffName: staff.staffName,
          totalBookings,
          completedBookings,
          completionRate: Number(completionRate.toFixed(1)),
          cancellationRate: Number(cancellationRate.toFixed(1)),
          totalRevenuePaisa: totalRevenue,
          averageBookingValuePaisa: Math.round(averageBookingValue),
          workingDays,
          bookingsPerDay: Number(bookingsPerDay.toFixed(1)),
          revenuePerDay: Math.round(revenuePerDay),
          utilizationScore: Number((completionRate * 0.6 + bookingsPerDay * 10).toFixed(1)),
          efficiency: Number((totalRevenue / Math.max(totalBookings, 1)).toFixed(0))
        };
      });

      return {
        period,
        staffAnalytics: staffAnalytics.sort((a, b) => b.totalRevenuePaisa - a.totalRevenuePaisa),
        summary: {
          totalStaff: staffAnalytics.length,
          averageUtilization: staffAnalytics.length > 0 
            ? Number((staffAnalytics.reduce((sum, s) => sum + s.utilizationScore, 0) / staffAnalytics.length).toFixed(1))
            : 0,
          topPerformer: staffAnalytics.length > 0 ? staffAnalytics[0].staffName : null,
          totalStaffRevenue: staffAnalytics.reduce((sum, s) => sum + s.totalRevenuePaisa, 0)
        }
      };
    } catch (error) {
      console.error('Error fetching advanced staff analytics:', error);
      throw error;
    }
  }

  // Client Retention Analytics
  async getClientRetentionAnalytics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get customer behavior data
      const customerMetrics = await db
        .select({
          customerEmail: bookings.customerEmail,
          customerName: bookings.customerName,
          totalBookings: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(${bookings.totalAmountPaisa})`,
          firstBooking: sql<string>`min(${bookings.bookingDate})`,
          lastBooking: sql<string>`max(${bookings.bookingDate})`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(bookings.customerEmail, bookings.customerName);

      // Calculate retention metrics
      const now = new Date();
      const retentionAnalytics = customerMetrics.map(customer => {
        const totalBookings = Number(customer.totalBookings) || 0;
        const totalSpent = Number(customer.totalSpent) || 0;
        const completedBookings = Number(customer.completedBookings) || 0;
        const firstBookingDate = new Date(customer.firstBooking);
        const lastBookingDate = new Date(customer.lastBooking);
        
        const daysSinceFirst = Math.floor((now.getTime() - firstBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLast = Math.floor((now.getTime() - lastBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const customerLifespan = Math.floor((lastBookingDate.getTime() - firstBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const averageDaysBetweenBookings = totalBookings > 1 ? customerLifespan / (totalBookings - 1) : 0;

        // Customer lifecycle stage
        let lifecycleStage = 'new';
        if (totalBookings >= 5) lifecycleStage = 'loyal';
        else if (totalBookings >= 2) lifecycleStage = 'returning';
        
        // Churn risk assessment
        let churnRisk = 'low';
        if (daysSinceLast > 90) churnRisk = 'high';
        else if (daysSinceLast > 45) churnRisk = 'medium';

        return {
          customerEmail: customer.customerEmail,
          customerName: customer.customerName,
          totalBookings,
          completedBookings,
          totalSpentPaisa: totalSpent,
          averageBookingValuePaisa: totalBookings > 0 ? Math.round(totalSpent / totalBookings) : 0,
          daysSinceFirst,
          daysSinceLast,
          averageDaysBetweenBookings: Math.round(averageDaysBetweenBookings),
          lifecycleStage,
          churnRisk,
          lifetimeValue: totalSpent
        };
      });

      // Calculate aggregate retention metrics
      const totalCustomers = retentionAnalytics.length;
      const returningCustomers = retentionAnalytics.filter(c => c.totalBookings > 1).length;
      const loyalCustomers = retentionAnalytics.filter(c => c.lifecycleStage === 'loyal').length;
      const highRiskCustomers = retentionAnalytics.filter(c => c.churnRisk === 'high').length;

      const averageLifetimeValue = totalCustomers > 0 
        ? retentionAnalytics.reduce((sum, c) => sum + c.lifetimeValue, 0) / totalCustomers 
        : 0;

      return {
        period,
        customerAnalytics: retentionAnalytics.sort((a, b) => b.lifetimeValue - a.lifetimeValue),
        retentionMetrics: {
          totalCustomers,
          newCustomers: retentionAnalytics.filter(c => c.lifecycleStage === 'new').length,
          returningCustomers,
          loyalCustomers,
          retentionRate: totalCustomers > 0 ? Number((returningCustomers / totalCustomers * 100).toFixed(1)) : 0,
          loyaltyRate: totalCustomers > 0 ? Number((loyalCustomers / totalCustomers * 100).toFixed(1)) : 0,
          churnRisk: {
            high: highRiskCustomers,
            medium: retentionAnalytics.filter(c => c.churnRisk === 'medium').length,
            low: retentionAnalytics.filter(c => c.churnRisk === 'low').length
          },
          averageLifetimeValuePaisa: Math.round(averageLifetimeValue),
          averageBookingsPerCustomer: totalCustomers > 0 
            ? Number((retentionAnalytics.reduce((sum, c) => sum + c.totalBookings, 0) / totalCustomers).toFixed(1))
            : 0
        }
      };
    } catch (error) {
      console.error('Error fetching client retention analytics:', error);
      throw error;
    }
  }

  // Service Popularity Analytics
  async getServicePopularityAnalytics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate, previousStartDate, previousEndDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
      const previousEndDateStr = previousEndDate.toISOString().split('T')[0];

      // Current period service performance
      const currentServiceMetrics = await db
        .select({
          serviceId: services.id,
          serviceName: services.name,
          serviceCategory: services.category,
          servicePricePaisa: services.priceInPaisa,
          serviceDuration: services.durationMinutes,
          totalBookings: sql<number>`count(*)`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          averageBookingValue: sql<number>`avg(${bookings.totalAmountPaisa})`,
          uniqueCustomers: sql<number>`count(distinct ${bookings.customerEmail})`
        })
        .from(services)
        .leftJoin(bookings, and(
          eq(bookings.serviceId, services.id),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .where(eq(services.salonId, salonId))
        .groupBy(services.id, services.name, services.category, services.priceInPaisa, services.durationMinutes);

      // Previous period for comparison
      const previousServiceMetrics = await db
        .select({
          serviceId: services.id,
          totalBookings: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(services)
        .leftJoin(bookings, and(
          eq(bookings.serviceId, services.id),
          gte(bookings.bookingDate, previousStartDateStr),
          lte(bookings.bookingDate, previousEndDateStr)
        ))
        .where(eq(services.salonId, salonId))
        .groupBy(services.id);

      // Create lookup for previous period data
      const previousMetricsMap = new Map();
      previousServiceMetrics.forEach(metric => {
        previousMetricsMap.set(metric.serviceId, {
          totalBookings: Number(metric.totalBookings) || 0,
          totalRevenue: Number(metric.totalRevenue) || 0
        });
      });

      // Calculate service analytics with trends
      const serviceAnalytics = currentServiceMetrics.map(service => {
        const totalBookings = Number(service.totalBookings) || 0;
        const completedBookings = Number(service.completedBookings) || 0;
        const totalRevenue = Number(service.totalRevenue) || 0;
        const uniqueCustomers = Number(service.uniqueCustomers) || 0;
        
        const previousData = previousMetricsMap.get(service.serviceId) || { totalBookings: 0, totalRevenue: 0 };
        
        const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100) : 0;
        const cancellationRate = totalBookings > 0 ? (Number(service.cancelledBookings) / totalBookings * 100) : 0;
        const revenuePerBooking = totalBookings > 0 ? (totalRevenue / totalBookings) : 0;
        
        // Trend calculations
        const bookingsTrend = this.calculateTrendMetric(totalBookings, previousData.totalBookings);
        const revenueTrend = this.calculateTrendMetric(totalRevenue, previousData.totalRevenue);

        return {
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          category: service.serviceCategory,
          standardPricePaisa: Number(service.servicePricePaisa) || 0,
          durationMinutes: Number(service.serviceDuration) || 0,
          totalBookings,
          completedBookings,
          completionRate: Number(completionRate.toFixed(1)),
          cancellationRate: Number(cancellationRate.toFixed(1)),
          totalRevenuePaisa: totalRevenue,
          averageRevenuePerBookingPaisa: Math.round(revenuePerBooking),
          uniqueCustomers,
          customerReturnRate: uniqueCustomers > 0 ? Number(((totalBookings - uniqueCustomers) / uniqueCustomers * 100).toFixed(1)) : 0,
          bookingsTrend,
          revenueTrend,
          popularityScore: totalBookings * 0.4 + completionRate * 0.3 + (uniqueCustomers / Math.max(totalBookings, 1)) * 100 * 0.3
        };
      });

      // Service category analysis
      const categoryAnalysis: Record<string, {
        serviceCount: number;
        totalBookings: number;
        totalRevenue: number;
        averageCompletionRate: number;
      }> = {};
      serviceAnalytics.forEach(service => {
        const category = service.category || 'Other';
        if (!categoryAnalysis[category]) {
          categoryAnalysis[category] = {
            serviceCount: 0,
            totalBookings: 0,
            totalRevenue: 0,
            averageCompletionRate: 0
          };
        }
        categoryAnalysis[category].serviceCount++;
        categoryAnalysis[category].totalBookings += service.totalBookings;
        categoryAnalysis[category].totalRevenue += service.totalRevenuePaisa;
        categoryAnalysis[category].averageCompletionRate += service.completionRate;
      });

      // Calculate category averages
      Object.values(categoryAnalysis).forEach((category) => {
        category.averageCompletionRate = category.serviceCount > 0 
          ? Number((category.averageCompletionRate / category.serviceCount).toFixed(1))
          : 0;
      });

      return {
        period,
        serviceAnalytics: serviceAnalytics.sort((a, b) => b.popularityScore - a.popularityScore),
        categoryAnalysis,
        insights: {
          topService: serviceAnalytics.length > 0 ? serviceAnalytics[0].serviceName : null,
          mostProfitableService: serviceAnalytics.length > 0 
            ? serviceAnalytics.sort((a, b) => b.totalRevenuePaisa - a.totalRevenuePaisa)[0].serviceName 
            : null,
          highestCompletionRate: serviceAnalytics.length > 0 
            ? Math.max(...serviceAnalytics.map(s => s.completionRate))
            : 0,
          lowestCancellationRate: serviceAnalytics.length > 0 
            ? Math.min(...serviceAnalytics.map(s => s.cancellationRate))
            : 0
        }
      };
    } catch (error) {
      console.error('Error fetching service popularity analytics:', error);
      throw error;
    }
  }

  // Business Intelligence Metrics
  async getBusinessIntelligenceMetrics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Revenue forecasting based on trends
      const dailyRevenue = await db
        .select({
          date: bookings.bookingDate,
          revenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          bookingCount: sql<number>`count(*)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr),
          eq(bookings.status, 'completed')
        ))
        .groupBy(bookings.bookingDate)
        .orderBy(asc(bookings.bookingDate));

      // Calculate growth trends
      const revenueData = dailyRevenue.map(day => Number(day.revenue) || 0);
      const bookingData = dailyRevenue.map(day => Number(day.bookingCount) || 0);
      
      const averageRevenue = revenueData.length > 0 ? revenueData.reduce((a, b) => a + b, 0) / revenueData.length : 0;
      const averageBookings = bookingData.length > 0 ? bookingData.reduce((a, b) => a + b, 0) / bookingData.length : 0;
      
      // Simple linear trend calculation
      const revenueTrend = this.calculateLinearTrend(revenueData);
      const bookingTrend = this.calculateLinearTrend(bookingData);

      // Peak performance analysis
      const peakRevenueDay = dailyRevenue.length > 0 
        ? dailyRevenue.reduce((max, day) => Number(day.revenue) > Number(max.revenue) ? day : max)
        : null;

      const peakBookingDay = dailyRevenue.length > 0 
        ? dailyRevenue.reduce((max, day) => Number(day.bookingCount) > Number(max.bookingCount) ? day : max)
        : null;

      // Capacity utilization
      const totalStaff = await db
        .select({ count: sql<number>`count(*)` })
        .from(staff)
        .where(and(eq(staff.salonId, salonId), eq(staff.isActive, 1)));

      const staffCount = totalStaff[0]?.count || 0;
      const workingDaysInPeriod = dailyRevenue.length;
      const totalBookings = bookingData.reduce((a, b) => a + b, 0);
      
      // Assume 8 hours working day, 1 hour per booking average
      const theoreticalCapacity = staffCount * workingDaysInPeriod * 8;
      const capacityUtilization = theoreticalCapacity > 0 ? (totalBookings / theoreticalCapacity * 100) : 0;

      return {
        period,
        forecasting: {
          averageDailyRevenuePaisa: Math.round(averageRevenue),
          averageDailyBookings: Number(averageBookings.toFixed(1)),
          revenueTrendSlope: revenueTrend.slope,
          bookingTrendSlope: bookingTrend.slope,
          projectedNextPeriodRevenuePaisa: Math.round(averageRevenue * (1 + revenueTrend.slope / 100)),
          projectedNextPeriodBookings: Math.round(averageBookings * (1 + bookingTrend.slope / 100))
        },
        performance: {
          peakRevenueDay: peakRevenueDay ? {
            date: peakRevenueDay.date,
            revenuePaisa: Number(peakRevenueDay.revenue),
            bookings: Number(peakRevenueDay.bookingCount)
          } : null,
          peakBookingDay: peakBookingDay ? {
            date: peakBookingDay.date,
            revenuePaisa: Number(peakBookingDay.revenue),
            bookings: Number(peakBookingDay.bookingCount)
          } : null,
          capacityUtilization: Number(capacityUtilization.toFixed(1)),
          staffCount,
          workingDays: workingDaysInPeriod
        },
        trends: {
          dailyData: dailyRevenue.map(day => ({
            date: day.date,
            revenuePaisa: Number(day.revenue) || 0,
            bookings: Number(day.bookingCount) || 0
          })),
          revenueGrowthRate: Number(revenueTrend.slope.toFixed(2)),
          bookingGrowthRate: Number(bookingTrend.slope.toFixed(2))
        }
      };
    } catch (error) {
      console.error('Error fetching business intelligence metrics:', error);
      throw error;
    }
  }

  // Cohort Analysis
  async getCohortAnalysis(salonId: string): Promise<any> {
    try {
      // Get all customers with their first booking date
      const customerCohorts = await db
        .select({
          customerEmail: bookings.customerEmail,
          firstBookingDate: sql<string>`min(${bookings.bookingDate})`,
          totalBookings: sql<number>`count(*)`
        })
        .from(bookings)
        .where(eq(bookings.salonId, salonId))
        .groupBy(bookings.customerEmail);

      // Group customers by cohort (month of first booking)
      const cohortData = {};
      customerCohorts.forEach(customer => {
        const cohortMonth = customer.firstBookingDate.substring(0, 7); // YYYY-MM format
        if (!cohortData[cohortMonth]) {
          cohortData[cohortMonth] = {
            cohortSize: 0,
            customers: []
          };
        }
        cohortData[cohortMonth].cohortSize++;
        cohortData[cohortMonth].customers.push({
          email: customer.customerEmail,
          totalBookings: Number(customer.totalBookings)
        });
      });

      // Calculate retention rates for each cohort
      const cohortAnalysis = Object.entries(cohortData).map(([cohortMonth, data]: [string, any]) => {
        const returningCustomers = data.customers.filter(c => c.totalBookings > 1).length;
        const loyalCustomers = data.customers.filter(c => c.totalBookings >= 5).length;
        
        return {
          cohortMonth,
          cohortSize: data.cohortSize,
          returningCustomers,
          loyalCustomers,
          retentionRate: data.cohortSize > 0 ? Number((returningCustomers / data.cohortSize * 100).toFixed(1)) : 0,
          loyaltyRate: data.cohortSize > 0 ? Number((loyalCustomers / data.cohortSize * 100).toFixed(1)) : 0,
          averageBookingsPerCustomer: data.cohortSize > 0 
            ? Number((data.customers.reduce((sum, c) => sum + c.totalBookings, 0) / data.cohortSize).toFixed(1))
            : 0
        };
      }).sort((a, b) => b.cohortMonth.localeCompare(a.cohortMonth));

      return {
        cohorts: cohortAnalysis,
        summary: {
          totalCohorts: cohortAnalysis.length,
          averageRetentionRate: cohortAnalysis.length > 0 
            ? Number((cohortAnalysis.reduce((sum, c) => sum + c.retentionRate, 0) / cohortAnalysis.length).toFixed(1))
            : 0,
          averageLoyaltyRate: cohortAnalysis.length > 0 
            ? Number((cohortAnalysis.reduce((sum, c) => sum + c.loyaltyRate, 0) / cohortAnalysis.length).toFixed(1))
            : 0,
          bestPerformingCohort: cohortAnalysis.length > 0 
            ? cohortAnalysis.reduce((best, current) => current.retentionRate > best.retentionRate ? current : best)
            : null
        }
      };
    } catch (error) {
      console.error('Error fetching cohort analysis:', error);
      throw error;
    }
  }

  // Customer Segmentation
  async getCustomerSegmentation(salonId: string): Promise<any> {
    try {
      const customerData = await db
        .select({
          customerEmail: bookings.customerEmail,
          customerName: bookings.customerName,
          totalBookings: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(${bookings.totalAmountPaisa})`,
          lastBookingDate: sql<string>`max(${bookings.bookingDate})`,
          firstBookingDate: sql<string>`min(${bookings.bookingDate})`
        })
        .from(bookings)
        .where(eq(bookings.salonId, salonId))
        .groupBy(bookings.customerEmail, bookings.customerName);

      // Segment customers based on RFM analysis (Recency, Frequency, Monetary)
      const now = new Date();
      const segments = {
        champions: [], // High value, frequent, recent
        loyalCustomers: [], // High frequency, good monetary
        potentialLoyalists: [], // Recent customers with good frequency
        newCustomers: [], // Recent but low frequency
        promising: [], // Recent customers with potential
        needsAttention: [], // Good monetary but declining frequency
        aboutToSleep: [], // Low recency but good historical value
        atRisk: [], // Low recency and frequency but good monetary
        cannotLoseThem: [], // High monetary value but low recency
        hibernating: [] // Low on all metrics
      };

      customerData.forEach(customer => {
        const totalBookings = Number(customer.totalBookings);
        const totalSpent = Number(customer.totalSpent);
        const lastBookingDate = new Date(customer.lastBookingDate);
        const firstBookingDate = new Date(customer.firstBookingDate);
        
        const daysSinceLastBooking = Math.floor((now.getTime() - lastBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const customerAge = Math.floor((now.getTime() - firstBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const averageBookingValue = totalBookings > 0 ? totalSpent / totalBookings : 0;

        // Simple segmentation logic
        if (totalBookings >= 5 && daysSinceLastBooking <= 30 && totalSpent >= 500000) {
          segments.champions.push(customer);
        } else if (totalBookings >= 3 && daysSinceLastBooking <= 60) {
          segments.loyalCustomers.push(customer);
        } else if (daysSinceLastBooking <= 30 && totalBookings >= 2) {
          segments.potentialLoyalists.push(customer);
        } else if (daysSinceLastBooking <= 30 && totalBookings === 1) {
          segments.newCustomers.push(customer);
        } else if (daysSinceLastBooking <= 60 && totalBookings >= 2) {
          segments.promising.push(customer);
        } else if (totalSpent >= 300000 && daysSinceLastBooking <= 90) {
          segments.needsAttention.push(customer);
        } else if (totalSpent >= 200000 && daysSinceLastBooking <= 120) {
          segments.aboutToSleep.push(customer);
        } else if (totalBookings >= 2 && daysSinceLastBooking <= 180) {
          segments.atRisk.push(customer);
        } else if (totalSpent >= 500000) {
          segments.cannotLoseThem.push(customer);
        } else {
          segments.hibernating.push(customer);
        }
      });

      // Calculate segment metrics
      const segmentMetrics = Object.entries(segments).map(([segmentName, customers]: [string, any[]]) => ({
        segmentName,
        customerCount: customers.length,
        totalRevenuePaisa: customers.reduce((sum, c) => sum + Number(c.totalSpent), 0),
        averageLifetimeValuePaisa: customers.length > 0 
          ? Math.round(customers.reduce((sum, c) => sum + Number(c.totalSpent), 0) / customers.length)
          : 0,
        averageBookings: customers.length > 0 
          ? Number((customers.reduce((sum, c) => sum + Number(c.totalBookings), 0) / customers.length).toFixed(1))
          : 0,
        percentage: customerData.length > 0 ? Number((customers.length / customerData.length * 100).toFixed(1)) : 0
      }));

      return {
        segments: segmentMetrics.sort((a, b) => b.totalRevenuePaisa - a.totalRevenuePaisa),
        totalCustomers: customerData.length,
        insights: {
          highValueSegments: ['champions', 'loyalCustomers', 'cannotLoseThem'],
          atRiskSegments: ['aboutToSleep', 'atRisk', 'hibernating'],
          growthOpportunitySegments: ['potentialLoyalists', 'promising', 'newCustomers']
        }
      };
    } catch (error) {
      console.error('Error fetching customer segmentation:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateDateRange(period: string) {
    const endDate = new Date();
    const startDate = new Date();
    const previousStartDate = new Date();
    const previousEndDate = new Date();
    
    switch (period) {
      case 'daily':
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        previousStartDate.setDate(endDate.getDate() - 2);
        previousEndDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
      case 'week':
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        previousStartDate.setDate(endDate.getDate() - 14);
        previousEndDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
      case 'month':
      case '30d':
        startDate.setMonth(endDate.getMonth() - 1);
        previousStartDate.setMonth(endDate.getMonth() - 2);
        previousEndDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
      case 'quarter':
      case '90d':
        startDate.setMonth(endDate.getMonth() - 3);
        previousStartDate.setMonth(endDate.getMonth() - 6);
        previousEndDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'yearly':
      case 'year':
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        previousStartDate.setFullYear(endDate.getFullYear() - 2);
        previousEndDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
        previousStartDate.setMonth(endDate.getMonth() - 2);
        previousEndDate.setMonth(endDate.getMonth() - 1);
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  private calculateTrendMetric(current: number, previous: number) {
    if (previous === 0) {
      return current > 0 ? { percentage: '100.0', direction: 'up' } : { percentage: '0.0', direction: 'neutral' };
    }
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  }

  private calculateLinearTrend(data: number[]) {
    if (data.length < 2) return { slope: 0, intercept: 0 };
    
    const n = data.length;
    const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = data.reduce((sum, _, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope: slope || 0, intercept: intercept || 0 };
  }

  // Payment operations
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByBookingId(bookingId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.bookingId, bookingId));
    return payment || undefined;
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    const updates: any = { status };
    if (completedAt) {
      updates.completedAt = completedAt;
    }
    await db.update(payments).set(updates).where(eq(payments.id, id));
  }

  async updatePaymentOrderId(id: string, razorpayOrderId: string): Promise<void> {
    await db.update(payments).set({ razorpayOrderId }).where(eq(payments.id, id));
  }

  async updatePaymentDetails(id: string, razorpayPaymentId: string, razorpaySignature: string): Promise<void> {
    await db.update(payments).set({ 
      razorpayPaymentId, 
      razorpaySignature 
    }).where(eq(payments.id, id));
  }

  async getPaymentByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, razorpayOrderId));
    return payment || undefined;
  }

  // Staff operations
  async getStaff(id: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember || undefined;
  }

  async getStaffBySalonId(salonId: string): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.salonId, salonId));
  }

  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(staffData).returning();
    return newStaff;
  }

  async updateStaff(id: string, updates: Partial<InsertStaff>): Promise<void> {
    await db.update(staff).set(updates).where(eq(staff.id, id));
  }

  // Availability pattern operations
  async getAvailabilityPattern(id: string): Promise<AvailabilityPattern | undefined> {
    const [pattern] = await db.select().from(availabilityPatterns).where(eq(availabilityPatterns.id, id));
    return pattern || undefined;
  }

  async getAvailabilityPatternsBySalonId(salonId: string): Promise<AvailabilityPattern[]> {
    return await db.select().from(availabilityPatterns).where(eq(availabilityPatterns.salonId, salonId));
  }

  async getAvailabilityPatternsByStaffId(staffId: string): Promise<AvailabilityPattern[]> {
    return await db.select().from(availabilityPatterns).where(eq(availabilityPatterns.staffId, staffId));
  }

  async createAvailabilityPattern(pattern: InsertAvailabilityPattern): Promise<AvailabilityPattern> {
    const [newPattern] = await db.insert(availabilityPatterns).values(pattern).returning();
    return newPattern;
  }

  async updateAvailabilityPattern(id: string, updates: Partial<InsertAvailabilityPattern>): Promise<void> {
    await db.update(availabilityPatterns).set(updates).where(eq(availabilityPatterns.id, id));
  }

  async deleteAvailabilityPattern(id: string): Promise<void> {
    await db.delete(availabilityPatterns).where(eq(availabilityPatterns.id, id));
  }

  // Time slot operations
  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const [slot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return slot || undefined;
  }

  async getTimeSlotsByDateRange(salonId: string, startDate: string, endDate: string): Promise<TimeSlot[]> {
    return await db.select().from(timeSlots)
      .where(and(
        eq(timeSlots.salonId, salonId),
        eq(timeSlots.startDateTime, new Date(startDate)),
        eq(timeSlots.endDateTime, new Date(endDate))
      ));
  }

  async getAvailableTimeSlots(salonId: string, date: string, staffId?: string): Promise<TimeSlot[]> {
    const conditions = [
      eq(timeSlots.salonId, salonId),
      eq(timeSlots.isBooked, 0),
      eq(timeSlots.isBlocked, 0)
    ];
    
    if (staffId) {
      conditions.push(eq(timeSlots.staffId, staffId));
    }

    return await db.select().from(timeSlots).where(and(...conditions));
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const [newSlot] = await db.insert(timeSlots).values(timeSlot).returning();
    return newSlot;
  }

  async updateTimeSlot(id: string, updates: Partial<InsertTimeSlot>): Promise<void> {
    await db.update(timeSlots).set(updates).where(eq(timeSlots.id, id));
  }

  async blockTimeSlot(id: string): Promise<void> {
    await db.update(timeSlots).set({ isBlocked: 1 }).where(eq(timeSlots.id, id));
  }

  async unblockTimeSlot(id: string): Promise<void> {
    await db.update(timeSlots).set({ isBlocked: 0 }).where(eq(timeSlots.id, id));
  }

  // Availability generation methods
  async generateTimeSlotsFromPattern(patternId: string, startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    const pattern = await this.getAvailabilityPattern(patternId);
    if (!pattern) {
      throw new Error('Availability pattern not found');
    }

    const slots: InsertTimeSlot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Check if current date matches the pattern's day of week
      if (currentDate.getDay() === pattern.dayOfWeek) {
        // Parse start and end times
        const [startHour, startMinute] = pattern.startTime.split(':').map(Number);
        const [endHour, endMinute] = pattern.endTime.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMinute, 0, 0);

        // Generate slots for this day
        while (slotStart < dayEnd) {
          const slotEnd = new Date(slotStart.getTime() + pattern.slotDurationMinutes * 60000);
          
          if (slotEnd <= dayEnd) {
            slots.push({
              patternId: pattern.id,
              salonId: pattern.salonId,
              staffId: pattern.staffId,
              startDateTime: new Date(slotStart),
              endDateTime: new Date(slotEnd),
              isBooked: 0,
              isBlocked: 0
            });
          }

          slotStart = new Date(slotEnd);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Insert all slots and return them
    if (slots.length > 0) {
      return await db.insert(timeSlots).values(slots).returning();
    }
    
    return [];
  }

  async regenerateTimeSlotsForSalon(salonId: string, startDate: Date, endDate: Date): Promise<void> {
    // Delete existing slots in the date range
    await db.delete(timeSlots).where(and(
      eq(timeSlots.salonId, salonId),
      eq(timeSlots.isBooked, 0) // Only delete unbooked slots
    ));

    // Get all active patterns for this salon
    const patterns = await this.getAvailabilityPatternsBySalonId(salonId);
    const activePatterns = patterns.filter(p => p.isActive === 1);

    // Generate slots for each pattern
    for (const pattern of activePatterns) {
      await this.generateTimeSlotsFromPattern(pattern.id, startDate, endDate);
    }
  }

  // Email verification operations
  async createVerificationToken(email: string, userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    await db.insert(emailVerificationTokens).values({
      email,
      token,
      userId,
      expiresAt
    });

    return token;
  }

  async verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; userId?: string }> {
    const [verificationToken] = await db.select()
      .from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.token, token),
        isNull(emailVerificationTokens.verifiedAt) // Not already verified
      ));

    if (!verificationToken) {
      return { success: false };
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      return { success: false };
    }

    // Mark token as verified
    await db.update(emailVerificationTokens)
      .set({ verifiedAt: new Date() })
      .where(eq(emailVerificationTokens.token, token));

    return {
      success: true,
      email: verificationToken.email,
      userId: verificationToken.userId || undefined
    };
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await db.update(users)
      .set({ emailVerified: 1 })
      .where(eq(users.id, userId));
  }

  // Business Profile Setup Implementation

  // Booking settings operations
  async getBookingSettings(salonId: string): Promise<BookingSettings | undefined> {
    const [settings] = await db.select().from(bookingSettings).where(eq(bookingSettings.salonId, salonId));
    return settings || undefined;
  }

  async createBookingSettings(settings: InsertBookingSettings): Promise<BookingSettings> {
    const [newSettings] = await db.insert(bookingSettings).values(settings).returning();
    return newSettings;
  }

  async updateBookingSettings(salonId: string, updates: Partial<InsertBookingSettings>): Promise<void> {
    await db.update(bookingSettings).set(updates).where(eq(bookingSettings.salonId, salonId));
  }

  // Staff-service operations
  async getStaffService(staffId: string, serviceId: string): Promise<StaffService | undefined> {
    const [staffService] = await db.select().from(staffServices).where(
      and(eq(staffServices.staffId, staffId), eq(staffServices.serviceId, serviceId))
    );
    return staffService || undefined;
  }

  async getStaffServicesBySalonId(salonId: string): Promise<StaffService[]> {
    return await db.select().from(staffServices).where(eq(staffServices.salonId, salonId));
  }

  async getStaffServicesByStaffId(staffId: string): Promise<StaffService[]> {
    return await db.select().from(staffServices).where(eq(staffServices.staffId, staffId));
  }

  async getStaffServicesByServiceId(serviceId: string): Promise<StaffService[]> {
    return await db.select().from(staffServices).where(eq(staffServices.serviceId, serviceId));
  }

  async createStaffService(staffService: InsertStaffService): Promise<StaffService> {
    const [newStaffService] = await db.insert(staffServices).values(staffService).returning();
    return newStaffService;
  }

  async updateStaffService(staffId: string, serviceId: string, updates: Partial<InsertStaffService>): Promise<void> {
    await db.update(staffServices).set(updates).where(
      and(eq(staffServices.staffId, staffId), eq(staffServices.serviceId, serviceId))
    );
  }

  async deleteStaffService(staffId: string, serviceId: string): Promise<void> {
    await db.delete(staffServices).where(
      and(eq(staffServices.staffId, staffId), eq(staffServices.serviceId, serviceId))
    );
  }

  // Resource operations
  async getResource(id: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  async getResourcesBySalonId(salonId: string): Promise<Resource[]> {
    return await db.select().from(resources).where(and(
      eq(resources.salonId, salonId),
      eq(resources.isActive, 1)
    ));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: string, salonId: string, updates: Partial<InsertResource>): Promise<void> {
    await db.update(resources).set(updates).where(and(eq(resources.id, id), eq(resources.salonId, salonId)));
  }

  async deleteResource(id: string, salonId: string): Promise<void> {
    await db.update(resources).set({ isActive: 0 }).where(and(eq(resources.id, id), eq(resources.salonId, salonId)));
  }

  // Service-resource operations
  async getServiceResource(serviceId: string, resourceId: string): Promise<ServiceResource | undefined> {
    const [serviceResource] = await db.select().from(serviceResources).where(
      and(eq(serviceResources.serviceId, serviceId), eq(serviceResources.resourceId, resourceId))
    );
    return serviceResource || undefined;
  }

  async getServiceResourcesBySalonId(salonId: string): Promise<ServiceResource[]> {
    return await db.select().from(serviceResources).where(eq(serviceResources.salonId, salonId));
  }

  async getServiceResourcesByServiceId(serviceId: string): Promise<ServiceResource[]> {
    return await db.select().from(serviceResources).where(eq(serviceResources.serviceId, serviceId));
  }

  async getServiceResourcesByResourceId(resourceId: string): Promise<ServiceResource[]> {
    return await db.select().from(serviceResources).where(eq(serviceResources.resourceId, resourceId));
  }

  async createServiceResource(serviceResource: InsertServiceResource): Promise<ServiceResource> {
    const [newServiceResource] = await db.insert(serviceResources).values(serviceResource).returning();
    return newServiceResource;
  }

  async updateServiceResource(serviceId: string, resourceId: string, updates: Partial<InsertServiceResource>): Promise<void> {
    await db.update(serviceResources).set(updates).where(
      and(eq(serviceResources.serviceId, serviceId), eq(serviceResources.resourceId, resourceId))
    );
  }

  async deleteServiceResource(serviceId: string, resourceId: string): Promise<void> {
    await db.delete(serviceResources).where(
      and(eq(serviceResources.serviceId, serviceId), eq(serviceResources.resourceId, resourceId))
    );
  }

  // Media asset operations
  async getMediaAsset(id: string): Promise<MediaAsset | undefined> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
    return asset || undefined;
  }

  async getMediaAssetsBySalonId(salonId: string): Promise<MediaAsset[]> {
    return await db.select().from(mediaAssets).where(eq(mediaAssets.salonId, salonId));
  }

  async getMediaAssetsByType(salonId: string, assetType: string): Promise<MediaAsset[]> {
    return await db.select().from(mediaAssets).where(
      and(eq(mediaAssets.salonId, salonId), eq(mediaAssets.assetType, assetType))
    );
  }

  async createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset> {
    const [newAsset] = await db.insert(mediaAssets).values(asset).returning();
    return newAsset;
  }

  async updateMediaAsset(id: string, salonId: string, updates: Partial<InsertMediaAsset>): Promise<void> {
    await db.update(mediaAssets).set(updates).where(and(eq(mediaAssets.id, id), eq(mediaAssets.salonId, salonId)));
  }

  async setPrimaryMediaAsset(salonId: string, assetId: string): Promise<MediaAsset> {
    // Use transaction to ensure atomicity and prevent split-brain primaries
    return await db.transaction(async (tx) => {
      // First, remove primary from all existing assets for this salon
      await tx.update(mediaAssets).set({ isPrimary: 0 }).where(eq(mediaAssets.salonId, salonId));
      // Then set the specified asset as primary (with salon validation)
      await tx.update(mediaAssets).set({ isPrimary: 1 }).where(
        and(eq(mediaAssets.id, assetId), eq(mediaAssets.salonId, salonId))
      );
      // Return the updated asset
      const [updatedAsset] = await tx.select().from(mediaAssets).where(
        and(eq(mediaAssets.id, assetId), eq(mediaAssets.salonId, salonId))
      );
      if (!updatedAsset) {
        throw new Error('Media asset not found');
      }
      return updatedAsset;
    });
  }

  async deleteMediaAsset(id: string, salonId: string): Promise<void> {
    await db.delete(mediaAssets).where(and(eq(mediaAssets.id, id), eq(mediaAssets.salonId, salonId)));
  }

  // Tax rate operations
  async getTaxRate(id: string): Promise<TaxRate | undefined> {
    const [taxRate] = await db.select().from(taxRates).where(eq(taxRates.id, id));
    return taxRate || undefined;
  }

  async getTaxRatesBySalonId(salonId: string): Promise<TaxRate[]> {
    return await db.select().from(taxRates).where(and(
      eq(taxRates.salonId, salonId),
      eq(taxRates.isActive, 1)
    ));
  }

  async getDefaultTaxRate(salonId: string): Promise<TaxRate | undefined> {
    const [defaultTax] = await db.select().from(taxRates).where(
      and(eq(taxRates.salonId, salonId), eq(taxRates.isDefault, 1), eq(taxRates.isActive, 1))
    );
    return defaultTax || undefined;
  }

  async createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate> {
    const [newTaxRate] = await db.insert(taxRates).values(taxRate).returning();
    return newTaxRate;
  }

  async updateTaxRate(id: string, salonId: string, updates: Partial<InsertTaxRate>): Promise<void> {
    await db.update(taxRates).set(updates).where(and(eq(taxRates.id, id), eq(taxRates.salonId, salonId)));
  }

  async setDefaultTaxRate(salonId: string, taxRateId: string): Promise<void> {
    // Use transaction to ensure atomicity and prevent split-brain defaults
    await db.transaction(async (tx) => {
      // First, remove default from all existing tax rates for this salon
      await tx.update(taxRates).set({ isDefault: 0 }).where(eq(taxRates.salonId, salonId));
      // Then set the specified tax rate as default (with salon validation)
      await tx.update(taxRates).set({ isDefault: 1 }).where(
        and(eq(taxRates.id, taxRateId), eq(taxRates.salonId, salonId))
      );
    });
  }

  async deleteTaxRate(id: string, salonId: string): Promise<void> {
    await db.update(taxRates).set({ isActive: 0 }).where(and(eq(taxRates.id, id), eq(taxRates.salonId, salonId)));
  }

  // Payout account operations
  async getPayoutAccount(id: string): Promise<PayoutAccount | undefined> {
    const [account] = await db.select().from(payoutAccounts).where(eq(payoutAccounts.id, id));
    return account || undefined;
  }

  async getPayoutAccountsBySalonId(salonId: string): Promise<PayoutAccount[]> {
    return await db.select().from(payoutAccounts).where(and(
      eq(payoutAccounts.salonId, salonId),
      eq(payoutAccounts.isActive, 1)
    ));
  }

  async getDefaultPayoutAccount(salonId: string): Promise<PayoutAccount | undefined> {
    const [defaultAccount] = await db.select().from(payoutAccounts).where(
      and(eq(payoutAccounts.salonId, salonId), eq(payoutAccounts.isDefault, 1), eq(payoutAccounts.isActive, 1))
    );
    return defaultAccount || undefined;
  }

  async createPayoutAccount(account: InsertPayoutAccount): Promise<PayoutAccount> {
    const [newAccount] = await db.insert(payoutAccounts).values(account).returning();
    return newAccount;
  }

  async updatePayoutAccount(id: string, salonId: string, updates: Partial<InsertPayoutAccount>): Promise<void> {
    await db.update(payoutAccounts).set(updates).where(and(eq(payoutAccounts.id, id), eq(payoutAccounts.salonId, salonId)));
  }

  async setDefaultPayoutAccount(salonId: string, accountId: string): Promise<void> {
    // Use transaction to ensure atomicity and prevent split-brain defaults
    await db.transaction(async (tx) => {
      // First, remove default from all existing accounts for this salon
      await tx.update(payoutAccounts).set({ isDefault: 0 }).where(eq(payoutAccounts.salonId, salonId));
      // Then set the specified account as default (with salon validation)
      await tx.update(payoutAccounts).set({ isDefault: 1 }).where(
        and(eq(payoutAccounts.id, accountId), eq(payoutAccounts.salonId, salonId))
      );
    });
  }

  async deletePayoutAccount(id: string, salonId: string): Promise<void> {
    await db.update(payoutAccounts).set({ isActive: 0 }).where(and(eq(payoutAccounts.id, id), eq(payoutAccounts.salonId, salonId)));
  }

  // Publish state operations
  async getPublishState(salonId: string): Promise<PublishState | undefined> {
    const [state] = await db.select().from(publishState).where(eq(publishState.salonId, salonId));
    return state || undefined;
  }

  async createPublishState(state: InsertPublishState): Promise<PublishState> {
    const [newState] = await db.insert(publishState).values(state).returning();
    return newState;
  }

  async updatePublishState(salonId: string, updates: Partial<InsertPublishState>): Promise<void> {
    await db.update(publishState).set(updates).where(eq(publishState.salonId, salonId));
  }

  async checkBusinessReadiness(salonId: string): Promise<{ isReady: boolean; missingRequirements: string[] }> {
    const missingRequirements: string[] = [];

    // Check if salon has basic information
    const salon = await this.getSalon(salonId);
    if (!salon || !salon.name || !salon.address || !salon.phone) {
      missingRequirements.push("Complete salon basic information");
    }

    // Check if salon has at least one service
    const services = await this.getServicesBySalonId(salonId);
    if (services.length === 0) {
      missingRequirements.push("Add at least one service");
    }

    // Check if salon has at least one staff member
    const staff = await this.getStaffBySalonId(salonId);
    if (staff.length === 0) {
      missingRequirements.push("Add at least one staff member");
    }

    // Check if salon has booking settings configured
    const bookingSettings = await this.getBookingSettings(salonId);
    if (!bookingSettings) {
      missingRequirements.push("Configure booking settings");
    }

    // Check if salon has at least one tax rate configured
    const taxRates = await this.getTaxRatesBySalonId(salonId);
    if (taxRates.length === 0) {
      missingRequirements.push("Configure tax rates");
    }

    // Check if salon has a default payout account
    const defaultPayoutAccount = await this.getDefaultPayoutAccount(salonId);
    if (!defaultPayoutAccount) {
      missingRequirements.push("Configure payout account");
    }

    return {
      isReady: missingRequirements.length === 0,
      missingRequirements
    };
  }

  async checkDashboardCompletion(salonId: string): Promise<{
    profile: { isComplete: boolean; missingFields?: string[] };
    services: { isComplete: boolean; count: number };
    staff: { isComplete: boolean; count: number };
    settings: { isComplete: boolean; missingFields?: string[] };
    media: { isComplete: boolean; count: number };
    overallProgress: number;
    nextStep?: string;
  }> {
    // Get all the data we need to check completion
    const salon = await this.getSalon(salonId);
    const services = await this.getServicesBySalonId(salonId);
    const staff = await this.getStaffBySalonId(salonId);
    const bookingSettings = await this.getBookingSettings(salonId);
    const mediaAssets = await this.getMediaAssetsBySalonId(salonId);

    // Check Profile completion
    const profileMissingFields: string[] = [];
    if (!salon?.name) profileMissingFields.push('name');
    if (!salon?.address) profileMissingFields.push('address');
    if (!salon?.phone) profileMissingFields.push('phone');
    if (!salon?.email) profileMissingFields.push('email');
    if (!salon?.description) profileMissingFields.push('description');
    
    const profileComplete = profileMissingFields.length === 0;

    // Check Services completion
    const servicesComplete = services.length > 0;

    // Check Staff completion
    const staffComplete = staff.length > 0;

    // Check Settings completion - settings are complete if they exist and have required fields
    const settingsMissingFields: string[] = [];
    if (!bookingSettings) {
      settingsMissingFields.push('bookingSettings');
    } else {
      // Only check for essential fields, not specific values
      if (!bookingSettings.timezone) {
        settingsMissingFields.push('timezone');
      }
      if (bookingSettings.leadTimeMinutes === null || bookingSettings.leadTimeMinutes === undefined) {
        settingsMissingFields.push('leadTimeMinutes');
      }
      if (bookingSettings.cancelWindowMinutes === null || bookingSettings.cancelWindowMinutes === undefined) {
        settingsMissingFields.push('cancelWindowMinutes');
      }
    }
    
    const settingsComplete = settingsMissingFields.length === 0;

    // Check Media completion
    const mediaComplete = mediaAssets.length > 0;

    // Calculate overall progress
    const completedSections = [
      profileComplete,
      servicesComplete,
      staffComplete,
      settingsComplete,
      mediaComplete
    ].filter(Boolean).length;
    
    const overallProgress = Math.round((completedSections / 5) * 100);

    // Determine next step
    let nextStep: string | undefined;
    if (!profileComplete) {
      nextStep = 'profile';
    } else if (!servicesComplete) {
      nextStep = 'services';
    } else if (!staffComplete) {
      nextStep = 'staff';
    } else if (!settingsComplete) {
      nextStep = 'settings';
    } else if (!mediaComplete) {
      nextStep = 'media';
    }

    return {
      profile: { 
        isComplete: profileComplete, 
        missingFields: profileComplete ? undefined : profileMissingFields 
      },
      services: { 
        isComplete: servicesComplete, 
        count: services.length 
      },
      staff: { 
        isComplete: staffComplete, 
        count: staff.length 
      },
      settings: { 
        isComplete: settingsComplete, 
        missingFields: settingsComplete ? undefined : settingsMissingFields 
      },
      media: { 
        isComplete: mediaComplete, 
        count: mediaAssets.length 
      },
      overallProgress,
      nextStep
    };
  }
  
  // Customer Profile Operations
  async getCustomerProfile(salonId: string, customerEmail: string): Promise<CustomerProfile | undefined> {
    try {
      const [profile] = await db
        .select()
        .from(customerProfiles)
        .where(and(
          eq(customerProfiles.salonId, salonId),
          eq(customerProfiles.customerEmail, customerEmail)
        ));
      return profile || undefined;
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      throw error;
    }
  }
  
  async getOrCreateCustomerProfile(salonId: string, customerEmail: string): Promise<CustomerProfile | undefined> {
    try {
      // First try to get existing profile
      const existingProfile = await this.getCustomerProfile(salonId, customerEmail);
      if (existingProfile) {
        return existingProfile;
      }
      
      // If no profile exists, find customer data from their most recent booking
      // Direct query instead of O(n) scan
      const [customerBooking] = await db
        .select({
          customerName: bookings.customerName,
          customerPhone: bookings.customerPhone,
          customerEmail: bookings.customerEmail
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.customerEmail, customerEmail)
        ))
        .orderBy(desc(bookings.createdAt))
        .limit(1);
      
      if (!customerBooking) {
        return undefined; // Customer not found
      }
      
      // Use INSERT...ON CONFLICT for safe profile creation
      try {
        const [created] = await db
          .insert(customerProfiles)
          .values({
            salonId,
            customerEmail: customerEmail,
            customerName: customerBooking.customerName,
            customerPhone: customerBooking.customerPhone,
            notes: '',
            preferences: {},
            isVip: 0,
            tags: []
          })
          .onConflictDoNothing()
          .returning();
        
        // If conflict occurred (profile already exists), fetch the existing one
        if (!created) {
          return await this.getCustomerProfile(salonId, customerEmail);
        }
        
        return created;
      } catch (error) {
        // Handle unique constraint violations gracefully
        console.warn('Profile creation conflict, fetching existing profile:', error);
        return await this.getCustomerProfile(salonId, customerEmail);
      }
      
    } catch (error) {
      console.error('Error getting or creating customer profile:', error);
      throw error;
    }
  }
  
  async getCustomerProfileById(id: string): Promise<CustomerProfile | undefined> {
    try {
      const [profile] = await db
        .select()
        .from(customerProfiles)
        .where(eq(customerProfiles.id, id));
      return profile || undefined;
    } catch (error) {
      console.error('Error fetching customer profile by ID:', error);
      throw error;
    }
  }
  
  async createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile> {
    try {
      const [created] = await db
        .insert(customerProfiles)
        .values(profile)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating customer profile:', error);
      throw error;
    }
  }
  
  async updateCustomerProfile(id: string, salonId: string, updates: UpdateCustomerNotesInput): Promise<void> {
    try {
      // Build update object - only include isVip if explicitly provided
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };
      
      // Fix: Only update isVip if explicitly provided, preserve existing value otherwise
      if (updates.isVip !== undefined) {
        updateData.isVip = updates.isVip ? 1 : 0;
      }
      
      await db
        .update(customerProfiles)
        .set(updateData)
        .where(and(
          eq(customerProfiles.id, id),
          eq(customerProfiles.salonId, salonId)
        ));
    } catch (error) {
      console.error('Error updating customer profile:', error);
      throw error;
    }
  }
  
  async getCustomerBookingHistory(salonId: string, customerEmail: string): Promise<any[]> {
    try {
      const bookingHistory = await db
        .select({
          id: bookings.id,
          serviceId: bookings.serviceId,
          bookingDate: bookings.bookingDate,
          bookingTime: bookings.bookingTime,
          status: bookings.status,
          totalAmountPaisa: bookings.totalAmountPaisa,
          currency: bookings.currency,
          notes: bookings.notes,
          createdAt: bookings.createdAt,
          serviceName: services.name,
          serviceDuration: services.durationMinutes,
          staffName: staff.name
        })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(staff, eq(bookings.staffId, staff.id))
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.customerEmail, customerEmail)
        ))
        .orderBy(desc(bookings.createdAt));
        
      return bookingHistory;
    } catch (error) {
      console.error('Error fetching customer booking history:', error);
      throw error;
    }
  }
  
  async getCustomerStats(salonId: string, customerEmail: string): Promise<{
    totalBookings: number;
    totalSpent: number;
    lastVisit: string | null;
    favoriteServices: Array<{ serviceId: string; serviceName: string; count: number }>;
    averageSpend: number;
    bookingFrequency: string;
  }> {
    try {
      // Get basic stats
      const [stats] = await db
        .select({
          totalBookings: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(${bookings.totalAmountPaisa})`,
          lastVisit: sql<string>`max(${bookings.bookingDate})`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.customerEmail, customerEmail)
        ));
        
      // Get favorite services
      const favoriteServices = await db
        .select({
          serviceId: bookings.serviceId,
          serviceName: services.name,
          count: sql<number>`count(*)`
        })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.customerEmail, customerEmail)
        ))
        .groupBy(bookings.serviceId, services.name)
        .orderBy(desc(sql`count(*)`));
        
      const totalBookings = Number(stats?.totalBookings) || 0;
      const totalSpent = Number(stats?.totalSpent) || 0;
      const averageSpend = totalBookings > 0 ? totalSpent / totalBookings : 0;
      
      // Calculate booking frequency
      let bookingFrequency = 'New Customer';
      if (totalBookings >= 10) {
        bookingFrequency = 'Frequent';
      } else if (totalBookings >= 5) {
        bookingFrequency = 'Regular';
      } else if (totalBookings >= 2) {
        bookingFrequency = 'Returning';
      }
      
      return {
        totalBookings,
        totalSpent,
        lastVisit: stats?.lastVisit || null,
        favoriteServices: favoriteServices.map(f => ({
          serviceId: f.serviceId,
          serviceName: f.serviceName || 'Unknown Service',
          count: f.count
        })),
        averageSpend,
        bookingFrequency
      };
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  }

  // ===============================================
  // FINANCIAL REPORTING SYSTEM IMPLEMENTATIONS
  // ===============================================

  // Expense category operations
  async getExpenseCategory(id: string): Promise<ExpenseCategory | undefined> {
    const [category] = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    return category || undefined;
  }

  async getExpenseCategoriesBySalonId(salonId: string): Promise<ExpenseCategory[]> {
    return await db.select().from(expenseCategories)
      .where(and(eq(expenseCategories.salonId, salonId), eq(expenseCategories.isActive, 1)))
      .orderBy(asc(expenseCategories.name));
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    const [newCategory] = await db.insert(expenseCategories).values(category).returning();
    return newCategory;
  }

  async updateExpenseCategory(id: string, salonId: string, updates: Partial<InsertExpenseCategory>): Promise<void> {
    await db.update(expenseCategories)
      .set(updates)
      .where(and(eq(expenseCategories.id, id), eq(expenseCategories.salonId, salonId)));
  }

  async deleteExpenseCategory(id: string, salonId: string): Promise<void> {
    await db.update(expenseCategories)
      .set({ isActive: 0 })
      .where(and(eq(expenseCategories.id, id), eq(expenseCategories.salonId, salonId)));
  }

  async createDefaultExpenseCategories(salonId: string): Promise<ExpenseCategory[]> {
    const defaultCategories: InsertExpenseCategory[] = [
      { salonId, name: 'Supplies', description: 'Hair products, nail polish, tools', color: '#8B5CF6', isDefault: 1 },
      { salonId, name: 'Utilities', description: 'Electricity, water, internet', color: '#3B82F6', isDefault: 1 },
      { salonId, name: 'Rent', description: 'Office and salon space rental', color: '#EF4444', isDefault: 1 },
      { salonId, name: 'Marketing', description: 'Advertising and promotional expenses', color: '#F59E0B', isDefault: 1 },
      { salonId, name: 'Equipment', description: 'Salon equipment and maintenance', color: '#10B981', isDefault: 1 },
      { salonId, name: 'Staff Costs', description: 'Training, uniforms, benefits', color: '#F97316', isDefault: 1 },
      { salonId, name: 'Professional Services', description: 'Legal, accounting, consulting', color: '#6366F1', isDefault: 1 },
      { salonId, name: 'Insurance', description: 'Business and liability insurance', color: '#8B5A2B', isDefault: 1 },
    ];

    return await db.insert(expenseCategories).values(defaultCategories).returning();
  }

  // Expense operations
  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async getExpensesBySalonId(salonId: string, filters?: { 
    categoryId?: string; 
    status?: string; 
    startDate?: string; 
    endDate?: string;
    createdBy?: string;
  }): Promise<Expense[]> {
    const conditions = [eq(expenses.salonId, salonId)];

    if (filters?.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }
    if (filters?.status) {
      conditions.push(eq(expenses.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(expenses.expenseDate, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(expenses.expenseDate, new Date(filters.endDate)));
    }
    if (filters?.createdBy) {
      conditions.push(eq(expenses.createdBy, filters.createdBy));
    }

    return await db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.expenseDate));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: string, salonId: string, updates: Partial<InsertExpense>): Promise<void> {
    await db.update(expenses)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.salonId, salonId)));
  }

  async approveExpense(id: string, approvedBy: string): Promise<void> {
    await db.update(expenses)
      .set({ 
        status: 'approved', 
        approvedBy, 
        approvedAt: new Date(), 
        updatedAt: new Date() 
      })
      .where(eq(expenses.id, id));
  }

  async rejectExpense(id: string, approvedBy: string): Promise<void> {
    await db.update(expenses)
      .set({ 
        status: 'rejected', 
        approvedBy, 
        approvedAt: new Date(), 
        updatedAt: new Date() 
      })
      .where(eq(expenses.id, id));
  }

  async deleteExpense(id: string, salonId: string): Promise<void> {
    await db.delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.salonId, salonId)));
  }

  async getExpensesByCategory(salonId: string, categoryId: string, period?: string): Promise<Expense[]> {
    const conditions = [eq(expenses.salonId, salonId), eq(expenses.categoryId, categoryId)];

    if (period) {
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'monthly':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'yearly':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      conditions.push(gte(expenses.expenseDate, startDate));
    }

    return await db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.expenseDate));
  }

  async getExpenseAnalytics(salonId: string, period: string): Promise<{
    totalExpenses: number;
    expensesByCategory: Array<{ categoryId: string; categoryName: string; amount: number; percentage: number }>;
    monthlyTrend: Array<{ month: string; amount: number }>;
    topVendors: Array<{ vendor: string; amount: number; count: number }>;
    pendingApprovals: number;
    taxDeductibleAmount: number;
  }> {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get total expenses
    const totalResult = await db.select({
      total: sql<number>`COALESCE(SUM(${expenses.amountPaisa}), 0)`
    }).from(expenses)
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        gte(expenses.expenseDate, startDate)
      ));

    const totalExpenses = totalResult[0]?.total || 0;

    // Get expenses by category
    const categoryResults = await db.select({
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      amount: sql<number>`COALESCE(SUM(${expenses.amountPaisa}), 0)`
    }).from(expenses)
      .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        gte(expenses.expenseDate, startDate)
      ))
      .groupBy(expenses.categoryId, expenseCategories.name);

    const expensesByCategory = categoryResults.map(cat => ({
      ...cat,
      percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0
    }));

    // Get monthly trend (last 12 months)
    const monthlyResults = await db.select({
      month: sql<string>`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`,
      amount: sql<number>`COALESCE(SUM(${expenses.amountPaisa}), 0)`
    }).from(expenses)
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        gte(expenses.expenseDate, new Date(now.getFullYear() - 1, now.getMonth(), 1))
      ))
      .groupBy(sql`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`);

    // Get top vendors
    const vendorResults = await db.select({
      vendor: expenses.vendor,
      amount: sql<number>`COALESCE(SUM(${expenses.amountPaisa}), 0)`,
      count: sql<number>`COUNT(*)`
    }).from(expenses)
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        gte(expenses.expenseDate, startDate),
        sql`${expenses.vendor} IS NOT NULL AND ${expenses.vendor} != ''`
      ))
      .groupBy(expenses.vendor)
      .orderBy(sql`SUM(${expenses.amountPaisa}) DESC`)
      .limit(5);

    // Get pending approvals count
    const pendingResult = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(expenses)
      .where(and(eq(expenses.salonId, salonId), eq(expenses.status, 'pending')));

    // Get tax deductible amount
    const taxDeductibleResult = await db.select({
      total: sql<number>`COALESCE(SUM(${expenses.amountPaisa}), 0)`
    }).from(expenses)
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        eq(expenses.taxDeductible, 1),
        gte(expenses.expenseDate, startDate)
      ));

    return {
      totalExpenses,
      expensesByCategory,
      monthlyTrend: monthlyResults,
      topVendors: vendorResults.map(v => ({ vendor: v.vendor!, amount: v.amount, count: v.count })),
      pendingApprovals: pendingResult[0]?.count || 0,
      taxDeductibleAmount: taxDeductibleResult[0]?.total || 0
    };
  }

  // Commission rate operations
  async getCommissionRate(id: string): Promise<CommissionRate | undefined> {
    const [rate] = await db.select().from(commissionRates).where(eq(commissionRates.id, id));
    return rate || undefined;
  }

  async getCommissionRatesBySalonId(salonId: string): Promise<CommissionRate[]> {
    return await db.select().from(commissionRates)
      .where(and(eq(commissionRates.salonId, salonId), eq(commissionRates.isActive, 1)))
      .orderBy(desc(commissionRates.effectiveFrom));
  }

  async getCommissionRatesByStaffId(staffId: string): Promise<CommissionRate[]> {
    return await db.select().from(commissionRates)
      .where(and(eq(commissionRates.staffId, staffId), eq(commissionRates.isActive, 1)))
      .orderBy(desc(commissionRates.effectiveFrom));
  }

  async getActiveCommissionRate(salonId: string, staffId?: string, serviceId?: string): Promise<CommissionRate | undefined> {
    const now = new Date();
    const conditions = [
      eq(commissionRates.salonId, salonId),
      eq(commissionRates.isActive, 1),
      lte(commissionRates.effectiveFrom, now),
      sql`(${commissionRates.effectiveTo} IS NULL OR ${commissionRates.effectiveTo} >= ${now})`
    ];

    if (staffId) {
      conditions.push(eq(commissionRates.staffId, staffId));
    }
    if (serviceId) {
      conditions.push(eq(commissionRates.serviceId, serviceId));
    }

    const rates = await db.select().from(commissionRates)
      .where(and(...conditions))
      .orderBy(desc(commissionRates.effectiveFrom))
      .limit(1);
    return rates[0] || undefined;
  }

  async createCommissionRate(rate: InsertCommissionRate): Promise<CommissionRate> {
    const [newRate] = await db.insert(commissionRates).values(rate).returning();
    return newRate;
  }

  async updateCommissionRate(id: string, salonId: string, updates: Partial<InsertCommissionRate>): Promise<void> {
    await db.update(commissionRates)
      .set(updates)
      .where(and(eq(commissionRates.id, id), eq(commissionRates.salonId, salonId)));
  }

  async deactivateCommissionRate(id: string): Promise<void> {
    await db.update(commissionRates)
      .set({ isActive: 0, effectiveTo: new Date() })
      .where(eq(commissionRates.id, id));
  }

  // Commission operations
  async getCommission(id: string): Promise<Commission | undefined> {
    const [commission] = await db.select().from(commissions).where(eq(commissions.id, id));
    return commission || undefined;
  }

  async getCommissionsBySalonId(salonId: string, filters?: {
    staffId?: string;
    period?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Commission[]> {
    const conditions = [eq(commissions.salonId, salonId)];

    if (filters?.staffId) {
      conditions.push(eq(commissions.staffId, filters.staffId));
    }
    if (filters?.paymentStatus) {
      conditions.push(eq(commissions.paymentStatus, filters.paymentStatus));
    }
    if (filters?.startDate) {
      conditions.push(gte(commissions.serviceDate, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(commissions.serviceDate, new Date(filters.endDate)));
    }

    return await db.select().from(commissions).where(and(...conditions)).orderBy(desc(commissions.serviceDate));
  }

  async getCommissionsByStaffId(staffId: string, period?: string): Promise<Commission[]> {
    const conditions = [eq(commissions.staffId, staffId)];

    if (period) {
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'monthly':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'yearly':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      conditions.push(gte(commissions.serviceDate, startDate));
    }

    return await db.select().from(commissions).where(and(...conditions)).orderBy(desc(commissions.serviceDate));
  }

  async createCommission(commission: InsertCommission): Promise<Commission> {
    const [newCommission] = await db.insert(commissions).values(commission).returning();
    return newCommission;
  }

  async updateCommission(id: string, salonId: string, updates: Partial<InsertCommission>): Promise<void> {
    await db.update(commissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(commissions.id, id), eq(commissions.salonId, salonId)));
  }

  async payCommissions(commissionIds: string[], paidBy: string, paymentMethod: string, paymentReference?: string): Promise<number> {
    const result = await db.update(commissions)
      .set({ 
        paymentStatus: 'paid',
        paidAt: new Date(),
        paidBy,
        paymentMethod,
        paymentReference,
        updatedAt: new Date()
      })
      .where(inArray(commissions.id, commissionIds));

    return result.rowCount || 0;
  }

  async calculateCommissionForBooking(bookingId: string): Promise<Commission | null> {
    // Get booking details with service and staff information
    const booking = await db.select({
      id: bookings.id,
      salonId: bookings.salonId,
      serviceId: bookings.serviceId,
      staffId: bookings.staffId,
      bookingDate: bookings.bookingDate,
      servicePrice: services.priceInPaisa
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking[0] || !booking[0].staffId) {
      return null;
    }

    const bookingData = booking[0];

    // Get active commission rate
    const rate = await this.getActiveCommissionRate(
      bookingData.salonId, 
      bookingData.staffId, 
      bookingData.serviceId
    );

    if (!rate) {
      return null;
    }

    // Calculate commission amount
    let commissionAmount = 0;
    if (rate.rateType === 'percentage') {
      commissionAmount = Math.round((bookingData.servicePrice * parseFloat(rate.rateValue)) / 100);
    } else if (rate.rateType === 'fixed_amount') {
      commissionAmount = Math.round(parseFloat(rate.rateValue) * 100); // Convert to paisa
    }

    // Apply min/max limits
    if (rate.minAmount && commissionAmount < rate.minAmount) {
      commissionAmount = rate.minAmount;
    }
    if (rate.maxAmount && commissionAmount > rate.maxAmount) {
      commissionAmount = rate.maxAmount;
    }

    const serviceDate = new Date(bookingData.bookingDate);
    
    const commissionData: InsertCommission = {
      salonId: bookingData.salonId,
      staffId: bookingData.staffId,
      bookingId: bookingData.id,
      serviceId: bookingData.serviceId,
      rateId: rate.id,
      baseAmountPaisa: bookingData.servicePrice,
      commissionAmountPaisa: commissionAmount,
      commissionRate: rate.rateValue,
      serviceDate,
      periodYear: serviceDate.getFullYear(),
      periodMonth: serviceDate.getMonth() + 1,
      paymentStatus: 'pending'
    };

    return await this.createCommission(commissionData);
  }

  async getCommissionAnalytics(salonId: string, period: string): Promise<{
    totalCommissions: number;
    paidCommissions: number;
    pendingCommissions: number;
    commissionsByStaff: Array<{ staffId: string; staffName: string; earned: number; paid: number; pending: number }>;
    monthlyTrend: Array<{ month: string; amount: number }>;
    averageCommissionRate: number;
  }> {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get commission totals
    const totalsResult = await db.select({
      total: sql<number>`COALESCE(SUM(${commissions.commissionAmountPaisa}), 0)`,
      paid: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.paymentStatus} = 'paid' THEN ${commissions.commissionAmountPaisa} ELSE 0 END), 0)`,
      pending: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.paymentStatus} = 'pending' THEN ${commissions.commissionAmountPaisa} ELSE 0 END), 0)`
    }).from(commissions)
      .where(and(
        eq(commissions.salonId, salonId),
        gte(commissions.serviceDate, startDate)
      ));

    const totals = totalsResult[0] || { total: 0, paid: 0, pending: 0 };

    // Get commissions by staff
    const staffResults = await db.select({
      staffId: commissions.staffId,
      staffName: staff.name,
      earned: sql<number>`COALESCE(SUM(${commissions.commissionAmountPaisa}), 0)`,
      paid: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.paymentStatus} = 'paid' THEN ${commissions.commissionAmountPaisa} ELSE 0 END), 0)`,
      pending: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.paymentStatus} = 'pending' THEN ${commissions.commissionAmountPaisa} ELSE 0 END), 0)`
    }).from(commissions)
      .innerJoin(staff, eq(commissions.staffId, staff.id))
      .where(and(
        eq(commissions.salonId, salonId),
        gte(commissions.serviceDate, startDate)
      ))
      .groupBy(commissions.staffId, staff.name);

    // Get monthly trend
    const monthlyResults = await db.select({
      month: sql<string>`TO_CHAR(${commissions.serviceDate}, 'YYYY-MM')`,
      amount: sql<number>`COALESCE(SUM(${commissions.commissionAmountPaisa}), 0)`
    }).from(commissions)
      .where(and(
        eq(commissions.salonId, salonId),
        gte(commissions.serviceDate, new Date(now.getFullYear() - 1, now.getMonth(), 1))
      ))
      .groupBy(sql`TO_CHAR(${commissions.serviceDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${commissions.serviceDate}, 'YYYY-MM')`);

    // Get average commission rate
    const avgRateResult = await db.select({
      avgRate: sql<number>`COALESCE(AVG(${commissions.commissionRate}), 0)`
    }).from(commissions)
      .where(and(
        eq(commissions.salonId, salonId),
        gte(commissions.serviceDate, startDate)
      ));

    return {
      totalCommissions: totals.total,
      paidCommissions: totals.paid,
      pendingCommissions: totals.pending,
      commissionsByStaff: staffResults,
      monthlyTrend: monthlyResults,
      averageCommissionRate: avgRateResult[0]?.avgRate || 0
    };
  }

  // Budget operations
  async getBudget(id: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget || undefined;
  }

  async getBudgetsBySalonId(salonId: string, filters?: { categoryId?: string; budgetType?: string; isActive?: boolean }): Promise<Budget[]> {
    const conditions = [eq(budgets.salonId, salonId)];

    if (filters?.categoryId) {
      conditions.push(eq(budgets.categoryId, filters.categoryId));
    }
    if (filters?.budgetType) {
      conditions.push(eq(budgets.budgetType, filters.budgetType));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(budgets.isActive, filters.isActive ? 1 : 0));
    }

    return await db.select().from(budgets).where(and(...conditions)).orderBy(desc(budgets.startDate));
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: string, salonId: string, updates: Partial<InsertBudget>): Promise<void> {
    await db.update(budgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(budgets.id, id), eq(budgets.salonId, salonId)));
  }

  async updateBudgetSpentAmount(salonId: string, categoryId: string, additionalSpent: number): Promise<void> {
    await db.update(budgets)
      .set({ 
        spentAmountPaisa: sql`${budgets.spentAmountPaisa} + ${additionalSpent}`,
        updatedAt: new Date()
      })
      .where(and(
        eq(budgets.salonId, salonId),
        eq(budgets.categoryId, categoryId),
        eq(budgets.isActive, 1),
        lte(budgets.startDate, new Date()),
        gte(budgets.endDate, new Date())
      ));
  }

  async deleteBudget(id: string, salonId: string): Promise<void> {
    await db.update(budgets)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(and(eq(budgets.id, id), eq(budgets.salonId, salonId)));
  }

  async getBudgetAnalytics(salonId: string, period: string): Promise<{
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
    budgetsByCategory: Array<{
      categoryId: string;
      categoryName: string;
      budgeted: number;
      spent: number;
      remaining: number;
      utilization: number;
      status: 'under' | 'on-track' | 'over';
    }>;
    alertingBudgets: Array<{ budgetId: string; name: string; utilization: number }>;
  }> {
    const now = new Date();
    
    // Get active budgets
    const budgetResults = await db.select({
      budgetId: budgets.id,
      budgetName: budgets.name,
      categoryId: budgets.categoryId,
      categoryName: expenseCategories.name,
      budgeted: budgets.budgetAmountPaisa,
      spent: budgets.spentAmountPaisa,
      alertThreshold: budgets.alertThreshold
    }).from(budgets)
      .leftJoin(expenseCategories, eq(budgets.categoryId, expenseCategories.id))
      .where(and(
        eq(budgets.salonId, salonId),
        eq(budgets.isActive, 1),
        lte(budgets.startDate, now),
        gte(budgets.endDate, now)
      ));

    const totalBudget = budgetResults.reduce((sum, b) => sum + b.budgeted, 0);
    const totalSpent = budgetResults.reduce((sum, b) => sum + b.spent, 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const budgetsByCategory = budgetResults.map(budget => {
      const remaining = budget.budgeted - budget.spent;
      const utilization = budget.budgeted > 0 ? (budget.spent / budget.budgeted) * 100 : 0;
      
      let status: 'under' | 'on-track' | 'over' = 'under';
      if (utilization > 100) status = 'over';
      else if (utilization > (budget.alertThreshold || 80)) status = 'on-track';

      return {
        categoryId: budget.categoryId || '',
        categoryName: budget.categoryName || 'Uncategorized',
        budgeted: budget.budgeted,
        spent: budget.spent,
        remaining,
        utilization,
        status
      };
    });

    const alertingBudgets = budgetResults
      .filter(b => {
        const utilization = b.budgeted > 0 ? (b.spent / b.budgeted) * 100 : 0;
        return utilization >= (b.alertThreshold || 80);
      })
      .map(b => ({
        budgetId: b.budgetId,
        name: b.budgetName,
        utilization: b.budgeted > 0 ? (b.spent / b.budgeted) * 100 : 0
      }));

    return {
      totalBudget,
      totalSpent,
      budgetUtilization,
      budgetsByCategory,
      alertingBudgets
    };
  }

  // Financial report operations
  async getFinancialReport(id: string): Promise<FinancialReport | undefined> {
    const [report] = await db.select().from(financialReports).where(eq(financialReports.id, id));
    return report || undefined;
  }

  async getFinancialReportsBySalonId(salonId: string, filters?: { reportType?: string; reportPeriod?: string }): Promise<FinancialReport[]> {
    const conditions = [eq(financialReports.salonId, salonId)];

    if (filters?.reportType) {
      conditions.push(eq(financialReports.reportType, filters.reportType));
    }
    if (filters?.reportPeriod) {
      conditions.push(eq(financialReports.reportPeriod, filters.reportPeriod));
    }

    return await db.select().from(financialReports).where(and(...conditions)).orderBy(desc(financialReports.createdAt));
  }

  async createFinancialReport(report: InsertFinancialReport): Promise<FinancialReport> {
    const [newReport] = await db.insert(financialReports).values(report).returning();
    return newReport;
  }

  async updateFinancialReport(id: string, salonId: string, updates: Partial<InsertFinancialReport>): Promise<void> {
    await db.update(financialReports)
      .set(updates)
      .where(and(eq(financialReports.id, id), eq(financialReports.salonId, salonId)));
  }

  async deleteFinancialReport(id: string, salonId: string): Promise<void> {
    await db.delete(financialReports)
      .where(and(eq(financialReports.id, id), eq(financialReports.salonId, salonId)));
  }

  async generateProfitLossStatement(salonId: string, startDate: string, endDate: string): Promise<{
    period: { startDate: string; endDate: string };
    revenue: {
      serviceRevenue: number;
      otherRevenue: number;
      totalRevenue: number;
    };
    expenses: {
      operatingExpenses: Array<{ categoryId: string; categoryName: string; amount: number }>;
      totalOperatingExpenses: number;
      commissions: number;
      taxes: number;
      totalExpenses: number;
    };
    profitLoss: {
      grossProfit: number;
      grossProfitMargin: number;
      netProfit: number;
      netProfitMargin: number;
      ebitda: number;
    };
  }> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get service revenue from completed bookings
    const revenueResult = await db.select({
      serviceRevenue: sql<number>`COALESCE(SUM(${services.priceInPaisa}), 0)`
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        gte(bookings.createdAt, start),
        lte(bookings.createdAt, end)
      ));

    const serviceRevenue = revenueResult[0]?.serviceRevenue || 0;
    const otherRevenue = 0; // For future expansion
    const totalRevenue = serviceRevenue + otherRevenue;

    // Get operating expenses by category
    const expenseResults = await db.select({
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      amount: sql<number>`COALESCE(SUM(${expenses.amountPaisa}), 0)`
    }).from(expenses)
      .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        gte(expenses.expenseDate, start),
        lte(expenses.expenseDate, end)
      ))
      .groupBy(expenses.categoryId, expenseCategories.name);

    const totalOperatingExpenses = expenseResults.reduce((sum, exp) => sum + exp.amount, 0);

    // Get commission expenses
    const commissionResult = await db.select({
      commissions: sql<number>`COALESCE(SUM(${commissions.commissionAmountPaisa}), 0)`
    }).from(commissions)
      .where(and(
        eq(commissions.salonId, salonId),
        gte(commissions.serviceDate, start),
        lte(commissions.serviceDate, end)
      ));

    const commissionsExpense = commissionResult[0]?.commissions || 0;

    // Get tax expenses
    const taxResult = await db.select({
      taxes: sql<number>`COALESCE(SUM(${expenses.taxAmountPaisa}), 0)`
    }).from(expenses)
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        gte(expenses.expenseDate, start),
        lte(expenses.expenseDate, end)
      ));

    const taxes = taxResult[0]?.taxes || 0;
    const totalExpenses = totalOperatingExpenses + commissionsExpense + taxes;

    // Calculate profit metrics
    const grossProfit = totalRevenue - totalOperatingExpenses;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = totalRevenue - totalExpenses;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const ebitda = grossProfit; // Simplified for salon business

    return {
      period: { startDate, endDate },
      revenue: {
        serviceRevenue,
        otherRevenue,
        totalRevenue
      },
      expenses: {
        operatingExpenses: expenseResults,
        totalOperatingExpenses,
        commissions: commissionsExpense,
        taxes,
        totalExpenses
      },
      profitLoss: {
        grossProfit,
        grossProfitMargin,
        netProfit,
        netProfitMargin,
        ebitda
      }
    };
  }

  async generateCashFlowStatement(salonId: string, startDate: string, endDate: string): Promise<{
    period: { startDate: string; endDate: string };
    operatingActivities: {
      netIncome: number;
      adjustments: Array<{ item: string; amount: number }>;
      totalOperatingCashFlow: number;
    };
    investingActivities: {
      equipmentPurchases: number;
      totalInvestingCashFlow: number;
    };
    financingActivities: {
      ownerWithdrawals: number;
      totalFinancingCashFlow: number;
    };
    netCashFlow: number;
  }> {
    const plStatement = await this.generateProfitLossStatement(salonId, startDate, endDate);
    const netIncome = plStatement.profitLoss.netProfit;

    // Get equipment purchases from expenses
    const equipmentResult = await db.select({
      equipment: sql<number>`COALESCE(SUM(${expenses.amountPaisa}), 0)`
    }).from(expenses)
      .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        eq(expenseCategories.name, 'Equipment'),
        gte(expenses.expenseDate, new Date(startDate)),
        lte(expenses.expenseDate, new Date(endDate))
      ));

    const equipmentPurchases = -(equipmentResult[0]?.equipment || 0); // Negative because it's cash outflow

    // Simplified cash flow adjustments
    const adjustments = [
      { item: 'Depreciation', amount: 0 }, // Would need asset tracking
      { item: 'Accounts Receivable Changes', amount: 0 }
    ];

    const totalOperatingCashFlow = netIncome + adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const totalInvestingCashFlow = equipmentPurchases;
    const ownerWithdrawals = 0; // Would need owner withdrawal tracking
    const totalFinancingCashFlow = ownerWithdrawals;
    const netCashFlow = totalOperatingCashFlow + totalInvestingCashFlow + totalFinancingCashFlow;

    return {
      period: { startDate, endDate },
      operatingActivities: {
        netIncome,
        adjustments,
        totalOperatingCashFlow
      },
      investingActivities: {
        equipmentPurchases,
        totalInvestingCashFlow
      },
      financingActivities: {
        ownerWithdrawals,
        totalFinancingCashFlow
      },
      netCashFlow
    };
  }

  // Tax setting operations
  async getTaxSetting(id: string): Promise<TaxSetting | undefined> {
    const [setting] = await db.select().from(taxSettings).where(eq(taxSettings.id, id));
    return setting || undefined;
  }

  async getTaxSettingsBySalonId(salonId: string): Promise<TaxSetting[]> {
    return await db.select().from(taxSettings)
      .where(and(eq(taxSettings.salonId, salonId), eq(taxSettings.isActive, 1)))
      .orderBy(asc(taxSettings.taxType));
  }

  async getTaxSettingByType(salonId: string, taxType: string): Promise<TaxSetting | undefined> {
    const [setting] = await db.select().from(taxSettings)
      .where(and(
        eq(taxSettings.salonId, salonId),
        eq(taxSettings.taxType, taxType),
        eq(taxSettings.isActive, 1)
      ));
    return setting || undefined;
  }

  async createTaxSetting(setting: InsertTaxSetting): Promise<TaxSetting> {
    const [newSetting] = await db.insert(taxSettings).values(setting).returning();
    return newSetting;
  }

  async updateTaxSetting(id: string, salonId: string, updates: Partial<InsertTaxSetting>): Promise<void> {
    await db.update(taxSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(taxSettings.id, id), eq(taxSettings.salonId, salonId)));
  }

  async deleteTaxSetting(id: string, salonId: string): Promise<void> {
    await db.update(taxSettings)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(and(eq(taxSettings.id, id), eq(taxSettings.salonId, salonId)));
  }

  async calculateTaxLiability(salonId: string, period: string): Promise<{
    period: string;
    grossRevenue: number;
    taxableRevenue: number;
    taxBreakdown: Array<{
      taxType: string;
      taxName: string;
      rate: number;
      taxableAmount: number;
      taxOwed: number;
    }>;
    totalTaxOwed: number;
    nextFilingDates: Array<{ taxType: string; dueDate: string }>;
  }> {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get gross revenue
    const revenueResult = await db.select({
      grossRevenue: sql<number>`COALESCE(SUM(${services.priceInPaisa}), 0)`
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        gte(bookings.createdAt, startDate)
      ));

    const grossRevenue = revenueResult[0]?.grossRevenue || 0;
    const taxableRevenue = grossRevenue; // Simplified - would need deduction logic

    // Get active tax settings
    const taxSettingsResults = await this.getTaxSettingsBySalonId(salonId);
    
    const taxBreakdown = taxSettingsResults.map(setting => {
      const rate = parseFloat(setting.taxRate);
      const taxableAmount = taxableRevenue;
      const taxOwed = Math.round((taxableAmount * rate) / 100);

      return {
        taxType: setting.taxType,
        taxName: setting.taxName,
        rate,
        taxableAmount,
        taxOwed
      };
    });

    const totalTaxOwed = taxBreakdown.reduce((sum, tax) => sum + tax.taxOwed, 0);

    // Calculate next filing dates
    const nextFilingDates = taxSettingsResults
      .filter(setting => setting.nextFilingDate)
      .map(setting => ({
        taxType: setting.taxType,
        dueDate: setting.nextFilingDate!.toISOString().split('T')[0]
      }));

    return {
      period,
      grossRevenue,
      taxableRevenue,
      taxBreakdown,
      totalTaxOwed,
      nextFilingDates
    };
  }

  // Comprehensive financial analytics
  async getFinancialKPIs(salonId: string, period: string): Promise<{
    revenue: {
      totalRevenue: number;
      averageBookingValue: number;
      revenuePerCustomer: number;
      revenueGrowthRate: number;
    };
    expenses: {
      totalExpenses: number;
      expenseRatio: number;
      costPerService: number;
      expenseGrowthRate: number;
    };
    profitability: {
      grossProfitMargin: number;
      netProfitMargin: number;
      breakEvenPoint: number;
      returnOnInvestment: number;
    };
    efficiency: {
      revenuePerStaff: number;
      serviceUtilizationRate: number;
      averageServiceTime: number;
      staffProductivity: number;
    };
  }> {
    const now = new Date();
    const startDate = new Date();
    const prevStartDate = new Date();
    
    switch (period) {
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        prevStartDate.setMonth(now.getMonth() - 2);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        prevStartDate.setMonth(now.getMonth() - 6);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        prevStartDate.setFullYear(now.getFullYear() - 2);
        break;
    }

    // Revenue KPIs
    const revenueResults = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${services.priceInPaisa}), 0)`,
      bookingCount: sql<number>`COUNT(*)`,
      uniqueCustomers: sql<number>`COUNT(DISTINCT ${bookings.customerEmail})`
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        gte(bookings.createdAt, startDate)
      ));

    const currentRevenue = revenueResults[0]?.totalRevenue || 0;
    const bookingCount = revenueResults[0]?.bookingCount || 0;
    const uniqueCustomers = revenueResults[0]?.uniqueCustomers || 0;

    // Previous period revenue for growth calculation
    const prevRevenueResults = await db.select({
      prevRevenue: sql<number>`COALESCE(SUM(${services.priceInPaisa}), 0)`
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        gte(bookings.scheduledAt, prevStartDate),
        lte(bookings.scheduledAt, startDate)
      ));

    const prevRevenue = prevRevenueResults[0]?.prevRevenue || 0;
    const revenueGrowthRate = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Expense KPIs
    const expenseResults = await db.select({
      totalExpenses: sql<number>`COALESCE(SUM(${expenses.amountPaisa}), 0)`
    }).from(expenses)
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        gte(expenses.expenseDate, startDate)
      ));

    const totalExpenses = expenseResults[0]?.totalExpenses || 0;

    // Previous period expenses
    const prevExpenseResults = await db.select({
      prevExpenses: sql<number>`COALESCE(SUM(${expenses.amountPaisa}), 0)`
    }).from(expenses)
      .where(and(
        eq(expenses.salonId, salonId),
        eq(expenses.status, 'approved'),
        gte(expenses.expenseDate, prevStartDate),
        lte(expenses.expenseDate, startDate)
      ));

    const prevExpenses = prevExpenseResults[0]?.prevExpenses || 0;
    const expenseGrowthRate = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

    // Staff count for efficiency metrics
    const staffResults = await db.select({
      staffCount: sql<number>`COUNT(*)`
    }).from(staff)
      .where(and(eq(staff.salonId, salonId), eq(staff.isActive, 1)));

    const staffCount = staffResults[0]?.staffCount || 1;

    // Service duration for efficiency
    const avgServiceResults = await db.select({
      avgDuration: sql<number>`COALESCE(AVG(${services.durationMinutes}), 0)`
    }).from(services)
      .where(and(eq(services.salonId, salonId), eq(services.isActive, 1)));

    const averageServiceTime = avgServiceResults[0]?.avgDuration || 0;

    // Calculate KPIs
    const averageBookingValue = bookingCount > 0 ? currentRevenue / bookingCount : 0;
    const revenuePerCustomer = uniqueCustomers > 0 ? currentRevenue / uniqueCustomers : 0;
    const expenseRatio = currentRevenue > 0 ? (totalExpenses / currentRevenue) * 100 : 0;
    const costPerService = bookingCount > 0 ? totalExpenses / bookingCount : 0;
    const grossProfitMargin = currentRevenue > 0 ? ((currentRevenue - totalExpenses) / currentRevenue) * 100 : 0;
    const netProfitMargin = grossProfitMargin; // Simplified
    const breakEvenPoint = averageBookingValue > 0 ? totalExpenses / averageBookingValue : 0;
    const returnOnInvestment = totalExpenses > 0 ? ((currentRevenue - totalExpenses) / totalExpenses) * 100 : 0;
    const revenuePerStaff = staffCount > 0 ? currentRevenue / staffCount : 0;
    const serviceUtilizationRate = 80; // Would need time slot analysis
    const staffProductivity = staffCount > 0 ? bookingCount / staffCount : 0;

    return {
      revenue: {
        totalRevenue: currentRevenue,
        averageBookingValue,
        revenuePerCustomer,
        revenueGrowthRate
      },
      expenses: {
        totalExpenses,
        expenseRatio,
        costPerService,
        expenseGrowthRate
      },
      profitability: {
        grossProfitMargin,
        netProfitMargin,
        breakEvenPoint,
        returnOnInvestment
      },
      efficiency: {
        revenuePerStaff,
        serviceUtilizationRate,
        averageServiceTime,
        staffProductivity
      }
    };
  }

  async getFinancialForecast(salonId: string, months: number): Promise<{
    forecast: Array<{
      month: string;
      projectedRevenue: number;
      projectedExpenses: number;
      projectedProfit: number;
      confidence: number;
    }>;
    assumptions: {
      revenueGrowthRate: number;
      seasonalFactors: Array<{ month: number; factor: number }>;
      costInflationRate: number;
    };
    scenarios: {
      optimistic: { totalRevenue: number; totalProfit: number };
      realistic: { totalRevenue: number; totalProfit: number };
      pessimistic: { totalRevenue: number; totalProfit: number };
    };
  }> {
    // Get historical data for trend analysis (last 12 months)
    const historicalResults = await db.select({
      month: sql<string>`TO_CHAR(${bookings.scheduledAt}, 'YYYY-MM')`,
      revenue: sql<number>`COALESCE(SUM(${services.priceInPaisa}), 0)`
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        gte(bookings.scheduledAt, new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1))
      ))
      .groupBy(sql`TO_CHAR(${bookings.scheduledAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${bookings.scheduledAt}, 'YYYY-MM')`);

    // Calculate growth rate from historical data
    const revenues = historicalResults.map(r => r.revenue);
    const revenueGrowthRate = revenues.length > 1 
      ? ((revenues[revenues.length - 1] - revenues[0]) / revenues[0]) * 100 / revenues.length
      : 5; // Default 5% monthly growth

    // Get expense ratio
    const kpis = await this.getFinancialKPIs(salonId, 'monthly');
    const expenseRatio = kpis.expenses.expenseRatio / 100;
    const costInflationRate = 3; // Default 3% inflation

    // Generate seasonal factors (simplified)
    const seasonalFactors = [
      { month: 1, factor: 0.9 }, { month: 2, factor: 0.95 }, { month: 3, factor: 1.1 },
      { month: 4, factor: 1.05 }, { month: 5, factor: 1.15 }, { month: 6, factor: 1.2 },
      { month: 7, factor: 1.1 }, { month: 8, factor: 1.05 }, { month: 9, factor: 1.0 },
      { month: 10, factor: 1.1 }, { month: 11, factor: 1.2 }, { month: 12, factor: 1.3 }
    ];

    // Generate forecast
    const baseRevenue = kpis.revenue.totalRevenue;
    const forecast = [];

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const monthNumber = futureDate.getMonth() + 1;
      const seasonalFactor = seasonalFactors.find(f => f.month === monthNumber)?.factor || 1;
      
      const growthFactor = Math.pow(1 + (revenueGrowthRate / 100), i);
      const projectedRevenue = Math.round(baseRevenue * growthFactor * seasonalFactor);
      
      const expenseGrowthFactor = Math.pow(1 + (costInflationRate / 100), i);
      const projectedExpenses = Math.round(baseRevenue * expenseRatio * expenseGrowthFactor);
      
      const projectedProfit = projectedRevenue - projectedExpenses;
      const confidence = Math.max(50, 95 - (i * 5)); // Confidence decreases over time

      forecast.push({
        month: futureDate.toISOString().substring(0, 7),
        projectedRevenue,
        projectedExpenses,
        projectedProfit,
        confidence
      });
    }

    // Calculate scenarios
    const totalProjectedRevenue = forecast.reduce((sum, f) => sum + f.projectedRevenue, 0);
    const totalProjectedProfit = forecast.reduce((sum, f) => sum + f.projectedProfit, 0);

    const scenarios = {
      optimistic: {
        totalRevenue: Math.round(totalProjectedRevenue * 1.2),
        totalProfit: Math.round(totalProjectedProfit * 1.3)
      },
      realistic: {
        totalRevenue: totalProjectedRevenue,
        totalProfit: totalProjectedProfit
      },
      pessimistic: {
        totalRevenue: Math.round(totalProjectedRevenue * 0.8),
        totalProfit: Math.round(totalProjectedProfit * 0.6)
      }
    };

    return {
      forecast,
      assumptions: {
        revenueGrowthRate,
        seasonalFactors,
        costInflationRate
      },
      scenarios
    };
  }

  // Communication system method implementations

  // Scheduled message operations
  async getScheduledMessage(id: string): Promise<ScheduledMessage | undefined> {
    const [message] = await db.select().from(scheduledMessages).where(eq(scheduledMessages.id, id));
    return message || undefined;
  }

  async getScheduledMessagesBySalonId(salonId: string, filters?: {
    status?: string;
    type?: string;
    scheduledBefore?: Date;
  }): Promise<ScheduledMessage[]> {
    const conditions = [eq(scheduledMessages.salonId, salonId)];
    
    if (filters?.status) {
      conditions.push(eq(scheduledMessages.status, filters.status));
    }
    if (filters?.type) {
      conditions.push(eq(scheduledMessages.type, filters.type));
    }
    if (filters?.scheduledBefore) {
      conditions.push(lte(scheduledMessages.scheduledFor, filters.scheduledBefore));
    }
    
    return await db.select().from(scheduledMessages).where(and(...conditions));
  }

  async getScheduledMessagesDue(beforeTime?: Date): Promise<ScheduledMessage[]> {
    const cutoffTime = beforeTime || new Date();
    
    return await db.select()
      .from(scheduledMessages)
      .where(
        and(
          eq(scheduledMessages.status, 'pending'),
          lte(scheduledMessages.scheduledFor, cutoffTime)
        )
      )
      .orderBy(asc(scheduledMessages.scheduledFor));
  }

  async createScheduledMessage(message: InsertScheduledMessage): Promise<ScheduledMessage> {
    const [created] = await db.insert(scheduledMessages).values(message).returning();
    return created;
  }

  async updateScheduledMessage(id: string, updates: Partial<InsertScheduledMessage>): Promise<void> {
    await db.update(scheduledMessages)
      .set(updates)
      .where(eq(scheduledMessages.id, id));
  }

  async markScheduledMessageSent(id: string, providerId?: string): Promise<void> {
    await db.update(scheduledMessages)
      .set({ 
        status: 'sent',
        sentAt: new Date()
      })
      .where(eq(scheduledMessages.id, id));
  }

  async markScheduledMessageFailed(id: string, reason: string): Promise<void> {
    await db.update(scheduledMessages)
      .set({ 
        status: 'failed',
        failureReason: reason
      })
      .where(eq(scheduledMessages.id, id));
  }

  async cancelScheduledMessage(id: string): Promise<void> {
    await db.update(scheduledMessages)
      .set({ 
        status: 'cancelled'
      })
      .where(eq(scheduledMessages.id, id));
  }

  async rescheduleMessage(id: string, newScheduleTime: Date): Promise<void> {
    await db.update(scheduledMessages)
      .set({ 
        scheduledFor: newScheduleTime,
        status: 'pending'
      })
      .where(eq(scheduledMessages.id, id));
  }

  // Template processing and personalization
  async processTemplate(templateContent: string, variables: Record<string, any>): Promise<string> {
    let processed = templateContent;
    
    // Simple variable replacement - replace {{variableName}} with actual values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    }
    
    return processed;
  }

  async getTemplateVariables(salonId: string, bookingId?: string, customerId?: string): Promise<Record<string, any>> {
    const variables: Record<string, any> = {};
    
    // Get salon info
    const salon = await this.getSalonById(salonId);
    if (salon) {
      variables.salonName = salon.name;
      variables.salonPhone = salon.phone;
      variables.salonEmail = salon.email;
      variables.salonAddress = `${salon.address}, ${salon.city}, ${salon.state} ${salon.zipCode}`;
    }
    
    // Get booking info if provided
    if (bookingId) {
      const booking = await this.getBooking(bookingId);
      if (booking) {
        variables.customerName = booking.customerName;
        variables.customerEmail = booking.customerEmail;
        variables.customerPhone = booking.customerPhone;
        variables.bookingDate = booking.createdAt?.toLocaleDateString() || '';
        variables.bookingTime = booking.createdAt?.toLocaleTimeString() || '';
        
        // Get service info
        const service = await this.getService(booking.serviceId);
        if (service) {
          variables.serviceName = service.name;
          variables.servicePrice = (service.priceInPaisa / 100).toFixed(2);
          variables.serviceDuration = service.durationMinutes;
        }
      }
    }
    
    // Add common variables
    variables.currentDate = new Date().toLocaleDateString();
    variables.currentYear = new Date().getFullYear();
    
    return variables;
  }

  // Basic implementations for other communication methods (stubs for now)
  async getMessageTemplate(id: string): Promise<MessageTemplate | undefined> {
    const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    return template || undefined;
  }

  async getMessageTemplatesBySalonId(salonId: string, filters?: { type?: string; channel?: string; isActive?: boolean }): Promise<MessageTemplate[]> {
    const conditions = [eq(messageTemplates.salonId, salonId)];
    
    if (filters?.type) {
      conditions.push(eq(messageTemplates.type, filters.type));
    }
    if (filters?.channel) {
      conditions.push(eq(messageTemplates.channel, filters.channel));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(messageTemplates.isActive, filters.isActive ? 1 : 0));
    }
    
    return await db.select().from(messageTemplates).where(and(...conditions));
  }

  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const [created] = await db.insert(messageTemplates).values(template).returning();
    return created;
  }

  async updateMessageTemplate(id: string, salonId: string, updates: Partial<InsertMessageTemplate>): Promise<void> {
    await db.update(messageTemplates)
      .set(updates)
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.salonId, salonId)
      ));
  }

  async deleteMessageTemplate(id: string, salonId: string): Promise<void> {
    await db.delete(messageTemplates)
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.salonId, salonId)
      ));
  }

  // Booking notification automation stubs
  async scheduleBookingNotifications(bookingId: string): Promise<void> {
    // Implementation would schedule various notification messages
    console.log(`Scheduling notifications for booking ${bookingId}`);
  }

  async cancelBookingNotifications(bookingId: string): Promise<void> {
    // Implementation would cancel scheduled notifications for a booking
    console.log(`Cancelling notifications for booking ${bookingId}`);
  }

  async sendBookingConfirmation(bookingId: string): Promise<boolean> {
    // Implementation would send booking confirmation
    console.log(`Sending confirmation for booking ${bookingId}`);
    return true;
  }

  async sendBookingReminder(bookingId: string, reminderType: '24h' | '2h'): Promise<boolean> {
    // Implementation would send booking reminder
    console.log(`Sending ${reminderType} reminder for booking ${bookingId}`);
    return true;
  }

  async sendBookingCancellation(bookingId: string): Promise<boolean> {
    // Implementation would send booking cancellation notice
    console.log(`Sending cancellation notice for booking ${bookingId}`);
    return true;
  }

  async sendFollowUpMessage(bookingId: string): Promise<boolean> {
    // Implementation would send follow-up message
    console.log(`Sending follow-up message for booking ${bookingId}`);
    return true;
  }

  // ====================================
  // A/B TESTING SYSTEM OPERATIONS
  // ====================================

  // A/B Test Campaign Operations
  async getAbTestCampaign(id: string): Promise<AbTestCampaign | undefined> {
    try {
      const [campaign] = await db
        .select()
        .from(abTestCampaigns)
        .where(eq(abTestCampaigns.id, id));
      return campaign || undefined;
    } catch (error) {
      console.error('Error fetching A/B test campaign:', error);
      throw new Error('Failed to fetch A/B test campaign');
    }
  }

  async getAbTestCampaignsBySalonId(
    salonId: string, 
    filters?: { status?: string; testType?: string }
  ): Promise<AbTestCampaign[]> {
    try {
      let query = db
        .select()
        .from(abTestCampaigns)
        .where(eq(abTestCampaigns.salonId, salonId));

      const conditions = [eq(abTestCampaigns.salonId, salonId)];
      
      if (filters?.status) {
        conditions.push(eq(abTestCampaigns.status, filters.status));
      }
      
      if (filters?.testType) {
        conditions.push(eq(abTestCampaigns.testType, filters.testType));
      }

      if (conditions.length > 1) {
        query = db
          .select()
          .from(abTestCampaigns)
          .where(and(...conditions));
      }

      const campaigns = await query.orderBy(desc(abTestCampaigns.createdAt));
      return campaigns;
    } catch (error) {
      console.error('Error fetching A/B test campaigns by salon:', error);
      throw new Error('Failed to fetch A/B test campaigns');
    }
  }

  async createAbTestCampaign(campaign: InsertAbTestCampaign): Promise<AbTestCampaign> {
    try {
      const [newCampaign] = await db
        .insert(abTestCampaigns)
        .values(campaign)
        .returning();
      return newCampaign;
    } catch (error) {
      console.error('Error creating A/B test campaign:', error);
      throw new Error('Failed to create A/B test campaign');
    }
  }

  async updateAbTestCampaign(id: string, updates: Partial<InsertAbTestCampaign>): Promise<void> {
    try {
      await db
        .update(abTestCampaigns)
        .set(updates)
        .where(eq(abTestCampaigns.id, id));
    } catch (error) {
      console.error('Error updating A/B test campaign:', error);
      throw new Error('Failed to update A/B test campaign');
    }
  }

  async deleteAbTestCampaign(id: string): Promise<void> {
    try {
      await db
        .delete(abTestCampaigns)
        .where(eq(abTestCampaigns.id, id));
    } catch (error) {
      console.error('Error deleting A/B test campaign:', error);
      throw new Error('Failed to delete A/B test campaign');
    }
  }

  // Test Variant Operations
  async getTestVariant(id: string): Promise<TestVariant | undefined> {
    try {
      const [variant] = await db
        .select()
        .from(testVariants)
        .where(eq(testVariants.id, id));
      return variant || undefined;
    } catch (error) {
      console.error('Error fetching test variant:', error);
      throw new Error('Failed to fetch test variant');
    }
  }

  async getTestVariantsByTestId(testCampaignId: string): Promise<TestVariant[]> {
    try {
      const variants = await db
        .select()
        .from(testVariants)
        .where(eq(testVariants.testCampaignId, testCampaignId))
        .orderBy(asc(testVariants.priority));
      return variants;
    } catch (error) {
      console.error('Error fetching test variants by test ID:', error);
      throw new Error('Failed to fetch test variants');
    }
  }

  async createTestVariant(variant: InsertTestVariant): Promise<TestVariant> {
    try {
      const [newVariant] = await db
        .insert(testVariants)
        .values(variant)
        .returning();
      return newVariant;
    } catch (error) {
      console.error('Error creating test variant:', error);
      throw new Error('Failed to create test variant');
    }
  }

  async updateTestVariant(id: string, updates: Partial<InsertTestVariant>): Promise<void> {
    try {
      await db
        .update(testVariants)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(testVariants.id, id));
    } catch (error) {
      console.error('Error updating test variant:', error);
      throw new Error('Failed to update test variant');
    }
  }

  async deleteTestVariant(id: string): Promise<void> {
    try {
      await db
        .delete(testVariants)
        .where(eq(testVariants.id, id));
    } catch (error) {
      console.error('Error deleting test variant:', error);
      throw new Error('Failed to delete test variant');
    }
  }

  // Test Metrics Operations
  async getTestMetric(id: string): Promise<TestMetric | undefined> {
    try {
      const [metric] = await db
        .select()
        .from(testMetrics)
        .where(eq(testMetrics.id, id));
      return metric || undefined;
    } catch (error) {
      console.error('Error fetching test metric:', error);
      throw new Error('Failed to fetch test metric');
    }
  }

  async getTestMetricsByVariantId(
    variantId: string, 
    dateRange?: { start: string; end: string }
  ): Promise<TestMetric[]> {
    try {
      let query = db
        .select()
        .from(testMetrics)
        .where(eq(testMetrics.variantId, variantId));

      if (dateRange) {
        const conditions = [
          eq(testMetrics.variantId, variantId),
          gte(testMetrics.metricDate, new Date(dateRange.start)),
          lte(testMetrics.metricDate, new Date(dateRange.end))
        ];
        
        query = db
          .select()
          .from(testMetrics)
          .where(and(...conditions));
      }

      const metrics = await query.orderBy(desc(testMetrics.metricDate));
      return metrics;
    } catch (error) {
      console.error('Error fetching test metrics by variant ID:', error);
      throw new Error('Failed to fetch test metrics');
    }
  }

  async getTestMetricsByTestId(
    testCampaignId: string, 
    dateRange?: { start: string; end: string }
  ): Promise<TestMetric[]> {
    try {
      let query = db
        .select()
        .from(testMetrics)
        .where(eq(testMetrics.testCampaignId, testCampaignId));

      if (dateRange) {
        const conditions = [
          eq(testMetrics.testCampaignId, testCampaignId),
          gte(testMetrics.metricDate, new Date(dateRange.start)),
          lte(testMetrics.metricDate, new Date(dateRange.end))
        ];
        
        query = db
          .select()
          .from(testMetrics)
          .where(and(...conditions));
      }

      const metrics = await query.orderBy(desc(testMetrics.metricDate));
      return metrics;
    } catch (error) {
      console.error('Error fetching test metrics by test ID:', error);
      throw new Error('Failed to fetch test metrics');
    }
  }

  async createTestMetric(metric: InsertTestMetric): Promise<TestMetric> {
    try {
      // Calculate rates before inserting
      const calculatedMetric = {
        ...metric,
        openRate: metric.deliveredCount > 0 ? (metric.openCount / metric.deliveredCount) : 0,
        clickRate: metric.deliveredCount > 0 ? (metric.clickCount / metric.deliveredCount) : 0,
        conversionRate: metric.deliveredCount > 0 ? (metric.conversionCount / metric.deliveredCount) : 0,
        bookingRate: metric.deliveredCount > 0 ? (metric.bookingCount / metric.deliveredCount) : 0,
      };

      const [newMetric] = await db
        .insert(testMetrics)
        .values(calculatedMetric)
        .returning();
      return newMetric;
    } catch (error) {
      console.error('Error creating test metric:', error);
      throw new Error('Failed to create test metric');
    }
  }

  async updateTestMetric(id: string, updates: Partial<InsertTestMetric>): Promise<void> {
    try {
      // Recalculate rates if count fields are updated
      const updateData: any = { ...updates, updatedAt: new Date() };
      
      if ('deliveredCount' in updates || 'openCount' in updates || 'clickCount' in updates || 
          'conversionCount' in updates || 'bookingCount' in updates) {
        const [currentMetric] = await db
          .select()
          .from(testMetrics)
          .where(eq(testMetrics.id, id));
        
        if (currentMetric) {
          const updatedMetric = { ...currentMetric, ...updates };
          updateData.openRate = updatedMetric.deliveredCount > 0 ? 
            (updatedMetric.openCount / updatedMetric.deliveredCount) : 0;
          updateData.clickRate = updatedMetric.deliveredCount > 0 ? 
            (updatedMetric.clickCount / updatedMetric.deliveredCount) : 0;
          updateData.conversionRate = updatedMetric.deliveredCount > 0 ? 
            (updatedMetric.conversionCount / updatedMetric.deliveredCount) : 0;
          updateData.bookingRate = updatedMetric.deliveredCount > 0 ? 
            (updatedMetric.bookingCount / updatedMetric.deliveredCount) : 0;
        }
      }

      await db
        .update(testMetrics)
        .set(updateData)
        .where(eq(testMetrics.id, id));
    } catch (error) {
      console.error('Error updating test metric:', error);
      throw new Error('Failed to update test metric');
    }
  }

  async bulkCreateTestMetrics(metrics: InsertTestMetric[]): Promise<TestMetric[]> {
    try {
      // Calculate rates for each metric
      const calculatedMetrics = metrics.map(metric => ({
        ...metric,
        openRate: metric.deliveredCount > 0 ? (metric.openCount / metric.deliveredCount) : 0,
        clickRate: metric.deliveredCount > 0 ? (metric.clickCount / metric.deliveredCount) : 0,
        conversionRate: metric.deliveredCount > 0 ? (metric.conversionCount / metric.deliveredCount) : 0,
        bookingRate: metric.deliveredCount > 0 ? (metric.bookingCount / metric.deliveredCount) : 0,
      }));

      const newMetrics = await db
        .insert(testMetrics)
        .values(calculatedMetrics)
        .returning();
      return newMetrics;
    } catch (error) {
      console.error('Error bulk creating test metrics:', error);
      throw new Error('Failed to bulk create test metrics');
    }
  }

  // Test Results Operations
  async getTestResult(id: string): Promise<TestResult | undefined> {
    try {
      const [result] = await db
        .select()
        .from(testResults)
        .where(eq(testResults.id, id));
      return result || undefined;
    } catch (error) {
      console.error('Error fetching test result:', error);
      throw new Error('Failed to fetch test result');
    }
  }

  async getTestResultByTestId(testCampaignId: string): Promise<TestResult | undefined> {
    try {
      const [result] = await db
        .select()
        .from(testResults)
        .where(eq(testResults.testCampaignId, testCampaignId));
      return result || undefined;
    } catch (error) {
      console.error('Error fetching test result by test ID:', error);
      throw new Error('Failed to fetch test result');
    }
  }

  async createTestResult(result: InsertTestResult): Promise<TestResult> {
    try {
      const [newResult] = await db
        .insert(testResults)
        .values(result)
        .returning();
      return newResult;
    } catch (error) {
      console.error('Error creating test result:', error);
      throw new Error('Failed to create test result');
    }
  }

  async updateTestResult(id: string, updates: Partial<InsertTestResult>): Promise<void> {
    try {
      await db
        .update(testResults)
        .set(updates)
        .where(eq(testResults.id, id));
    } catch (error) {
      console.error('Error updating test result:', error);
      throw new Error('Failed to update test result');
    }
  }

  // Analytics and Aggregation Methods
  async getAbTestPerformanceSummary(testCampaignId: string): Promise<{
    totalParticipants: number;
    variants: Array<{
      variantId: string;
      variantName: string;
      openRate: number;
      clickRate: number;
      conversionRate: number;
      bookingRate: number;
      isWinner: boolean;
    }>;
  }> {
    try {
      // Get campaign and result to determine winner
      const [campaign] = await db
        .select()
        .from(abTestCampaigns)
        .where(eq(abTestCampaigns.id, testCampaignId));
      
      if (!campaign) {
        throw new Error('A/B test campaign not found');
      }

      const [result] = await db
        .select()
        .from(testResults)
        .where(eq(testResults.testCampaignId, testCampaignId));

      // Get variants with aggregated metrics
      const variantsWithMetrics = await db
        .select({
          variantId: testVariants.id,
          variantName: testVariants.variantName,
          totalParticipants: sql<number>`SUM(${testMetrics.participantCount})`,
          avgOpenRate: sql<number>`AVG(${testMetrics.openRate})`,
          avgClickRate: sql<number>`AVG(${testMetrics.clickRate})`,
          avgConversionRate: sql<number>`AVG(${testMetrics.conversionRate})`,
          avgBookingRate: sql<number>`AVG(${testMetrics.bookingRate})`
        })
        .from(testVariants)
        .leftJoin(testMetrics, eq(testVariants.id, testMetrics.variantId))
        .where(eq(testVariants.testCampaignId, testCampaignId))
        .groupBy(testVariants.id, testVariants.variantName);

      const totalParticipants = variantsWithMetrics.reduce(
        (sum, variant) => sum + (variant.totalParticipants || 0), 
        0
      );

      const variants = variantsWithMetrics.map(variant => ({
        variantId: variant.variantId,
        variantName: variant.variantName,
        openRate: Number(variant.avgOpenRate) || 0,
        clickRate: Number(variant.avgClickRate) || 0,
        conversionRate: Number(variant.avgConversionRate) || 0,
        bookingRate: Number(variant.avgBookingRate) || 0,
        isWinner: result?.winnerVariantId === variant.variantId
      }));

      return {
        totalParticipants,
        variants
      };
    } catch (error) {
      console.error('Error fetching A/B test performance summary:', error);
      throw new Error('Failed to fetch A/B test performance summary');
    }
  }

  async getAbTestCampaignAnalytics(salonId: string, period: string): Promise<{
    totalTests: number;
    activeTests: number;
    completedTests: number;
    averageImprovement: number;
    topPerformingVariants: Array<{
      variantId: string;
      variantName: string;
      testName: string;
      performanceMetric: number;
      improvement: number;
    }>;
  }> {
    try {
      // Get campaign counts
      const allCampaigns = await db
        .select({
          id: abTestCampaigns.id,
          status: abTestCampaigns.status,
          campaignName: abTestCampaigns.campaignName
        })
        .from(abTestCampaigns)
        .where(eq(abTestCampaigns.salonId, salonId));

      const totalTests = allCampaigns.length;
      const activeTests = allCampaigns.filter(c => c.status === 'active').length;
      const completedTests = allCampaigns.filter(c => c.status === 'completed').length;

      // Get completed tests with results for improvement calculation
      const completedTestsWithResults = await db
        .select({
          campaignId: abTestCampaigns.id,
          campaignName: abTestCampaigns.campaignName,
          performanceImprovement: testResults.performanceImprovement
        })
        .from(abTestCampaigns)
        .innerJoin(testResults, eq(abTestCampaigns.id, testResults.testCampaignId))
        .where(
          and(
            eq(abTestCampaigns.salonId, salonId),
            eq(abTestCampaigns.status, 'completed')
          )
        );

      const averageImprovement = completedTestsWithResults.length > 0 ?
        completedTestsWithResults.reduce((sum, test) => 
          sum + (Number(test.performanceImprovement) || 0), 0
        ) / completedTestsWithResults.length : 0;

      // Get top performing variants
      const topPerformingVariants = await db
        .select({
          variantId: testVariants.id,
          variantName: testVariants.variantName,
          testName: abTestCampaigns.campaignName,
          avgBookingRate: sql<number>`AVG(${testMetrics.bookingRate})`,
          avgConversionRate: sql<number>`AVG(${testMetrics.conversionRate})`
        })
        .from(testVariants)
        .innerJoin(abTestCampaigns, eq(testVariants.testCampaignId, abTestCampaigns.id))
        .leftJoin(testMetrics, eq(testVariants.id, testMetrics.variantId))
        .where(eq(abTestCampaigns.salonId, salonId))
        .groupBy(testVariants.id, testVariants.variantName, abTestCampaigns.campaignName)
        .orderBy(desc(sql`AVG(${testMetrics.bookingRate})`))
        .limit(5);

      return {
        totalTests,
        activeTests,
        completedTests,
        averageImprovement,
        topPerformingVariants: topPerformingVariants.map(variant => ({
          variantId: variant.variantId,
          variantName: variant.variantName,
          testName: variant.testName,
          performanceMetric: Number(variant.avgBookingRate) || 0,
          improvement: Number(variant.avgConversionRate) || 0
        }))
      };
    } catch (error) {
      console.error('Error fetching A/B test campaign analytics:', error);
      throw new Error('Failed to fetch A/B test campaign analytics');
    }
  }

  // Customer Dashboard API Implementation
  async getCustomerAppointments(customerId: string, filters?: {
    status?: "upcoming" | "completed" | "cancelled" | "all";
    limit?: number;
    offset?: number;
  }) {
    try {
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      const status = filters?.status || "all";

      // Get customer email first
      const user = await this.getUserById(customerId);
      if (!user?.email) {
        throw new Error('Customer email not found');
      }

      // Build where conditions using customerEmail
      let whereCondition = eq(bookings.customerEmail, user.email);
      
      if (status === "upcoming") {
        // Fix: Filter by date/time >= now AND status in ['confirmed','pending']
        const today = new Date().toISOString().split('T')[0];
        whereCondition = and(
          whereCondition,
          gte(bookings.bookingDate, today),
          sql`${bookings.status} IN ('confirmed', 'pending')`
        ) as any;
      } else if (status !== "all") {
        whereCondition = and(whereCondition, eq(bookings.status, status)) as any;
      }

      // Get appointments with salon, service, and staff details
      const appointmentsQuery = db
        .select({
          id: bookings.id,
          salonId: bookings.salonId,
          salonName: salons.name,
          serviceId: bookings.serviceId,
          serviceName: services.name,
          staffId: bookings.staffId,
          staffName: staff.name,
          bookingDate: bookings.bookingDate,
          bookingTime: bookings.bookingTime,
          status: bookings.status,
          totalAmountPaisa: bookings.totalAmountPaisa,
          currency: bookings.currency,
          duration: services.durationMinutes,
          notes: bookings.notes,
          createdAt: bookings.createdAt,
        })
        .from(bookings)
        .innerJoin(salons, eq(bookings.salonId, salons.id))
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(staff, eq(bookings.staffId, staff.id))
        .where(whereCondition)
        .orderBy(desc(bookings.bookingDate), desc(bookings.bookingTime))
        .limit(limit)
        .offset(offset);

      const appointments = await appointmentsQuery;

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(whereCondition);

      const hasMore = offset + limit < count;

      return {
        appointments: appointments.map(apt => ({
          id: apt.id,
          salonId: apt.salonId,
          salonName: apt.salonName,
          serviceId: apt.serviceId,
          serviceName: apt.serviceName,
          staffId: apt.staffId || '',
          staffName: apt.staffName || 'Not assigned',
          bookingDate: apt.bookingDate,
          bookingTime: apt.bookingTime,
          status: apt.status as "upcoming" | "completed" | "cancelled",
          totalAmountPaisa: apt.totalAmountPaisa,
          currency: apt.currency,
          duration: apt.duration,
          notes: apt.notes || undefined,
          createdAt: apt.createdAt?.toISOString() || '',
        })),
        total: count,
        hasMore,
      };
    } catch (error) {
      console.error('Error fetching customer appointments:', error);
      throw new Error('Failed to fetch customer appointments');
    }
  }

  async getCustomerProfileWithStats(customerId: string) {
    try {
      // Get user details
      const user = await this.getUserById(customerId);
      if (!user?.email) {
        throw new Error('User not found');
      }

      // Get booking stats using customerEmail
      const bookingStats = await db
        .select({
          totalBookings: sql<number>`count(*)`,
          totalSpentPaisa: sql<number>`coalesce(sum(${bookings.totalAmountPaisa}), 0)`,
          lastBookingDate: sql<string>`max(${bookings.bookingDate})`,
        })
        .from(bookings)
        .where(eq(bookings.customerEmail, user.email));

      // Get favorite service using customerEmail
      const favoriteServiceQuery = await db
        .select({
          serviceId: bookings.serviceId,
          serviceName: services.name,
          count: sql<number>`count(*)`,
        })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(eq(bookings.customerEmail, user.email))
        .groupBy(bookings.serviceId, services.name)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(1);

      // Get communication preferences (default values if not found)
      let communicationPrefs = {
        email: true,
        sms: true,
        push: true,
      };

      try {
        const [userPrefs] = await db
          .select({
            emailOptIn: communicationPreferences.emailOptIn,
            smsOptIn: communicationPreferences.smsOptIn,
          })
          .from(communicationPreferences)
          .where(eq(communicationPreferences.customerId, customerId))
          .limit(1);

        if (userPrefs) {
          communicationPrefs = {
            email: Boolean(userPrefs.emailOptIn),
            sms: Boolean(userPrefs.smsOptIn),
            push: true, // Default push to true
          };
        }
      } catch {
        // Keep default values if communication preferences table doesn't exist or query fails
      }

      const stats = bookingStats[0];
      const favoriteService = favoriteServiceQuery[0];

      return {
        id: user.id,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
        preferences: {
          favoriteServices: favoriteService ? [favoriteService.serviceId] : [],
          preferredStaff: [], // TODO: Can be calculated from booking history
          communicationPreferences: communicationPrefs,
        },
        stats: {
          totalBookings: stats.totalBookings || 0,
          totalSpentPaisa: stats.totalSpentPaisa || 0,
          memberSince: user.createdAt?.toISOString() || new Date().toISOString(),
          lastBookingDate: stats.lastBookingDate || undefined,
          favoriteService: favoriteService?.serviceName || undefined,
        },
      };
    } catch (error) {
      console.error('Error fetching customer profile with stats:', error);
      throw new Error('Failed to fetch customer profile');
    }
  }

  async getCustomerPaymentHistory(customerId: string) {
    try {
      // Get customer email first
      const user = await this.getUserById(customerId);
      if (!user?.email) {
        throw new Error('Customer email not found');
      }

      // Get payments with booking, salon, and service details
      const paymentsQuery = await db
        .select({
          id: payments.id,
          bookingId: payments.bookingId,
          salonName: salons.name,
          serviceName: services.name,
          amountPaisa: payments.amountPaisa,
          currency: payments.currency,
          status: payments.status,
          transactionDate: payments.createdAt,
        })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .innerJoin(salons, eq(bookings.salonId, salons.id))
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(eq(bookings.customerEmail, user.email))
        .orderBy(desc(payments.createdAt));

      return {
        payments: paymentsQuery.map(payment => ({
          id: payment.id,
          bookingId: payment.bookingId,
          salonName: payment.salonName,
          serviceName: payment.serviceName,
          amountPaisa: payment.amountPaisa,
          currency: payment.currency,
          status: payment.status as "completed" | "pending" | "failed" | "refunded",
          paymentMethod: 'razorpay', // Default since we use Razorpay
          transactionDate: payment.transactionDate?.toISOString() || '',
          receiptUrl: undefined, // Not available in schema
        })),
        total: paymentsQuery.length,
      };
    } catch (error) {
      console.error('Error fetching customer payment history:', error);
      throw new Error('Failed to fetch customer payment history');
    }
  }
}

// Example data initialization
async function initializeSalonsAndServices() {
  try {
    // Check if salons already exist
    const existingSalons = await db.select().from(salons);
    if (existingSalons.length === 0) {
      // Create sample salons for demonstration
      const mockSalons: InsertSalon[] = [
        {
          name: "Artisan Theory Salon",
          description: "Modern hair salon specializing in cuts, color, and styling",
          address: "789 Fashion Avenue",
          city: "Chicago",
          state: "IL", 
          zipCode: "60603",
          phone: "+1-312-555-0123",
          email: "info@artisantheory.com",
          category: "Hair Salon",
          priceRange: "$$",
          openTime: "9:00 AM",
          closeTime: "9:00 PM",
          isActive: 1
        },
        {
          name: "LO Spa & Nails",
          description: "Luxury nail spa with premium manicure and pedicure services",
          address: "123 Chicago Loop",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          phone: "+1-312-555-0456",
          email: "contact@lospa.com",
          category: "Nails",
          priceRange: "$$$",
          openTime: "10:00 AM",
          closeTime: "8:00 PM",
          isActive: 1
        },
        {
          name: "Tranquil Spa Retreat",
          description: "Full-service spa offering massage, facials, and wellness treatments",
          address: "456 Downtown District",
          city: "Chicago",
          state: "IL",
          zipCode: "60602",
          phone: "+1-312-555-0789",
          email: "hello@tranquilspa.com",
          category: "Massage",
          priceRange: "$$$$",
          openTime: "8:00 AM",
          closeTime: "10:00 PM",
          isActive: 1
        }
      ];
      
      const createdSalons = await db.insert(salons).values(mockSalons).returning();
      console.log('✅ Initialized salons in database');
      
      // Create services for each salon
      const salonServices: InsertService[] = [
        // Artisan Theory Salon services
        { salonId: createdSalons[0].id, name: "Haircut & Style", description: "Professional haircut and styling", durationMinutes: 60, priceInPaisa: 6500, category: "Hair", currency: "INR", isActive: 1 },
        { salonId: createdSalons[0].id, name: "Color Treatment", description: "Full hair coloring service", durationMinutes: 120, priceInPaisa: 15000, category: "Hair", currency: "INR", isActive: 1 },
        
        // LO Spa & Nails services
        { salonId: createdSalons[1].id, name: "Manicure", description: "Complete nail care and polish", durationMinutes: 45, priceInPaisa: 3500, category: "Nails", currency: "INR", isActive: 1 },
        { salonId: createdSalons[1].id, name: "Pedicure", description: "Relaxing foot care and polish", durationMinutes: 60, priceInPaisa: 4500, category: "Nails", currency: "INR", isActive: 1 },
        
        // Tranquil Spa Retreat services
        { salonId: createdSalons[2].id, name: "Facial Treatment", description: "Deep cleansing facial", durationMinutes: 90, priceInPaisa: 12000, category: "Facial", currency: "INR", isActive: 1 },
        { salonId: createdSalons[2].id, name: "Swedish Massage", description: "Relaxing full body massage", durationMinutes: 60, priceInPaisa: 8000, category: "Massage", currency: "INR", isActive: 1 }
      ];
      
      await db.insert(services).values(salonServices);
      console.log('✅ Initialized services in database');
    }
  } catch (error) {
    console.error('Error initializing salons and services:', error);
  }
}

export const storage = new DatabaseStorage();

// Initialize data on startup - using database now
async function initializeServices() {
  await initializeSalonsAndServices();
}

initializeSalonsAndServices();

export { initializeServices };
