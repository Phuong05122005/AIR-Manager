/**
 * App.js — Entry point của ứng dụng React Native
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { KitProvider } from './src/context/KitContext';
import GlobalNotificationBanner from './src/components/GlobalNotificationBanner';

// Polyfill Alert.alert cho môi trường Web
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const formattedMessage = message ? `${title}\n\n${message}` : title;
    if (buttons && buttons.length > 0) {
      // Tìm nút không phải là "Hủy" hoặc "Cancel" làm nút xác nhận
      const confirmButton = buttons.find(b => b.style !== 'cancel' && b.text !== 'Hủy' && b.text !== 'Cancel') || buttons[buttons.length - 1];
      const cancelButton = buttons.find(b => b.style === 'cancel' || b.text === 'Hủy' || b.text === 'Cancel');
      
      if (confirmButton && cancelButton) {
        const result = window.confirm(formattedMessage);
        if (result) {
          if (typeof confirmButton.onPress === 'function') confirmButton.onPress();
        } else {
          if (cancelButton && typeof cancelButton.onPress === 'function') cancelButton.onPress();
        }
      } else {
        window.alert(formattedMessage);
        const firstButton = buttons[0];
        if (firstButton && typeof firstButton.onPress === 'function') firstButton.onPress();
      }
    } else {
      window.alert(formattedMessage);
    }
  };
}

export default function App() {
  console.log('📱 App component rendering started');
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <KitProvider>
          {/* Thanh trạng thái màu tối */}
          <StatusBar style="dark" backgroundColor="transparent" translucent />
          <AppNavigator />
          <GlobalNotificationBanner />
        </KitProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
