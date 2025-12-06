import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ChatProvider } from '../src/contexts/ChatContext';
import { AIConsultantProvider } from '../src/contexts/AIConsultantContext';
import { ToastProvider } from '../src/components/Toast';
import { OfflineQueryProvider } from '../src/providers/OfflineQueryProvider';
import { OfflineBanner } from '../src/components/OfflineBanner';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OfflineQueryProvider>
        <AuthProvider>
          <ChatProvider>
            <AIConsultantProvider>
              <ToastProvider>
                <OfflineBanner />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="home" />
                  <Stack.Screen name="profile" />
                  <Stack.Screen name="salon" />
                  <Stack.Screen name="booking" />
                  <Stack.Screen name="shop" />
                  <Stack.Screen name="offers" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen name="wallet" />
                  <Stack.Screen name="edit-profile" />
                  <Stack.Screen name="language" />
                  <Stack.Screen name="help-support" />
                  <Stack.Screen name="web-page" />
                  <Stack.Screen name="events" />
                  <Stack.Screen name="chat" />
                </Stack>
              </ToastProvider>
            </AIConsultantProvider>
          </ChatProvider>
        </AuthProvider>
      </OfflineQueryProvider>
    </GestureHandlerRootView>
  );
}
