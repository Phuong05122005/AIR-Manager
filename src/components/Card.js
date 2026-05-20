/**
 * components/Card.js — Card container tái sử dụng
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../theme/theme';

const Card = ({ children, style, variant = 'default' }) => {
  return (
    <View style={[styles.card, styles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  default: {},
  elevated: { ...SHADOWS.md },
  highlight: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.lg,
  },
});

export default Card;
