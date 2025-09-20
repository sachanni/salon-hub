import { apiRequest } from "./queryClient";

export interface SocialAuthData {
  provider: 'google' | 'facebook' | 'apple';
  token: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

export async function handleSocialAuth(
  provider: string, 
  credential: any, 
  userType: 'customer' | 'owner'
): Promise<any> {
  try {
    let authData: SocialAuthData;

    switch (provider) {
      case 'google':
        // Decode Google JWT token
        if (!credential.credential) {
          throw new Error('No Google credential received');
        }
        
        try {
          // Safely parse Google JWT token
          const tokenParts = credential.credential.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid JWT format');
          }
          
          const payloadString = atob(tokenParts[1]);
          if (typeof payloadString !== 'string') {
            throw new Error('Invalid JWT payload');
          }
          
          const payload = JSON.parse(payloadString);
          authData = {
            provider: 'google',
            token: credential.credential,
            email: payload.email,
            firstName: payload.given_name,
            lastName: payload.family_name,
            profileImage: payload.picture,
          };
        } catch (error) {
          console.error('Error parsing Google JWT:', error);
          throw new Error('Failed to parse Google authentication token');
        }
        break;

      case 'facebook':
        // Facebook auth data would be processed from OAuth callback
        authData = {
          provider: 'facebook',
          token: credential.accessToken,
          email: credential.email,
          firstName: credential.firstName,
          lastName: credential.lastName,
          profileImage: credential.picture?.data?.url,
        };
        break;

      case 'apple':
        // Apple auth data would be processed from OAuth callback
        authData = {
          provider: 'apple',
          token: credential.authorization?.id_token,
          email: credential.user?.email,
          firstName: credential.user?.name?.firstName,
          lastName: credential.user?.name?.lastName,
        };
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Send to backend for processing
    const response = await apiRequest('/api/auth/social', 'POST', {
      ...authData,
      userType,
    });

    return response;
  } catch (error) {
    console.error('Social auth error:', error);
    throw error;
  }
}

export function generateSocialAuthState(userType: string): string {
  return `${userType}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

export function parseSocialAuthState(state: string): { userType: string } | null {
  try {
    const parts = state.split('-');
    if (parts.length >= 3) {
      return { userType: parts[0] };
    }
    return null;
  } catch {
    return null;
  }
}