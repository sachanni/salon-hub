# Production Readiness Checklist - SalonHub Mobile

## ❌ Critical Issues (Must Fix Before Production)

### 1. Auth Token Persistence
**Status**: NOT IMPLEMENTED  
**Issue**: AuthContext stores user object but no JWT token. Authenticated API requests will fail.

**Fix Required**:
```typescript
// mobile/src/contexts/AuthContext.tsx
interface AuthState {
  user: User | null;
  token: string | null;  // ADD THIS
  isAuthenticated: boolean;
  // ...
}

// Use expo-secure-store for sensitive data
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  USER: '@salonhub:user',
  TOKEN: '@salonhub:token',  // Store in SecureStore, not AsyncStorage
  // ...
};

const login = async (user: User, token: string) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  // Update state...
};
```

**Fix API Service**:
```typescript
// mobile/src/services/api.ts
import * as SecureStore from 'expo-secure-store';

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('@salonhub:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 2. Platform-Specific API Base URL
**Status**: PARTIALLY IMPLEMENTED  
**Issue**: Only localhost fallback; needs device-specific guidance.

**Fix Required**:
```typescript
// mobile/.env.development
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000  # Your local machine IP

// mobile/.env.production
EXPO_PUBLIC_API_URL=https://api.salonhub.com
```

Add to README:
- iOS Simulator: `http://localhost:5000`
- Android Emulator: `http://10.0.2.2:5000`
- Physical Device: `http://YOUR_LOCAL_IP:5000`

### 3. Security: Remove Console Logs
**Status**: PRESENT IN CODE  
**Issue**: Sensitive data (location coords, push tokens) logged to console.

**Fix Required**:
```typescript
// Remove these lines:
console.log('Location obtained:', location.coords);  // REMOVE
console.log('Push token:', token);  // REMOVE
console.log('Permission ' + action);  // REMOVE

// Replace with secure logging service (production):
// logger.info('Permission granted'); // No sensitive data
```

### 4. OTP Rate Limiting
**Status**: UI TIMER ONLY  
**Issue**: No API throttling enforcement; resend can be spammed.

**Fix Required**:
```typescript
// Add state to track last request time
const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);

const handleRequestOTP = async () => {
  const now = Date.now();
  if (lastRequestTime && now - lastRequestTime < 60000) {
    Alert.alert('Please wait', 'You can request OTP again in a moment');
    return;
  }
  
  setLastRequestTime(now);
  // ... rest of logic
};
```

### 5. Secure Storage for JWT
**Status**: USING ASYNCSTORAGE  
**Issue**: Sensitive tokens should use platform-secure storage.

**Fix Required**:
```bash
# Install expo-secure-store
cd mobile && npx expo install expo-secure-store
```

```typescript
// Switch from AsyncStorage to SecureStore for tokens
import * as SecureStore from 'expo-secure-store';

// For tokens only
await SecureStore.setItemAsync('token', jwtToken);
const token = await SecureStore.getItemAsync('token');

// Keep AsyncStorage for non-sensitive data (user profile, preferences)
```

---

## ⚠️ Medium Priority Issues

### 6. Inline Error States
**Status**: USING ALERTS  
**Fix**: Add inline error messages below inputs instead of alerts.

```typescript
// Replace Alert.alert() with inline state:
const [errorMessage, setErrorMessage] = useState<string | null>(null);

// Display below input:
{errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
```

### 7. Onboarding Re-entry Guard
**Status**: PARTIAL  
**Fix**: Prevent re-showing onboarding if already completed.

```typescript
// mobile/app/index.tsx
useEffect(() => {
  if (!isLoading) {
    if (hasCompletedOnboarding) {
      router.replace('/home');  // Skip onboarding
    } else {
      router.replace('/onboarding/splash');
    }
  }
}, [isLoading, hasCompletedOnboarding]);
```

### 8. Permission Denial UX
**Status**: BASIC ALERT  
**Fix**: Add "Open Settings" option when permissions denied.

```typescript
import { Linking } from 'react-native';

if (status !== 'granted') {
  Alert.alert(
    'Permission Denied',
    'Location access helps us find salons near you.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Open Settings', 
        onPress: () => Linking.openSettings() 
      }
    ]
  );
}
```

### 9. Input Validation States
**Status**: SUBMIT-TIME ONLY  
**Fix**: Real-time validation feedback.

```typescript
const [isPhoneValid, setIsPhoneValid] = useState<boolean | null>(null);

<TextInput
  onChangeText={(text) => {
    setPhoneNumber(text);
    setIsPhoneValid(validatePhoneNumber(text));
  }}
  style={[
    styles.input,
    isPhoneValid === false && styles.inputError,
    isPhoneValid === true && styles.inputSuccess
  ]}
/>
```

---

## 📋 Polish & Enhancement Items

### 10. Loading Skeleton States
Add skeleton screens while data loads.

### 11. Accessibility (a11y)
- Add `accessibilityLabel` to all interactive elements
- Support screen readers
- Larger touch targets (minimum 44x44pt)

### 12. Offline Support
- Cache user data
- Queue failed API requests
- Show offline indicator

### 13. Error Boundary
Catch React errors and show fallback UI.

```typescript
// mobile/app/_layout.tsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary FallbackComponent={ErrorFallback}>
  {children}
</ErrorBoundary>
```

### 14. Analytics & Crash Reporting
- Firebase Analytics
- Sentry for crash reports
- Track onboarding completion rate

