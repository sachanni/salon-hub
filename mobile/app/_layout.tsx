import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/components/Toast';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="home" />
        </Stack>
      </ToastProvider>
    </AuthProvider>
  );
}
