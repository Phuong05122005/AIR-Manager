/**
 * components/Button.js — Nút bấm tái sử dụng
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_SIZES, SPACING, SHADOWS } from '../theme/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md',         // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? COLORS.white : COLORS.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  // ── Variants ────────────────────────────────────────────────────────────────
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.primaryLight, borderWidth: 0 },
  danger: { backgroundColor: COLORS.danger },
  ghost: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.border },
  disabled: { opacity: 0.5 },
  // ── Text color per variant ────────────────────────────────────────────────────
  text: { fontWeight: '600' },
  text_primary: { color: COLORS.white },
  text_secondary: { color: COLORS.primary },
  text_danger: { color: COLORS.white },
  text_ghost: { color: COLORS.textSecondary },
  // ── Sizes ───────────────────────────────────────────────────────────────────
  size_sm: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md },
  size_md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  size_lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl },
  textSize_sm: { fontSize: FONT_SIZES.sm },
  textSize_md: { fontSize: FONT_SIZES.md },
  textSize_lg: { fontSize: FONT_SIZES.lg },
});

export default Button;
