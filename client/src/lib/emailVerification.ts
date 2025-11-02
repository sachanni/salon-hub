import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithEmailAndPassword,
  UserCredential,
  Auth
} from 'firebase/auth';
import { auth } from './firebase';

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function sendWelcomeEmailWithVerification(
  email: string,
  password: string
): Promise<EmailVerificationResult> {
  if (!auth) {
    return {
      success: false,
      message: 'Firebase not configured',
      error: 'Firebase authentication is not available'
    };
  }

  try {
    console.log('🔐 Creating Firebase user for email verification:', email);

    let userCredential: UserCredential;

    try {
      // Try to create a new user
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase user created successfully');
    } catch (createError: any) {
      if (createError.code === 'auth/email-already-in-use') {
        // If user already exists, sign them in and resend verification email
        console.log('⚠️ Firebase user already exists, signing in to resend verification');
        
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          console.log('✅ Signed in existing user');
          
          // Check if already verified
          if (userCredential.user.emailVerified) {
            console.log('✅ Email already verified');
            return {
              success: true,
              message: 'Email already verified'
            };
          }
        } catch (signInError: any) {
          console.error('❌ Failed to sign in existing user:', signInError);
          return {
            success: false,
            message: 'Unable to send verification email. Please try logging in and requesting a new verification email.',
            error: signInError.code || signInError.message
          };
        }
      } else {
        throw createError;
      }
    }

    // Send verification email
    await sendEmailVerification(userCredential.user, {
      url: `${window.location.origin}/email-verified`,
      handleCodeInApp: false,
    });

    console.log('📧 Verification email sent successfully');

    return {
      success: true,
      message: 'Welcome email with verification link sent successfully!'
    };

  } catch (error: any) {
    console.error('❌ Error sending verification email:', error);
    
    let errorMessage = 'Failed to send verification email';
    
    if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later';
    }

    return {
      success: false,
      message: errorMessage,
      error: error.code || error.message
    };
  }
}

export async function checkEmailVerificationStatus(auth: Auth | undefined): Promise<boolean> {
  if (!auth || !auth.currentUser) {
    return false;
  }

  await auth.currentUser.reload();
  return auth.currentUser.emailVerified;
}

export async function resendVerificationEmail(): Promise<EmailVerificationResult> {
  if (!auth || !auth.currentUser) {
    return {
      success: false,
      message: 'No user logged in',
      error: 'User must be logged in to resend verification email'
    };
  }

  try {
    await sendEmailVerification(auth.currentUser, {
      url: `${window.location.origin}/email-verified`,
      handleCodeInApp: false,
    });

    return {
      success: true,
      message: 'Verification email sent successfully!'
    };
  } catch (error: any) {
    console.error('❌ Error resending verification email:', error);
    
    return {
      success: false,
      message: 'Failed to resend verification email',
      error: error.code || error.message
    };
  }
}
