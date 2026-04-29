import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BookmarkProvider } from '@/contexts/BookmarkContext';
import { CartProvider } from '@/contexts/CartContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const colorScheme = useColorScheme();
  const { isLoading } = useAuth();
  useProtectedRoutes();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#111111" />
      </View>
    );
  }

  return (
    <BookmarkProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
    </BookmarkProvider>
  );
}

function useProtectedRoutes() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const rootSegment = segments[0];

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthRoute = rootSegment === 'login';

    if (!session && !isAuthRoute) {
      router.replace('/login');
    }

    if (session && isAuthRoute) {
      router.replace('/');
    }
  }, [isLoading, rootSegment, router, session]);
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
