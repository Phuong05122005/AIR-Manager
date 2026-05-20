import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../theme/theme';

const GlobalNotificationBanner = () => {
  const { activeNotification, setActiveNotification, notificationsEnabled } = useAuth();
  const slideAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (activeNotification && notificationsEnabled) {
      // Slide down animation
      Animated.spring(slideAnim, {
        toValue: 50, // 50px below status bar
        useNativeDriver: true,
        tension: 30,
        friction: 8,
      }).start();

      // Auto-hide timer
      const timer = setTimeout(() => {
        hideBanner();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [activeNotification, notificationsEnabled]);

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActiveNotification(null);
    });
  };

  if (!activeNotification || !notificationsEnabled) return null;

  const { title, message, type } = activeNotification;

  // Visual cues per type
  let emoji = '🔔';
  let bannerBorderColor = COLORS.primary;
  let iconBgColor = '#E6F0FA';

  if (type === 'error') {
    emoji = '🔴';
    bannerBorderColor = '#FF4D4F';
    iconBgColor = '#FFF1F0';
  } else if (type === 'warning') {
    emoji = '🟡';
    bannerBorderColor = '#FAAD14';
    iconBgColor = '#FFFBE6';
  } else if (type === 'success') {
    emoji = '🟢';
    bannerBorderColor = COLORS.teal;
    iconBgColor = '#E6FFFB';
  }

  return (
    <Animated.View style={[styles.bannerContainer, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity 
        style={[styles.banner, { borderColor: bannerBorderColor }]}
        activeOpacity={0.9} 
        onPress={hideBanner}
      >
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 99999, // Ensure it draws over EVERYTHING
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.lg,
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  emoji: { fontSize: 22 },
  content: { flex: 1, paddingRight: 16 },
  title: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  message: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, lineHeight: 16 },
  closeText: { position: 'absolute', top: 12, right: 12, fontSize: 12, color: COLORS.textDisabled, fontWeight: '700' },
});

export default GlobalNotificationBanner;
