/**
 * components/LoadingIndicator.js — Màn hình loading khi gọi API
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../theme/theme';

export const LoadingIndicator = ({ message = 'Đang tải dữ liệu...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.message}>{message}</Text>
  </View>
);

export const InlineLoader = () => (
  <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: SPACING.md }} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});

export default LoadingIndicator;

/**
 * components/StatusBadge.js — Badge hiển thị trạng thái linh kiện
 */

import { STATUS_CONFIG } from '../theme/theme';

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['available'];
  return (
    <View
      style={{
        backgroundColor: config.background,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: config.color,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
};
