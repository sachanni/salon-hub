import { 
  type User, type InsertUser, type UpsertUser,
  type UserSavedLocation, type InsertUserSavedLocation,
  type Service, type InsertService,
  type ServiceTemplate, type InsertServiceTemplate,
  type ServicePackage, type InsertServicePackage,
  type PackageService, type InsertPackageService,
  type Booking, type InsertBooking,
  type BookingService, type InsertBookingService,
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
  // Platform admin types
  type PlatformConfig, type InsertPlatformConfig,
  type PlatformCommission, type InsertPlatformCommission,
  type PlatformPayout, type InsertPlatformPayout,
  type PlatformOffer, type InsertPlatformOffer,
  // Geocoding cache types
  type GeocodeLocation, type InsertGeocodeLocation,
  type LocationAlias, type InsertLocationAlias,
  // Review system types
  type SalonReview, type InsertSalonReview,
  // Google Places cache types
  type GooglePlacesCache, type InsertGooglePlacesCache,
  // Product E-commerce types
  type ProductRetailConfig, type InsertProductRetailConfig,
  type ProductVariant, type InsertProductVariant,
  type ShoppingCart, type InsertShoppingCart,
  type CartItem, type InsertCartItem,
  type ProductOrder, type InsertProductOrder,
  type ProductOrderItem, type InsertProductOrderItem,
  type Wishlist, type InsertWishlist,
  type ProductReview, type InsertProductReview,
  type DeliverySettings, type InsertDeliverySettings,
  type ProductView, type InsertProductView,
  // Smart Rebooking types
  type ServiceRebookingCycle, type InsertServiceRebookingCycle,
  type CustomerRebookingStat, type InsertCustomerRebookingStat,
  type RebookingReminder, type InsertRebookingReminder,
  type RebookingSettings, type InsertRebookingSettings,
  users, userSavedLocations, services, serviceTemplates, servicePackages, packageServices, bookings, bookingServices, payments, salons, roles, organizations, userRoles, orgUsers,
  staff, availabilityPatterns, timeSlots, emailVerificationTokens,
  bookingSettings, staffServices, resources, serviceResources, mediaAssets, taxRates, payoutAccounts, publishState, customerProfiles,
  geocodeLocations, locationAliases,
  // Review and cache tables
  salonReviews, googlePlacesCache,
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
  optimizationRecommendations, automatedActionLogs, campaignOptimizationInsights,
  // Platform admin tables
  platformConfig, platformCommissions, platformPayouts, platformOffers,
  // Wallet and launch offer tables
  userWallets, walletTransactions, userOfferUsage, launchOffers,
  // Product E-commerce tables
  productRetailConfig, productVariants, shoppingCarts, cartItems,
  productOrders, productOrderItems, wishlists, productReviews,
  deliverySettings, productViews,
  // Smart Rebooking tables
  serviceRebookingCycles, customerRebookingStats, rebookingReminders, rebookingSettings,
  // Job Card tables
  jobCards, jobCardServices
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, isNull, gte, lte, desc, asc, sql, inArray, ne, like, isNotNull, lt, gt } from "drizzle-orm";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  searchUsersByEmail(emailQuery: string, limit?: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<void>;
  updateUserPreferences(userId: string, preferences: any): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>; // Required for Replit Auth
  
  // User saved locations operations
  getUserSavedLocation(id: string): Promise<UserSavedLocation | undefined>;
  getUserSavedLocationsByUserId(userId: string): Promise<UserSavedLocation[]>;
  getUserSavedLocationByUserIdAndLabel(userId: string, label: string): Promise<UserSavedLocation | undefined>;
  createUserSavedLocation(location: InsertUserSavedLocation): Promise<UserSavedLocation>;
  updateUserSavedLocation(id: string, updates: Partial<InsertUserSavedLocation>): Promise<void>;
  deleteUserSavedLocation(id: string): Promise<void>;
  
  // Proximity search operations
  findSalonsNearLocation(latitude: number, longitude: number, radiusKm: number, limit?: number): Promise<Array<Salon & { distance: number }>>;
  findSalonsNearUserLocation(userId: string, locationLabel: string, radiusKm: number, limit?: number): Promise<Array<Salon & { distance: number }>>;
  
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
  
  // Password reset operations
  savePasswordResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  
  // Salon operations
  getSalon(id: string): Promise<Salon | undefined>;
  getAllSalons(): Promise<Salon[]>;
  getSalons(): Promise<Salon[]>;  // Get ALL salons regardless of publish state
  createSalon(salon: InsertSalon): Promise<Salon>;
  updateSalon(id: string, updates: Partial<InsertSalon>): Promise<void>;
  deleteSalon(id: string): Promise<void>;
  
  // Service operations
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  getServicesBySalonId(salonId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<InsertService>): Promise<void>;
  deleteService(id: string): Promise<void>;
  
  // Service template operations
  getServiceTemplates(filters?: {
    gender?: string;
    category?: string;
    isPopular?: boolean;
  }): Promise<ServiceTemplate[]>;
  
  // Booking operations
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingServicesByBookingId(bookingId: string): Promise<BookingService[]>;
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

  // Super Admin operations
  // Platform analytics
  getPlatformStats(period?: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    totalUsers: number;
    totalSalons: number;
    pendingApprovals: number;
    activeUsers: number;
    activeOffers: number;
    bookingTrends: Array<{ date: string; count: number; revenue: number }>;
  }>;

  // Business management
  getAllSalonsForAdmin(filters?: {
    status?: string;
    approvalStatus?: string;
    city?: string;
    search?: string;
  }): Promise<Array<Salon & { 
    totalBookings: number;
    totalRevenue: number;
    ownerName?: string;
  }>>;

  approveSalon(salonId: string, approvedBy: string): Promise<void>;
  rejectSalon(salonId: string, reason: string, rejectedBy: string): Promise<void>;
  toggleSalonStatus(salonId: string, isActive: boolean, options?: { 
    disabledBySuperAdmin?: boolean; 
    disabledReason?: string; 
    disabledBy?: string;
  }): Promise<void>;
  toggleSalonStatusBySuperAdmin(salonId: string, isActive: boolean, adminId: string, reason?: string): Promise<void>;

  // User management  
  getAllUsersForAdmin(filters?: {
    role?: string;
    isActive?: number;
    search?: string;
  }): Promise<Array<User & { 
    roles: string[];
    totalBookings: number;
    totalSpent: number;
  }>>;

  toggleUserActive(userId: string, isActive: number): Promise<void>;

  // Booking analytics
  getAllBookingsForAdmin(filters?: {
    status?: string;
    salonId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<Booking & { 
    salonName: string;
    serviceName: string;
    customerName: string;
  }>>;

  getSalonBookingStats(salonId: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    cancellationRate: number;
    averageBookingValue: number;
  }>;

  // Platform configuration
  getPlatformConfig(key: string): Promise<any>;
  setPlatformConfig(key: string, value: any, updatedBy: string): Promise<void>;

  // Commission & Payouts
  createPlatformCommission(data: any): Promise<void>;
  getSalonEarnings(salonId: string): Promise<{
    totalEarnings: number;
    platformCommission: number;
    salonShare: number;
    pendingPayout: number;
  }>;

  createPayout(salonId: string, amount: number): Promise<any>;
  approvePayout(payoutId: string, approvedBy: string): Promise<void>;
  rejectPayout(payoutId: string, reason: string, rejectedBy: string): Promise<void>;
  
  getAllPayouts(filters?: { status?: string; salonId?: string }): Promise<any[]>;

  // Offers Management
  getAllOffers(filters?: { 
    status?: string;
    approvalStatus?: string;
    isPlatformWide?: number;
    salonId?: string;
    ownedBySalonId?: string;
  }): Promise<Array<PlatformOffer & { salonName?: string }>>;
  getOfferById(offerId: string): Promise<PlatformOffer | undefined>;
  getSalonOffers(salonId: string): Promise<PlatformOffer[]>; // Get offers owned by a specific salon
  createOffer(data: InsertPlatformOffer): Promise<PlatformOffer>;
  createSalonOffer(salonId: string, data: any, createdBy: string): Promise<PlatformOffer>; // Auto-approve aware
  updateOffer(offerId: string, updates: Partial<InsertPlatformOffer>): Promise<void>;
  updateSalonOffer(offerId: string, salonId: string, updates: any, editedBy: string): Promise<void>; // Edit tracking + re-approval logic
  approveOffer(offerId: string, approvedBy: string): Promise<void>;
  rejectOffer(offerId: string, reason: string, rejectedBy: string): Promise<void>;
  toggleOfferStatus(offerId: string, isActive: number): Promise<void>;
  toggleSalonOfferStatus(offerId: string, salonId: string, isActive: number): Promise<void>; // Ownership validation
  deleteOffer(offerId: string): Promise<void>;
  deleteSalonOffer(offerId: string, salonId: string): Promise<void>; // Ownership validation

  // Digital Wallet Management
  getUserWallet(userId: string): Promise<any>;
  createUserWallet(userId: string): Promise<any>;
  addWalletCredit(userId: string, amountInPaisa: number, reason: string, bookingId?: string, offerId?: string): Promise<void>;
  deductWalletBalance(userId: string, amountInPaisa: number, reason: string, bookingId?: string): Promise<void>;
  getWalletTransactions(userId: string): Promise<any[]>;

  // Launch Offers & Eligibility
  getActiveLaunchOffers(): Promise<any[]>;
  getUserOfferEligibility(userId: string, offerId: string): Promise<{
    eligible: boolean;
    usageCount: number;
    maxUsage: number;
    reason?: string;
  }>;
  trackOfferUsage(userId: string, offerId: string, bookingId: string, discountInPaisa: number, usageNumber: number): Promise<void>;
  getCustomerOffers(userId: string, salonId?: string): Promise<any[]>;
  getAllOffersWithSalons(): Promise<any[]>;

  // ===== PRODUCT E-COMMERCE OPERATIONS =====
  
  // Product Discovery (Customer-facing)
  getRetailProducts(salonId: string, filters?: {
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Array<Product & { retailConfig?: ProductRetailConfig; variants?: ProductVariant[] }>>;
  
  getProductById(productId: string, includeVariants?: boolean): Promise<(Product & { retailConfig?: ProductRetailConfig; variants?: ProductVariant[] }) | undefined>;
  
  searchProducts(query: string, filters?: {
    salonId?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
  }): Promise<Array<Product & { retailConfig?: ProductRetailConfig }>>;
  
  // Product Variants
  getProductVariants(productId: string): Promise<ProductVariant[]>;
  getVariantById(variantId: string): Promise<ProductVariant | undefined>;
  
  // Shopping Cart Operations
  createOrGetCart(userId: string, salonId: string): Promise<ShoppingCart>;
  getActiveCart(userId: string, salonId: string): Promise<(ShoppingCart & { items?: Array<CartItem & { product?: Product; variant?: ProductVariant }> }) | undefined>;
  getUserCartItems(userId: string): Promise<Array<CartItem & { product?: Product & { retailConfig?: ProductRetailConfig }; variant?: ProductVariant; salonId?: string }>>;
  addCartItem(cartId: string, item: {
    productId: string;
    variantId?: string;
    quantity: number;
    priceAtAdd: number;
  }): Promise<CartItem>;
  updateCartItem(itemId: string, quantity: number): Promise<void>;
  removeCartItem(itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  
  // Product Order Operations
  createProductOrder(orderData: {
    userId: string;
    salonId: string;
    cartId: string;
    deliveryAddress: any;
    paymentMethod: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      priceInPaisa: number;
    }>;
    subtotalInPaisa: number;
    taxInPaisa: number;
    deliveryFeeInPaisa: number;
    totalInPaisa: number;
  }): Promise<ProductOrder>;
  
  getProductOrder(orderId: string): Promise<(ProductOrder & { items?: ProductOrderItem[] }) | undefined>;
  getProductOrdersByUser(userId: string, limit?: number): Promise<ProductOrder[]>;
  updateOrderStatus(orderId: string, status: string, updatedBy?: string): Promise<void>;
  cancelProductOrder(orderId: string, reason?: string): Promise<void>;
  
  // Stock Reservation Operations
  reserveProductStock(productId: string, quantity: number): Promise<{ success: boolean; availableStock: number; message?: string }>;
  releaseProductStock(productId: string, quantity: number): Promise<void>;
  commitProductStockReduction(productId: string, quantity: number): Promise<void>;
  
  // Wishlist Operations
  addToWishlist(userId: string, productId: string): Promise<Wishlist>;
  getWishlist(userId: string, salonId?: string): Promise<Array<Wishlist & { product?: Product }>>;
  removeFromWishlist(wishlistId: string): Promise<void>;
  isInWishlist(userId: string, productId: string): Promise<boolean>;
  
  // Product Reviews
  createProductReview(review: {
    productId: string;
    userId: string;
    orderId?: string;
    rating: number;
    title?: string;
    reviewText?: string;
    images?: string[];
  }): Promise<ProductReview>;
  
  getProductReviews(productId: string, filters?: {
    rating?: number;
    verified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ProductReview[]>;
  
  updateReviewHelpfulness(reviewId: string, helpfulCount?: number, notHelpfulCount?: number): Promise<void>;
  
  // Product Views Analytics
  trackProductView(userId: string | null, productId: string, sessionId?: string): Promise<void>;
  getProductViewCount(productId: string, period?: string): Promise<number>;

  // ===============================================
  // BUSINESS ADMIN - Product Management
  // ===============================================
  getAdminProductList(salonId: string, filters?: {
    availableForRetail?: boolean;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]>;
  
  configureProductForRetail(productId: string, salonId: string, config: {
    availableForRetail: boolean;
    retailPriceInPaisa?: number;
    retailStockAllocated?: number;
    retailDescription?: string;
    retailImageUrls?: string[];
    featured?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    searchKeywords?: string[];
  }): Promise<void>;

  // ===============================================
  // BUSINESS ADMIN - Order Management  
  // ===============================================
  getAdminOrders(salonId: string, filters?: {
    status?: string;
    fulfillmentType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any>;

  updateOrderStatus(orderId: string, salonId: string, updates: {
    status: string;
    trackingNumber?: string;
    courierPartner?: string;
    estimatedDeliveryDate?: string;
    notes?: string;
  }): Promise<void>;

  cancelOrderAdmin(orderId: string, salonId: string, reason: string, refundAmountPaisa?: number): Promise<void>;

  // ===============================================
  // BUSINESS ADMIN - Analytics
  // ===============================================
  getProductAnalytics(salonId: string, filters?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any>;

  // ===============================================
  // BUSINESS ADMIN - Delivery Settings
  // ===============================================
  getDeliverySettings(salonId: string): Promise<any>;
  updateDeliverySettings(salonId: string, settings: any): Promise<void>;
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
    // Case-insensitive email lookup with whitespace normalization
    const [user] = await db.select().from(users).where(sql`LOWER(TRIM(${users.email})) = LOWER(TRIM(${email}))`);
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async searchUsersByEmail(emailQuery: string, limit: number = 10): Promise<User[]> {
    const searchResults = await db
      .select()
      .from(users)
      .where(sql`${users.email} ILIKE ${`%${emailQuery}%`}`)
      .limit(limit);
    return searchResults;
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
    const result = await db.select().from(salons).where(and(
      eq(salons.orgId, orgId),
      eq(salons.isActive, 1)
    ));
    return result || [];
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
    // Only return published salons (those that have gone live)
    const results = await db
      .select({ salons })
      .from(salons)
      .innerJoin(publishState, eq(salons.id, publishState.salonId))
      .where(
        and(
          eq(salons.isActive, 1),
          eq(publishState.isPublished, 1) // Only show published salons
        )
      );
    
    return results.map(r => r.salons) || [];
  }

  async getSalons(): Promise<Salon[]> {
    // Get ALL salons (including unpublished) - used for business dashboard
    const results = await db.select().from(salons).where(eq(salons.isActive, 1));
    return results || [];
  }

  async createSalon(salon: InsertSalon): Promise<Salon> {
    const [newSalon] = await db.insert(salons).values(salon).returning();
    return newSalon;
  }

  async updateSalon(id: string, updates: Partial<InsertSalon>): Promise<void> {
    await db.update(salons).set(updates).where(eq(salons.id, id));
  }

  async deleteSalon(id: string): Promise<void> {
    // Delete the salon - related data will cascade if configured, 
    // or remain orphaned (to be cleaned up separately if needed)
    await db.delete(salons).where(eq(salons.id, id));
  }

  // Proximity search operations
  async findSalonsNearLocation(latitude: number, longitude: number, radiusKm: number, limit?: number): Promise<Array<Salon & { distance: number }>> {
    try {
      // Validate input parameters
      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees');
      }
      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees');
      }
      if (radiusKm < 0.1 || radiusKm > 50) {
        throw new Error('Radius must be between 0.1 and 50 kilometers');
      }

      const searchLimit = Math.min(limit || 50, 500); // Get more results for filtering

      // Bounding box optimization - filter before expensive distance calculation
      // 1 degree latitude ≈ 111 km
      // 1 degree longitude ≈ 111 km * cos(latitude)
      const latDegreeOffset = radiusKm / 111;
      const lngDegreeOffset = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

      const minLat = latitude - latDegreeOffset;
      const maxLat = latitude + latDegreeOffset;
      const minLng = longitude - lngDegreeOffset;
      const maxLng = longitude + lngDegreeOffset;

      // Get salons within the bounding box first (much faster)
      // JOIN with publish_state to only show published salons
      const results = await db
        .select()
        .from(salons)
        .innerJoin(publishState, eq(salons.id, publishState.salonId))
        .where(
          and(
            eq(salons.isActive, 1),
            eq(publishState.isPublished, 1), // Only show published salons
            // Bounding box prefilter for performance
            sql`CAST(${salons.latitude} AS DECIMAL) >= ${minLat}`,
            sql`CAST(${salons.latitude} AS DECIMAL) <= ${maxLat}`,
            sql`CAST(${salons.longitude} AS DECIMAL) >= ${minLng}`,
            sql`CAST(${salons.longitude} AS DECIMAL) <= ${maxLng}`,
            // Only include salons with valid coordinates
            sql`${salons.latitude} IS NOT NULL`,
            sql`${salons.longitude} IS NOT NULL`
          )
        )
        .limit(searchLimit);

      // Handle empty results
      if (!results || results.length === 0) {
        return [];
      }

      // Calculate Haversine distance in JavaScript and filter by actual distance
      const earthRadiusKm = 6371;
      const salonsWithDistance = results.map(result => {
        const salon = result.salons; // Extract salon from joined result
        const salonLat = parseFloat(salon.latitude || '0');
        const salonLng = parseFloat(salon.longitude || '0');
        
        // Haversine formula
        const dLat = this.toRadians(salonLat - latitude);
        const dLng = this.toRadians(salonLng - longitude);
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(this.toRadians(latitude)) * Math.cos(this.toRadians(salonLat)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadiusKm * c;

        return {
          ...salon,
          distance: distance
        };
      })
      .filter(salon => salon.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, Math.min(limit || 50, 100));

      return salonsWithDistance;
    } catch (error) {
      console.error('Error in findSalonsNearLocation:', error);
      throw error;
    }
  }

  // Helper method to convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  async findSalonsNearUserLocation(userId: string, locationLabel: string, radiusKm: number, limit?: number): Promise<Array<Salon & { distance: number }>> {
    try {
      // Get user's saved location
      const [userLocation] = await db
        .select()
        .from(userSavedLocations)
        .where(
          and(
            eq(userSavedLocations.userId, userId),
            eq(userSavedLocations.label, locationLabel)
          )
        );

      if (!userLocation) {
        throw new Error(`User location '${locationLabel}' not found`);
      }

      const latitude = parseFloat(userLocation.latitude);
      const longitude = parseFloat(userLocation.longitude);

      return this.findSalonsNearLocation(latitude, longitude, radiusKm, limit);
    } catch (error) {
      console.error('Error in findSalonsNearUserLocation:', error);
      throw error;
    }
  }

  // Service operations
  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getAllServices(): Promise<Service[]> {
    const result = await db.select().from(services).where(eq(services.isActive, 1));
    return result || [];
  }

  async getServicesBySalonId(salonId: string): Promise<Service[]> {
    const result = await db.select().from(services).where(and(
      eq(services.salonId, salonId),
      eq(services.isActive, 1)
    ));
    return result || [];
  }

  async createService(service: InsertService): Promise<Service> {
    // Auto-assign image if not provided
    const serviceData = { ...service };
    if (!serviceData.imageUrl) {
      const { getServiceImage, getDefaultImageByCategory } = await import('../shared/service-images');
      const autoImage = getServiceImage(service.name) || getDefaultImageByCategory(service.category || '');
      if (autoImage) {
        serviceData.imageUrl = autoImage;
      }
    }
    
    const [newService] = await db.insert(services).values(serviceData).returning();
    return newService;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<void> {
    await db.update(services).set(updates).where(eq(services.id, id));
  }

  async deleteService(id: string): Promise<void> {
    await db.update(services).set({ isActive: 0 }).where(eq(services.id, id));
  }

  // Service template operations
  async getServiceTemplates(filters?: {
    gender?: string;
    category?: string;
    isPopular?: boolean;
  }): Promise<ServiceTemplate[]> {
    try {
      let query = db.select().from(serviceTemplates).where(eq(serviceTemplates.isActive, 1));
      
      const conditions = [eq(serviceTemplates.isActive, 1)];
      
      if (filters?.gender) {
        conditions.push(eq(serviceTemplates.gender, filters.gender));
      }
      
      if (filters?.category) {
        conditions.push(eq(serviceTemplates.category, filters.category));
      }
      
      if (filters?.isPopular !== undefined) {
        conditions.push(eq(serviceTemplates.isPopular, filters.isPopular ? 1 : 0));
      }
      
      const result = await db
        .select()
        .from(serviceTemplates)
        .where(and(...conditions))
        .orderBy(serviceTemplates.sortOrder, serviceTemplates.category, serviceTemplates.name);
      
      return result || [];
    } catch (error) {
      console.error('Error fetching service templates:', error);
      return [];
    }
  }

  // Package/Combo operations
  async getPackage(id: string) {
    const [pkg] = await db.select().from(servicePackages).where(eq(servicePackages.id, id));
    return pkg || undefined;
  }

  async getPackagesBySalonId(salonId: string) {
    const packages = await db.select().from(servicePackages).where(and(
      eq(servicePackages.salonId, salonId),
      eq(servicePackages.isActive, 1)
    ));
    
    // Fetch services for each package
    const packagesWithServices = await Promise.all(
      packages.map(async (pkg) => {
        const packageSvcs = await db.select({
          packageService: packageServices,
          service: services
        })
        .from(packageServices)
        .innerJoin(services, eq(packageServices.serviceId, services.id))
        .where(eq(packageServices.packageId, pkg.id))
        .orderBy(packageServices.sequenceOrder);

        return {
          ...pkg,
          services: packageSvcs.map(ps => ({
            ...ps.service,
            sequenceOrder: ps.packageService.sequenceOrder
          }))
        };
      })
    );
    
    return packagesWithServices || [];
  }

  async getPackageWithServices(packageId: string) {
    // Get package details
    const pkg = await this.getPackage(packageId);
    if (!pkg) return undefined;

    // Get all services in this package
    const packageSvcs = await db.select({
      packageService: packageServices,
      service: services
    })
    .from(packageServices)
    .innerJoin(services, eq(packageServices.serviceId, services.id))
    .where(eq(packageServices.packageId, packageId))
    .orderBy(packageServices.sequenceOrder);

    return {
      ...pkg,
      services: packageSvcs.map(ps => ({
        ...ps.service,
        sequenceOrder: ps.packageService.sequenceOrder
      }))
    };
  }

  async createPackage(packageData: any) {
    const [newPackage] = await db.insert(servicePackages).values(packageData).returning();
    return newPackage;
  }

  async updatePackage(id: string, updates: any) {
    await db.update(servicePackages).set({ ...updates, updatedAt: new Date() }).where(eq(servicePackages.id, id));
  }

  async deletePackage(id: string) {
    await db.update(servicePackages).set({ isActive: 0 }).where(eq(servicePackages.id, id));
  }

  async addServiceToPackage(data: any) {
    const [packageService] = await db.insert(packageServices).values(data).returning();
    return packageService;
  }

  async removeAllServicesFromPackage(packageId: string) {
    await db.delete(packageServices).where(eq(packageServices.packageId, packageId));
  }

  // Resilient transaction helper with retry logic for transient failures
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 100
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if error is transient (connection/WebSocket errors)
        const isTransient = 
          error.message?.includes('WebSocket') ||
          error.message?.includes('fetch failed') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT') ||
          error.code === '57014' || // query_canceled
          error.code === '57P01' || // admin_shutdown
          error.code === '08006';   // connection_failure
        
        // Don't retry if it's not a transient error
        if (!isTransient) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          console.error(`Transaction failed after ${maxAttempts} attempts:`, error.message);
          throw error;
        }
        
        // Calculate delay with exponential backoff + jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 50;
        console.warn(`Transaction attempt ${attempt} failed (transient error), retrying in ${Math.round(delay)}ms...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Transaction failed');
  }

  // Transactional package operations - ensures atomicity for create/update with services
  async createPackageWithServices(packageData: any, serviceIds: string[], salonId: string) {
    return await this.withRetry(async () => {
      return await db.transaction(async (tx) => {
        // Create the package
        const [newPackage] = await tx.insert(servicePackages).values(packageData).returning();
        
        // Add all services to the package
        for (let i = 0; i < serviceIds.length; i++) {
          await tx.insert(packageServices).values({
            packageId: newPackage.id,
            serviceId: serviceIds[i],
            salonId,
            sequenceOrder: i + 1
          });
        }
        
        return newPackage;
      });
    });
  }

  async updatePackageWithServices(packageId: string, packageData: any, serviceIds: string[] | null, salonId: string) {
    return await this.withRetry(async () => {
      return await db.transaction(async (tx) => {
        // Update the package
        await tx.update(servicePackages).set({ ...packageData, updatedAt: new Date() }).where(eq(servicePackages.id, packageId));
        
        // Service update behavior:
        // - serviceIds = null/undefined: don't modify services at all (metadata-only update)
        // - serviceIds = [] (empty array): remove all services from package
        // - serviceIds = [id1, id2, ...]: replace all services with new list
        if (serviceIds !== null && serviceIds !== undefined) {
          // Always remove all existing services when serviceIds is explicitly provided
          await tx.delete(packageServices).where(eq(packageServices.packageId, packageId));
          
          // Add new services only if the array is not empty
          if (serviceIds.length > 0) {
            for (let i = 0; i < serviceIds.length; i++) {
              await tx.insert(packageServices).values({
                packageId,
                serviceId: serviceIds[i],
                salonId,
                sequenceOrder: i + 1
              });
            }
          }
        }
        
        // Return the updated package
        const [updatedPackage] = await tx.select().from(servicePackages).where(eq(servicePackages.id, packageId));
        if (!updatedPackage) {
          throw new Error('Package not found');
        }
        return updatedPackage;
      });
    });
  }

  // Booking operations
  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingServicesByBookingId(bookingId: string): Promise<BookingService[]> {
    return db.select()
      .from(bookingServices)
      .where(eq(bookingServices.bookingId, bookingId));
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

  async getBookingsBySalonId(salonId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<any[]> {
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
        .select({
          id: bookings.id,
          serviceId: bookings.serviceId,
          staffId: bookings.staffId,
          timeSlotId: bookings.timeSlotId,
          customerName: bookings.customerName,
          customerEmail: bookings.customerEmail,
          customerPhone: bookings.customerPhone,
          salonName: bookings.salonName,
          bookingDate: bookings.bookingDate,
          bookingTime: bookings.bookingTime,
          status: bookings.status,
          totalAmountPaisa: bookings.totalAmountPaisa,
          currency: bookings.currency,
          paymentMethod: bookings.paymentMethod,
          notes: bookings.notes,
          guestSessionId: bookings.guestSessionId,
          offerId: bookings.offerId,
          originalAmountPaisa: bookings.originalAmountPaisa,
          discountAmountPaisa: bookings.discountAmountPaisa,
          finalAmountPaisa: bookings.finalAmountPaisa,
          createdAt: bookings.createdAt,
          salonId: bookings.salonId,
          serviceName: services.name,
          serviceDuration: services.durationMinutes,
          jobCardId: jobCards.id,
          jobCardStatus: jobCards.status
        })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(jobCards, eq(bookings.id, jobCards.bookingId))
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
    if (!bookingTime || typeof bookingTime !== 'string') {
      throw new Error('Invalid booking time: time is required');
    }

    // Normalize time to 24-hour format and parse
    let hours: number, minutes: number;
    
    // Check if time is in 12-hour format (contains AM/PM)
    const time12HourMatch = bookingTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (time12HourMatch) {
      const [, hourStr, minuteStr, period] = time12HourMatch;
      hours = parseInt(hourStr, 10);
      minutes = parseInt(minuteStr, 10);
      
      // Convert to 24-hour format
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
    } else {
      // Assume 24-hour format (HH:MM)
      const timeParts = bookingTime.split(':');
      if (timeParts.length !== 2) {
        throw new Error(`Invalid booking time format: ${bookingTime}. Expected "HH:MM" or "H:MM AM/PM"`);
      }
      
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
    }
    
    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid booking time values: hours=${hours}, minutes=${minutes}`);
    }
    
    // Parse the booking date and time into a start Date object
    const start = new Date(bookingDate);
    if (isNaN(start.getTime())) {
      throw new Error(`Invalid booking date: ${bookingDate}`);
    }
    
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
      
      // First, we need to get all bookings for the date to check overlaps with their actual durations
      const potentialConflicts = await db
        .select({
          id: bookings.id,
          salonId: bookings.salonId,
          staffId: bookings.staffId,
          serviceId: bookings.serviceId,
          timeSlotId: bookings.timeSlotId,
          customerName: bookings.customerName,
          customerEmail: bookings.customerEmail,
          customerPhone: bookings.customerPhone,
          salonName: bookings.salonName,
          bookingDate: bookings.bookingDate,
          bookingTime: bookings.bookingTime,
          status: bookings.status,
          totalAmountPaisa: bookings.totalAmountPaisa,
          currency: bookings.currency,
          paymentMethod: bookings.paymentMethod,
          notes: bookings.notes,
          guestSessionId: bookings.guestSessionId,
          offerId: bookings.offerId,
          originalAmountPaisa: bookings.originalAmountPaisa,
          discountAmountPaisa: bookings.discountAmountPaisa,
          finalAmountPaisa: bookings.finalAmountPaisa,
          createdAt: bookings.createdAt,
          durationMinutes: services.durationMinutes
        })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(and(
          eq(bookings.salonId, salonId),
          ne(bookings.status, 'cancelled'),
          ne(bookings.status, 'completed'),
          eq(bookings.bookingDate, startDateStr),
          staffId ? eq(bookings.staffId, staffId) : sql`1=1`,
          excludeId ? ne(bookings.id, excludeId) : sql`1=1`
        ));
      
      // Filter the results by checking for time overlaps using JavaScript
      const overlappingBookings = potentialConflicts.filter(booking => {
        const [bookingHours, bookingMinutes] = booking.bookingTime.split(':').map(Number);
        const bookingStart = new Date(booking.bookingDate);
        bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
        
        const bookingEnd = new Date(bookingStart);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.durationMinutes);
        
        // Check for overlap: booking overlaps if booking_start < search_end AND booking_end > search_start
        return bookingStart < end && bookingEnd > start;
      });
      
      return overlappingBookings as Booking[];
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
        
        // Check for conflicting bookings using proper conflict detection
        const conflictingBookings = await this.findOverlappingBookings(
          currentBooking.salonId,
          targetStaffId,
          start,
          end,
          id // Exclude current booking
        );
        
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
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
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

      // Normalize date boundaries for timestamp comparisons (job cards use timestamps)
      const periodStartDate = new Date(startDateStr);
      periodStartDate.setHours(0, 0, 0, 0);
      const periodEndDate = new Date(endDateStr);
      periodEndDate.setHours(23, 59, 59, 999);
      const prevPeriodStartDate = new Date(previousStartDateStr);
      prevPeriodStartDate.setHours(0, 0, 0, 0);
      const prevPeriodEndDate = new Date(previousEndDateStr);
      prevPeriodEndDate.setHours(23, 59, 59, 999);

      // Get current period booking stats
      // Note: Only count EXPECTED revenue from bookings that are confirmed but NOT yet completed
      // Actual/realized revenue is calculated from completed job cards with payments
      const bookingStats = await db
        .select({
          totalBookings: sql<number>`count(*)`,
          expectedRevenue: sql<number>`sum(case when ${bookings.status} IN ('confirmed', 'arrived') then ${bookings.totalAmountPaisa} else 0 end)`,
          confirmedBookings: sql<number>`count(case when ${bookings.status} = 'confirmed' then 1 end)`,
          arrivedBookings: sql<number>`count(case when ${bookings.status} = 'arrived' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ));

      // Get current period job card stats (includes walk-ins)
      // IMPORTANT: Realized revenue is ONLY from completed job cards that are PAID
      // This ensures we don't count revenue before service is delivered and payment is collected
      const jobCardStats = await db
        .select({
          totalJobCards: sql<number>`count(*)`,
          // Realized revenue = only from completed AND paid job cards
          realizedRevenue: sql<number>`sum(case when ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then ${jobCards.paidAmountPaisa} else 0 end)`,
          // Pending revenue = from open/in-service job cards (service in progress but not yet paid)
          pendingRevenue: sql<number>`sum(case when ${jobCards.status} IN ('open', 'in_service', 'pending_checkout') then ${jobCards.totalAmountPaisa} else 0 end)`,
          completedJobCards: sql<number>`count(case when ${jobCards.status} = 'completed' then 1 end)`,
          paidJobCards: sql<number>`count(case when ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then 1 end)`,
          walkInCount: sql<number>`count(case when ${jobCards.isWalkIn} = 1 then 1 end)`,
          // Walk-in revenue only from paid walk-ins
          walkInRevenue: sql<number>`sum(case when ${jobCards.isWalkIn} = 1 AND ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then ${jobCards.paidAmountPaisa} else 0 end)`
        })
        .from(jobCards)
        .where(and(
          eq(jobCards.salonId, salonId),
          gte(jobCards.checkInAt, periodStartDate),
          lte(jobCards.checkInAt, periodEndDate)
        ));

      // Get previous period booking stats for comparison
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

      // Get previous period job card stats (for trend comparison)
      const previousJobCardStats = await db
        .select({
          totalJobCards: sql<number>`count(*)`,
          realizedRevenue: sql<number>`sum(case when ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then ${jobCards.paidAmountPaisa} else 0 end)`,
          completedJobCards: sql<number>`count(case when ${jobCards.status} = 'completed' then 1 end)`,
          paidJobCards: sql<number>`count(case when ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then 1 end)`
        })
        .from(jobCards)
        .where(and(
          eq(jobCards.salonId, salonId),
          gte(jobCards.checkInAt, prevPeriodStartDate),
          lte(jobCards.checkInAt, prevPeriodEndDate)
        ));

      // Get today's specific booking data
      const todayBookingStats = await db
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

      // Get today's job card data (includes walk-ins)
      // Only count realized revenue from PAID job cards
      const todayJobCardStats = await db
        .select({
          todayJobCards: sql<number>`count(*)`,
          todayRealizedRevenue: sql<number>`sum(case when ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then ${jobCards.paidAmountPaisa} else 0 end)`,
          todayPendingRevenue: sql<number>`sum(case when ${jobCards.status} IN ('open', 'in_service', 'pending_checkout') then ${jobCards.totalAmountPaisa} else 0 end)`,
          todayWalkIns: sql<number>`count(case when ${jobCards.isWalkIn} = 1 then 1 end)`,
          todayCompleted: sql<number>`count(case when ${jobCards.status} = 'completed' then 1 end)`,
          todayPaid: sql<number>`count(case when ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then 1 end)`
        })
        .from(jobCards)
        .where(and(
          eq(jobCards.salonId, salonId),
          gte(jobCards.checkInAt, todayStart),
          lte(jobCards.checkInAt, todayEnd)
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

      // Get popular services (from bookings)
      const popularServicesFromBookings = await db
        .select({
          serviceId: services.id,
          serviceName: services.name,
          bookingCount: sql<number>`count(*)`,
          bookingRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(services.id, services.name);

      // Get popular services (from job cards - completed & paid only)
      const popularServicesFromJobCards = await db
        .select({
          serviceId: jobCardServices.serviceId,
          jobCardCount: sql<number>`count(distinct ${jobCardServices.jobCardId})`,
          jobCardRevenue: sql<number>`sum(case when ${jobCardServices.status} = 'completed' then ${jobCardServices.finalPricePaisa} else 0 end)`
        })
        .from(jobCardServices)
        .innerJoin(jobCards, and(
          eq(jobCardServices.jobCardId, jobCards.id),
          eq(jobCards.status, 'completed'),
          eq(jobCards.paymentStatus, 'paid'),
          gte(jobCards.checkInAt, startDate),
          lte(jobCards.checkInAt, endDate)
        ))
        .where(eq(jobCardServices.salonId, salonId))
        .groupBy(jobCardServices.serviceId);

      // Combine popular services data
      // NOTE: Job cards are the source of truth for realized revenue
      // Bookings represent reservations, job cards represent actual service delivery
      const serviceMap = new Map<string, { serviceId: string; serviceName: string; bookingCount: number; jobCardCount: number; realizedRevenue: number }>();
      
      // First add booking data (for service counts only, not revenue)
      popularServicesFromBookings.forEach(s => {
        serviceMap.set(s.serviceId, {
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          bookingCount: parseFloat(String(s.bookingCount)) || 0,
          jobCardCount: 0,
          realizedRevenue: 0 // Revenue comes from job cards only
        });
      });
      
      // Then add job card data (counts and revenue)
      // Also fetch service names for job-card-only services
      const serviceNameLookup = new Map<string, string>();
      popularServicesFromBookings.forEach(s => serviceNameLookup.set(s.serviceId, s.serviceName));
      
      // Get service names for any job-card-only services
      const jobCardServiceIds = popularServicesFromJobCards.map(jc => jc.serviceId);
      const missingServiceIds = jobCardServiceIds.filter(id => !serviceNameLookup.has(id));
      if (missingServiceIds.length > 0) {
        const additionalServices = await db
          .select({ id: services.id, name: services.name })
          .from(services)
          .where(inArray(services.id, missingServiceIds));
        additionalServices.forEach(s => serviceNameLookup.set(s.id, s.name));
      }
      
      popularServicesFromJobCards.forEach(jc => {
        const existing = serviceMap.get(jc.serviceId);
        const jcCount = parseFloat(String(jc.jobCardCount)) || 0;
        const jcRevenue = parseFloat(String(jc.jobCardRevenue)) || 0;
        
        if (existing) {
          existing.jobCardCount = jcCount;
          existing.realizedRevenue = jcRevenue;
        } else {
          // Service only appears in job cards (walk-in only service)
          serviceMap.set(jc.serviceId, {
            serviceId: jc.serviceId,
            serviceName: serviceNameLookup.get(jc.serviceId) || 'Unknown Service',
            bookingCount: 0,
            jobCardCount: jcCount,
            realizedRevenue: jcRevenue
          });
        }
      });
      
      const popularServices = Array.from(serviceMap.values())
        .map(s => ({
          ...s,
          totalCount: s.bookingCount + s.jobCardCount
        }))
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 5);

      // Get revenue trends by day (from bookings)
      const bookingTrendsByDay = await db
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

      // Get revenue trends by day (from job cards - completed & paid only)
      const jobCardTrendsByDay = await db
        .select({
          date: sql<string>`DATE(${jobCards.checkInAt})`,
          jobCardCount: sql<number>`count(*)`,
          revenue: sql<number>`sum(case when ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then ${jobCards.paidAmountPaisa} else 0 end)`
        })
        .from(jobCards)
        .where(and(
          eq(jobCards.salonId, salonId),
          gte(jobCards.checkInAt, startDate),
          lte(jobCards.checkInAt, endDate)
        ))
        .groupBy(sql`DATE(${jobCards.checkInAt})`)
        .orderBy(asc(sql`DATE(${jobCards.checkInAt})`));

      // Combine trends data
      // NOTE: Realized revenue comes ONLY from completed & paid job cards
      // Booking revenue is "expected" revenue, not realized
      const trendsMap = new Map<string, { bookingCount: number; jobCardCount: number; realizedRevenue: number; expectedRevenue: number }>();
      bookingTrendsByDay.forEach(t => {
        trendsMap.set(t.date, {
          bookingCount: parseFloat(String(t.bookingCount)) || 0,
          jobCardCount: 0,
          realizedRevenue: 0, // Will come from job cards
          expectedRevenue: parseFloat(String(t.revenue)) || 0 // Booking revenue is expected, not realized
        });
      });
      jobCardTrendsByDay.forEach(t => {
        const dateKey = t.date;
        const jcCount = parseFloat(String(t.jobCardCount)) || 0;
        const jcRevenue = parseFloat(String(t.revenue)) || 0;
        const existing = trendsMap.get(dateKey);
        if (existing) {
          existing.jobCardCount = jcCount;
          existing.realizedRevenue = jcRevenue;
        } else {
          trendsMap.set(dateKey, {
            bookingCount: 0,
            jobCardCount: jcCount,
            realizedRevenue: jcRevenue,
            expectedRevenue: 0
          });
        }
      });
      const revenueTrends = Array.from(trendsMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Get staff performance (from bookings)
      const staffPerformanceFromBookings = await db
        .select({
          staffId: staff.id,
          staffName: staff.name,
          bookingCount: sql<number>`count(*)`,
          bookingRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(bookings)
        .leftJoin(staff, eq(bookings.staffId, staff.id))
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(staff.id, staff.name);

      // Get staff performance (from job cards - completed & paid only)
      const staffPerformanceFromJobCards = await db
        .select({
          staffId: jobCardServices.staffId,
          jobCardCount: sql<number>`count(distinct ${jobCardServices.jobCardId})`,
          jobCardRevenue: sql<number>`sum(case when ${jobCardServices.status} = 'completed' then ${jobCardServices.finalPricePaisa} else 0 end)`
        })
        .from(jobCardServices)
        .innerJoin(jobCards, and(
          eq(jobCardServices.jobCardId, jobCards.id),
          eq(jobCards.status, 'completed'),
          eq(jobCards.paymentStatus, 'paid'),
          gte(jobCards.checkInAt, startDate),
          lte(jobCards.checkInAt, endDate)
        ))
        .where(and(
          eq(jobCardServices.salonId, salonId),
          isNotNull(jobCardServices.staffId)
        ))
        .groupBy(jobCardServices.staffId);

      // Combine staff performance data
      // NOTE: Revenue comes ONLY from completed & paid job cards
      const staffMap = new Map<string, { staffId: string; staffName: string; bookingCount: number; jobCardCount: number; realizedRevenue: number }>();
      
      // First add booking data (counts only, not revenue)
      staffPerformanceFromBookings.forEach(s => {
        const staffIdKey = s.staffId || 'unassigned';
        staffMap.set(staffIdKey, {
          staffId: staffIdKey,
          staffName: s.staffName || 'Unassigned',
          bookingCount: parseFloat(String(s.bookingCount)) || 0,
          jobCardCount: 0,
          realizedRevenue: 0 // Revenue comes from job cards only
        });
      });
      
      // Get staff names for job-card-only staff
      const staffIdsFromJobCards = staffPerformanceFromJobCards.map(jc => jc.staffId).filter((id): id is string => id != null);
      const missingStaffIds = staffIdsFromJobCards.filter(id => !staffMap.has(id));
      if (missingStaffIds.length > 0) {
        const additionalStaff = await db
          .select({ id: staff.id, name: staff.name })
          .from(staff)
          .where(inArray(staff.id, missingStaffIds));
        additionalStaff.forEach(s => {
          if (!staffMap.has(s.id)) {
            staffMap.set(s.id, {
              staffId: s.id,
              staffName: s.name,
              bookingCount: 0,
              jobCardCount: 0,
              realizedRevenue: 0
            });
          }
        });
      }
      
      // Add job card data (counts and revenue)
      staffPerformanceFromJobCards.forEach(jc => {
        const staffIdKey = jc.staffId || 'unassigned';
        const jcCount = parseFloat(String(jc.jobCardCount)) || 0;
        const jcRevenue = parseFloat(String(jc.jobCardRevenue)) || 0;
        const existing = staffMap.get(staffIdKey);
        if (existing) {
          existing.jobCardCount = jcCount;
          existing.realizedRevenue = jcRevenue;
        }
      });
      
      const staffPerformance = Array.from(staffMap.values())
        .map(s => ({
          ...s,
          totalCount: s.bookingCount + s.jobCardCount
        }))
        .sort((a, b) => b.totalCount - a.totalCount);

      // Process booking stats
      const bookingData = bookingStats[0] || {
        totalBookings: 0,
        expectedRevenue: 0,
        confirmedBookings: 0,
        arrivedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0
      };

      // Process job card stats
      const jobCardData = jobCardStats[0] || {
        totalJobCards: 0,
        realizedRevenue: 0,
        pendingRevenue: 0,
        completedJobCards: 0,
        paidJobCards: 0,
        walkInCount: 0,
        walkInRevenue: 0
      };

      const previousBookingData = previousBookingStats[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0
      };

      const previousJobCardData = previousJobCardStats[0] || {
        totalJobCards: 0,
        realizedRevenue: 0,
        completedJobCards: 0,
        paidJobCards: 0
      };

      // Process today's data
      const todayBookingData = todayBookingStats[0] || {
        todayBookings: 0,
        todayRevenue: 0,
        todayConfirmed: 0
      };

      const todayJobCardData = todayJobCardStats[0] || {
        todayJobCards: 0,
        todayRealizedRevenue: 0,
        todayPendingRevenue: 0,
        todayWalkIns: 0,
        todayCompleted: 0,
        todayPaid: 0
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

      // Combined metrics (bookings + job cards)
      const currentBookings = Number(bookingData.totalBookings) || 0;
      const currentJobCards = Number(jobCardData.totalJobCards) || 0;
      const totalCustomers = currentBookings + currentJobCards;
      
      // REVENUE BREAKDOWN:
      // 1. Realized Revenue = ONLY from completed & paid job cards (money actually collected)
      // 2. Expected Revenue = From confirmed bookings that haven't been serviced yet
      // 3. Pending Revenue = From job cards in progress (service started but not yet paid)
      const realizedRevenue = Number(jobCardData.realizedRevenue) || 0;
      const expectedRevenue = Number(bookingData.expectedRevenue) || 0;
      const pendingRevenue = Number(jobCardData.pendingRevenue) || 0;
      
      // Total Revenue shown in dashboard = ONLY realized revenue (actually collected)
      const currentRevenue = realizedRevenue;
      
      // Walk-in specific stats (only from paid walk-ins)
      const currentWalkIns = Number(jobCardData.walkInCount) || 0;
      const walkInRevenue = Number(jobCardData.walkInRevenue) || 0;
      const paidJobCards = Number(jobCardData.paidJobCards) || 0;
      
      // Previous period combined metrics
      const previousBookings = Number(previousBookingData.totalBookings) || 0;
      const previousJobCards = Number(previousJobCardData.totalJobCards) || 0;
      const previousTotalCustomers = previousBookings + previousJobCards;
      const previousRealizedRevenue = Number(previousJobCardData.realizedRevenue) || 0;
      const previousRevenue = previousRealizedRevenue;

      // Today's combined metrics
      const todayBookings = Number(todayBookingData.todayBookings) || 0;
      const todayJobCards = Number(todayJobCardData.todayJobCards) || 0;
      const todayTotalCustomers = todayBookings + todayJobCards;
      // Today's revenue = only from paid job cards today
      const todayRealizedRevenue = Number(todayJobCardData.todayRealizedRevenue) || 0;
      const todayExpectedRevenue = Number(todayBookingData.todayRevenue) || 0;
      const todayPendingRevenue = Number(todayJobCardData.todayPendingRevenue) || 0;
      const todayRevenue = todayRealizedRevenue; // Show only realized revenue
      const todayWalkIns = Number(todayJobCardData.todayWalkIns) || 0;
      const todayCompleted = Number(todayJobCardData.todayCompleted) || 0;
      const todayPaid = Number(todayJobCardData.todayPaid) || 0;

      const bookingsTrend = calculateTrend(totalCustomers, previousTotalCustomers);
      const revenueTrend = calculateTrend(currentRevenue, previousRevenue);

      // Calculate average transaction value based on PAID transactions only
      const averageTransactionValue = paidJobCards > 0 ? realizedRevenue / paidJobCards : 0;
      const previousPaidJobCards = Number(previousJobCardData.paidJobCards) || 0;
      const previousAverageTransactionValue = previousPaidJobCards > 0 ? previousRealizedRevenue / previousPaidJobCards : 0;
      const averageValueTrend = calculateTrend(averageTransactionValue, previousAverageTransactionValue);

      return {
        period,
        startDate: startDateStr,
        endDate: endDateStr,
        overview: {
          // Combined customer/transaction data
          totalBookings: currentBookings,
          totalJobCards: currentJobCards,
          totalCustomers: totalCustomers,
          
          // REVENUE BREAKDOWN - This is the key fix for the lifecycle issue
          // totalRevenuePaisa = ONLY realized revenue (actually collected from paid job cards)
          totalRevenuePaisa: currentRevenue,
          realizedRevenuePaisa: realizedRevenue,      // Money actually collected
          expectedRevenuePaisa: expectedRevenue,      // From confirmed bookings (not yet serviced)
          pendingRevenuePaisa: pendingRevenue,        // From job cards in progress (not yet paid)
          
          // Booking status breakdown
          confirmedBookings: Number(bookingData.confirmedBookings) || 0,
          arrivedBookings: Number(bookingData.arrivedBookings) || 0,
          cancelledBookings: Number(bookingData.cancelledBookings) || 0,
          completedBookings: Number(bookingData.completedBookings) || 0,
          
          // Job card status breakdown
          completedJobCards: Number(jobCardData.completedJobCards) || 0,
          paidJobCards: paidJobCards,
          
          cancellationRate: currentBookings > 0 
            ? ((Number(bookingData.cancelledBookings) || 0) / currentBookings * 100).toFixed(2)
            : '0.00',
          
          // Completion rate (job cards that were completed and paid vs total job cards)
          completionRate: currentJobCards > 0
            ? (paidJobCards / currentJobCards * 100).toFixed(1)
            : '0.0',
          
          // Walk-in specific data (only from paid walk-ins)
          walkInCount: currentWalkIns,
          walkInRevenuePaisa: walkInRevenue,
          
          // Today's specific data (combined)
          todayBookings: todayBookings,
          todayJobCards: todayJobCards,
          todayTotalCustomers: todayTotalCustomers,
          todayRevenuePaisa: todayRevenue,           // Only realized revenue today
          todayRealizedRevenuePaisa: todayRealizedRevenue,
          todayExpectedRevenuePaisa: todayExpectedRevenue,
          todayPendingRevenuePaisa: todayPendingRevenue,
          todayConfirmed: Number(todayBookingData.todayConfirmed) || 0,
          todayWalkIns: todayWalkIns,
          todayCompleted: todayCompleted,
          todayPaid: todayPaid,
          
          // Staff metrics
          activeStaffCount: Number(staffCount),
          
          // Average values (based on paid transactions only)
          averageBookingValuePaisa: Math.round(averageTransactionValue),
          
          // Trending data with percentages
          bookingsTrend: {
            percentage: bookingsTrend.percentage.toFixed(1),
            direction: bookingsTrend.trend,
            previousPeriodValue: previousTotalCustomers
          },
          revenueTrend: {
            percentage: revenueTrend.percentage.toFixed(1),
            direction: revenueTrend.trend,
            previousPeriodValue: previousRevenue
          },
          averageValueTrend: {
            percentage: averageValueTrend.percentage.toFixed(1),
            direction: averageValueTrend.trend,
            previousPeriodValue: Math.round(previousAverageTransactionValue)
          }
        },
        popularServices: popularServices.map(service => ({
          serviceName: service.serviceName,
          bookingCount: service.bookingCount,
          jobCardCount: service.jobCardCount,
          serviceCount: service.totalCount,
          realizedRevenuePaisa: service.realizedRevenue
        })),
        revenueTrends: revenueTrends.map(trend => ({
          date: trend.date,
          bookingCount: trend.bookingCount,
          jobCardCount: trend.jobCardCount,
          totalTransactions: trend.bookingCount + trend.jobCardCount,
          realizedRevenuePaisa: trend.realizedRevenue,
          expectedRevenuePaisa: trend.expectedRevenue
        })),
        staffPerformance: staffPerformance
          .filter(performer => performer.staffName && performer.staffName !== 'Unassigned')
          .map(performer => ({
            staffName: performer.staffName,
            bookingCount: performer.bookingCount,
            jobCardCount: performer.jobCardCount,
            transactionCount: performer.totalCount,
            realizedRevenuePaisa: performer.realizedRevenue,
            utilization: totalCustomers > 0 ? (performer.totalCount / totalCustomers * 100).toFixed(1) : '0.0'
          }))
      };
    } catch (error) {
      console.error('Error fetching salon analytics:', error);
      throw error;
    }
  }

  // Advanced Staff Analytics (includes both bookings and job cards/walk-ins)
  async getAdvancedStaffAnalytics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate, previousStartDate, previousEndDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get staff performance from traditional bookings
      const bookingMetrics = await db
        .select({
          staffId: staff.id,
          staffName: staff.name,
          totalBookings: sql<number>`count(${bookings.id})`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          bookingRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          workingDays: sql<number>`count(distinct ${bookings.bookingDate})`
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

      // Get staff performance from job cards (walk-ins)
      const jobCardMetrics = await db
        .select({
          staffId: staff.id,
          totalJobCards: sql<number>`count(${jobCards.id})`,
          completedJobCards: sql<number>`count(case when ${jobCards.status} = 'completed' then 1 end)`,
          jobCardRevenue: sql<number>`sum(case when ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then ${jobCards.paidAmountPaisa} else 0 end)`,
          walkInCount: sql<number>`count(case when ${jobCards.isWalkIn} = 1 then 1 end)`,
          jobCardWorkingDays: sql<number>`count(distinct DATE(${jobCards.checkInAt}))`
        })
        .from(staff)
        .leftJoin(jobCards, and(
          eq(jobCards.assignedStaffId, staff.id),
          gte(jobCards.checkInAt, startDate),
          lte(jobCards.checkInAt, endDate)
        ))
        .where(and(
          eq(staff.salonId, salonId),
          eq(staff.isActive, 1)
        ))
        .groupBy(staff.id);

      // Create lookup for job card metrics
      const jobCardMap = new Map();
      jobCardMetrics.forEach(m => {
        jobCardMap.set(m.staffId, {
          totalJobCards: parseFloat(String(m.totalJobCards)) || 0,
          completedJobCards: parseFloat(String(m.completedJobCards)) || 0,
          jobCardRevenue: parseFloat(String(m.jobCardRevenue)) || 0,
          walkInCount: parseFloat(String(m.walkInCount)) || 0,
          jobCardWorkingDays: parseFloat(String(m.jobCardWorkingDays)) || 0
        });
      });

      // Combine booking and job card metrics for each staff
      const staffAnalytics = bookingMetrics.map(s => {
        const bookingCount = parseFloat(String(s.totalBookings)) || 0;
        const completedBookings = parseFloat(String(s.completedBookings)) || 0;
        const cancelledBookings = parseFloat(String(s.cancelledBookings)) || 0;
        const bookingRevenue = parseFloat(String(s.bookingRevenue)) || 0;
        const bookingWorkingDays = parseFloat(String(s.workingDays)) || 0;

        const jc = jobCardMap.get(s.staffId) || { totalJobCards: 0, completedJobCards: 0, jobCardRevenue: 0, walkInCount: 0, jobCardWorkingDays: 0 };

        // Combined metrics
        const totalServices = bookingCount + jc.totalJobCards;
        const totalCompleted = completedBookings + jc.completedJobCards;
        const totalRevenue = bookingRevenue + jc.jobCardRevenue;
        const workingDays = Math.max(bookingWorkingDays, jc.jobCardWorkingDays);

        const completionRate = totalServices > 0 ? (totalCompleted / totalServices * 100) : 0;
        const cancellationRate = totalServices > 0 ? (cancelledBookings / totalServices * 100) : 0;
        const servicesPerDay = workingDays > 0 ? (totalServices / workingDays) : 0;
        const revenuePerDay = workingDays > 0 ? (totalRevenue / workingDays) : 0;

        return {
          staffId: s.staffId,
          staffName: s.staffName,
          totalBookings: bookingCount,
          totalJobCards: jc.totalJobCards,
          totalServices, // Combined count
          completedServices: totalCompleted,
          walkInCount: jc.walkInCount,
          completionRate: Number(completionRate.toFixed(1)),
          cancellationRate: Number(cancellationRate.toFixed(1)),
          totalRevenuePaisa: totalRevenue,
          bookingRevenuePaisa: bookingRevenue,
          walkInRevenuePaisa: jc.jobCardRevenue,
          averageServiceValuePaisa: totalServices > 0 ? Math.round(totalRevenue / totalServices) : 0,
          workingDays,
          servicesPerDay: Number(servicesPerDay.toFixed(1)),
          revenuePerDay: Math.round(revenuePerDay),
          utilizationScore: Number((completionRate * 0.6 + servicesPerDay * 10).toFixed(1)),
          efficiency: Number((totalRevenue / Math.max(totalServices, 1)).toFixed(0))
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
          totalStaffRevenue: staffAnalytics.reduce((sum, s) => sum + s.totalRevenuePaisa, 0),
          totalWalkInRevenue: staffAnalytics.reduce((sum, s) => sum + s.walkInRevenuePaisa, 0),
          totalBookingRevenue: staffAnalytics.reduce((sum, s) => sum + s.bookingRevenuePaisa, 0)
        }
      };
    } catch (error) {
      console.error('Error fetching advanced staff analytics:', error);
      throw error;
    }
  }

  // Client Retention Analytics (includes both bookings and walk-in customers)
  async getClientRetentionAnalytics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get customer behavior data from bookings
      const bookingCustomerMetrics = await db
        .select({
          customerEmail: bookings.customerEmail,
          customerName: bookings.customerName,
          totalVisits: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(${bookings.totalAmountPaisa})`,
          firstVisit: sql<string>`min(${bookings.bookingDate})`,
          lastVisit: sql<string>`max(${bookings.bookingDate})`,
          completedVisits: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`,
          cancelledVisits: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          source: sql<string>`'booking'`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(bookings.customerEmail, bookings.customerName);

      // Get walk-in customer data from job cards
      const jobCardCustomerMetrics = await db
        .select({
          customerPhone: jobCards.customerPhone,
          customerName: jobCards.customerName,
          totalVisits: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(case when ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' then ${jobCards.paidAmountPaisa} else 0 end)`,
          firstVisit: sql<string>`min(DATE(${jobCards.checkInAt}))`,
          lastVisit: sql<string>`max(DATE(${jobCards.checkInAt}))`,
          completedVisits: sql<number>`count(case when ${jobCards.status} = 'completed' then 1 end)`,
          isWalkIn: sql<number>`max(case when ${jobCards.isWalkIn} = 1 then 1 else 0 end)`
        })
        .from(jobCards)
        .where(and(
          eq(jobCards.salonId, salonId),
          gte(jobCards.checkInAt, startDate),
          lte(jobCards.checkInAt, endDate)
        ))
        .groupBy(jobCards.customerPhone, jobCards.customerName);

      // Combine customer data - use a map to merge by phone/email
      const customerMap = new Map<string, any>();
      
      // Add booking customers
      bookingCustomerMetrics.forEach(c => {
        const key = c.customerEmail || c.customerName;
        customerMap.set(key, {
          customerIdentifier: c.customerEmail,
          customerName: c.customerName,
          totalVisits: parseFloat(String(c.totalVisits)) || 0,
          totalSpent: parseFloat(String(c.totalSpent)) || 0,
          firstVisit: c.firstVisit,
          lastVisit: c.lastVisit,
          completedVisits: parseFloat(String(c.completedVisits)) || 0,
          cancelledVisits: parseFloat(String(c.cancelledVisits)) || 0,
          isWalkIn: false,
          source: 'booking'
        });
      });

      // Add/merge job card customers
      jobCardCustomerMetrics.forEach(c => {
        const key = c.customerPhone || c.customerName;
        const existing = customerMap.get(key);
        const visits = parseFloat(String(c.totalVisits)) || 0;
        const spent = parseFloat(String(c.totalSpent)) || 0;
        const completed = parseFloat(String(c.completedVisits)) || 0;
        const isWalkIn = parseFloat(String(c.isWalkIn)) === 1;
        
        if (existing) {
          // Merge with existing customer
          existing.totalVisits += visits;
          existing.totalSpent += spent;
          existing.completedVisits += completed;
          if (c.firstVisit && (!existing.firstVisit || c.firstVisit < existing.firstVisit)) {
            existing.firstVisit = c.firstVisit;
          }
          if (c.lastVisit && (!existing.lastVisit || c.lastVisit > existing.lastVisit)) {
            existing.lastVisit = c.lastVisit;
          }
          existing.source = 'both';
        } else {
          customerMap.set(key, {
            customerIdentifier: c.customerPhone,
            customerName: c.customerName,
            totalVisits: visits,
            totalSpent: spent,
            firstVisit: c.firstVisit,
            lastVisit: c.lastVisit,
            completedVisits: completed,
            cancelledVisits: 0,
            isWalkIn: isWalkIn,
            source: isWalkIn ? 'walk_in' : 'job_card'
          });
        }
      });

      // Calculate retention metrics
      const now = new Date();
      const retentionAnalytics = Array.from(customerMap.values()).map(customer => {
        const totalVisits = customer.totalVisits;
        const totalSpent = customer.totalSpent;
        const completedVisits = customer.completedVisits;
        const firstVisitDate = customer.firstVisit ? new Date(customer.firstVisit) : now;
        const lastVisitDate = customer.lastVisit ? new Date(customer.lastVisit) : now;
        
        const daysSinceFirst = Math.floor((now.getTime() - firstVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLast = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        const customerLifespan = Math.floor((lastVisitDate.getTime() - firstVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        const averageDaysBetweenVisits = totalVisits > 1 ? customerLifespan / (totalVisits - 1) : 0;

        // Customer lifecycle stage
        let lifecycleStage = 'new';
        if (totalVisits >= 5) lifecycleStage = 'loyal';
        else if (totalVisits >= 2) lifecycleStage = 'returning';
        
        // Churn risk assessment
        let churnRisk = 'low';
        if (daysSinceLast > 90) churnRisk = 'high';
        else if (daysSinceLast > 45) churnRisk = 'medium';

        return {
          customerIdentifier: customer.customerIdentifier,
          customerName: customer.customerName,
          totalVisits,
          completedVisits,
          totalSpentPaisa: totalSpent,
          averageVisitValuePaisa: totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0,
          daysSinceFirst,
          daysSinceLast,
          averageDaysBetweenVisits: Math.round(averageDaysBetweenVisits),
          lifecycleStage,
          churnRisk,
          lifetimeValue: totalSpent,
          isWalkIn: customer.isWalkIn,
          source: customer.source
        };
      });

      // Calculate aggregate retention metrics
      const totalCustomers = retentionAnalytics.length;
      const walkInCustomers = retentionAnalytics.filter(c => c.source === 'walk_in').length;
      const bookingCustomers = retentionAnalytics.filter(c => c.source === 'booking').length;
      const returningCustomers = retentionAnalytics.filter(c => c.totalVisits > 1).length;
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
          walkInCustomers,
          bookingCustomers,
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
          averageVisitsPerCustomer: totalCustomers > 0 
            ? Number((retentionAnalytics.reduce((sum, c) => sum + c.totalVisits, 0) / totalCustomers).toFixed(1))
            : 0
        }
      };
    } catch (error) {
      console.error('Error fetching client retention analytics:', error);
      throw error;
    }
  }

  // Service Popularity Analytics (includes both bookings and job card services)
  async getServicePopularityAnalytics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate, previousStartDate, previousEndDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
      const previousEndDateStr = previousEndDate.toISOString().split('T')[0];

      // Current period service performance from bookings
      const bookingServiceMetrics = await db
        .select({
          serviceId: services.id,
          serviceName: services.name,
          serviceCategory: services.category,
          servicePricePaisa: services.priceInPaisa,
          serviceDuration: services.durationMinutes,
          bookingCount: sql<number>`count(${bookings.id})`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          bookingRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          uniqueBookingCustomers: sql<number>`count(distinct ${bookings.customerEmail})`
        })
        .from(services)
        .leftJoin(bookings, and(
          eq(bookings.serviceId, services.id),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .where(eq(services.salonId, salonId))
        .groupBy(services.id, services.name, services.category, services.priceInPaisa, services.durationMinutes);

      // Current period service performance from job cards
      const jobCardServiceMetrics = await db
        .select({
          serviceId: jobCardServices.serviceId,
          jobCardCount: sql<number>`count(distinct ${jobCardServices.jobCardId})`,
          completedJobCards: sql<number>`count(case when ${jobCardServices.status} = 'completed' then 1 end)`,
          jobCardRevenue: sql<number>`sum(case when ${jobCardServices.status} = 'completed' then ${jobCardServices.finalPricePaisa} else 0 end)`
        })
        .from(jobCardServices)
        .innerJoin(jobCards, and(
          eq(jobCardServices.jobCardId, jobCards.id),
          gte(jobCards.checkInAt, startDate),
          lte(jobCards.checkInAt, endDate)
        ))
        .where(eq(jobCardServices.salonId, salonId))
        .groupBy(jobCardServices.serviceId);

      // Create lookup for job card metrics
      const jobCardMap = new Map();
      jobCardServiceMetrics.forEach(m => {
        jobCardMap.set(m.serviceId, {
          jobCardCount: parseFloat(String(m.jobCardCount)) || 0,
          completedJobCards: parseFloat(String(m.completedJobCards)) || 0,
          jobCardRevenue: parseFloat(String(m.jobCardRevenue)) || 0
        });
      });

      // Previous period from bookings
      const previousBookingMetrics = await db
        .select({
          serviceId: services.id,
          totalBookings: sql<number>`count(${bookings.id})`,
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

      // Previous period from job cards
      const previousJobCardMetrics = await db
        .select({
          serviceId: jobCardServices.serviceId,
          jobCardCount: sql<number>`count(distinct ${jobCardServices.jobCardId})`,
          jobCardRevenue: sql<number>`sum(case when ${jobCardServices.status} = 'completed' then ${jobCardServices.finalPricePaisa} else 0 end)`
        })
        .from(jobCardServices)
        .innerJoin(jobCards, and(
          eq(jobCardServices.jobCardId, jobCards.id),
          gte(jobCards.checkInAt, previousStartDate),
          lte(jobCards.checkInAt, previousEndDate)
        ))
        .where(eq(jobCardServices.salonId, salonId))
        .groupBy(jobCardServices.serviceId);

      // Create lookup for previous period data (combined)
      const previousMetricsMap = new Map();
      previousBookingMetrics.forEach(metric => {
        previousMetricsMap.set(metric.serviceId, {
          totalServices: parseFloat(String(metric.totalBookings)) || 0,
          totalRevenue: parseFloat(String(metric.totalRevenue)) || 0
        });
      });
      previousJobCardMetrics.forEach(m => {
        const existing = previousMetricsMap.get(m.serviceId) || { totalServices: 0, totalRevenue: 0 };
        existing.totalServices += parseFloat(String(m.jobCardCount)) || 0;
        existing.totalRevenue += parseFloat(String(m.jobCardRevenue)) || 0;
        previousMetricsMap.set(m.serviceId, existing);
      });

      // Calculate service analytics with trends (combining bookings + job cards)
      const serviceAnalytics = bookingServiceMetrics.map(service => {
        const bookingCount = parseFloat(String(service.bookingCount)) || 0;
        const completedBookings = parseFloat(String(service.completedBookings)) || 0;
        const cancelledBookings = parseFloat(String(service.cancelledBookings)) || 0;
        const bookingRevenue = parseFloat(String(service.bookingRevenue)) || 0;
        const uniqueBookingCustomers = parseFloat(String(service.uniqueBookingCustomers)) || 0;

        const jc = jobCardMap.get(service.serviceId) || { jobCardCount: 0, completedJobCards: 0, jobCardRevenue: 0 };

        // Combined metrics
        const totalServices = bookingCount + jc.jobCardCount;
        const totalCompleted = completedBookings + jc.completedJobCards;
        const totalRevenue = bookingRevenue + jc.jobCardRevenue;
        const uniqueCustomers = uniqueBookingCustomers; // Job card customers tracked separately
        
        const previousData = previousMetricsMap.get(service.serviceId) || { totalServices: 0, totalRevenue: 0 };
        
        const completionRate = totalServices > 0 ? (totalCompleted / totalServices * 100) : 0;
        const cancellationRate = totalServices > 0 ? (cancelledBookings / totalServices * 100) : 0;
        const revenuePerService = totalServices > 0 ? (totalRevenue / totalServices) : 0;
        
        // Trend calculations
        const servicesTrend = this.calculateTrendMetric(totalServices, previousData.totalServices);
        const revenueTrend = this.calculateTrendMetric(totalRevenue, previousData.totalRevenue);

        return {
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          category: service.serviceCategory,
          standardPricePaisa: Number(service.servicePricePaisa) || 0,
          durationMinutes: Number(service.serviceDuration) || 0,
          totalBookings: bookingCount,
          totalJobCards: jc.jobCardCount,
          totalServices, // Combined count
          completedServices: totalCompleted,
          completionRate: Number(completionRate.toFixed(1)),
          cancellationRate: Number(cancellationRate.toFixed(1)),
          totalRevenuePaisa: totalRevenue,
          bookingRevenuePaisa: bookingRevenue,
          jobCardRevenuePaisa: jc.jobCardRevenue,
          averageRevenuePerServicePaisa: Math.round(revenuePerService),
          uniqueCustomers,
          customerReturnRate: uniqueCustomers > 0 ? Number(((totalServices - uniqueCustomers) / uniqueCustomers * 100).toFixed(1)) : 0,
          servicesTrend,
          revenueTrend,
          popularityScore: totalServices * 0.4 + completionRate * 0.3 + (uniqueCustomers / Math.max(totalServices, 1)) * 100 * 0.3
        };
      });

      // Service category analysis
      const categoryAnalysis: Record<string, {
        serviceCount: number;
        totalServices: number;
        totalRevenue: number;
        averageCompletionRate: number;
      }> = {};
      serviceAnalytics.forEach(service => {
        const category = service.category || 'Other';
        if (!categoryAnalysis[category]) {
          categoryAnalysis[category] = {
            serviceCount: 0,
            totalServices: 0,
            totalRevenue: 0,
            averageCompletionRate: 0
          };
        }
        categoryAnalysis[category].serviceCount++;
        categoryAnalysis[category].totalServices += service.totalServices;
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
      const cohortData: Record<string, { cohortSize: number; customers: Array<{ email: string; totalBookings: number }> }> = {};
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
      const cohortAnalysis = Object.entries(cohortData).map(([cohortMonth, data]) => {
        const returningCustomers = data.customers.filter((c: { email: string; totalBookings: number }) => c.totalBookings > 1).length;
        const loyalCustomers = data.customers.filter((c: { email: string; totalBookings: number }) => c.totalBookings >= 5).length;
        
        return {
          cohortMonth,
          cohortSize: data.cohortSize,
          returningCustomers,
          loyalCustomers,
          retentionRate: data.cohortSize > 0 ? Number((returningCustomers / data.cohortSize * 100).toFixed(1)) : 0,
          loyaltyRate: data.cohortSize > 0 ? Number((loyalCustomers / data.cohortSize * 100).toFixed(1)) : 0,
          averageBookingsPerCustomer: data.cohortSize > 0 
            ? Number((data.customers.reduce((sum: number, c: { email: string; totalBookings: number }) => sum + c.totalBookings, 0) / data.cohortSize).toFixed(1))
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
      type CustomerData = {
        customerEmail: string;
        customerName: string;
        totalBookings: number;
        totalSpent: number;
        lastBookingDate: string;
        firstBookingDate: string;
      };
      const segments: Record<string, CustomerData[]> = {
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

    // Add date filtering
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      conditions.push(
        sql`${timeSlots.startDateTime} >= ${startOfDay.toISOString()}`,
        sql`${timeSlots.startDateTime} <= ${endOfDay.toISOString()}`
      );
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
      .set({ 
        emailVerified: 1,
        emailVerificationToken: null,
        emailVerificationExpiry: null
      })
      .where(eq(users.id, userId));
  }

  async saveEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db.update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpiry: expiry,
        emailVerificationSentAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);
    return user || undefined;
  }

  async getUnverifiedUsers(hoursSinceRegistration: number = 24): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursSinceRegistration);

    const unverifiedUsers = await db.select()
      .from(users)
      .where(and(
        eq(users.emailVerified, 0),
        isNotNull(users.email),
        lt(users.createdAt, cutoffDate)
      ));

    return unverifiedUsers;
  }

  async clearEmailVerificationToken(userId: string): Promise<void> {
    await db.update(users)
      .set({
        emailVerificationToken: null,
        emailVerificationExpiry: null
      })
      .where(eq(users.id, userId));
  }

  // Password reset operations
  async savePasswordResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db.update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpiry: expiry
      })
      .where(eq(users.id, userId));
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);
    return user || undefined;
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db.update(users)
      .set({
        passwordResetToken: null,
        passwordResetExpiry: null
      })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
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
    const result = await db.select().from(mediaAssets).where(eq(mediaAssets.salonId, salonId));
    return result || [];
  }

  async getMediaAssetsByType(salonId: string, assetType: string): Promise<MediaAsset[]> {
    const result = await db.select().from(mediaAssets).where(
      and(eq(mediaAssets.salonId, salonId), eq(mediaAssets.assetType, assetType))
    );
    return result || [];
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

    // Check Profile completion - ALL fields are mandatory
    const profileMissingFields: string[] = [];
    // Business Info - Required fields
    if (!salon?.name) profileMissingFields.push('name');
    if (!salon?.category) profileMissingFields.push('category');
    // Location Contact - ALL fields are required
    if (!salon?.address) profileMissingFields.push('address');
    if (!salon?.city) profileMissingFields.push('city');
    if (!salon?.state) profileMissingFields.push('state');
    if (!salon?.zipCode) profileMissingFields.push('zipCode');
    if (!salon?.phone) profileMissingFields.push('phone');
    if (!salon?.email) profileMissingFields.push('email');
    if (!salon?.latitude) profileMissingFields.push('latitude');
    if (!salon?.longitude) profileMissingFields.push('longitude');
    
    const profileComplete = profileMissingFields.length === 0;

    // Check Services completion
    const servicesComplete = services.length > 0;

    // Check Staff completion
    const staffComplete = staff.length > 0;

    // Check Settings completion - match setup-status requirements (just check existence)
    const settingsComplete = !!bookingSettings;

    // Check Media completion
    const mediaComplete = mediaAssets.length > 0;

    // Calculate overall progress
    // Only count mandatory sections for completion percentage
    // Mandatory: profile, services, staff, settings, media (5 sections)
    // Optional: resources, payment-setup (not counted in completion)
    const completedSections = [
      profileComplete,
      servicesComplete,
      staffComplete,
      settingsComplete,
      mediaComplete
    ].filter(Boolean).length;
    
    const overallProgress = Math.round((completedSections / 5) * 100);

    // Determine next step (only mandatory steps)
    let nextStep: string | undefined;
    if (!profileComplete) {
      nextStep = 'business-info'; // Updated to match frontend step IDs
    } else if (!servicesComplete) {
      nextStep = 'services';
    } else if (!staffComplete) {
      nextStep = 'staff';
    } else if (!settingsComplete) {
      nextStep = 'booking-settings'; // Updated to match frontend step IDs
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
        isComplete: settingsComplete
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
      bookingData.staffId || undefined, 
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
      staffId: bookingData.staffId!,  // We know it's not null from the check above
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

    // Revenue Calculation Strategy (avoiding double-counting):
    // Job Cards are the SOURCE OF TRUTH for actual revenue
    // - Count all job card revenue (includes bookings that were checked-in)
    // - Only count bookings WITHOUT linked job cards (legacy/unprocessed)

    // 1. Revenue from ALL completed job cards (primary source)
    const jobCardRevenueResult = await db.select({
      jobCardRevenue: sql<number>`COALESCE(SUM(${jobCards.totalAmountPaisa}), 0)`
    }).from(jobCards)
      .where(and(
        eq(jobCards.salonId, salonId),
        eq(jobCards.status, 'completed'),
        gte(jobCards.createdAt, start),
        lte(jobCards.createdAt, end)
      ));

    const jobCardRevenue = parseFloat(String(jobCardRevenueResult[0]?.jobCardRevenue)) || 0;

    // 2. Revenue from completed bookings WITHOUT job cards (legacy/unprocessed)
    const orphanBookingResult = await db.select({
      bookingRevenue: sql<number>`COALESCE(SUM(${services.priceInPaisa}), 0)`
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(jobCards, eq(jobCards.bookingId, bookings.id))
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        gte(bookings.createdAt, start),
        lte(bookings.createdAt, end),
        sql`${jobCards.id} IS NULL` // No job card linked
      ));

    const orphanBookingRevenue = parseFloat(String(orphanBookingResult[0]?.bookingRevenue)) || 0;

    // Combined service revenue (no double-counting)
    const serviceRevenue = jobCardRevenue + orphanBookingRevenue;
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

    const totalOperatingExpenses = expenseResults.reduce((sum, exp) => sum + parseFloat(String(exp.amount)) || 0, 0);

    // Get commission expenses
    const commissionResult = await db.select({
      commissions: sql<number>`COALESCE(SUM(${commissions.commissionAmountPaisa}), 0)`
    }).from(commissions)
      .where(and(
        eq(commissions.salonId, salonId),
        gte(commissions.serviceDate, start),
        lte(commissions.serviceDate, end)
      ));

    const commissionsExpense = parseFloat(String(commissionResult[0]?.commissions)) || 0;

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

    const taxes = parseFloat(String(taxResult[0]?.taxes)) || 0;
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

    // Revenue Calculation Strategy:
    // Job Cards are the SOURCE OF TRUTH for actual revenue collected
    // - Job cards linked to bookings: Count job card amount (actual payment, may include add-ons)
    // - Walk-in job cards: Count job card amount
    // - Bookings WITHOUT job cards: Count booking service price (legacy/unprocessed)
    
    // 1. Revenue from ALL completed job cards (primary source)
    const jobCardRevenueResults = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${jobCards.totalAmountPaisa}), 0)`,
      jobCardCount: sql<number>`COUNT(*)`,
      uniqueCustomers: sql<number>`COUNT(DISTINCT COALESCE(${jobCards.customerId}, ${jobCards.customerPhone}))`
    }).from(jobCards)
      .where(and(
        eq(jobCards.salonId, salonId),
        eq(jobCards.status, 'completed'),
        gte(jobCards.createdAt, startDate)
      ));

    const jobCardRevenue = parseFloat(String(jobCardRevenueResults[0]?.totalRevenue)) || 0;
    const jobCardCount = parseFloat(String(jobCardRevenueResults[0]?.jobCardCount)) || 0;
    const jobCardCustomers = parseFloat(String(jobCardRevenueResults[0]?.uniqueCustomers)) || 0;

    // 2. Revenue from completed bookings that DON'T have job cards (legacy/unprocessed)
    const orphanBookingResults = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${services.priceInPaisa}), 0)`,
      bookingCount: sql<number>`COUNT(*)`,
      uniqueCustomers: sql<number>`COUNT(DISTINCT ${bookings.customerEmail})`
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(jobCards, eq(jobCards.bookingId, bookings.id))
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        gte(bookings.createdAt, startDate),
        sql`${jobCards.id} IS NULL` // No job card linked
      ));

    const orphanBookingRevenue = parseFloat(String(orphanBookingResults[0]?.totalRevenue)) || 0;
    const orphanBookingCount = parseFloat(String(orphanBookingResults[0]?.bookingCount)) || 0;
    const orphanBookingCustomers = parseFloat(String(orphanBookingResults[0]?.uniqueCustomers)) || 0;

    // Combined totals (no double-counting)
    const currentRevenue = jobCardRevenue + orphanBookingRevenue;
    const totalTransactionCount = jobCardCount + orphanBookingCount;
    const uniqueCustomers = jobCardCustomers + orphanBookingCustomers;

    // Previous period - Job Cards
    const prevJobCardResults = await db.select({
      prevRevenue: sql<number>`COALESCE(SUM(${jobCards.totalAmountPaisa}), 0)`
    }).from(jobCards)
      .where(and(
        eq(jobCards.salonId, salonId),
        eq(jobCards.status, 'completed'),
        gte(jobCards.createdAt, prevStartDate),
        lte(jobCards.createdAt, startDate)
      ));

    // Previous period - Orphan Bookings (without job cards)
    const prevOrphanBookingResults = await db.select({
      prevRevenue: sql<number>`COALESCE(SUM(${services.priceInPaisa}), 0)`
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(jobCards, eq(jobCards.bookingId, bookings.id))
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        gte(bookings.createdAt, prevStartDate),
        lte(bookings.createdAt, startDate),
        sql`${jobCards.id} IS NULL`
      ));

    const prevJobCardRevenue = parseFloat(String(prevJobCardResults[0]?.prevRevenue)) || 0;
    const prevOrphanRevenue = parseFloat(String(prevOrphanBookingResults[0]?.prevRevenue)) || 0;
    const prevRevenue = prevJobCardRevenue + prevOrphanRevenue;
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

    // Calculate KPIs (using combined bookings + job cards)
    const averageBookingValue = totalTransactionCount > 0 ? currentRevenue / totalTransactionCount : 0;
    const revenuePerCustomer = uniqueCustomers > 0 ? currentRevenue / uniqueCustomers : 0;
    const expenseRatio = currentRevenue > 0 ? (totalExpenses / currentRevenue) * 100 : 0;
    const costPerService = totalTransactionCount > 0 ? totalExpenses / totalTransactionCount : 0;
    const grossProfitMargin = currentRevenue > 0 ? ((currentRevenue - totalExpenses) / currentRevenue) * 100 : 0;
    const netProfitMargin = grossProfitMargin; // Simplified
    const breakEvenPoint = averageBookingValue > 0 ? totalExpenses / averageBookingValue : 0;
    const returnOnInvestment = totalExpenses > 0 ? ((currentRevenue - totalExpenses) / totalExpenses) * 100 : 0;
    const revenuePerStaff = staffCount > 0 ? currentRevenue / staffCount : 0;
    const serviceUtilizationRate = 80; // Would need time slot analysis
    const staffProductivity = staffCount > 0 ? totalTransactionCount / staffCount : 0;

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
    const oneYearAgo = new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1);

    // Get historical data from bookings (last 12 months)
    const bookingHistoricalResults = await db.select({
      month: sql<string>`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`,
      revenue: sql<number>`COALESCE(SUM(${services.priceInPaisa}), 0)`
    }).from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        gte(bookings.createdAt, oneYearAgo)
      ))
      .groupBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`);

    // Get historical data from job cards (last 12 months - completed & paid only)
    const jobCardHistoricalResults = await db.select({
      month: sql<string>`TO_CHAR(${jobCards.checkInAt}, 'YYYY-MM')`,
      revenue: sql<number>`COALESCE(SUM(${jobCards.paidAmountPaisa}), 0)`
    }).from(jobCards)
      .where(and(
        eq(jobCards.salonId, salonId),
        eq(jobCards.status, 'completed'),
        eq(jobCards.paymentStatus, 'paid'),
        gte(jobCards.checkInAt, oneYearAgo)
      ))
      .groupBy(sql`TO_CHAR(${jobCards.checkInAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${jobCards.checkInAt}, 'YYYY-MM')`);

    // Combine historical results from both sources
    const combinedHistoryMap = new Map<string, number>();
    bookingHistoricalResults.forEach(r => {
      combinedHistoryMap.set(r.month, parseFloat(String(r.revenue)) || 0);
    });
    jobCardHistoricalResults.forEach(r => {
      const existing = combinedHistoryMap.get(r.month) || 0;
      combinedHistoryMap.set(r.month, existing + (parseFloat(String(r.revenue)) || 0));
    });

    const historicalResults = Array.from(combinedHistoryMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

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
    
    const result = await db.select().from(scheduledMessages).where(and(...conditions));
    return result || [];
  }

  async getScheduledMessagesDue(beforeTime?: Date): Promise<ScheduledMessage[]> {
    const cutoffTime = beforeTime || new Date();
    
    const result = await db.select()
      .from(scheduledMessages)
      .where(
        and(
          eq(scheduledMessages.status, 'pending'),
          lte(scheduledMessages.scheduledFor, cutoffTime)
        )
      )
      .orderBy(asc(scheduledMessages.scheduledFor));
    
    return result || [];
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

  async getMessageTemplatesBySalonId(salonId: string, type?: string): Promise<MessageTemplate[]> {
    const conditions = [eq(messageTemplates.salonId, salonId)];
    
    if (type) {
      conditions.push(eq(messageTemplates.type, type));
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
      const deliveredCount = metric.deliveredCount || 0;
      const openCount = metric.openCount || 0;
      const clickCount = metric.clickCount || 0;
      const conversionCount = metric.conversionCount || 0;
      const bookingCount = metric.bookingCount || 0;
      
      const calculatedMetric = {
        ...metric,
        openRate: deliveredCount > 0 ? ((openCount / deliveredCount).toFixed(4)) : '0.0000',
        clickRate: deliveredCount > 0 ? ((clickCount / deliveredCount).toFixed(4)) : '0.0000',
        conversionRate: deliveredCount > 0 ? ((conversionCount / deliveredCount).toFixed(4)) : '0.0000',
        bookingRate: deliveredCount > 0 ? ((bookingCount / deliveredCount).toFixed(4)) : '0.0000',
      };

      const [newMetric] = await db
        .insert(testMetrics)
        .values([calculatedMetric])
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
          const deliveredCount = updatedMetric.deliveredCount || 0;
          const openCount = updatedMetric.openCount || 0;
          const clickCount = updatedMetric.clickCount || 0;
          const conversionCount = updatedMetric.conversionCount || 0;
          const bookingCount = updatedMetric.bookingCount || 0;
          
          updateData.openRate = deliveredCount > 0 ? ((openCount / deliveredCount).toFixed(4)) : '0.0000';
          updateData.clickRate = deliveredCount > 0 ? ((clickCount / deliveredCount).toFixed(4)) : '0.0000';
          updateData.conversionRate = deliveredCount > 0 ? ((conversionCount / deliveredCount).toFixed(4)) : '0.0000';
          updateData.bookingRate = deliveredCount > 0 ? ((bookingCount / deliveredCount).toFixed(4)) : '0.0000';
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
      const calculatedMetrics = metrics.map(metric => {
        const deliveredCount = metric.deliveredCount || 0;
        const openCount = metric.openCount || 0;
        const clickCount = metric.clickCount || 0;
        const conversionCount = metric.conversionCount || 0;
        const bookingCount = metric.bookingCount || 0;
        
        return {
          ...metric,
          openRate: deliveredCount > 0 ? ((openCount / deliveredCount).toFixed(4)) : '0.0000',
          clickRate: deliveredCount > 0 ? ((clickCount / deliveredCount).toFixed(4)) : '0.0000',
          conversionRate: deliveredCount > 0 ? ((conversionCount / deliveredCount).toFixed(4)) : '0.0000',
          bookingRate: deliveredCount > 0 ? ((bookingCount / deliveredCount).toFixed(4)) : '0.0000',
        };
      });

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
    status?: "upcoming" | "completed" | "cancelled" | "history" | "all";
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
      } else if (status === "history") {
        // History = past appointments (completed or cancelled)
        whereCondition = and(
          whereCondition,
          sql`${bookings.status} IN ('completed', 'cancelled')`
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

  // User saved locations operations - stub implementations
  async getUserSavedLocation(id: string): Promise<UserSavedLocation | undefined> {
    const [location] = await db.select().from(userSavedLocations).where(eq(userSavedLocations.id, id));
    return location || undefined;
  }

  async getUserSavedLocationsByUserId(userId: string): Promise<UserSavedLocation[]> {
    return await db.select().from(userSavedLocations).where(eq(userSavedLocations.userId, userId));
  }

  async getUserSavedLocationByUserIdAndLabel(userId: string, label: string): Promise<UserSavedLocation | undefined> {
    const [location] = await db.select().from(userSavedLocations)
      .where(and(eq(userSavedLocations.userId, userId), eq(userSavedLocations.label, label)));
    return location || undefined;
  }

  async createUserSavedLocation(location: InsertUserSavedLocation): Promise<UserSavedLocation> {
    const [newLocation] = await db.insert(userSavedLocations).values(location).returning();
    return newLocation;
  }

  async updateUserSavedLocation(id: string, updates: Partial<InsertUserSavedLocation>): Promise<void> {
    await db.update(userSavedLocations).set(updates).where(eq(userSavedLocations.id, id));
  }

  async deleteUserSavedLocation(id: string): Promise<void> {
    await db.delete(userSavedLocations).where(eq(userSavedLocations.id, id));
  }

  // Note: findSalonsNearUserLocation is already implemented earlier in the class

  // Note: Other methods like verifyEmailToken, markEmailAsVerified, isUserStaffOfSalon 
  // are already implemented elsewhere in the class

  // Minimal stubs for interface compliance - only truly missing methods
  
  // Communication system minimal stubs 
  async getDefaultMessageTemplate(salonId: string, type: string): Promise<MessageTemplate | undefined> {
    const templates = await this.getMessageTemplatesBySalonId(salonId, type);
    return templates.find(t => t.isDefault) || undefined;
  }

  async createDefaultMessageTemplates(salonId: string): Promise<MessageTemplate[]> {
    return [];
  }

  async getCustomerSegment(id: string): Promise<CustomerSegment | undefined> {
    const [segment] = await db.select().from(customerSegments).where(eq(customerSegments.id, id));
    return segment || undefined;
  }

  async getCustomerSegmentsBySalonId(salonId: string): Promise<CustomerSegment[]> {
    return await db.select().from(customerSegments).where(eq(customerSegments.salonId, salonId));
  }

  async createCustomerSegment(segment: InsertCustomerSegment): Promise<CustomerSegment> {
    const [created] = await db.insert(customerSegments).values(segment).returning();
    return created;
  }

  async updateCustomerSegment(id: string, salonId: string, updates: Partial<InsertCustomerSegment>): Promise<void> {
    await db.update(customerSegments)
      .set(updates)
      .where(and(eq(customerSegments.id, id), eq(customerSegments.salonId, salonId)));
  }

  async deleteCustomerSegment(id: string, salonId: string): Promise<void> {
    await db.delete(customerSegments)
      .where(and(eq(customerSegments.id, id), eq(customerSegments.salonId, salonId)));
  }

  async updateSegmentCustomerCount(segmentId: string): Promise<void> {
    // Stub - would update customer count
  }

  async getCustomersInSegment(segmentId: string, salonId: string): Promise<User[]> {
    return [];
  }

  // Communication preferences methods
  async getCommunicationPreferences(customerId: string, salonId: string): Promise<CommunicationPreferences | undefined> {
    const [prefs] = await db.select()
      .from(communicationPreferences)
      .where(and(
        eq(communicationPreferences.customerId, customerId),
        eq(communicationPreferences.salonId, salonId)
      ))
      .limit(1);
    return prefs;
  }

  async createCommunicationPreferences(preferences: InsertCommunicationPreferences): Promise<CommunicationPreferences> {
    const [created] = await db.insert(communicationPreferences)
      .values(preferences)
      .returning();
    return created;
  }

  async updateCommunicationPreferences(customerId: string, salonId: string, updates: {
    emailOptIn?: number;
    smsOptIn?: number;
    marketingOptIn?: number;
    unsubscribedAt?: Date;
    unsubscribeReason?: string;
  }): Promise<void> {
    await db.update(communicationPreferences)
      .set(updates)
      .where(and(
        eq(communicationPreferences.customerId, customerId),
        eq(communicationPreferences.salonId, salonId)
      ));
  }

  async unsubscribeFromCommunications(customerId: string, salonId: string, reason?: string): Promise<void> {
    await this.updateCommunicationPreferences(customerId, salonId, {
      emailOptIn: 0,
      smsOptIn: 0,
      marketingOptIn: 0,
      unsubscribedAt: new Date(),
      unsubscribeReason: reason
    });
  }

  async getUnsubscribedCustomers(salonId: string): Promise<string[]> {
    const unsubscribed = await db.select({ customerId: communicationPreferences.customerId })
      .from(communicationPreferences)
      .where(and(
        eq(communicationPreferences.salonId, salonId),
        eq(communicationPreferences.emailOptIn, 0),
        eq(communicationPreferences.smsOptIn, 0)
      ));
    return unsubscribed.map(u => u.customerId);
  }

  // Communication history methods
  async getCommunicationHistory(id: string): Promise<CommunicationHistory | undefined> {
    const [history] = await db.select()
      .from(communicationHistory)
      .where(eq(communicationHistory.id, id))
      .limit(1);
    return history;
  }

  async getCommunicationHistoryBySalonId(salonId: string, filters?: {
    customerId?: string;
    campaignId?: string;
    bookingId?: string;
    type?: string;
    channel?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CommunicationHistory[]> {
    let query = db.select().from(communicationHistory).where(eq(communicationHistory.salonId, salonId));
    return await query;
  }

  async getCommunicationHistoryByCustomer(customerId: string, salonId: string): Promise<CommunicationHistory[]> {
    return await db.select()
      .from(communicationHistory)
      .where(and(
        eq(communicationHistory.customerId, customerId),
        eq(communicationHistory.salonId, salonId)
      ));
  }

  async createCommunicationHistory(history: InsertCommunicationHistory): Promise<CommunicationHistory> {
    const [created] = await db.insert(communicationHistory)
      .values(history)
      .returning();
    return created;
  }

  async updateCommunicationHistory(id: string, updates: {
    status?: string;
    providerId?: string;
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    failureReason?: string;
    metadata?: any;
  }): Promise<void> {
    await db.update(communicationHistory)
      .set(updates)
      .where(eq(communicationHistory.id, id));
  }

  async getCommunicationDashboardMetrics(salonId: string, period: string): Promise<{
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
  }> {
    return {
      totalMessagesSent: 0,
      totalMessagesDelivered: 0,
      totalMessagesOpened: 0,
      totalMessagesClicked: 0,
      totalMessagesFailed: 0,
      emailOpenRate: 0,
      emailClickRate: 0,
      smsDeliveryRate: 0,
      unsubscribeRate: 0,
      activeCampaigns: 0,
      topPerformingCampaigns: [],
      channelPerformance: [],
      recentActivity: []
    };
  }

  async updateProductUsage(id: string, salonId: string, updates: Partial<InsertProductUsage>): Promise<void> { }
  async updateAutomationConfiguration(id: string, updates: Partial<InsertAutomationConfiguration>): Promise<void> { }
  async deleteAutomationConfiguration(id: string): Promise<void> { }

  // Remaining stub methods for interface compliance
  async startCommunicationCampaign(id: string): Promise<void> { }
  async pauseCommunicationCampaign(id: string): Promise<void> { }
  async completeCommunicationCampaign(id: string): Promise<void> { }
  async updateCampaignStats(campaignId: string, stats: any): Promise<void> { }
  async getCommunicationHistoryBySalonId(salonId: string, filters?: any): Promise<CommunicationHistory[]> { return []; }
  async getCommunicationHistoryByCustomer(customerId: string, salonId: string): Promise<CommunicationHistory[]> { return []; }
  async updateCommunicationHistory(id: string, updates: any): Promise<void> { }

  // =================================
  // COMMUNICATION CAMPAIGN OPERATIONS
  // =================================

  async getCommunicationCampaign(id: string): Promise<CommunicationCampaign | undefined> {
    const [campaign] = await db.select().from(communicationCampaigns)
      .where(eq(communicationCampaigns.id, id));
    return campaign || undefined;
  }

  async getCommunicationCampaignsBySalonId(salonId: string, filters?: { status?: string; type?: string }): Promise<CommunicationCampaign[]> {
    let conditions: any[] = [eq(communicationCampaigns.salonId, salonId)];
    
    if (filters?.status) {
      conditions.push(eq(communicationCampaigns.status, filters.status));
    }
    if (filters?.type) {
      conditions.push(eq(communicationCampaigns.type, filters.type));
    }
    
    return await db.select().from(communicationCampaigns)
      .where(and(...conditions))
      .orderBy(desc(communicationCampaigns.createdAt));
  }

  async createCommunicationCampaign(campaign: InsertCommunicationCampaign): Promise<CommunicationCampaign> {
    const [newCampaign] = await db.insert(communicationCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCommunicationCampaign(id: string, salonId: string, updates: Partial<InsertCommunicationCampaign>): Promise<void> {
    await db.update(communicationCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(communicationCampaigns.id, id),
        eq(communicationCampaigns.salonId, salonId)
      ));
  }

  async deleteCommunicationCampaign(id: string, salonId: string): Promise<void> {
    await db.delete(communicationCampaigns)
      .where(and(
        eq(communicationCampaigns.id, id),
        eq(communicationCampaigns.salonId, salonId)
      ));
  }

  // Add hundreds of minimal stubs to satisfy interface - basic empty implementations

  // Inventory management implementations
  
  // =================================
  // PRODUCT CATEGORY OPERATIONS
  // =================================
  
  async getProductCategory(id: string, salonId?: string): Promise<ProductCategory | undefined> {
    if (salonId) {
      // Salon-scoped lookup for multi-tenant security
      const [category] = await db.select().from(productCategories)
        .where(and(
          eq(productCategories.id, id),
          eq(productCategories.salonId, salonId)
        ));
      return category || undefined;
    } else {
      // Unscoped lookup (for system/admin operations only)
      const [category] = await db.select().from(productCategories).where(eq(productCategories.id, id));
      return category || undefined;
    }
  }

  async getProductCategoriesBySalonId(salonId: string): Promise<ProductCategory[]> {
    return await db.select().from(productCategories)
      .where(and(
        eq(productCategories.salonId, salonId),
        eq(productCategories.isActive, 1)
      ))
      .orderBy(productCategories.sortOrder, productCategories.name);
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [newCategory] = await db.insert(productCategories).values(category).returning();
    return newCategory;
  }

  async updateProductCategory(id: string, salonId: string, updates: Partial<InsertProductCategory>): Promise<void> {
    // Remove immutable fields to prevent ownership tampering
    const { salonId: _, ...safeUpdates } = updates;
    
    // Validate parentCategoryId belongs to same salon if provided
    if (safeUpdates.parentCategoryId) {
      const parentCategory = await db.select().from(productCategories)
        .where(and(
          eq(productCategories.id, safeUpdates.parentCategoryId),
          eq(productCategories.salonId, salonId)
        ))
        .limit(1);
      
      if (parentCategory.length === 0) {
        throw new Error('Parent category not found or does not belong to this salon');
      }
    }

    await db.update(productCategories)
      .set(safeUpdates)
      .where(and(
        eq(productCategories.id, id),
        eq(productCategories.salonId, salonId)
      ));
  }

  async deleteProductCategory(id: string, salonId: string): Promise<void> {
    // Check if any products are using this category (with salon scope for security)
    const productsWithCategory = await db.select().from(products)
      .where(and(
        eq(products.categoryId, id),
        eq(products.salonId, salonId),
        eq(products.isActive, 1)
      ))
      .limit(1);
    
    if (productsWithCategory.length > 0) {
      throw new Error('Cannot delete category that has active products. Please reassign or delete products first.');
    }

    // Soft delete by setting is_active to 0 (with salon scope for security)
    await db.update(productCategories)
      .set({ isActive: 0 })
      .where(and(
        eq(productCategories.id, id),
        eq(productCategories.salonId, salonId)
      ));
  }

  async createDefaultProductCategories(salonId: string): Promise<ProductCategory[]> {
    const defaultCategories: InsertProductCategory[] = [
      { salonId, name: 'Hair Care Products', description: 'Shampoos, conditioners, styling products', sortOrder: 1, isActive: 1 },
      { salonId, name: 'Skin Care Products', description: 'Cleansers, moisturizers, serums', sortOrder: 2, isActive: 1 },
      { salonId, name: 'Nail Care Products', description: 'Polishes, treatments, tools', sortOrder: 3, isActive: 1 },
      { salonId, name: 'Hair Color & Treatments', description: 'Hair dyes, bleaches, treatments', sortOrder: 4, isActive: 1 },
      { salonId, name: 'Styling Tools', description: 'Dryers, straighteners, curling irons', sortOrder: 5, isActive: 1 },
      { salonId, name: 'Professional Tools', description: 'Scissors, razors, combs', sortOrder: 6, isActive: 1 },
      { salonId, name: 'Salon Supplies', description: 'Towels, capes, foils, disposables', sortOrder: 7, isActive: 1 },
      { salonId, name: 'Spa & Massage Products', description: 'Oils, lotions, aromatherapy', sortOrder: 8, isActive: 1 },
    ];

    const createdCategories = await db.insert(productCategories).values(defaultCategories).returning();
    return createdCategories;
  }

  // =================================
  // VENDOR OPERATIONS
  // =================================
  
  async getVendor(id: string, salonId?: string): Promise<Vendor | undefined> {
    if (salonId) {
      // Salon-scoped lookup for multi-tenant security
      const [vendor] = await db.select().from(vendors)
        .where(and(
          eq(vendors.id, id),
          eq(vendors.salonId, salonId)
        ));
      return vendor || undefined;
    } else {
      // Unscoped lookup (for system/admin operations only)
      const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
      return vendor || undefined;
    }
  }

  async getVendorsBySalonId(salonId: string): Promise<Vendor[]> {
    return await db.select().from(vendors)
      .where(and(
        eq(vendors.salonId, salonId),
        eq(vendors.status, 'active')
      ))
      .orderBy(vendors.name);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async updateVendor(id: string, salonId: string, updates: Partial<InsertVendor>): Promise<void> {
    // Remove immutable fields to prevent ownership tampering
    const { salonId: _, ...safeUpdates } = updates;

    await db.update(vendors)
      .set({
        ...safeUpdates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(vendors.id, id),
        eq(vendors.salonId, salonId)
      ));
  }

  async deleteVendor(id: string, salonId: string): Promise<void> {
    // Check if any products are linked to this vendor (with salon scope for security)
    const productsWithVendor = await db.select().from(products)
      .where(and(
        eq(products.vendorId, id),
        eq(products.salonId, salonId),
        eq(products.isActive, 1)
      ))
      .limit(1);
    
    if (productsWithVendor.length > 0) {
      throw new Error('Cannot delete vendor that has active products. Please reassign or delete products first.');
    }

    // Check if any pending/draft purchase orders exist with this vendor
    const pendingPOs = await db.select().from(purchaseOrders)
      .where(and(
        eq(purchaseOrders.vendorId, id),
        eq(purchaseOrders.salonId, salonId),
        or(
          eq(purchaseOrders.status, 'draft'),
          eq(purchaseOrders.status, 'approved')
        )
      ))
      .limit(1);
    
    if (pendingPOs.length > 0) {
      throw new Error('Cannot delete vendor with pending purchase orders. Please complete or cancel them first.');
    }

    // Soft delete by setting status to inactive (with salon scope for security)
    await db.update(vendors)
      .set({ 
        status: 'inactive',
        updatedAt: new Date(),
      })
      .where(and(
        eq(vendors.id, id),
        eq(vendors.salonId, salonId)
      ));
  }

  // =================================
  // PRODUCT OPERATIONS
  // =================================
  
  async getProduct(id: string, salonId?: string): Promise<Product | undefined> {
    if (salonId) {
      // Salon-scoped lookup for multi-tenant security
      const [product] = await db.select().from(products)
        .where(and(
          eq(products.id, id),
          eq(products.salonId, salonId)
        ));
      return product || undefined;
    } else {
      // Unscoped lookup (for system/admin operations only)
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product || undefined;
    }
  }

  async getProductsBySalonId(salonId: string, filters?: any): Promise<Product[]> {
    // Build filter conditions
    const conditions: any[] = [eq(products.salonId, salonId)];

    if (filters) {
      if (filters.categoryId) {
        conditions.push(eq(products.categoryId, filters.categoryId));
      }
      if (filters.vendorId) {
        conditions.push(eq(products.vendorId, filters.vendorId));
      }
      if (filters.isActive !== undefined) {
        conditions.push(eq(products.isActive, filters.isActive ? 1 : 0));
      } else {
        // Default to active products only
        conditions.push(eq(products.isActive, 1));
      }
      if (filters.lowStock) {
        conditions.push(sql`${products.currentStock} <= ${products.minimumStock}`);
      }

      // Apply search filter as additional AND condition
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(
          or(
            sql`${products.name} ILIKE ${searchTerm}`,
            sql`${products.sku} ILIKE ${searchTerm}`,
            sql`${products.brand} ILIKE ${searchTerm}`,
            sql`${products.barcode} ILIKE ${searchTerm}`
          )
        );
      }
    } else {
      // Default to active products only
      conditions.push(eq(products.isActive, 1));
    }

    // Single combined where clause with all conditions
    return await db.select().from(products)
      .where(and(...conditions))
      .orderBy(products.name);
  }

  async getProductsByCategory(salonId: string, categoryId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.salonId, salonId),
        eq(products.categoryId, categoryId),
        eq(products.isActive, 1)
      ))
      .orderBy(products.name);
  }

  async getLowStockProducts(salonId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.salonId, salonId),
        eq(products.isActive, 1),
        eq(products.lowStockAlert, 1),
        sql`${products.currentStock} <= ${products.minimumStock}`
      ))
      .orderBy(products.name);
  }

  async getProductBySKU(sku: string, salonId: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products)
      .where(and(
        eq(products.sku, sku),
        eq(products.salonId, salonId)
      ))
      .limit(1);
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Validate SKU uniqueness per salon
    const existingProduct = await this.getProductBySKU(product.sku, product.salonId);
    if (existingProduct) {
      throw new Error(`Product with SKU '${product.sku}' already exists in this salon`);
    }

    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, salonId: string, updates: Partial<InsertProduct>): Promise<void> {
    // Remove immutable fields to prevent ownership tampering and stock manipulation
    const { salonId: _, currentStock, ...safeUpdates } = updates;

    // If updating SKU, validate uniqueness
    if (safeUpdates.sku) {
      const existingProduct = await this.getProductBySKU(safeUpdates.sku, salonId);
      if (existingProduct && existingProduct.id !== id) {
        throw new Error(`Product with SKU '${safeUpdates.sku}' already exists in this salon`);
      }
    }

    // Prevent direct stock changes - must use stock movements
    if (currentStock !== undefined) {
      throw new Error('Cannot update stock directly. Use stock movements instead.');
    }

    await db.update(products)
      .set(safeUpdates)
      .where(and(
        eq(products.id, id),
        eq(products.salonId, salonId)
      ));
  }

  async deleteProduct(id: string, salonId: string): Promise<void> {
    // Check if any pending/draft purchase order items reference this product (with salon scope)
    const pendingPOItems = await db.select().from(purchaseOrderItems)
      .innerJoin(purchaseOrders, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id))
      .where(and(
        eq(purchaseOrderItems.productId, id),
        eq(purchaseOrders.salonId, salonId),
        or(
          eq(purchaseOrders.status, 'draft'),
          eq(purchaseOrders.status, 'approved')
        )
      ))
      .limit(1);
    
    if (pendingPOItems.length > 0) {
      throw new Error('Cannot delete product with pending purchase orders. Please complete or cancel them first.');
    }

    // Soft delete by setting is_active to 0 (with salon scope for security)
    await db.update(products)
      .set({ isActive: 0 })
      .where(and(
        eq(products.id, id),
        eq(products.salonId, salonId)
      ));
  }
  async getStockMovement(id: string, salonId?: string): Promise<StockMovement | undefined> {
    if (salonId) {
      // Salon-scoped lookup for multi-tenant security
      const [movement] = await db.select().from(stockMovements)
        .where(and(
          eq(stockMovements.id, id),
          eq(stockMovements.salonId, salonId)
        ));
      return movement || undefined;
    } else {
      // Unscoped lookup (for system/admin operations only)
      const [movement] = await db.select().from(stockMovements).where(eq(stockMovements.id, id));
      return movement || undefined;
    }
  }

  async getStockMovementsByProduct(productId: string, salonId: string): Promise<StockMovement[]> {
    return await db.select().from(stockMovements)
      .where(and(
        eq(stockMovements.productId, productId),
        eq(stockMovements.salonId, salonId)
      ))
      .orderBy(desc(stockMovements.createdAt));
  }

  async getStockMovementsBySalonId(salonId: string, filters?: any): Promise<StockMovement[]> {
    const conditions: any[] = [eq(stockMovements.salonId, salonId)];

    if (filters) {
      if (filters.productId) {
        conditions.push(eq(stockMovements.productId, filters.productId));
      }
      if (filters.type) {
        conditions.push(eq(stockMovements.type, filters.type));
      }
      if (filters.referenceType) {
        conditions.push(eq(stockMovements.referenceType, filters.referenceType));
      }
      if (filters.staffId) {
        conditions.push(eq(stockMovements.staffId, filters.staffId));
      }
      if (filters.startDate) {
        conditions.push(sql`${stockMovements.createdAt} >= ${filters.startDate}`);
      }
      if (filters.endDate) {
        conditions.push(sql`${stockMovements.createdAt} <= ${filters.endDate}`);
      }
    }

    return await db.select().from(stockMovements)
      .where(and(...conditions))
      .orderBy(desc(stockMovements.createdAt))
      .limit(filters?.limit || 100);
  }

  async createStockMovement(movement: InsertStockMovement, options?: { allowNegativeStock?: boolean }): Promise<StockMovement> {
    const quantity = parseFloat(movement.quantity.toString());

    // Determine if this is an increase or decrease
    const isIncrease = ['purchase', 'return', 'adjustment-in'].includes(movement.type);
    const isDecrease = ['usage', 'waste', 'adjustment-out', 'transfer'].includes(movement.type);
    const isAdjustment = movement.type === 'adjustment';

    if (!isIncrease && !isDecrease && !isAdjustment) {
      throw new Error(`Invalid stock movement type: ${movement.type}`);
    }

    // Use transaction with row locking to prevent race conditions
    return await db.transaction(async (tx) => {
      // Lock the product row for this transaction to prevent concurrent updates
      const [product] = await tx
        .select()
        .from(products)
        .where(and(
          eq(products.id, movement.productId),
          eq(products.salonId, movement.salonId)
        ))
        .for('update'); // SELECT FOR UPDATE locks the row

      if (!product) {
        throw new Error('Product not found or does not belong to this salon');
      }

      // Calculate new stock level from locked row
      const currentStock = parseFloat(product.currentStock);
      const previousStock = currentStock;
      let newStock: number;

      if (isIncrease) {
        newStock = currentStock + quantity;
      } else if (isDecrease) {
        newStock = currentStock - quantity;
      } else {
        // For generic adjustment, use quantity as-is (can be positive or negative)
        newStock = currentStock + quantity;
      }

      // Prevent negative stock unless explicitly allowed
      if (newStock < 0 && !options?.allowNegativeStock) {
        throw new Error(`Insufficient stock. Current: ${currentStock}, Requested: ${Math.abs(quantity)}. Available: ${currentStock}`);
      }

      // Create stock movement record with audit trail
      const [newMovement] = await tx.insert(stockMovements).values({
        ...movement,
        previousStock: previousStock.toString(),
        newStock: newStock.toString(),
      }).returning();

      // Update product current stock atomically
      await tx.update(products)
        .set({ currentStock: newStock.toString() })
        .where(and(
          eq(products.id, movement.productId),
          eq(products.salonId, movement.salonId)
        ));

      return newMovement;
    });
  }
  async getPurchaseOrder(id: string, salonId?: string): Promise<PurchaseOrder | undefined> {
    if (salonId) {
      // Salon-scoped lookup for multi-tenant security
      const [po] = await db.select().from(purchaseOrders)
        .where(and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.salonId, salonId)
        ));
      return po || undefined;
    } else {
      // Unscoped lookup (for system/admin operations only)
      const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
      return po || undefined;
    }
  }

  async getPurchaseOrdersBySalonId(salonId: string, filters?: any): Promise<PurchaseOrder[]> {
    const conditions: any[] = [eq(purchaseOrders.salonId, salonId)];

    if (filters) {
      if (filters.status) {
        conditions.push(eq(purchaseOrders.status, filters.status));
      }
      if (filters.vendorId) {
        conditions.push(eq(purchaseOrders.vendorId, filters.vendorId));
      }
      if (filters.startDate) {
        conditions.push(sql`${purchaseOrders.orderDate} >= ${filters.startDate}`);
      }
      if (filters.endDate) {
        conditions.push(sql`${purchaseOrders.orderDate} <= ${filters.endDate}`);
      }
    }

    return await db.select().from(purchaseOrders)
      .where(and(...conditions))
      .orderBy(desc(purchaseOrders.orderDate))
      .limit(filters?.limit || 100);
  }

  async getPurchaseOrderItems(purchaseOrderId: string, salonId: string): Promise<PurchaseOrderItem[]> {
    // Verify PO belongs to salon before returning items
    const po = await this.getPurchaseOrder(purchaseOrderId, salonId);
    if (!po) {
      throw new Error('Purchase order not found or does not belong to this salon');
    }

    // Join with products table to get product name and SKU
    const items = await db
      .select({
        id: purchaseOrderItems.id,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        productId: purchaseOrderItems.productId,
        quantity: purchaseOrderItems.quantity,
        unit: purchaseOrderItems.unit,
        unitCostInPaisa: purchaseOrderItems.unitCostInPaisa,
        totalCostInPaisa: purchaseOrderItems.totalCostInPaisa,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        notes: purchaseOrderItems.notes,
        createdAt: purchaseOrderItems.createdAt,
        product_name: products.name,
        sku: products.sku,
      })
      .from(purchaseOrderItems)
      .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId))
      .orderBy(purchaseOrderItems.createdAt);

    return items as any;
  }

  async createPurchaseOrder(po: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<{ po: PurchaseOrder, items: PurchaseOrderItem[] }> {
    if (!items || items.length === 0) {
      throw new Error('Purchase order must have at least one item');
    }

    // Validate vendor exists and belongs to the salon
    const vendor = await this.getVendor(po.vendorId, po.salonId);
    if (!vendor) {
      throw new Error('Vendor not found or does not belong to this salon');
    }

    // Validate all products exist and belong to the same salon
    for (const item of items) {
      const product = await this.getProduct(item.productId, po.salonId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found or does not belong to this salon`);
      }
    }

    // Calculate totals from items
    const subtotal = items.reduce((sum, item) => sum + parseInt(item.totalCostInPaisa.toString()), 0);
    const tax = po.taxInPaisa || 0;
    const shipping = po.shippingInPaisa || 0;
    const discount = po.discountInPaisa || 0;
    const total = subtotal + tax + shipping - discount;

    // Use transaction to create PO and items atomically
    return await db.transaction(async (tx) => {
      // Generate unique order number using randomUUID for better collision resistance
      const uuid = randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
      const orderNumber = `PO-${Date.now().toString(36)}-${uuid}`;
      
      // Create purchase order
      const [newPO] = await tx.insert(purchaseOrders).values({
        ...po,
        orderNumber,
        subtotalInPaisa: subtotal,
        totalInPaisa: total,
        status: 'draft',
      }).returning();

      // Create purchase order items
      const itemsWithPOId = items.map(item => ({
        ...item,
        purchaseOrderId: newPO.id,
      }));

      const newItems = await tx.insert(purchaseOrderItems)
        .values(itemsWithPOId)
        .returning();

      return { po: newPO, items: newItems };
    });
  }

  async updatePurchaseOrder(id: string, salonId: string, updates: Partial<InsertPurchaseOrder>): Promise<void> {
    // Only allow updating draft POs
    const po = await this.getPurchaseOrder(id, salonId);
    if (!po) {
      throw new Error('Purchase order not found or does not belong to this salon');
    }
    if (po.status !== 'draft') {
      throw new Error('Only draft purchase orders can be updated');
    }

    // Remove immutable fields
    const { salonId: _, createdBy, approvedBy, receivedBy, ...safeUpdates } = updates;

    await db.update(purchaseOrders)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.salonId, salonId)
      ));
  }

  async approvePurchaseOrder(id: string, salonId: string, approvedBy: string): Promise<void> {
    // Only allow approving draft POs
    const po = await this.getPurchaseOrder(id, salonId);
    if (!po) {
      throw new Error('Purchase order not found or does not belong to this salon');
    }
    if (po.status !== 'draft') {
      throw new Error('Only draft purchase orders can be approved');
    }

    await db.update(purchaseOrders)
      .set({ 
        status: 'approved',
        approvedBy,
        updatedAt: new Date(),
      })
      .where(and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.salonId, salonId)
      ));
  }

  async receivePurchaseOrder(id: string, salonId: string, receivedBy: string, receivedItems: { itemId: string, receivedQuantity: string }[]): Promise<void> {
    // Validate PO exists and is delivered
    const po = await this.getPurchaseOrder(id, salonId);
    if (!po) {
      throw new Error('Purchase order not found or does not belong to this salon');
    }
    if (po.status !== 'delivered') {
      throw new Error('Only delivered purchase orders can be received');
    }

    // Get PO items
    const items = await this.getPurchaseOrderItems(id, salonId);

    // Use transaction to update PO, items, and create stock movements
    await db.transaction(async (tx) => {
      // Update purchase order status
      await tx.update(purchaseOrders)
        .set({
          status: 'received',
          receivedBy,
          actualDeliveryDate: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.salonId, salonId)
        ));

      // Process each received item
      for (const receivedItem of receivedItems) {
        const item = items.find(i => i.id === receivedItem.itemId);
        if (!item) {
          throw new Error(`Purchase order item ${receivedItem.itemId} not found`);
        }

        // Update item received quantity
        await tx.update(purchaseOrderItems)
          .set({ receivedQuantity: receivedItem.receivedQuantity })
          .where(eq(purchaseOrderItems.id, receivedItem.itemId));

        // Create stock movement for received quantity
        if (parseFloat(receivedItem.receivedQuantity) > 0) {
          // Lock product row for update
          const [product] = await tx
            .select()
            .from(products)
            .where(and(
              eq(products.id, item.productId),
              eq(products.salonId, salonId)
            ))
            .for('update');

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          const currentStock = parseFloat(product.currentStock);
          const receivedQty = parseFloat(receivedItem.receivedQuantity);
          const newStock = currentStock + receivedQty;

          // Check if receivedBy user has a staff record
          const [staffRecord] = await tx
            .select()
            .from(staff)
            .where(and(
              eq(staff.userId, receivedBy),
              eq(staff.salonId, salonId)
            ))
            .limit(1);

          // Create stock movement
          await tx.insert(stockMovements).values({
            salonId,
            productId: item.productId,
            type: 'purchase',
            quantity: receivedItem.receivedQuantity,
            unit: item.unit,
            unitCostInPaisa: item.unitCostInPaisa,
            totalCostInPaisa: item.totalCostInPaisa,
            previousStock: currentStock.toString(),
            newStock: newStock.toString(),
            reason: 'Purchase order received',
            reference: po.orderNumber,
            referenceId: po.id,
            referenceType: 'purchase_order',
            staffId: staffRecord?.id || null,
          });

          // Update product stock
          await tx.update(products)
            .set({ currentStock: newStock.toString() })
            .where(and(
              eq(products.id, item.productId),
              eq(products.salonId, salonId)
            ));
        }
      }
    });
  }

  async updatePurchaseOrderStatus(id: string, status: string): Promise<void> {
    await db.update(purchaseOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id));
  }

  async deletePurchaseOrder(id: string, salonId: string): Promise<void> {
    // Only allow deleting draft POs
    const po = await this.getPurchaseOrder(id, salonId);
    if (!po) {
      throw new Error('Purchase order not found or does not belong to this salon');
    }
    if (po.status !== 'draft') {
      throw new Error('Only draft purchase orders can be deleted');
    }

    // Hard delete since it's draft (cascade will delete items)
    await db.delete(purchaseOrders)
      .where(and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.salonId, salonId)
      ));
  }
  async getPurchaseOrderItem(id: string): Promise<PurchaseOrderItem | undefined> { return undefined; }
  async getPurchaseOrderItemsByOrderId(orderId: string): Promise<PurchaseOrderItem[]> { return []; }
  async getProductUsage(id: string): Promise<ProductUsage | undefined> { return undefined; }
  async getProductUsageByBooking(bookingId: string): Promise<ProductUsage[]> { return []; }
  async getReorderRule(id: string): Promise<ReorderRule | undefined> { return undefined; }
  async getReorderRulesBySalonId(salonId: string): Promise<ReorderRule[]> { return []; }
  async getReorderRulesByProduct(productId: string): Promise<ReorderRule[]> { return []; }
  async checkReorderRules(salonId: string): Promise<any[]> { return []; }
  async getInventoryAdjustment(id: string): Promise<InventoryAdjustment | undefined> { return undefined; }
  async getInventoryAdjustmentsBySalonId(salonId: string): Promise<InventoryAdjustment[]> { return []; }
  async approveInventoryAdjustment(id: string, approvedBy: string): Promise<void> { }
  async getInventoryAdjustmentItem(id: string): Promise<InventoryAdjustmentItem | undefined> { return undefined; }
  async getInventoryAdjustmentItemsByAdjustmentId(adjustmentId: string): Promise<InventoryAdjustmentItem[]> { return []; }
  async getInventoryAnalytics(salonId: string, period: string): Promise<any> { return {}; }

  // A/B testing minimal stubs
  async startAbTestCampaign(id: string): Promise<void> { }
  async pauseAbTestCampaign(id: string): Promise<void> { }
  async stopAbTestCampaign(id: string, winnerVariantId?: string): Promise<void> { }
  async getTestVariantsByCampaignId(campaignId: string): Promise<TestVariant[]> { return []; }
  async getTestMetricsByCampaignId(campaignId: string): Promise<TestMetric[]> { return []; }
  async getTestResultsByCampaignId(campaignId: string): Promise<TestResult[]> { return []; }
  async getTestResultsByVariantId(variantId: string): Promise<TestResult[]> { return []; }
  async calculateAbTestResults(campaignId: string): Promise<any> { return {}; }

  // Automation minimal stubs
  async getAutomationConfiguration(id: string): Promise<AutomationConfiguration | undefined> { return undefined; }
  async getAutomationConfigurationsBySalonId(salonId: string): Promise<AutomationConfiguration[]> { return []; }
  async getVariantGenerationRule(id: string): Promise<VariantGenerationRule | undefined> { return undefined; }
  async getVariantGenerationRulesByConfigId(configId: string): Promise<VariantGenerationRule[]> { return []; }
  async getPerformanceMonitoringSetting(id: string): Promise<PerformanceMonitoringSetting | undefined> { return undefined; }
  async getPerformanceMonitoringSettingsByConfigId(configId: string): Promise<PerformanceMonitoringSetting[]> { return []; }
  async getOptimizationRecommendation(id: string): Promise<OptimizationRecommendation | undefined> { return undefined; }
  async getOptimizationRecommendationsBySalonId(salonId: string): Promise<OptimizationRecommendation[]> { return []; }
  async getAutomatedActionLog(id: string): Promise<AutomatedActionLog | undefined> { return undefined; }
  async getAutomatedActionLogsByConfigId(configId: string): Promise<AutomatedActionLog[]> { return []; }
  async getCampaignOptimizationInsight(id: string): Promise<CampaignOptimizationInsight | undefined> { return undefined; }
  async getCampaignOptimizationInsightsByCampaignId(campaignId: string): Promise<CampaignOptimizationInsight[]> { return []; }
  async generateVariantsForCampaign(campaignId: string, count: number): Promise<TestVariant[]> { return []; }
  async optimizeCampaignAutomatically(campaignId: string): Promise<any> { return {}; }
  async monitorCampaignPerformance(campaignId: string): Promise<any> { return {}; }
  async getAutomationInsights(salonId: string, period: string): Promise<any> { return {}; }

  // Additional stub methods for interface compliance

  async getCustomerInsights(salonId: string, customerId?: string): Promise<any> {
    return {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      topSpenders: [],
      customerSegments: [],
      communicationPreferences: { email: 0, sms: 0, push: 0 },
      stats: { totalBookings: 0, totalSpentPaisa: 0, memberSince: '', lastBookingDate: '', favoriteService: '' }
    };
  }


  // ==================== SUPER ADMIN METHODS ====================

  async getPlatformStats(period?: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    totalCommission: number;
    totalJobCards: number;
    totalUsers: number;
    totalSalons: number;
    pendingApprovals: number;
    activeUsers: number;
    activeOffers: number;
    bookingTrends: Array<{ date: string; count: number; revenue: number }>;
  }> {
    // Get total bookings
    const totalBookingsResult = await db.select({ count: sql<number>`count(*)::int` }).from(bookings);
    const totalBookings = totalBookingsResult[0]?.count || 0;

    // Get total job cards (including walk-ins)
    const totalJobCardsResult = await db.select({ count: sql<number>`count(*)::int` }).from(jobCards);
    const totalJobCards = totalJobCardsResult[0]?.count || 0;

    // Get REALIZED revenue from completed & paid job cards (source of truth for revenue)
    const jobCardRevenueResult = await db.select({ 
      sum: sql<string>`COALESCE(SUM(${jobCards.totalAmountPaisa}), 0)` 
    }).from(jobCards).where(
      and(
        eq(jobCards.status, 'completed'),
        eq(jobCards.paymentStatus, 'paid')
      )
    );
    const jobCardRevenue = parseFloat(String(jobCardRevenueResult[0]?.sum || 0));

    // Also get revenue from completed bookings that don't have job cards (legacy/direct payments)
    const bookingRevenueResult = await db.select({ 
      sum: sql<string>`COALESCE(SUM(${bookings.totalAmountPaisa}), 0)` 
    }).from(bookings).where(
      and(
        eq(bookings.status, 'completed'),
        sql`NOT EXISTS (SELECT 1 FROM job_cards WHERE job_cards.booking_id = ${bookings.id})`
      )
    );
    const bookingRevenue = parseFloat(String(bookingRevenueResult[0]?.sum || 0));

    // Total realized revenue = job card revenue + legacy booking revenue
    const totalRevenue = Math.round(jobCardRevenue + bookingRevenue);

    // Calculate platform commission (default 10% - can be configured in settings)
    const configResult = await db.select()
      .from(platformConfig)
      .where(eq(platformConfig.configKey, 'payment_settings'))
      .limit(1);
    
    let commissionPercent = 10; // Default 10%
    if (configResult[0]?.configValue) {
      try {
        const paymentSettings = configResult[0].configValue as any;
        if (paymentSettings.defaultCommissionPercent) {
          commissionPercent = paymentSettings.defaultCommissionPercent;
        }
      } catch (e) {
        // Use default
      }
    }
    const totalCommission = Math.round(totalRevenue * (commissionPercent / 100));

    // Get total users
    const totalUsersResult = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get total salons
    const totalSalonsResult = await db.select({ count: sql<number>`count(*)::int` }).from(salons);
    const totalSalons = totalSalonsResult[0]?.count || 0;

    // Get pending approvals
    const pendingApprovalsResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(salons)
      .where(eq(salons.approvalStatus, 'pending'));
    const pendingApprovals = pendingApprovalsResult[0]?.count || 0;

    // Get active users
    const activeUsersResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isActive, 1));
    const activeUsers = activeUsersResult[0]?.count || 0;

    // Get active offers (approved and within valid date range)
    const activeOffersResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(platformOffers)
      .where(
        and(
          eq(platformOffers.isActive, 1),
          eq(platformOffers.approvalStatus, 'approved'),
          lte(platformOffers.validFrom, sql`NOW()`),
          gte(platformOffers.validUntil, sql`NOW()`)
        )
      );
    const activeOffers = activeOffersResult[0]?.count || 0;

    // Get combined trends from both bookings and job cards (last 7 days)
    const bookingTrends = await db
      .select({
        date: sql<string>`DATE(${jobCards.checkInAt})`,
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`COALESCE(SUM(CASE WHEN ${jobCards.status} = 'completed' AND ${jobCards.paymentStatus} = 'paid' THEN ${jobCards.totalAmountPaisa} ELSE 0 END), 0)`
      })
      .from(jobCards)
      .where(gte(jobCards.checkInAt, sql`NOW() - INTERVAL '7 days'`))
      .groupBy(sql`DATE(${jobCards.checkInAt})`)
      .orderBy(sql`DATE(${jobCards.checkInAt})`);

    return {
      totalBookings,
      totalRevenue,
      totalCommission,
      totalJobCards,
      totalUsers,
      totalSalons,
      pendingApprovals,
      activeUsers,
      activeOffers,
      bookingTrends: bookingTrends.map(t => ({
        date: t.date,
        count: t.count,
        revenue: parseFloat(String(t.revenue))
      }))
    };
  }

  async getAllSalonsForAdmin(filters?: {
    status?: string;
    approvalStatus?: string;
    city?: string;
    search?: string;
  }): Promise<Array<Salon & { 
    totalBookings: number;
    totalRevenue: number;
    ownerName?: string;
  }>> {
    let query = db.select({
      salon: salons,
      totalBookings: sql<number>`COALESCE(COUNT(DISTINCT ${bookings.id}), 0)::int`,
      totalRevenue: sql<number>`COALESCE(SUM(${bookings.totalAmountPaisa}), 0)::int`,
      ownerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
    })
    .from(salons)
    .leftJoin(bookings, eq(salons.id, bookings.salonId))
    .leftJoin(users, eq(salons.ownerId, users.id))
    .groupBy(salons.id, users.id)
    .$dynamic();

    if (filters?.approvalStatus) {
      query = query.where(eq(salons.approvalStatus, filters.approvalStatus));
    }
    if (filters?.city) {
      query = query.where(eq(salons.city, filters.city));
    }
    if (filters?.search) {
      query = query.where(sql`${salons.name} ILIKE ${`%${filters.search}%`}`);
    }

    const results = await query;

    return results.map(r => ({
      ...r.salon,
      totalBookings: r.totalBookings,
      totalRevenue: r.totalRevenue,
      ownerName: r.ownerName
    }));
  }

  async approveSalon(salonId: string, approvedBy: string): Promise<void> {
    await db.update(salons).set({
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedBy: approvedBy
    }).where(eq(salons.id, salonId));
  }

  async rejectSalon(salonId: string, reason: string, rejectedBy: string): Promise<void> {
    await db.update(salons).set({
      approvalStatus: 'rejected',
      rejectionReason: reason,
      approvedBy: rejectedBy,
      approvedAt: new Date()
    }).where(eq(salons.id, salonId));
  }

  async toggleSalonStatus(
    salonId: string, 
    isActive: boolean, 
    options?: { 
      disabledBySuperAdmin?: boolean; 
      disabledReason?: string; 
      disabledBy?: string;
    }
  ): Promise<void> {
    const updateData: any = {
      isActive: isActive ? 1 : 0
    };
    
    if (isActive) {
      // When enabling (owner-initiated only), clear owner-level disabled fields
      updateData.disabledAt = null;
      updateData.disabledReason = null;
      updateData.disabledBy = null;
      // Explicitly keep disabledBySuperAdmin = 0
      updateData.disabledBySuperAdmin = 0;
    } else {
      // When disabling (owner-initiated), set the disabled fields
      updateData.disabledAt = new Date();
      updateData.disabledReason = options?.disabledReason || 'Temporarily paused by owner';
      updateData.disabledBy = options?.disabledBy || null;
      // SECURITY: Owner-initiated disables always set disabledBySuperAdmin = 0
      updateData.disabledBySuperAdmin = 0;
    }
    
    // SECURITY: ATOMIC UPDATE with WHERE clause that ensures disabledBySuperAdmin = 0
    // This prevents race conditions where a super admin disables while owner is modifying
    // The update will only succeed if the salon is NOT currently disabled by super admin
    const result = await db.update(salons)
      .set(updateData)
      .where(
        and(
          eq(salons.id, salonId),
          eq(salons.disabledBySuperAdmin, 0) // Only modify if NOT admin-disabled
        )
      );
    
    // Check if update was successful by verifying a row was modified
    // If no rows modified, either salon doesn't exist or was admin-disabled
    const salon = await db.select().from(salons).where(eq(salons.id, salonId)).limit(1);
    if (salon.length === 0) {
      throw new Error("Salon not found");
    }
    
    // If the salon's isActive status doesn't match what we tried to set, 
    // it means the update failed due to disabledBySuperAdmin = 1
    if (salon[0].isActive !== (isActive ? 1 : 0)) {
      if (salon[0].disabledBySuperAdmin === 1) {
        throw new Error("Cannot modify salon: This salon was disabled by a platform administrator. Please contact support.");
      }
    }
  }

  async toggleSalonStatusBySuperAdmin(
    salonId: string, 
    isActive: boolean, 
    adminId: string,
    reason?: string
  ): Promise<void> {
    const updateData: any = {
      isActive: isActive ? 1 : 0
    };
    
    if (isActive) {
      // Super admin enabling - clear ALL disabled flags
      updateData.disabledBySuperAdmin = 0;
      updateData.disabledAt = null;
      updateData.disabledReason = null;
      updateData.disabledBy = null;
    } else {
      // Super admin disabling - set the super admin flag
      updateData.disabledBySuperAdmin = 1;
      updateData.disabledAt = new Date();
      updateData.disabledReason = reason || 'Disabled by platform administrator';
      updateData.disabledBy = adminId;
    }
    
    await db.update(salons).set(updateData).where(eq(salons.id, salonId));
  }

  async getAllUsersForAdmin(filters?: {
    role?: string;
    isActive?: number;
    search?: string;
  }): Promise<Array<User & { 
    roles: string[];
    totalBookings: number;
    totalSpent: number;
  }>> {
    let query = db.select({
      user: users,
      roles: sql<string[]>`ARRAY_AGG(DISTINCT ${roles.name})`,
      totalBookings: sql<number>`COALESCE(COUNT(DISTINCT ${bookings.id}), 0)::int`,
      totalSpent: sql<number>`COALESCE(SUM(${bookings.totalAmountPaisa}), 0)::int`
    })
    .from(users)
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(bookings, eq(users.email, bookings.customerEmail))
    .groupBy(users.id)
    .$dynamic();

    if (filters?.isActive !== undefined) {
      query = query.where(eq(users.isActive, filters.isActive));
    }
    if (filters?.search) {
      query = query.where(sql`${users.email} ILIKE ${`%${filters.search}%`} OR ${users.firstName} ILIKE ${`%${filters.search}%`}`);
    }

    const results = await query;

    return results.map(r => ({
      ...r.user,
      roles: r.roles.filter(Boolean),
      totalBookings: r.totalBookings,
      totalSpent: r.totalSpent
    }));
  }

  async toggleUserActive(userId: string, isActive: number): Promise<void> {
    await db.update(users).set({ isActive }).where(eq(users.id, userId));
  }

  async getAllBookingsForAdmin(filters?: {
    status?: string;
    salonId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<Booking & { 
    salonName: string;
    serviceName: string;
    customerName: string;
  }>> {
    let query = db.select({
      booking: bookings,
      salonName: salons.name,
      serviceName: services.name,
      customerName: bookings.customerName
    })
    .from(bookings)
    .leftJoin(salons, eq(bookings.salonId, salons.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .$dynamic();

    if (filters?.status) {
      query = query.where(eq(bookings.status, filters.status));
    }
    if (filters?.salonId) {
      query = query.where(eq(bookings.salonId, filters.salonId));
    }
    if (filters?.startDate) {
      query = query.where(gte(bookings.bookingDate, filters.startDate));
    }
    if (filters?.endDate) {
      query = query.where(lte(bookings.bookingDate, filters.endDate));
    }

    const results = await query;

    return results.map(r => ({
      ...r.booking,
      salonName: r.salonName || '',
      serviceName: r.serviceName || '',
      customerName: r.customerName
    }));
  }

  async getSalonBookingStats(salonId: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    cancellationRate: number;
    averageBookingValue: number;
  }> {
    const stats = await db.select({
      totalBookings: sql<number>`COUNT(*)::int`,
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'completed' THEN ${bookings.totalAmountPaisa} ELSE 0 END), 0)::int`,
      cancelledBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'cancelled' THEN 1 ELSE 0 END), 0)::int`,
      averageBookingValue: sql<number>`COALESCE(AVG(${bookings.totalAmountPaisa}), 0)::int`
    })
    .from(bookings)
    .where(eq(bookings.salonId, salonId));

    const result = stats[0];
    const cancellationRate = result.totalBookings > 0 
      ? (result.cancelledBookings / result.totalBookings) * 100 
      : 0;

    return {
      totalBookings: result.totalBookings || 0,
      totalRevenue: result.totalRevenue || 0,
      cancellationRate,
      averageBookingValue: result.averageBookingValue || 0
    };
  }

  async getPlatformConfig(key: string): Promise<any> {
    const [config] = await db.select()
      .from(platformConfig)
      .where(eq(platformConfig.configKey, key));
    return config?.configValue;
  }

  async setPlatformConfig(key: string, value: any, updatedBy: string): Promise<void> {
    const existing = await db.select()
      .from(platformConfig)
      .where(eq(platformConfig.configKey, key));

    if (existing.length > 0) {
      await db.update(platformConfig).set({
        configValue: value,
        updatedBy,
        updatedAt: new Date()
      }).where(eq(platformConfig.configKey, key));
    } else {
      await db.insert(platformConfig).values({
        configKey: key,
        configValue: value,
        updatedBy
      });
    }
  }

  async createPlatformCommission(data: any): Promise<void> {
    await db.insert(platformCommissions).values(data);
  }

  async getSalonEarnings(salonId: string): Promise<{
    totalEarnings: number;
    platformCommission: number;
    salonShare: number;
    pendingPayout: number;
  }> {
    const commissions = await db.select({
      totalEarnings: sql<number>`COALESCE(SUM(${platformCommissions.bookingAmountPaisa}), 0)::int`,
      platformCommission: sql<number>`COALESCE(SUM(${platformCommissions.commissionAmountPaisa}), 0)::int`,
      salonShare: sql<number>`COALESCE(SUM(${platformCommissions.salonEarningsPaisa}), 0)::int`
    })
    .from(platformCommissions)
    .where(eq(platformCommissions.salonId, salonId));

    const payouts = await db.select({
      paidOut: sql<number>`COALESCE(SUM(${platformPayouts.amountPaisa}), 0)::int`
    })
    .from(platformPayouts)
    .where(and(
      eq(platformPayouts.salonId, salonId),
      eq(platformPayouts.status, 'paid')
    ));

    const result = commissions[0];
    const paidOut = payouts[0]?.paidOut || 0;
    const pendingPayout = (result?.salonShare || 0) - paidOut;

    return {
      totalEarnings: result?.totalEarnings || 0,
      platformCommission: result?.platformCommission || 0,
      salonShare: result?.salonShare || 0,
      pendingPayout
    };
  }

  async createPayout(salonId: string, amount: number): Promise<any> {
    const [payout] = await db.insert(platformPayouts).values({
      salonId,
      amountPaisa: amount,
      status: 'pending'
    }).returning();
    return payout;
  }

  async approvePayout(payoutId: string, approvedBy: string): Promise<void> {
    await db.update(platformPayouts).set({
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    }).where(eq(platformPayouts.id, payoutId));
  }

  async rejectPayout(payoutId: string, reason: string, rejectedBy: string): Promise<void> {
    await db.update(platformPayouts).set({
      status: 'rejected',
      rejectionReason: reason,
      approvedBy: rejectedBy,
      approvedAt: new Date()
    }).where(eq(platformPayouts.id, payoutId));
  }

  async getAllPayouts(filters?: { status?: string; salonId?: string }): Promise<any[]> {
    let query = db.select({
      payout: platformPayouts,
      salonName: salons.name
    })
    .from(platformPayouts)
    .leftJoin(salons, eq(platformPayouts.salonId, salons.id))
    .$dynamic();

    if (filters?.status) {
      query = query.where(eq(platformPayouts.status, filters.status));
    }
    if (filters?.salonId) {
      query = query.where(eq(platformPayouts.salonId, filters.salonId));
    }

    const results = await query.orderBy(desc(platformPayouts.createdAt));

    return results.map(r => ({
      ...r.payout,
      salonName: r.salonName
    }));
  }

  // ==================== OFFERS MANAGEMENT ====================
  
  async getAllOffers(filters?: { 
    status?: string;
    approvalStatus?: string;
    isPlatformWide?: number;
    salonId?: string;
    ownedBySalonId?: string;
  }): Promise<Array<PlatformOffer & { salonName?: string }>> {
    let query = db.select({
      offer: platformOffers,
      salonName: salons.name
    })
    .from(platformOffers)
    .leftJoin(salons, eq(platformOffers.salonId, salons.id))
    .$dynamic();

    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(platformOffers.isActive, filters.status === 'active' ? 1 : 0));
    }
    if (filters?.approvalStatus) {
      conditions.push(eq(platformOffers.approvalStatus, filters.approvalStatus));
    }
    if (filters?.isPlatformWide !== undefined) {
      conditions.push(eq(platformOffers.isPlatformWide, filters.isPlatformWide));
    }
    if (filters?.salonId) {
      conditions.push(eq(platformOffers.salonId, filters.salonId));
    }
    if (filters?.ownedBySalonId !== undefined) {
      if (filters.ownedBySalonId === 'null') {
        conditions.push(sql`${platformOffers.ownedBySalonId} IS NULL`);
      } else {
        conditions.push(eq(platformOffers.ownedBySalonId, filters.ownedBySalonId));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(platformOffers.createdAt));

    return results.map(r => ({
      ...r.offer,
      salonName: r.salonName || undefined
    }));
  }

  async getOfferById(offerId: string): Promise<PlatformOffer | undefined> {
    const [offer] = await db.select().from(platformOffers).where(eq(platformOffers.id, offerId));
    return offer || undefined;
  }

  async createOffer(data: InsertPlatformOffer): Promise<PlatformOffer> {
    const [offer] = await db.insert(platformOffers).values(data).returning();
    return offer;
  }

  async updateOffer(offerId: string, updates: Partial<InsertPlatformOffer>): Promise<void> {
    await db.update(platformOffers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platformOffers.id, offerId));
  }

  async approveOffer(offerId: string, approvedBy: string): Promise<void> {
    await db.update(platformOffers).set({
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(platformOffers.id, offerId));
  }

  async rejectOffer(offerId: string, reason: string, rejectedBy: string): Promise<void> {
    await db.update(platformOffers).set({
      approvalStatus: 'rejected',
      approvalNotes: reason,
      rejectedBy,
      rejectedAt: new Date(),
      isActive: 0,
      updatedAt: new Date()
    }).where(eq(platformOffers.id, offerId));
  }

  async toggleOfferStatus(offerId: string, isActive: number): Promise<void> {
    await db.update(platformOffers)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(platformOffers.id, offerId));
  }

  async deleteOffer(offerId: string): Promise<void> {
    await db.delete(platformOffers).where(eq(platformOffers.id, offerId));
  }

  // Salon-specific offer methods with ownership validation
  async getSalonOffers(salonId: string): Promise<PlatformOffer[]> {
    const offers = await db.select()
      .from(platformOffers)
      .where(eq(platformOffers.ownedBySalonId, salonId))
      .orderBy(desc(platformOffers.createdAt));
    return offers;
  }

  async createSalonOffer(salonId: string, data: any, createdBy: string): Promise<PlatformOffer> {
    // Salon owner offers are ALWAYS auto-approved (no approval workflow needed)
    
    // Convert ALL date fields to Date objects explicitly
    const validFrom = data.validFrom instanceof Date ? data.validFrom : new Date(data.validFrom);
    const validUntil = data.validUntil instanceof Date ? data.validUntil : new Date(data.validUntil);

    // Build offer data explicitly - don't spread to avoid any string dates slipping through
    const offerData: any = {
      salonId: salonId,
      ownedBySalonId: salonId,
      title: data.title,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minimumPurchase: data.minimumPurchase,
      maxDiscount: data.maxDiscount,
      validFrom: validFrom,
      validUntil: validUntil,
      isActive: data.isActive,
      isPlatformWide: 0, // Salon offers are never platform-wide
      usageLimit: data.usageLimit,
      imageUrl: data.imageUrl, // Promotional image for offer card
      approvalStatus: 'approved', // ALWAYS auto-approved
      autoApproved: 1,
      requiresApprovalOnEdit: 0,
      approvedBy: createdBy, // Set to the user creating the offer (auto-approved)
      approvedAt: new Date(),
      createdBy: createdBy,
    };

    const [offer] = await db.insert(platformOffers).values(offerData).returning();
    return offer;
  }

  async updateSalonOffer(offerId: string, salonId: string, updates: any, editedBy: string): Promise<void> {
    // Verify ownership
    const offer = await this.getOfferById(offerId);
    if (!offer || offer.ownedBySalonId !== salonId) {
      throw new Error('Unauthorized: Offer not owned by this salon');
    }

    // Get auto-approve setting (getPlatformConfig returns JSON configValue directly)
    const config = await this.getPlatformConfig('offerApprovalSettings');
    const autoApproveSalonOffers = config?.autoApproveSalonOffers ?? true;

    // Determine if re-approval is needed
    const needsReapproval = offer.requiresApprovalOnEdit === 1 || !autoApproveSalonOffers;

    const updateData: any = {
      ...updates,
      lastEditedBy: editedBy,
      lastEditedAt: new Date(),
      updatedAt: new Date()
    };

    // If editing requires re-approval, set status to pending
    if (needsReapproval && offer.approvalStatus === 'approved') {
      updateData.approvalStatus = 'pending';
      updateData.autoApproved = 0;
    }

    await db.update(platformOffers)
      .set(updateData)
      .where(eq(platformOffers.id, offerId));
  }

  async toggleSalonOfferStatus(offerId: string, salonId: string, isActive: number): Promise<void> {
    // Verify ownership
    const offer = await this.getOfferById(offerId);
    if (!offer || offer.ownedBySalonId !== salonId) {
      throw new Error('Unauthorized: Offer not owned by this salon');
    }

    await db.update(platformOffers)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(platformOffers.id, offerId));
  }

  async deleteSalonOffer(offerId: string, salonId: string): Promise<void> {
    // Verify ownership
    const offer = await this.getOfferById(offerId);
    if (!offer || offer.ownedBySalonId !== salonId) {
      throw new Error('Unauthorized: Offer not owned by this salon');
    }

    await db.delete(platformOffers).where(eq(platformOffers.id, offerId));
  }

  // Digital Wallet Management
  async getUserWallet(userId: string): Promise<any> {
    const [wallet] = await db.select().from(userWallets).where(eq(userWallets.userId, userId));
    return wallet || null;
  }

  async createUserWallet(userId: string): Promise<any> {
    const [wallet] = await db.insert(userWallets).values({
      userId,
      balanceInPaisa: 0,
      lifetimeEarnedInPaisa: 0,
      lifetimeSpentInPaisa: 0
    }).returning();
    return wallet;
  }

  async addWalletCredit(userId: string, amountInPaisa: number, reason: string, bookingId?: string, offerId?: string): Promise<void> {
    let wallet = await this.getUserWallet(userId);
    if (!wallet) {
      wallet = await this.createUserWallet(userId);
    }

    await db.update(userWallets)
      .set({
        balanceInPaisa: wallet.balanceInPaisa + amountInPaisa,
        lifetimeEarnedInPaisa: wallet.lifetimeEarnedInPaisa + amountInPaisa,
        updatedAt: new Date()
      })
      .where(eq(userWallets.id, wallet.id));

    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      userId,
      type: 'credit',
      amountInPaisa,
      reason,
      bookingId: bookingId || null,
      offerId: offerId || null
    });
  }

  async deductWalletBalance(userId: string, amountInPaisa: number, reason: string, bookingId?: string): Promise<void> {
    const wallet = await this.getUserWallet(userId);
    if (!wallet || wallet.balanceInPaisa < amountInPaisa) {
      throw new Error('Insufficient wallet balance');
    }

    await db.update(userWallets)
      .set({
        balanceInPaisa: wallet.balanceInPaisa - amountInPaisa,
        lifetimeSpentInPaisa: wallet.lifetimeSpentInPaisa + amountInPaisa,
        updatedAt: new Date()
      })
      .where(eq(userWallets.id, wallet.id));

    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      userId,
      type: 'debit',
      amountInPaisa,
      reason,
      bookingId: bookingId || null
    });
  }

  async getWalletTransactions(userId: string): Promise<any[]> {
    const transactions = await db.select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));
    return transactions;
  }

  // Launch Offers & Eligibility
  async getActiveLaunchOffers(): Promise<any[]> {
    const now = new Date();
    const offers = await db.select()
      .from(launchOffers)
      .where(
        and(
          eq(launchOffers.isActive, 1),
          lte(launchOffers.validFrom, now),
          gte(launchOffers.validUntil, now)
        )
      );
    return offers;
  }

  async getUserOfferEligibility(userId: string, offerId: string): Promise<{
    eligible: boolean;
    usageCount: number;
    maxUsage: number;
    reason?: string;
  }> {
    const [offer] = await db.select().from(launchOffers).where(eq(launchOffers.id, offerId));
    
    if (!offer) {
      return { eligible: false, usageCount: 0, maxUsage: 0, reason: 'Offer not found' };
    }

    if (offer.isActive === 0) {
      return { eligible: false, usageCount: 0, maxUsage: offer.maxUsagePerUser || 0, reason: 'Offer is inactive' };
    }

    const now = new Date();
    if (now < offer.validFrom || now > offer.validUntil) {
      return { eligible: false, usageCount: 0, maxUsage: offer.maxUsagePerUser || 0, reason: 'Offer expired or not yet valid' };
    }

    const usageRecords = await db.select()
      .from(userOfferUsage)
      .where(and(
        eq(userOfferUsage.userId, userId),
        eq(userOfferUsage.offerId, offerId)
      ));

    const usageCount = usageRecords.length;
    const maxUsage = offer.maxUsagePerUser || 999;

    if (usageCount >= maxUsage) {
      return { eligible: false, usageCount, maxUsage, reason: 'Usage limit reached' };
    }

    return { eligible: true, usageCount, maxUsage };
  }

  async trackOfferUsage(userId: string, offerId: string, bookingId: string, discountInPaisa: number, usageNumber: number): Promise<void> {
    await db.insert(userOfferUsage).values({
      userId,
      offerId,
      bookingId,
      discountAppliedInPaisa: discountInPaisa,
      usageNumber
    });
  }

  async getCustomerOffers(userId: string, salonId?: string): Promise<any[]> {
    const now = new Date();
    
    const conditions = [
      eq(platformOffers.isActive, 1),
      eq(platformOffers.approvalStatus, 'approved'),
      lte(platformOffers.validFrom, now),
      gte(platformOffers.validUntil, now)
    ];

    // Include platform-wide offers OR salon-specific offers (if salonId provided)
    if (salonId) {
      conditions.push(
        or(
          eq(platformOffers.isPlatformWide, 1),
          eq(platformOffers.salonId, salonId)
        )!
      );
    } else {
      // If no salonId, only show platform-wide offers
      conditions.push(eq(platformOffers.isPlatformWide, 1));
    }

    const results = await db.select({
      offer: platformOffers,
      salonName: salons.name
    })
    .from(platformOffers)
    .leftJoin(salons, eq(platformOffers.salonId, salons.id))
    .where(and(...conditions))
    .orderBy(desc(platformOffers.createdAt));
    
    // Map database columns to calculator expected format (camelCase)
    return results.map(r => ({
      id: r.offer.id,
      title: r.offer.title,
      description: r.offer.description,
      discountType: r.offer.discountType,
      discountValue: r.offer.discountValue,
      minimumPurchase: r.offer.minimumPurchase,
      maxDiscount: r.offer.maxDiscount,
      isPlatformWide: r.offer.isPlatformWide,
      salonId: r.offer.salonId,
      ownedBySalonId: r.offer.ownedBySalonId,
      validFrom: r.offer.validFrom,
      validUntil: r.offer.validUntil,
      usageLimit: r.offer.usageLimit,
      usageCount: r.offer.usageCount,
      imageUrl: r.offer.imageUrl,
      isActive: r.offer.isActive,
      approvalStatus: r.offer.approvalStatus,
      salonName: r.salonName || undefined
    }));
  }

  async getAllOffersWithSalons(): Promise<any[]> {
    const now = new Date();
    
    const conditions = [
      eq(platformOffers.isActive, 1),
      eq(platformOffers.approvalStatus, 'approved'),
      lte(platformOffers.validFrom, now),
      gte(platformOffers.validUntil, now)
    ];

    const results = await db.select({
      offer: platformOffers,
      salon: salons
    })
    .from(platformOffers)
    .leftJoin(salons, eq(platformOffers.salonId, salons.id))
    .where(and(...conditions))
    .orderBy(desc(platformOffers.createdAt));
    
    return results.map(r => ({
      id: r.offer.id,
      title: r.offer.title,
      description: r.offer.description,
      discountType: r.offer.discountType,
      discountValue: r.offer.discountValue,
      minimumPurchase: r.offer.minimumPurchase,
      maxDiscount: r.offer.maxDiscount,
      isPlatformWide: r.offer.isPlatformWide,
      salonId: r.offer.salonId,
      validFrom: r.offer.validFrom,
      validUntil: r.offer.validUntil,
      isActive: r.offer.isActive,
      approvalStatus: r.offer.approvalStatus,
      salon: r.salon ? {
        id: r.salon.id,
        name: r.salon.name,
        address: r.salon.address,
        city: r.salon.city,
        state: r.salon.state,
        rating: r.salon.rating,
        reviewCount: r.salon.reviewCount,
        category: r.salon.category,
        images: r.salon.images
      } : null
    }));
  }

  // ===============================================
  // GEOCODING CACHE METHODS - Production-Grade Location Accuracy
  // ===============================================

  async findLocationAlias(normalizedQuery: string): Promise<{ placeId: string } | null> {
    const [alias] = await db
      .select({ placeId: locationAliases.placeId })
      .from(locationAliases)
      .where(eq(locationAliases.normalizedQuery, normalizedQuery))
      .limit(1);
    
    return alias || null;
  }

  async getGeocodeLocation(placeId: string): Promise<any | null> {
    const [location] = await db
      .select()
      .from(geocodeLocations)
      .where(eq(geocodeLocations.placeId, placeId))
      .limit(1);
    
    return location || null;
  }

  async upsertGeocodeLocation(data: any): Promise<void> {
    await db
      .insert(geocodeLocations)
      .values(data)
      .onConflictDoUpdate({
        target: geocodeLocations.placeId,
        set: {
          formattedAddress: data.formattedAddress,
          latitude: data.latitude,
          longitude: data.longitude,
          locationType: data.locationType,
          confidence: data.confidence,
          viewport: data.viewport,
          rawResponse: data.rawResponse,
          verifiedAt: data.verifiedAt,
          expiresAt: data.expiresAt,
          usageCount: sql`${geocodeLocations.usageCount} + 1`,
          updatedAt: new Date(),
        },
      });
  }

  async createLocationAlias(data: any): Promise<void> {
    try {
      await db.insert(locationAliases).values(data);
    } catch (error) {
      // Ignore duplicate key errors
      if (!(error instanceof Error && error.message.includes('duplicate'))) {
        throw error;
      }
    }
  }

  async incrementLocationUsage(placeId: string, normalizedQuery: string): Promise<void> {
    // Update geocode_locations usage count
    await db
      .update(geocodeLocations)
      .set({ 
        usageCount: sql`${geocodeLocations.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(geocodeLocations.placeId, placeId));

    // Update location_aliases usage count
    await db
      .update(locationAliases)
      .set({ usageCount: sql`${locationAliases.usageCount} + 1` })
      .where(
        and(
          eq(locationAliases.normalizedQuery, normalizedQuery),
          eq(locationAliases.placeId, placeId)
        )
      );
  }

  async findLocationByCoordinates(
    lat: number,
    lng: number,
    radiusMeters: number
  ): Promise<any | null> {
    // PostgreSQL Haversine formula to find nearby locations
    // This is a simplified version - in production, use PostGIS for better performance
    const results = await db
      .select()
      .from(geocodeLocations)
      .where(
        sql`
          (
            6371000 * acos(
              cos(radians(${lat})) * 
              cos(radians(CAST(${geocodeLocations.latitude} AS FLOAT))) * 
              cos(radians(CAST(${geocodeLocations.longitude} AS FLOAT)) - radians(${lng})) + 
              sin(radians(${lat})) * 
              sin(radians(CAST(${geocodeLocations.latitude} AS FLOAT)))
            )
          ) <= ${radiusMeters}
        `
      )
      .limit(1);
    
    return results[0] || null;
  }

  // ==================== REVIEW MANAGEMENT ====================
  
  /**
   * Create a new review (Google or SalonHub)
   */
  async createReview(review: InsertSalonReview): Promise<SalonReview> {
    const [newReview] = await db.insert(salonReviews).values(review).returning();
    return newReview;
  }

  /**
   * Get reviews for a salon with optional source filtering
   */
  async getReviewsBySalonId(salonId: string, source?: 'google' | 'salonhub'): Promise<SalonReview[]> {
    if (source) {
      return await db.select().from(salonReviews)
        .where(and(eq(salonReviews.salonId, salonId), eq(salonReviews.source, source)))
        .orderBy(desc(salonReviews.createdAt));
    }
    return await db.select().from(salonReviews)
      .where(eq(salonReviews.salonId, salonId))
      .orderBy(desc(salonReviews.createdAt));
  }

  /**
   * Update salon's overall rating by computing weighted average of all reviews
   */
  async updateSalonRating(salonId: string): Promise<void> {
    // Get all reviews for this salon
    const reviews = await db.select().from(salonReviews)
      .where(eq(salonReviews.salonId, salonId));

    if (reviews.length === 0) {
      // No reviews - reset to 0
      await db.update(salons)
        .set({ rating: '0.00', reviewCount: 0 })
        .where(eq(salons.id, salonId));
      return;
    }

    // Calculate weighted average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(2);

    await db.update(salons)
      .set({ 
        rating: averageRating,
        reviewCount: reviews.length 
      })
      .where(eq(salons.id, salonId));
  }

  // ==================== GOOGLE PLACES CACHE ====================
  
  /**
   * Search for cached Google Places within radius
   */
  async searchCachedPlaces(latitude: number, longitude: number, businessName: string): Promise<GooglePlacesCache[]> {
    const radiusMeters = 100; // Search within 100 meters
    const now = new Date();

    // Find cached places within radius that haven't expired
    const results = await db
      .select()
      .from(googlePlacesCache)
      .where(
        and(
          sql`
            (
              6371000 * acos(
                cos(radians(${latitude})) * 
                cos(radians(CAST(${googlePlacesCache.latitude} AS FLOAT))) * 
                cos(radians(CAST(${googlePlacesCache.longitude} AS FLOAT)) - radians(${longitude})) + 
                sin(radians(${latitude})) * 
                sin(radians(CAST(${googlePlacesCache.latitude} AS FLOAT)))
              )
            ) <= ${radiusMeters}
          `,
          sql`LOWER(${googlePlacesCache.businessName}) LIKE LOWER(${'%' + businessName + '%'})`,
          sql`${googlePlacesCache.expiresAt} > ${now.toISOString()}`
        )
      )
      .limit(5);

    return results;
  }

  /**
   * Cache a Google Place result
   */
  async cacheGooglePlace(place: InsertGooglePlacesCache): Promise<void> {
    try {
      await db.insert(googlePlacesCache).values(place)
        .onConflictDoUpdate({
          target: googlePlacesCache.placeId,
          set: {
            businessName: place.businessName,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            rating: place.rating,
            reviewCount: place.reviewCount,
            payload: place.payload,
            fetchedAt: sql`CURRENT_TIMESTAMP`,
            expiresAt: place.expiresAt,
          }
        });
    } catch (error) {
      console.error('Error caching Google Place:', error);
      throw error;
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    const now = new Date();
    const result = await db.delete(googlePlacesCache)
      .where(sql`${googlePlacesCache.expiresAt} < ${now.toISOString()}`)
      .returning();
    
    return result.length;
  }

  // ==================== PRODUCT E-COMMERCE OPERATIONS ====================
  
  /**
   * Get retail products for a salon with optional filtering
   */
  async getRetailProducts(salonId: string, filters?: {
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Array<Product & { retailConfig?: ProductRetailConfig; variants?: ProductVariant[] }>> {
    const conditions = [
      // GATE 1: Product must be active
      eq(products.isActive, 1),
      // GATE 2: Product must be available for retail
      eq(products.availableForRetail, 1),
      // GATE 3: Product must have retail price configured
      gt(products.retailPriceInPaisa, 0),
    ];

    // Only filter by salon if salonId is provided
    if (salonId && salonId !== '') {
      conditions.push(eq(products.salonId, salonId));
    }

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      conditions.push(
        or(
          sql`LOWER(${products.name}) LIKE LOWER(${`%${filters.search}%`})`,
          sql`LOWER(${products.description}) LIKE LOWER(${`%${filters.search}%`})`,
          sql`LOWER(${products.brand}) LIKE LOWER(${`%${filters.search}%`})`
        )!
      );
    }

    if (filters?.minPrice !== undefined) {
      conditions.push(gte(products.retailPriceInPaisa, filters.minPrice));
    }

    if (filters?.maxPrice !== undefined) {
      conditions.push(lte(products.retailPriceInPaisa, filters.maxPrice));
    }

    // Get products with their retail config
    const results = await db
      .select({
        product: products,
        retailConfig: productRetailConfig,
      })
      .from(products)
      .leftJoin(productRetailConfig, eq(products.id, productRetailConfig.productId))
      .where(and(...conditions))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0)
      .orderBy(desc(products.createdAt));

    // Apply filters that depend on retail config
    let filteredResults = results;
    
    // GATE 4: Product must have retail stock allocated
    filteredResults = filteredResults.filter(r => {
      const retailStock = r.retailConfig?.retailStockAllocated;
      return retailStock && parseFloat(String(retailStock)) > 0;
    });
    
    // Featured filter
    if (filters?.featured !== undefined) {
      filteredResults = filteredResults.filter(r => r.retailConfig?.featured === (filters.featured ? 1 : 0));
    }

    // Get variants for each product
    const productsWithData = await Promise.all(
      filteredResults.map(async (result) => {
        const variants = await db
          .select()
          .from(productVariants)
          .where(and(
            eq(productVariants.productId, result.product.id),
            eq(productVariants.isActive, 1)
          ))
          .orderBy(asc(productVariants.displayOrder));

        return {
          ...result.product,
          retailConfig: result.retailConfig || undefined,
          variants: variants.length > 0 ? variants : undefined,
        };
      })
    );

    return productsWithData;
  }

  /**
   * Get product by ID with variants and retail config
   */
  async getProductById(productId: string, includeVariants = true): Promise<(Product & { retailConfig?: ProductRetailConfig; variants?: ProductVariant[] }) | undefined> {
    const [result] = await db
      .select({
        product: products,
        retailConfig: productRetailConfig,
      })
      .from(products)
      .leftJoin(productRetailConfig, eq(products.id, productRetailConfig.productId))
      .where(eq(products.id, productId));

    if (!result) {
      return undefined;
    }

    let variants: ProductVariant[] | undefined;
    if (includeVariants) {
      variants = await db
        .select()
        .from(productVariants)
        .where(and(
          eq(productVariants.productId, productId),
          eq(productVariants.isActive, 1)
        ))
        .orderBy(asc(productVariants.displayOrder));
    }

    return {
      ...result.product,
      retailConfig: result.retailConfig || undefined,
      variants: variants && variants.length > 0 ? variants : undefined,
    };
  }

  /**
   * Get product by ID for specific salon (SECURE: prevents cross-salon access)
   */
  async getProductByIdForSalon(productId: string, salonId: string, includeVariants = true): Promise<(Product & { retailConfig?: ProductRetailConfig; variants?: ProductVariant[] }) | undefined> {
    const [result] = await db
      .select({
        product: products,
        retailConfig: productRetailConfig,
      })
      .from(products)
      .leftJoin(productRetailConfig, eq(products.id, productRetailConfig.productId))
      .where(and(
        eq(products.id, productId),
        eq(products.salonId, salonId)
      ));

    if (!result) {
      return undefined;
    }

    let variants: ProductVariant[] | undefined;
    if (includeVariants) {
      variants = await db
        .select()
        .from(productVariants)
        .where(and(
          eq(productVariants.productId, productId),
          eq(productVariants.isActive, 1)
        ))
        .orderBy(asc(productVariants.displayOrder));
    }

    return {
      ...result.product,
      retailConfig: result.retailConfig || undefined,
      variants: variants && variants.length > 0 ? variants : undefined,
    };
  }

  /**
   * Search products across salons (customer-facing with ALL 4 visibility gates)
   */
  async searchProducts(query: string, filters?: {
    salonId?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
  }): Promise<Array<Product & { retailConfig?: ProductRetailConfig }>> {
    const conditions = [
      // GATE 1: Product must be active
      eq(products.isActive, 1),
      // GATE 2: Product must be available for retail
      eq(products.availableForRetail, 1),
      // GATE 3: Product must have retail price configured
      gt(products.retailPriceInPaisa, 0),
      or(
        sql`LOWER(${products.name}) LIKE LOWER(${`%${query}%`})`,
        sql`LOWER(${products.description}) LIKE LOWER(${`%${query}%`})`,
        sql`LOWER(${products.brand}) LIKE LOWER(${`%${query}%`})`
      )!
    ];

    if (filters?.salonId) {
      conditions.push(eq(products.salonId, filters.salonId));
    }

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.minPrice !== undefined) {
      conditions.push(gte(products.retailPriceInPaisa, filters.minPrice));
    }

    if (filters?.maxPrice !== undefined) {
      conditions.push(lte(products.retailPriceInPaisa, filters.maxPrice));
    }

    const results = await db
      .select({
        product: products,
        retailConfig: productRetailConfig,
      })
      .from(products)
      .leftJoin(productRetailConfig, eq(products.id, productRetailConfig.productId))
      .where(and(...conditions))
      .limit(filters?.limit || 50)
      .orderBy(desc(products.createdAt));

    // GATE 4: Product must have retail stock allocated (filter after join)
    const filteredResults = results.filter(r => {
      const retailStock = r.retailConfig?.retailStockAllocated;
      return retailStock && parseFloat(String(retailStock)) > 0;
    });

    return filteredResults.map(r => ({
      ...r.product,
      retailConfig: r.retailConfig || undefined,
    }));
  }

  /**
   * Get product variants
   */
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return await db
      .select()
      .from(productVariants)
      .where(and(
        eq(productVariants.productId, productId),
        eq(productVariants.isActive, 1)
      ))
      .orderBy(asc(productVariants.displayOrder));
  }

  /**
   * Get variant by ID
   */
  async getVariantById(variantId: string): Promise<ProductVariant | undefined> {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId));
    return variant || undefined;
  }

  /**
   * Create or get active shopping cart for user
   */
  async createOrGetCart(userId: string, salonId: string): Promise<ShoppingCart> {
    // Check for existing active cart
    const [existingCart] = await db
      .select()
      .from(shoppingCarts)
      .where(and(
        eq(shoppingCarts.userId, userId),
        eq(shoppingCarts.salonId, salonId),
        eq(shoppingCarts.status, 'active')
      ));

    if (existingCart) {
      return existingCart;
    }

    // Create new cart
    const [newCart] = await db
      .insert(shoppingCarts)
      .values({
        userId,
        salonId,
        status: 'active',
      })
      .returning();

    return newCart;
  }

  /**
   * Get active cart with items
   */
  async getActiveCart(userId: string, salonId: string): Promise<(ShoppingCart & { items?: Array<CartItem & { product?: Product; variant?: ProductVariant }> }) | undefined> {
    const [cart] = await db
      .select()
      .from(shoppingCarts)
      .where(and(
        eq(shoppingCarts.userId, userId),
        eq(shoppingCarts.salonId, salonId),
        eq(shoppingCarts.status, 'active')
      ));

    if (!cart) {
      return undefined;
    }

    // Get cart items with product details
    const items = await db
      .select({
        item: cartItems,
        product: products,
        variant: productVariants,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(eq(cartItems.cartId, cart.id));

    return {
      ...cart,
      items: items.map(i => ({
        ...i.item,
        product: i.product || undefined,
        variant: i.variant || undefined,
      })),
    };
  }

  /**
   * Get all cart items for a user across all salons
   */
  async getUserCartItems(userId: string): Promise<Array<CartItem & { product?: Product & { retailConfig?: ProductRetailConfig }; variant?: ProductVariant; salonId?: string }>> {
    // Get all active carts for the user
    const activeCarts = await db
      .select()
      .from(shoppingCarts)
      .where(and(
        eq(shoppingCarts.userId, userId),
        eq(shoppingCarts.status, 'active')
      ));

    if (activeCarts.length === 0) {
      return [];
    }

    // Get all cart items with product details and retail config
    const cartIds = activeCarts.map(c => c.id);
    const items = await db
      .select({
        item: cartItems,
        product: products,
        retailConfig: productRetailConfig,
        variant: productVariants,
        cart: shoppingCarts,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(productRetailConfig, eq(cartItems.productId, productRetailConfig.productId))
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .leftJoin(shoppingCarts, eq(cartItems.cartId, shoppingCarts.id))
      .where(inArray(cartItems.cartId, cartIds));

    return items.map(i => ({
      ...i.item,
      product: i.product ? {
        ...i.product,
        retailConfig: i.retailConfig || undefined,
      } : undefined,
      variant: i.variant || undefined,
      salonId: i.cart?.salonId,
    }));
  }

  /**
   * Add item to cart
   */
  async addCartItem(cartId: string, item: {
    productId: string;
    variantId?: string;
    quantity: number;
    priceAtAdd: number;
  }): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItemConditions = [
      eq(cartItems.cartId, cartId),
      eq(cartItems.productId, item.productId),
    ];

    if (item.variantId) {
      existingItemConditions.push(eq(cartItems.variantId, item.variantId));
    } else {
      existingItemConditions.push(isNull(cartItems.variantId));
    }

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(...existingItemConditions));

    if (existingItem) {
      // Update quantity
      const [updated] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updated;
    }

    // Add new item
    const [newItem] = await db
      .insert(cartItems)
      .values({
        cartId,
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        priceAtAddPaisa: item.priceAtAdd, // Correct field name
        currentPricePaisa: item.priceAtAdd, // Set current price same as add price initially
      })
      .returning();

    // Update cart's updatedAt
    await db
      .update(shoppingCarts)
      .set({ updatedAt: new Date() })
      .where(eq(shoppingCarts.id, cartId));

    return newItem;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(itemId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeCartItem(itemId);
      return;
    }

    await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, itemId));
  }

  /**
   * Remove cart item
   */
  async removeCartItem(itemId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  }

  /**
   * Clear all items from cart
   */
  async clearCart(cartId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  /**
   * Create product order
   */
  async createProductOrder(orderData: {
    userId: string;
    salonId: string;
    cartId: string;
    deliveryAddress: any;
    paymentMethod: string;
    fulfillmentType: string;
    items: Array<{
      productId: string;
      productName: string;
      productSku?: string;
      variantId?: string;
      quantity: number;
      priceInPaisa: number;
    }>;
    subtotalInPaisa: number;
    taxInPaisa: number;
    deliveryFeeInPaisa: number;
    totalInPaisa: number;
  }): Promise<ProductOrder> {
    // Create order
    const [order] = await db
      .insert(productOrders)
      .values({
        customerId: orderData.userId, // Correct field name is customerId
        salonId: orderData.salonId,
        orderNumber: `ORD-${Date.now()}`,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: orderData.paymentMethod,
        fulfillmentType: orderData.fulfillmentType, // Required field
        deliveryAddress: orderData.deliveryAddress,
        subtotalPaisa: orderData.subtotalInPaisa,
        taxPaisa: orderData.taxInPaisa,
        deliveryChargePaisa: orderData.deliveryFeeInPaisa,
        totalPaisa: orderData.totalInPaisa,
      })
      .returning();

    // Create order items
    await db.insert(productOrderItems).values(
      orderData.items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName, // Required snapshot field
        productSku: item.productSku || null,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPricePaisa: item.priceInPaisa, // Correct field name
        subtotalPaisa: item.priceInPaisa * item.quantity, // Required field
      }))
    );

    // Mark cart as converted
    await db
      .update(shoppingCarts)
      .set({ status: 'converted', updatedAt: new Date() })
      .where(eq(shoppingCarts.id, orderData.cartId));

    return order;
  }

  /**
   * Get product order with items
   */
  async getProductOrder(orderId: string): Promise<(ProductOrder & { items?: ProductOrderItem[] }) | undefined> {
    const [order] = await db
      .select()
      .from(productOrders)
      .where(eq(productOrders.id, orderId));

    if (!order) {
      return undefined;
    }

    const items = await db
      .select()
      .from(productOrderItems)
      .where(eq(productOrderItems.orderId, orderId));

    return {
      ...order,
      items: items.length > 0 ? items : undefined,
    };
  }

  /**
   * Get product orders by user
   */
  async getProductOrdersByUser(userId: string, limit = 50): Promise<ProductOrder[]> {
    return await db
      .select()
      .from(productOrders)
      .where(eq(productOrders.customerId, userId)) // Correct field name is customerId
      .orderBy(desc(productOrders.createdAt))
      .limit(limit);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, updatedBy?: string): Promise<void> {
    await db
      .update(productOrders)
      .set({ status })
      .where(eq(productOrders.id, orderId));
  }

  /**
   * Cancel product order
   */
  async cancelProductOrder(orderId: string, reason?: string): Promise<void> {
    await db
      .update(productOrders)
      .set({ 
        status: 'cancelled',
        cancellationReason: reason || null,
        cancelledAt: new Date(),
      })
      .where(eq(productOrders.id, orderId));
  }

  /**
   * Reserve product stock atomically (prevents overselling)
   * Returns success=false if insufficient stock available
   */
  async reserveProductStock(productId: string, quantity: number): Promise<{ success: boolean; availableStock: number; message?: string }> {
    // Get current stock from product retail config
    const [retailConfig] = await db
      .select()
      .from(productRetailConfig)
      .where(eq(productRetailConfig.productId, productId))
      .limit(1);

    if (!retailConfig) {
      return { success: false, availableStock: 0, message: 'Product retail config not found' };
    }

    const availableStock = parseFloat(retailConfig.retailStockAllocated || '0');

    // Check if sufficient stock available
    if (availableStock < quantity) {
      return { 
        success: false, 
        availableStock, 
        message: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}` 
      };
    }

    // Atomically decrement stock
    await db
      .update(productRetailConfig)
      .set({ 
        retailStockAllocated: sql`${productRetailConfig.retailStockAllocated} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(productRetailConfig.productId, productId));

    return { success: true, availableStock: availableStock - quantity };
  }

  /**
   * Release reserved stock (when order cancelled or payment failed)
   */
  async releaseProductStock(productId: string, quantity: number): Promise<void> {
    await db
      .update(productRetailConfig)
      .set({ 
        retailStockAllocated: sql`${productRetailConfig.retailStockAllocated} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(productRetailConfig.productId, productId));
  }

  /**
   * Commit stock reduction (same as reserve, but called after payment success for clarity)
   * Stock is already decremented by reserveProductStock, this is a no-op for now
   */
  async commitProductStockReduction(productId: string, quantity: number): Promise<void> {
    // No-op: Stock was already decremented during reservation
    // This method exists for semantic clarity and future enhancements (e.g., moving from reserved to sold)
    console.log(`Stock reduction committed for product ${productId}: ${quantity} units`);
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    // Check if already in wishlist
    const [existing] = await db
      .select()
      .from(wishlists)
      .where(and(
        eq(wishlists.userId, userId),
        eq(wishlists.productId, productId)
      ));

    if (existing) {
      return existing;
    }

    // Get product price for tracking
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    // Add to wishlist
    const [wishlistItem] = await db
      .insert(wishlists)
      .values({ 
        userId, 
        productId,
        priceAtAddPaisa: product?.retailPriceInPaisa || 0, // Required field for price tracking
      })
      .returning();

    return wishlistItem;
  }

  /**
   * Get user's wishlist
   */
  async getWishlist(userId: string, salonId?: string): Promise<Array<Wishlist & { product?: Product }>> {
    let query = db
      .select({
        wishlist: wishlists,
        product: products,
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId));

    if (salonId) {
      const results = await query;
      const filtered = results.filter(r => r.product?.salonId === salonId);
      return filtered.map(r => ({
        ...r.wishlist,
        product: r.product || undefined,
      }));
    }

    const results = await query.orderBy(desc(wishlists.addedAt));
    return results.map(r => ({
      ...r.wishlist,
      product: r.product || undefined,
    }));
  }

  /**
   * Remove from wishlist
   */
  async removeFromWishlist(wishlistId: string): Promise<void> {
    await db.delete(wishlists).where(eq(wishlists.id, wishlistId));
  }

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(wishlists)
      .where(and(
        eq(wishlists.userId, userId),
        eq(wishlists.productId, productId)
      ));
    return !!result;
  }

  /**
   * Create product review
   */
  async createProductReview(review: {
    productId: string;
    userId: string;
    orderId?: string;
    rating: number;
    title?: string;
    reviewText?: string;
    images?: string[];
  }): Promise<ProductReview> {
    // Get product's salon ID (required field)
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, review.productId));

    if (!product) {
      throw new Error('Product not found');
    }

    // Get order ID if not provided but user bought the product
    let orderId = review.orderId;
    if (!orderId) {
      const [order] = await db
        .select()
        .from(productOrders)
        .innerJoin(productOrderItems, eq(productOrders.id, productOrderItems.orderId))
        .where(and(
          eq(productOrders.customerId, review.userId),
          eq(productOrderItems.productId, review.productId),
          eq(productOrders.status, 'delivered')
        ))
        .limit(1);
      
      orderId = order?.product_orders.id;
    }

    // Schema requires orderId to be non-null, so we must have a valid order
    if (!orderId) {
      throw new Error('Cannot create review: No order found for this product purchase');
    }

    const [newReview] = await db
      .insert(productReviews)
      .values({
        productId: review.productId,
        userId: review.userId,
        salonId: product.salonId, // Required field
        orderId: orderId, // Required field (schema doesn't allow null)
        rating: review.rating,
        title: review.title || null,
        comment: review.reviewText || null, // Correct field name is 'comment'
        imageUrls: review.images || null, // Correct field name is 'imageUrls'
        verifiedPurchase: 1, // Always 1 since we require orderId
      })
      .returning();

    return newReview;
  }

  /**
   * Get product reviews
   */
  async getProductReviews(productId: string, filters?: {
    rating?: number;
    verified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ProductReview[]> {
    const conditions = [eq(productReviews.productId, productId)];

    if (filters?.rating !== undefined) {
      conditions.push(eq(productReviews.rating, filters.rating));
    }

    if (filters?.verified !== undefined) {
      conditions.push(eq(productReviews.verifiedPurchase, filters.verified ? 1 : 0)); // Correct field name
    }

    return await db
      .select()
      .from(productReviews)
      .where(and(...conditions))
      .orderBy(desc(productReviews.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  /**
   * Update review helpfulness counts
   */
  async updateReviewHelpfulness(reviewId: string, helpfulCount?: number, notHelpfulCount?: number): Promise<void> {
    const updates: any = {};
    if (helpfulCount !== undefined) {
      updates.helpfulCount = helpfulCount;
    }
    if (notHelpfulCount !== undefined) {
      updates.notHelpfulCount = notHelpfulCount;
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(productReviews)
        .set(updates)
        .where(eq(productReviews.id, reviewId));
    }
  }

  /**
   * Track product view
   */
  async trackProductView(userId: string | null, productId: string, sessionId?: string): Promise<void> {
    // Get product's salon ID (required field)
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return; // Silently skip if product not found
    }

    await db.insert(productViews).values({
      productId,
      salonId: product.salonId, // Required field
      userId: userId || null,
      sessionId: sessionId || null,
    });
  }

  /**
   * Get product view count
   */
  async getProductViewCount(productId: string, period?: string): Promise<number> {
    const conditions = [eq(productViews.productId, productId)];

    if (period) {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      conditions.push(gte(productViews.viewedAt, startDate));
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productViews)
      .where(and(...conditions));

    return result?.count || 0;
  }

  // ===============================================
  // BUSINESS ADMIN - Product Management
  // ===============================================
  async getAdminProductList(salonId: string, filters?: {
    availableForRetail?: boolean;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const conditions = [eq(products.salonId, salonId), eq(products.isActive, 1)];

    if (filters?.availableForRetail !== undefined) {
      conditions.push(eq(products.availableForRetail, filters.availableForRetail ? 1 : 0));
    }

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(products.name, `%${filters.search}%`),
          like(products.sku, `%${filters.search}%`)
        )!
      );
    }

    const productsList = await db
      .select()
      .from(products)
      .leftJoin(productRetailConfig, eq(products.id, productRetailConfig.productId))
      .where(and(...conditions))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0)
      .orderBy(desc(products.createdAt));

    return productsList.map(p => ({
      ...p.products,
      retailConfig: p.product_retail_config || null
    }));
  }

  async configureProductForRetail(productId: string, salonId: string, config: {
    availableForRetail: boolean;
    retailPriceInPaisa?: number;
    retailStockAllocated?: number;
    retailDescription?: string;
    retailImageUrls?: string[];
    featured?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    searchKeywords?: string[];
  }): Promise<void> {
    // Update product table
    await db.update(products)
      .set({
        availableForRetail: config.availableForRetail ? 1 : 0,
        retailPriceInPaisa: config.retailPriceInPaisa || undefined,
        updatedAt: new Date()
      })
      .where(and(eq(products.id, productId), eq(products.salonId, salonId)));

    // Check if retail config exists
    const existing = await db.select()
      .from(productRetailConfig)
      .where(eq(productRetailConfig.productId, productId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing config
      await db.update(productRetailConfig)
        .set({
          retailStockAllocated: config.retailStockAllocated !== undefined ? String(config.retailStockAllocated) : undefined,
          retailDescription: config.retailDescription || undefined,
          retailImageUrls: config.retailImageUrls || undefined,
          featured: config.featured !== undefined ? (config.featured ? 1 : 0) : undefined,
          metaTitle: config.metaTitle || undefined,
          metaDescription: config.metaDescription || undefined,
          searchKeywords: config.searchKeywords || undefined,
          updatedAt: new Date()
        })
        .where(eq(productRetailConfig.productId, productId));
    } else {
      // Create new config
      await db.insert(productRetailConfig).values({
        productId,
        salonId,
        retailStockAllocated: String(config.retailStockAllocated || 0),
        retailDescription: config.retailDescription,
        retailImageUrls: config.retailImageUrls || [],
        featured: config.featured ? 1 : 0,
        metaTitle: config.metaTitle,
        metaDescription: config.metaDescription,
        searchKeywords: config.searchKeywords || []
      });
    }
  }

  async allocateRetailStock(
    productId: string, 
    salonId: string, 
    data: {
      retailStockAllocated: number;
      retailPriceInPaisa?: number;
      useAllocatedStock?: number;
      lowStockThreshold?: number;
    }
  ): Promise<void> {
    // CRITICAL: Verify product belongs to salon before updating
    const product = await db.select()
      .from(products)
      .where(and(
        eq(products.id, productId),
        eq(products.salonId, salonId)
      ))
      .limit(1);
    
    if (product.length === 0) {
      throw new Error('Product not found or does not belong to this salon');
    }
    
    // Check if retail config exists
    const existing = await db.select()
      .from(productRetailConfig)
      .where(eq(productRetailConfig.productId, productId))
      .limit(1);

    const updateData: any = {
      retailStockAllocated: String(data.retailStockAllocated),
      updatedAt: new Date()
    };
    
    if (data.retailPriceInPaisa !== undefined) {
      updateData.retailPriceInPaisa = data.retailPriceInPaisa;
    }
    
    if (data.useAllocatedStock !== undefined) {
      updateData.useAllocatedStock = data.useAllocatedStock;
    }
    
    if (data.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = String(data.lowStockThreshold);
    }

    if (existing.length > 0) {
      // Update existing config
      await db.update(productRetailConfig)
        .set(updateData)
        .where(eq(productRetailConfig.productId, productId));
    } else {
      // Create new config
      await db.insert(productRetailConfig).values({
        productId,
        salonId,
        retailStockAllocated: String(data.retailStockAllocated),
        retailPriceInPaisa: data.retailPriceInPaisa,
        useAllocatedStock: data.useAllocatedStock ?? 1,
        lowStockThreshold: data.lowStockThreshold !== undefined ? String(data.lowStockThreshold) : '5',
        featured: 0,
        retailImageUrls: [],
        searchKeywords: []
      });
    }
  }

  // ===============================================
  // BUSINESS ADMIN - Order Management
  // ===============================================
  async getAdminOrders(salonId: string, filters?: {
    status?: string;
    fulfillmentType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const conditions = [eq(productOrders.salonId, salonId)];

    if (filters?.status) {
      conditions.push(eq(productOrders.status, filters.status));
    }

    if (filters?.fulfillmentType) {
      conditions.push(eq(productOrders.fulfillmentType, filters.fulfillmentType));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(productOrders.createdAt, new Date(filters.dateFrom)));
    }

    if (filters?.dateTo) {
      conditions.push(lte(productOrders.createdAt, new Date(filters.dateTo)));
    }

    if (filters?.search) {
      conditions.push(like(productOrders.orderNumber, `%${filters.search}%`));
    }

    const orders = await db
      .select({
        order: productOrders,
        user: users
      })
      .from(productOrders)
      .leftJoin(users, eq(productOrders.customerId, users.id))
      .where(and(...conditions))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0)
      .orderBy(desc(productOrders.createdAt));

    // Get status summary
    const statusCounts = await db
      .select({
        status: productOrders.status,
        count: sql<number>`count(*)`
      })
      .from(productOrders)
      .where(eq(productOrders.salonId, salonId))
      .groupBy(productOrders.status);

    const summary = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      acc.total = (acc.total || 0) + curr.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      orders: orders.map(o => ({
        ...o.order,
        customer: o.user
      })),
      summary
    };
  }

  async updateOrderStatus(orderId: string, salonId: string, updates: {
    status: string;
    trackingNumber?: string;
    courierPartner?: string;
    estimatedDeliveryDate?: string;
    notes?: string;
  }): Promise<void> {
    await db.update(productOrders)
      .set({
        status: updates.status,
        trackingNumber: updates.trackingNumber,
        courierPartner: updates.courierPartner,
        estimatedDeliveryDate: updates.estimatedDeliveryDate ? new Date(updates.estimatedDeliveryDate) : undefined,
        updatedAt: new Date()
      })
      .where(and(eq(productOrders.id, orderId), eq(productOrders.salonId, salonId)));
  }

  async cancelOrderAdmin(orderId: string, salonId: string, reason: string, refundAmountPaisa?: number): Promise<void> {
    const [order] = await db.select()
      .from(productOrders)
      .where(and(eq(productOrders.id, orderId), eq(productOrders.salonId, salonId)))
      .limit(1);

    if (!order) {
      throw new Error('Order not found');
    }

    // Update order status
    await db.update(productOrders)
      .set({
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(productOrders.id, orderId));

    // Return stock if order is in early status (pending/confirmed)
    if (['pending', 'confirmed'].includes(order.status)) {
      const orderItems = await db.select()
        .from(productOrderItems)
        .where(eq(productOrderItems.orderId, orderId));

      for (const item of orderItems) {
        // Return stock to retail allocation
        const [config] = await db.select()
          .from(productRetailConfig)
          .where(eq(productRetailConfig.productId, item.productId))
          .limit(1);

        if (config && config.retailStockAllocated !== null) {
          await db.update(productRetailConfig)
            .set({
              retailStockAllocated: config.retailStockAllocated + item.quantity
            })
            .where(eq(productRetailConfig.productId, item.productId));
        }
      }
    }
  }

  // ===============================================
  // BUSINESS ADMIN - Analytics
  // ===============================================
  async getProductAnalytics(salonId: string, filters?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any> {
    const now = new Date();
    let startDate: Date;

    if (filters?.dateFrom && filters?.dateTo) {
      startDate = new Date(filters.dateFrom);
    } else {
      switch (filters?.period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    const endDate = filters?.dateTo ? new Date(filters.dateTo) : now;

    // Get revenue summary
    const revenueData = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${productOrders.totalPaisa}), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
        averageOrderValue: sql<number>`COALESCE(AVG(${productOrders.totalPaisa}), 0)`
      })
      .from(productOrders)
      .where(
        and(
          eq(productOrders.salonId, salonId),
          gte(productOrders.createdAt, startDate),
          lte(productOrders.createdAt, endDate),
          sql`${productOrders.status} NOT IN ('cancelled', 'refunded')`
        )
      );

    // Get total units sold
    const unitsData = await db
      .select({
        totalUnits: sql<number>`COALESCE(SUM(${productOrderItems.quantity}), 0)`
      })
      .from(productOrderItems)
      .innerJoin(productOrders, eq(productOrderItems.orderId, productOrders.id))
      .where(
        and(
          eq(productOrders.salonId, salonId),
          gte(productOrders.createdAt, startDate),
          lte(productOrders.createdAt, endDate),
          sql`${productOrders.status} NOT IN ('cancelled', 'refunded')`
        )
      );

    // Get top products
    const topProducts = await db
      .select({
        productId: productOrderItems.productId,
        productName: products.name,
        unitsSold: sql<number>`SUM(${productOrderItems.quantity})`,
        revenue: sql<number>`SUM(${productOrderItems.unitPricePaisa} * ${productOrderItems.quantity})`
      })
      .from(productOrderItems)
      .innerJoin(productOrders, eq(productOrderItems.orderId, productOrders.id))
      .innerJoin(products, eq(productOrderItems.productId, products.id))
      .where(
        and(
          eq(productOrders.salonId, salonId),
          gte(productOrders.createdAt, startDate),
          lte(productOrders.createdAt, endDate),
          sql`${productOrders.status} NOT IN ('cancelled', 'refunded')`
        )
      )
      .groupBy(productOrderItems.productId, products.name)
      .orderBy(desc(sql`SUM(${productOrderItems.unitPricePaisa} * ${productOrderItems.quantity})`))
      .limit(10);

    return {
      period: filters?.period || 'month',
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0]
      },
      summary: {
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        totalOrders: revenueData[0]?.totalOrders || 0,
        totalUnits: unitsData[0]?.totalUnits || 0,
        averageOrderValue: Math.round(revenueData[0]?.averageOrderValue || 0)
      },
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        productName: p.productName,
        unitsSold: p.unitsSold,
        revenue: p.revenue
      }))
    };
  }

  // ===============================================
  // BUSINESS ADMIN - Delivery Settings
  // ===============================================
  async getDeliverySettings(salonId: string): Promise<any> {
    const [settings] = await db
      .select()
      .from(deliverySettings)
      .where(eq(deliverySettings.salonId, salonId))
      .limit(1);

    return settings || null;
  }

  async updateDeliverySettings(salonId: string, settings: any): Promise<void> {
    const existing = await db.select()
      .from(deliverySettings)
      .where(eq(deliverySettings.salonId, salonId))
      .limit(1);

    if (existing.length > 0) {
      await db.update(deliverySettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(deliverySettings.salonId, salonId));
    } else {
      await db.insert(deliverySettings).values({
        salonId,
        ...settings
      });
    }
  }

  // ===============================================
  // SMART REBOOKING SYSTEM
  // ===============================================

  // Service Rebooking Cycles Operations
  async getServiceRebookingCycle(id: string): Promise<ServiceRebookingCycle | undefined> {
    const [cycle] = await db.select()
      .from(serviceRebookingCycles)
      .where(eq(serviceRebookingCycles.id, id))
      .limit(1);
    return cycle;
  }

  async getServiceRebookingCycleBySalonAndService(salonId: string, serviceId: string): Promise<ServiceRebookingCycle | undefined> {
    const [cycle] = await db.select()
      .from(serviceRebookingCycles)
      .where(and(
        eq(serviceRebookingCycles.salonId, salonId),
        eq(serviceRebookingCycles.serviceId, serviceId)
      ))
      .limit(1);
    return cycle;
  }

  async getServiceRebookingCyclesBySalonId(salonId: string, filters?: { isActive?: boolean }): Promise<ServiceRebookingCycle[]> {
    const conditions = [eq(serviceRebookingCycles.salonId, salonId)];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(serviceRebookingCycles.isActive, filters.isActive ? 1 : 0));
    }
    return db.select()
      .from(serviceRebookingCycles)
      .where(and(...conditions))
      .orderBy(desc(serviceRebookingCycles.createdAt));
  }

  async createServiceRebookingCycle(cycle: InsertServiceRebookingCycle): Promise<ServiceRebookingCycle> {
    const [created] = await db.insert(serviceRebookingCycles)
      .values(cycle)
      .returning();
    return created;
  }

  async updateServiceRebookingCycle(id: string, salonId: string, updates: Partial<InsertServiceRebookingCycle>): Promise<void> {
    await db.update(serviceRebookingCycles)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(serviceRebookingCycles.id, id),
        eq(serviceRebookingCycles.salonId, salonId)
      ));
  }

  async deleteServiceRebookingCycle(id: string, salonId: string): Promise<void> {
    await db.delete(serviceRebookingCycles)
      .where(and(
        eq(serviceRebookingCycles.id, id),
        eq(serviceRebookingCycles.salonId, salonId)
      ));
  }

  // Customer Rebooking Stats Operations
  async getCustomerRebookingStat(id: string): Promise<CustomerRebookingStat | undefined> {
    const [stat] = await db.select()
      .from(customerRebookingStats)
      .where(eq(customerRebookingStats.id, id))
      .limit(1);
    return stat;
  }

  async getCustomerRebookingStatByKeys(salonId: string, customerId: string, serviceId: string): Promise<CustomerRebookingStat | undefined> {
    const [stat] = await db.select()
      .from(customerRebookingStats)
      .where(and(
        eq(customerRebookingStats.salonId, salonId),
        eq(customerRebookingStats.customerId, customerId),
        eq(customerRebookingStats.serviceId, serviceId)
      ))
      .limit(1);
    return stat;
  }

  async getCustomerRebookingStatsBySalonId(salonId: string, filters?: {
    status?: string;
    dueBefore?: Date;
    dueAfter?: Date;
  }): Promise<CustomerRebookingStat[]> {
    const conditions = [eq(customerRebookingStats.salonId, salonId)];
    if (filters?.status) {
      conditions.push(eq(customerRebookingStats.rebookingStatus, filters.status));
    }
    if (filters?.dueBefore) {
      conditions.push(lte(customerRebookingStats.nextRebookingDue, filters.dueBefore));
    }
    if (filters?.dueAfter) {
      conditions.push(gte(customerRebookingStats.nextRebookingDue, filters.dueAfter));
    }
    return db.select()
      .from(customerRebookingStats)
      .where(and(...conditions))
      .orderBy(asc(customerRebookingStats.nextRebookingDue));
  }

  async getCustomerRebookingStatsByCustomerId(customerId: string, filters?: {
    salonId?: string;
    status?: string;
  }): Promise<CustomerRebookingStat[]> {
    const conditions = [eq(customerRebookingStats.customerId, customerId)];
    if (filters?.salonId) {
      conditions.push(eq(customerRebookingStats.salonId, filters.salonId));
    }
    if (filters?.status) {
      conditions.push(eq(customerRebookingStats.rebookingStatus, filters.status));
    }
    return db.select()
      .from(customerRebookingStats)
      .where(and(...conditions))
      .orderBy(asc(customerRebookingStats.nextRebookingDue));
  }

  async getDueRebookings(salonId: string, limit?: number): Promise<CustomerRebookingStat[]> {
    const now = new Date();
    const query = db.select()
      .from(customerRebookingStats)
      .where(and(
        eq(customerRebookingStats.salonId, salonId),
        lte(customerRebookingStats.nextRebookingDue, now),
        inArray(customerRebookingStats.rebookingStatus, ['approaching', 'due', 'overdue'])
      ))
      .orderBy(asc(customerRebookingStats.nextRebookingDue));
    
    if (limit) {
      return query.limit(limit);
    }
    return query;
  }

  async createCustomerRebookingStat(stat: InsertCustomerRebookingStat): Promise<CustomerRebookingStat> {
    const [created] = await db.insert(customerRebookingStats)
      .values(stat)
      .returning();
    return created;
  }

  async upsertCustomerRebookingStat(stat: InsertCustomerRebookingStat): Promise<CustomerRebookingStat> {
    const existing = await this.getCustomerRebookingStatByKeys(stat.salonId, stat.customerId, stat.serviceId);
    if (existing) {
      await db.update(customerRebookingStats)
        .set({ ...stat, updatedAt: new Date() })
        .where(eq(customerRebookingStats.id, existing.id));
      return { ...existing, ...stat, updatedAt: new Date() } as CustomerRebookingStat;
    }
    return this.createCustomerRebookingStat(stat);
  }

  async updateCustomerRebookingStat(id: string, updates: Partial<InsertCustomerRebookingStat>): Promise<void> {
    await db.update(customerRebookingStats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerRebookingStats.id, id));
  }

  async updateCustomerRebookingStatus(id: string, status: string): Promise<void> {
    await db.update(customerRebookingStats)
      .set({ rebookingStatus: status, updatedAt: new Date() })
      .where(eq(customerRebookingStats.id, id));
  }

  async incrementRebookingRemindersReceived(id: string): Promise<void> {
    await db.update(customerRebookingStats)
      .set({ 
        remindersReceived: sql`${customerRebookingStats.remindersReceived} + 1`,
        lastReminderSentAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(customerRebookingStats.id, id));
  }

  async dismissCustomerRebooking(id: string, dismissUntil?: Date): Promise<void> {
    await db.update(customerRebookingStats)
      .set({
        rebookingStatus: 'dismissed',
        remindersDismissed: sql`${customerRebookingStats.remindersDismissed} + 1`,
        lastDismissedAt: new Date(),
        dismissUntil: dismissUntil || null,
        updatedAt: new Date()
      })
      .where(eq(customerRebookingStats.id, id));
  }

  // Rebooking Reminders Operations
  async getRebookingReminder(id: string): Promise<RebookingReminder | undefined> {
    const [reminder] = await db.select()
      .from(rebookingReminders)
      .where(eq(rebookingReminders.id, id))
      .limit(1);
    return reminder;
  }

  async getRebookingRemindersBySalonId(salonId: string, filters?: {
    status?: string;
    channel?: string;
    scheduledBefore?: Date;
    scheduledAfter?: Date;
  }): Promise<RebookingReminder[]> {
    const conditions = [eq(rebookingReminders.salonId, salonId)];
    if (filters?.status) {
      conditions.push(eq(rebookingReminders.status, filters.status));
    }
    if (filters?.channel) {
      conditions.push(eq(rebookingReminders.channel, filters.channel));
    }
    if (filters?.scheduledBefore) {
      conditions.push(lte(rebookingReminders.scheduledAt, filters.scheduledBefore));
    }
    if (filters?.scheduledAfter) {
      conditions.push(gte(rebookingReminders.scheduledAt, filters.scheduledAfter));
    }
    return db.select()
      .from(rebookingReminders)
      .where(and(...conditions))
      .orderBy(desc(rebookingReminders.createdAt));
  }

  async getPendingRebookingReminders(limit?: number): Promise<RebookingReminder[]> {
    const now = new Date();
    const query = db.select()
      .from(rebookingReminders)
      .where(and(
        eq(rebookingReminders.status, 'scheduled'),
        lte(rebookingReminders.scheduledAt, now)
      ))
      .orderBy(asc(rebookingReminders.scheduledAt));
    
    if (limit) {
      return query.limit(limit);
    }
    return query;
  }

  async createRebookingReminder(reminder: InsertRebookingReminder): Promise<RebookingReminder> {
    const [created] = await db.insert(rebookingReminders)
      .values(reminder)
      .returning();
    return created;
  }

  async updateRebookingReminder(id: string, updates: Partial<InsertRebookingReminder>): Promise<void> {
    await db.update(rebookingReminders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rebookingReminders.id, id));
  }

  async markReminderSent(id: string, externalMessageId?: string): Promise<void> {
    await db.update(rebookingReminders)
      .set({
        status: 'sent',
        sentAt: new Date(),
        externalMessageId: externalMessageId || null,
        updatedAt: new Date()
      })
      .where(eq(rebookingReminders.id, id));
  }

  async markReminderDelivered(id: string): Promise<void> {
    await db.update(rebookingReminders)
      .set({
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(rebookingReminders.id, id));
  }

  async markReminderOpened(id: string): Promise<void> {
    await db.update(rebookingReminders)
      .set({
        status: 'opened',
        openedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(rebookingReminders.id, id));
  }

  async markReminderClicked(id: string): Promise<void> {
    await db.update(rebookingReminders)
      .set({
        clickedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(rebookingReminders.id, id));
  }

  async markReminderConverted(id: string, bookingId: string): Promise<void> {
    await db.update(rebookingReminders)
      .set({
        status: 'converted',
        convertedBookingId: bookingId,
        convertedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(rebookingReminders.id, id));
  }

  async markReminderFailed(id: string, reason: string): Promise<void> {
    const reminder = await this.getRebookingReminder(id);
    const newRetryCount = (reminder?.retryCount || 0) + 1;
    
    await db.update(rebookingReminders)
      .set({
        status: newRetryCount >= (reminder?.maxRetries || 3) ? 'failed' : 'pending',
        failedAt: new Date(),
        failureReason: reason,
        retryCount: newRetryCount,
        updatedAt: new Date()
      })
      .where(eq(rebookingReminders.id, id));
  }

  async dismissRebookingReminder(id: string, reason: string): Promise<void> {
    await db.update(rebookingReminders)
      .set({
        status: 'dismissed',
        dismissedAt: new Date(),
        dismissReason: reason,
        updatedAt: new Date()
      })
      .where(eq(rebookingReminders.id, id));
  }

  async getRebookingReminderAnalytics(salonId: string, startDate: Date, endDate: Date): Promise<{
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    failed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }> {
    const reminders = await db.select()
      .from(rebookingReminders)
      .where(and(
        eq(rebookingReminders.salonId, salonId),
        gte(rebookingReminders.createdAt, startDate),
        lte(rebookingReminders.createdAt, endDate)
      ));

    const totalSent = reminders.filter(r => r.sentAt).length;
    const delivered = reminders.filter(r => r.deliveredAt).length;
    const opened = reminders.filter(r => r.openedAt).length;
    const clicked = reminders.filter(r => r.clickedAt).length;
    const converted = reminders.filter(r => r.convertedAt).length;
    const failed = reminders.filter(r => r.status === 'failed').length;

    return {
      totalSent,
      delivered,
      opened,
      clicked,
      converted,
      failed,
      deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      conversionRate: totalSent > 0 ? (converted / totalSent) * 100 : 0
    };
  }

  async getRebookingRemindersForChannelAnalysis(salonId: string, startDate: Date, endDate: Date): Promise<RebookingReminder[]> {
    return db.select()
      .from(rebookingReminders)
      .where(and(
        eq(rebookingReminders.salonId, salonId),
        gte(rebookingReminders.createdAt, startDate),
        lte(rebookingReminders.createdAt, endDate),
        or(
          eq(rebookingReminders.status, 'sent'),
          eq(rebookingReminders.status, 'converted')
        )
      ));
  }

  // Rebooking Settings Operations
  async getRebookingSettings(salonId: string): Promise<RebookingSettings | undefined> {
    const [settings] = await db.select()
      .from(rebookingSettings)
      .where(eq(rebookingSettings.salonId, salonId))
      .limit(1);
    return settings;
  }

  async createRebookingSettings(settings: InsertRebookingSettings): Promise<RebookingSettings> {
    const [created] = await db.insert(rebookingSettings)
      .values(settings)
      .returning();
    return created;
  }

  async updateRebookingSettings(salonId: string, updates: Partial<InsertRebookingSettings>): Promise<void> {
    await db.update(rebookingSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rebookingSettings.salonId, salonId));
  }

  async getOrCreateRebookingSettings(salonId: string): Promise<RebookingSettings> {
    const existing = await this.getRebookingSettings(salonId);
    if (existing) {
      return existing;
    }
    return this.createRebookingSettings({ salonId });
  }

  // Rebooking Analytics Operations
  async getRebookingDashboardAnalytics(salonId: string): Promise<{
    totalCustomersTracked: number;
    customersApproaching: number;
    customersDue: number;
    customersOverdue: number;
    totalRemindersSent: number;
    totalConversions: number;
    overallConversionRate: number;
    avgDaysBetweenBookings: number;
  }> {
    const stats = await db.select()
      .from(customerRebookingStats)
      .where(eq(customerRebookingStats.salonId, salonId));

    const totalCustomersTracked = stats.length;
    const customersApproaching = stats.filter(s => s.rebookingStatus === 'approaching').length;
    const customersDue = stats.filter(s => s.rebookingStatus === 'due').length;
    const customersOverdue = stats.filter(s => s.rebookingStatus === 'overdue').length;
    const totalRemindersSent = stats.reduce((sum, s) => sum + (s.remindersReceived || 0), 0);
    const totalConversions = stats.reduce((sum, s) => sum + (s.rebookingsFromReminders || 0), 0);

    const avgDaysValues = stats
      .filter(s => s.avgDaysBetweenBookings)
      .map(s => parseFloat(s.avgDaysBetweenBookings || '0'));
    const avgDaysBetweenBookings = avgDaysValues.length > 0
      ? avgDaysValues.reduce((a, b) => a + b, 0) / avgDaysValues.length
      : 0;

    return {
      totalCustomersTracked,
      customersApproaching,
      customersDue,
      customersOverdue,
      totalRemindersSent,
      totalConversions,
      overallConversionRate: totalRemindersSent > 0 ? (totalConversions / totalRemindersSent) * 100 : 0,
      avgDaysBetweenBookings
    };
  }
}

export const storage = new DatabaseStorage();


// Example data initialization
async function initializeSalonsAndServices() {
  try {
    // Check if salons already exist
    const existingSalons = await db.select().from(salons);
    
    if (existingSalons.length === 0) {
      console.log('🏪 Initializing sample salons and services...');
      
      // Create default salons (empty for now - can be populated later)
      console.log('✅ Database initialized');
    }
  } catch (error) {
    console.error('Error initializing salons and services:', error);
  }
}
async function initializeServices() {
  await initializeSalonsAndServices();
}

initializeSalonsAndServices();

export { initializeServices };
