import { Stack } from 'expo-router';

export default function GiftCardsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="purchase" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="detail" />
    </Stack>
  );
}