### 15. Deep Linking
Handle `salonhub://` URLs.

```typescript
// app.json
"scheme": "salonhub"

// Handle incoming links
Linking.addEventListener('url', handleDeepLink);
```

---

## ✅ Already Implemented (Good)

- ✅ TypeScript for type safety
- ✅ Expo Router navigation
- ✅ AuthContext state management
- ✅ AsyncStorage persistence (non-sensitive data)
- ✅ Native permission requests
- ✅ Animated UI components
- ✅ Phone number validation (India format)
- ✅ OTP auto-focus and paste support
- ✅ Resend timer (27s)
- ✅ Loading states on API calls
- ✅ Error handling (alerts)
- ✅ Comprehensive documentation

---

## 🎯 Immediate Action Items (Priority Order)

1. **Install expo-secure-store**: `npx expo install expo-secure-store`
2. **Update AuthContext**: Add token storage using SecureStore
3. **Fix API interceptor**: Attach JWT to authenticated requests
4. **Remove console.logs**: Delete all sensitive logging
5. **Add .env.development**: Document platform-specific API URLs
6. **Add OTP throttling**: Client-side rate limiting (60s cooldown)
7. **Test full auth flow**: Request OTP → Verify → Get token → Store → Use in API calls
8. **Add inline errors**: Replace alerts with inline error states
9. **Test permission denials**: Ensure graceful handling + settings link
10. **Finalize assets**: Add all required images per ASSETS_GUIDE.md

---

## Backend Requirements

### Required Endpoints (Not Yet Implemented)

```typescript
POST /api/auth/request-otp
Body: { phoneNumber: string }
Response: { success: boolean, message: string, expiresIn?: number }
Security: Rate limit to 3 requests per hour per phone number

POST /api/auth/verify-otp
Body: { phoneNumber: string, otp: string }
Response: { 
  success: boolean, 
  user: { id: string, phoneNumber: string },
  token: string,  // JWT token for authenticated requests
  refreshToken?: string
}
Security: Max 5 attempts per OTP, lock account after 10 failed attempts

POST /api/auth/resend-otp
Body: { phoneNumber: string }
Response: { success: boolean, message: string }
Security: Rate limit to 3 resends per hour

GET /api/auth/me (authenticated)
Headers: { Authorization: "Bearer <token>" }
Response: { user: { id, phoneNumber, name, email } }
```

### Backend Security Checklist

- [ ] OTP generation (6-digit random number)
- [ ] OTP storage (Redis with 10-minute TTL)
- [ ] SMS integration (Twilio)
- [ ] Rate limiting (express-rate-limit)
- [ ] JWT token generation (jsonwebtoken)
- [ ] Token expiration (15 minutes access, 7 days refresh)
- [ ] Refresh token rotation
- [ ] Request throttling
- [ ] Input sanitization
- [ ] Brute force protection

---

## Testing Checklist

### Manual Testing

- [ ] iOS Simulator - Full onboarding flow
- [ ] Android Emulator - Full onboarding flow
- [ ] Physical iOS Device - Permissions work correctly
- [ ] Physical Android Device - Permissions work correctly
- [ ] Slow network - Loading states appear
- [ ] No network - Error messages shown
- [ ] Invalid phone number - Validation works
- [ ] Invalid OTP - Error shown, retry allowed
- [ ] Expired OTP - Resend works
- [ ] App backgrounding - State persists
- [ ] App restart - Auth state restored
- [ ] Permission denials - Graceful handling

### Automated Testing (Future)

- [ ] Unit tests for AuthContext
- [ ] Integration tests for API service
- [ ] E2E tests with Detox/Appium

---

## Deployment Checklist

### Pre-Production

- [ ] All critical issues fixed
- [ ] All image assets added
- [ ] Environment variables configured
- [ ] Backend endpoints implemented
- [ ] SMS service configured (Twilio)
- [ ] Push notification certificates
- [ ] Privacy policy URL set
- [ ] Terms of service URL set

### App Store Submission

- [ ] App icons (1024x1024)
- [ ] Screenshots (per device size)
- [ ] App description
- [ ] Keywords for SEO
- [ ] Age rating
- [ ] Privacy disclosures
- [ ] Export compliance

### Google Play Submission

- [ ] Feature graphic (1024x500)
- [ ] Screenshots (per device size)
- [ ] App description
- [ ] Content rating questionnaire
- [ ] Privacy policy link
- [ ] Data safety form

---

## Estimated Timeline to Production

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| Critical Fixes | Auth token, API config, security | 2-3 days |
| Backend Implementation | OTP endpoints, SMS, JWT | 3-5 days |
| Medium Priority | Inline errors, UX polish | 2-3 days |
| Assets & Content | Images, copy, policies | 1-2 days |
| Testing | Manual + bug fixes | 2-3 days |
| Store Submission | Prep + review | 3-7 days |
| **Total** | **End-to-end** | **13-23 days** |

---

## Success Criteria

✅ **Ready for Production** when:
1. All critical issues resolved
2. Backend OTP flow implemented and tested
3. Auth tokens properly stored and used
4. No sensitive data in console logs
5. All permissions handle denials gracefully
6. Full onboarding flow tested on physical devices
7. Assets added and designs match specs
8. Privacy policy and terms in place
9. App store listings complete
10. Beta testing completed (TestFlight/Internal Testing)
