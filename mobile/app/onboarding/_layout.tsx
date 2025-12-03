import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="location" />
      <Stack.Screen name="notification" />
      <Stack.Screen name="mobile-verification" />
      <Stack.Screen name="otp-verification" />
    </Stack>
  );
}
