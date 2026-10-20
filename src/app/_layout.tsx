import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="catalog" />
        <Stack.Screen name="book/[id]" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="message" />
      </Stack>
    </AuthProvider>
  );
}
