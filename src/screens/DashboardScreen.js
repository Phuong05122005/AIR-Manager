/**
 * screens/DashboardScreen.js — Màn hình Dashboard / Tổng quan
 * Hiển thị thống kê: tổng linh kiện, đang mượn, sắp hết, hết hàng
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { componentApi, borrowApi } from '../api/apiClient';
import Card from '../components/Card';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { COLORS, FONT_SIZES, SPACING, RADIUS, STATUS_CONFIG } from '../theme/theme';

// ─── Stat Card nhỏ ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, bg, emoji }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Phiếu mượn gần đây ────────────────────────────────────────────────────────
const BorrowItem = ({ record }) => (
  <View style={styles.borrowItem}>
    <View style={styles.borrowIcon}>
      <Text style={{ fontSize: 18 }}>🔧</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.borrowName} numberOfLines={1}>
        {record.component?.name || 'Linh kiện'}
      </Text>
      <Text style={styles.borrowSub}>
        {record.user?.name} · SL: {record.quantity}
      </Text>
    </View>
    <View
      style={[
        styles.statusDot,
        { backgroundColor: STATUS_CONFIG[record.status]?.color || COLORS.primary },
      ]}
    />
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────
const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [recentBorrows, setRecentBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Gọi song song 2 API cùng lúc để tối ưu tốc độ
      const [statsRes, borrowsRes] = await Promise.all([
        componentApi.getStats(),
        borrowApi.getAll({ status: 'borrowing' }),
      ]);
      setStats(statsRes.data.data);
      setRecentBorrows(borrowsRes.data.data.slice(0, 5)); // Chỉ lấy 5 phiếu gần nhất
    } catch (error) {
      Alert.alert('Lỗi kết nối', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Kéo để làm mới
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) return <LoadingIndicator message="Đang tải Dashboard..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Header chào ─────────────────────────────────────────────────── */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.greeting}>Xin chào 👋</Text>
            <Text style={styles.title}>AI Robotic</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 20 }}>👤</Text>
          </View>
        </View>

        {/* ── Hero Card — Tổng số linh kiện ──────────────────────────────── */}
        <Card variant="highlight" style={styles.heroCard}>
          <Text style={styles.heroLabel}>Tổng số linh kiện</Text>
          <Text style={styles.heroValue}>{stats?.totalQuantity?.toLocaleString() ?? '—'}</Text>
          <Text style={styles.heroSub}>{stats?.total ?? 0} loại linh kiện trong kho</Text>
        </Card>

        {/* ── Thống kê nhanh ─────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Trạng thái kho</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Còn hàng" value={stats?.available ?? 0}
            color={COLORS.success} bg="#E6FAF4" emoji="✅"
          />
          <StatCard
            label="Sắp hết" value={stats?.lowStock ?? 0}
            color={COLORS.warning} bg="#FFF8E6" emoji="⚠️"
          />
          <StatCard
            label="Hết hàng" value={stats?.outOfStock ?? 0}
            color={COLORS.danger} bg="#FFF1F0" emoji="❌"
          />
          <StatCard
            label="Đang mượn" value={recentBorrows.length}
            color={COLORS.primary} bg={COLORS.primaryLight} emoji="📦"
          />
        </View>

        {/* ── Phiếu mượn đang hoạt động ──────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đang mượn</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Borrow')}>
            <Text style={styles.seeAll}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        <Card>
          {recentBorrows.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 32 }}>📭</Text>
              <Text style={styles.emptyText}>Không có phiếu mượn nào</Text>
            </View>
          ) : (
            recentBorrows.map((record, index) => (
              <BorrowItem key={record._id || index} record={record} />
            ))
          )}
        </Card>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: SPACING.xl },

  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  greeting: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: 2 },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  heroCard: { marginBottom: SPACING.xxl, padding: SPACING.xxl },
  heroLabel: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  heroValue: { fontSize: 48, fontWeight: '900', color: COLORS.white, lineHeight: 56 },
  heroSub: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg, fontWeight: '700',
    color: COLORS.textPrimary, marginBottom: SPACING.md,
  },
  seeAll: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: SPACING.md, marginBottom: SPACING.xxl,
  },
  statCard: {
    flex: 1, minWidth: '44%', borderRadius: RADIUS.lg,
    padding: SPACING.lg, alignItems: 'center', gap: 4,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },

  borrowItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  borrowIcon: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  borrowName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  borrowSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
});

export default DashboardScreen;
