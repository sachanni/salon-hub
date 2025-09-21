/**
 * Business Setup Service
 * Centralized business logic for salon setup completion tracking
 * Follows industry standards for clean architecture and separation of concerns
 */

export interface BusinessSetupStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  validationErrors: string[];
}

export interface BusinessSetupState {
  currentStep: string;
  steps: BusinessSetupStep[];
  canPublish: boolean;
  completionPercentage: number;
}

/**
 * Business rules for determining step completion
 * Each step has clear, testable criteria
 */
export class BusinessSetupService {
  
  static checkProfileCompletion(salonData: any): { completed: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!salonData?.name?.trim()) errors.push("Business name is required");
    if (!salonData?.category?.trim()) errors.push("Business category is required");
    if (!salonData?.address?.trim()) errors.push("Street address is required");
    if (!salonData?.city?.trim()) errors.push("City is required");
    if (!salonData?.phone?.trim()) errors.push("Phone number is required");
    
    return {
      completed: errors.length === 0,
      errors
    };
  }

  static checkServicesCompletion(services: any[]): { completed: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!services || services.length === 0) {
      errors.push("At least one service is required");
    } else {
      // Validate each service has required fields
      const invalidServices = services.filter(service => 
        !service.name?.trim() || 
        !service.price || 
        service.price <= 0 ||
        !service.duration ||
        service.duration <= 0
      );
      
      if (invalidServices.length > 0) {
        errors.push(`${invalidServices.length} service(s) have missing or invalid information`);
      }
    }
    
    return {
      completed: errors.length === 0,
      errors
    };
  }

  static checkStaffCompletion(staff: any[]): { completed: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Staff is optional but if added, must be valid
    if (staff && staff.length > 0) {
      const invalidStaff = staff.filter(member => 
        !member.name?.trim() || 
        !member.email?.trim() ||
        !member.role?.trim()
      );
      
      if (invalidStaff.length > 0) {
        errors.push(`${invalidStaff.length} staff member(s) have missing information`);
      }
    }
    
    return {
      completed: errors.length === 0,
      errors
    };
  }

  static checkBookingSettingsCompletion(settings: any): { completed: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Booking settings are optional with sensible defaults
    // No validation errors - always considered complete
    
    return {
      completed: true,
      errors
    };
  }

  static checkMediaCompletion(media: any[]): { completed: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Media is optional
    // No validation errors - always considered complete
    
    return {
      completed: true,
      errors
    };
  }

  /**
   * Calculate overall business setup state
   * Returns comprehensive state for UI components
   */
  static calculateSetupState(data: {
    salonData?: any;
    services?: any[];
    staff?: any[];
    bookingSettings?: any;
    media?: any[];
  }): BusinessSetupState {
    const profileCheck = this.checkProfileCompletion(data.salonData);
    const servicesCheck = this.checkServicesCompletion(data.services || []);
    const staffCheck = this.checkStaffCompletion(data.staff || []);
    const settingsCheck = this.checkBookingSettingsCompletion(data.bookingSettings);
    const mediaCheck = this.checkMediaCompletion(data.media || []);

    const steps: BusinessSetupStep[] = [
      {
        id: 'profile',
        title: 'Business Profile',
        description: 'Basic business information',
        required: true,
        completed: profileCheck.completed,
        validationErrors: profileCheck.errors
      },
      {
        id: 'services',
        title: 'Services & Pricing',
        description: 'What services do you offer?',
        required: true,
        completed: servicesCheck.completed,
        validationErrors: servicesCheck.errors
      },
      {
        id: 'staff',
        title: 'Staff Management',
        description: 'Add your team members',
        required: false,
        completed: staffCheck.completed,
        validationErrors: staffCheck.errors
      },
      {
        id: 'settings',
        title: 'Booking Settings',
        description: 'Configure booking policies',
        required: false,
        completed: settingsCheck.completed,
        validationErrors: settingsCheck.errors
      },
      {
        id: 'media',
        title: 'Photos & Media',
        description: 'Showcase your business',
        required: false,
        completed: mediaCheck.completed,
        validationErrors: mediaCheck.errors
      }
    ];

    const requiredSteps = steps.filter(step => step.required);
    const completedRequired = requiredSteps.filter(step => step.completed);
    const allStepsCompleted = steps.filter(step => step.completed);
    
    const completionPercentage = Math.round((allStepsCompleted.length / steps.length) * 100);
    const canPublish = requiredSteps.every(step => step.completed);
    
    // Determine current step - first incomplete required step, or first incomplete optional step
    const firstIncompleteRequired = requiredSteps.find(step => !step.completed);
    const firstIncomplete = steps.find(step => !step.completed);
    const currentStep = firstIncompleteRequired?.id || firstIncomplete?.id || 'overview';

    return {
      currentStep,
      steps,
      canPublish,
      completionPercentage
    };
  }

  /**
   * Get next recommended step for auto-navigation
   */
  static getNextStep(currentStepId: string, setupState: BusinessSetupState): string {
    const currentIndex = setupState.steps.findIndex(step => step.id === currentStepId);
    
    if (currentIndex === -1) return setupState.currentStep;
    
    // Find next incomplete step
    for (let i = currentIndex + 1; i < setupState.steps.length; i++) {
      if (!setupState.steps[i].completed) {
        return setupState.steps[i].id;
      }
    }
    
    // All steps complete - go to overview
    return 'overview';
  }
}