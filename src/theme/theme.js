/**
 * theme/theme.js — Design System cho AI Robotic
 * Centralize toàn bộ màu sắc, font, spacing để dễ thay đổi
 */

export const COLORS = {
  // ─── Primary ────────────────────────────────────────────────────────────────
  primary: '#0F2C59',       // Xanh Navy đậm
  primaryLight: '#E8EEF2',  // Nền card highlight
  primaryDark: '#081730',   // Khi nhấn
  teal: '#008080',          // Xanh ngọc (phụ)
  brandCyan: '#2DD4FF',     // Cyan thương hiệu AI Robotic

  // ─── Status ─────────────────────────────────────────────────────────────────
  success: '#2ECA7F',       // Xanh lá — Đầy đủ/Hoàn thành
  warning: '#FFC107',       // Vàng — Đang mượn/Sắp hết
  danger: '#FF4D4F',        // Đỏ — Thiếu đồ/Hỏng/Quá hạn
  info: '#1890FF',          // Xanh info

  // ─── Neutrals ───────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  background: '#F0F2F5',    // Trắng/Xám nhạt
  surface: 'rgba(255, 255, 255, 0.85)', // Nền card mờ (Glassmorphism)
  surfaceSolid: '#FFFFFF',  // Nền đặc
  border: 'rgba(232, 236, 240, 0.5)', // Viền mờ
  divider: 'rgba(240, 242, 245, 0.5)',

  // ─── Text ───────────────────────────────────────────────────────────────────
  textPrimary: '#1A2340',   // Tiêu đề
  textSecondary: '#6B7A99', // Mô tả, nhãn
  textDisabled: '#B0B8CC',
  textOnPrimary: '#FFFFFF', // Text trên nền navy

  // ─── Dark overlay ───────────────────────────────────────────────────────────
  overlay: 'rgba(15, 44, 89, 0.5)', // Phủ mờ xanh navy
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48, // Nút to cho user
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28, // Góc bo lớn cho Bento Grid
  round: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#008080',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  }
};

// Map trạng thái linh kiện → màu sắc + nhãn
export const STATUS_CONFIG = {
  available: {
    color: COLORS.success,
    background: 'rgba(46, 202, 127, 0.15)',
    label: 'Còn hàng',
  },
  low_stock: {
    color: COLORS.warning,
    background: 'rgba(255, 193, 7, 0.15)',
    label: 'Sắp hết',
  },
  out_of_stock: {
    color: COLORS.danger,
    background: 'rgba(255, 77, 79, 0.15)',
    label: 'Hết hàng',
  },
  borrowing: {
    color: COLORS.warning, // Chuyển sang Vàng theo ý user
    background: 'rgba(255, 193, 7, 0.15)',
    label: 'Đang mượn',
  },
  returned: {
    color: COLORS.success,
    background: 'rgba(46, 202, 127, 0.15)',
    label: 'Đã trả',
  },
  overdue: {
    color: COLORS.danger,
    background: 'rgba(255, 77, 79, 0.15)',
    label: 'Quá hạn',
  },
};

