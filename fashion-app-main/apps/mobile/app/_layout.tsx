import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BookmarkProvider } from '@/contexts/BookmarkContext';
import { CartProvider } from '@/contexts/CartContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    'DM Sans': {
      uri: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap',
    },
  });

  if (!fontsLoaded) {
    return null; // Or a splash screen
  }

  return (
    <BookmarkProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
    </BookmarkProvider>
  );
}
