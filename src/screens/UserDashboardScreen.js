import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useKit } from '../context/KitContext';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { assignCodesToComponents, getComponentQuantity } from '../utils/componentCode';

// ─── Component hiển thị từng hộp kit (có thể mở rộng xem linh kiện) ──────────
const KitCard = ({ kit }) => {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    'Sẵn sàng': { bg: '#E8F5E9', text: '#2E7D32', dot: '#4CAF50' },
    'Đang mượn': { bg: '#FFF3E0', text: '#E65100', dot: '#FF9800' },
    'Thiếu đồ': { bg: '#FFEBEE', text: '#C62828', dot: '#F44336' },
  };
  const sc = statusColors[kit.status] || statusColors['Sẵn sàng'];
  const componentCount = kit.components?.length || 0;
  const components = assignCodesToComponents(kit.components || []);

  return (
    <View style={styles.kitCard}>
      <TouchableOpacity 
        style={styles.kitCardHeader} 
        activeOpacity={0.7}
        onPress={() => componentCount > 0 && setExpanded(!expanded)}
      >
        <View style={styles.kitCardLeft}>
          <Text style={styles.kitCardIcon}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.kitCardName} numberOfLines={1}>{kit.name}</Text>
            <Text style={styles.kitCardTopic}>{kit.topic}</Text>
          </View>
        </View>
        <View style={styles.kitCardRight}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={[styles.statusText, { color: sc.text }]}>{kit.status}</Text>
          </View>
          {componentCount > 0 && (
            <Text style={styles.expandArrow}>{expanded ? '▲' : '▼'}</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Danh sách linh kiện mở rộng */}
      {expanded && components.length > 0 && (
        <View style={styles.componentListBox}>
          <Text style={styles.componentListTitle}>
            📋 Linh kiện bên trong ({componentCount}):
          </Text>
          <View style={styles.componentTableHeader}>
            <Text style={styles.componentColLabel}>Linh kiện</Text>
            <Text style={styles.componentQtyHeader}>SL linh kiện</Text>
          </View>
          {components.map((comp, idx) => (
            <View
              key={comp.id || idx}
              style={[
                styles.componentRow,
                idx === components.length - 1 && styles.componentRowLast,
              ]}
            >
              <View style={styles.componentRowLeft}>
                <Image
                  source={{ uri: comp.image || 'https://cdn-icons-png.flaticon.com/512/2885/2885417.png' }}
                  style={styles.componentImage}
                />
                <View style={styles.componentInfo}>
                  <Text style={styles.componentName} numberOfLines={2}>
                    {comp.name}
                  </Text>
                  <Text style={styles.componentCodeBadge}>{comp.code}</Text>
                </View>
              </View>
              <View style={styles.componentQtyCell}>
                <Text style={styles.componentQtyValue}>
                  {getComponentQuantity(comp)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const UserDashboardScreen = () => {
  const { user } = useAuth();
  const { kits, loading, fetchKits } = useKit();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Làm mới danh sách kits khi tab được focus
  useEffect(() => {
    if (isFocused) {
      fetchKits();
    }
  }, [isFocused]);

  // Giả lập trạng thái đang mượn
  const activeBorrow = true;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={{ flex: 1, width: '100%' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.name}>{user.name}</Text>
        </View>

        {/* Nút Mượn/Trả */}
        <TouchableOpacity 
          style={styles.ctaButtonWrapper}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Borrow')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaIcon}>📸</Text>
            <Text style={styles.ctaText}>MƯỢN / TRẢ</Text>
            <Text style={styles.ctaSub}>Quét mã QR hộp kit</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Thẻ trạng thái đang mượn */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Đang mượn</Text>
            <View style={[styles.badge, activeBorrow ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={[styles.badgeText, activeBorrow ? styles.badgeTextActive : styles.badgeTextInactive]}>
                {activeBorrow ? '1 hộp kit' : 'Trống'}
              </Text>
            </View>
          </View>
          {activeBorrow ? (
            <View style={styles.borrowInfo}>
              <View style={styles.borrowIconBox}><Text style={{fontSize: 24}}>📦</Text></View>
              <View style={styles.borrowDetailsBox}>
                <Text style={styles.borrowKitName}>Hộp Kit Cơ bản #05</Text>
                <Text style={styles.timeRemaining}>Hạn trả: 16:30 hôm nay</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Bạn chưa mượn hộp kit nào.</Text>
          )}
        </View>

        {/* ── DANH SÁCH HỘP KIT (XEM LINH KIỆN) ─────────────────────── */}
        <View style={styles.kitSectionHeader}>
          <Text style={styles.kitSectionTitle}>🔍 Danh sách hộp kit</Text>
          <Text style={styles.kitSectionSub}>Bấm vào hộp kit để xem linh kiện bên trong</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách...</Text>
          </View>
        ) : kits.length === 0 ? (
          <View style={styles.emptyKitBox}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={styles.emptyKitText}>Chưa có hộp kit nào trong hệ thống</Text>
          </View>
        ) : (
          kits.map((kit) => <KitCard key={kit.id || kit._id} kit={kit} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 120,
    gap: SPACING.lg,
  },
  header: {
    width: '100%',
    paddingTop: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  name: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  ctaButtonWrapper: {
    borderRadius: RADIUS.xxl,
    ...SHADOWS.lg,
  },
  ctaGradient: {
    borderRadius: RADIUS.xxl,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  ctaText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  ctaSub: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  statusCard: {
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },
  badgeActive: { backgroundColor: 'rgba(255, 193, 7, 0.2)' },
  badgeInactive: { backgroundColor: COLORS.divider },
  badgeText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  badgeTextActive: { color: COLORS.warning },
  badgeTextInactive: { color: COLORS.textDisabled },
  borrowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  borrowIconBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowDetailsBox: {
    flex: 1,
  },
  borrowKitName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  timeRemaining: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },

  // ─── Kit Section ────────────────────────────────────────────────
  kitSectionHeader: {
    marginTop: SPACING.md,
  },
  kitSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  kitSectionSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptyKitBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyKitText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // ─── Kit Card ───────────────────────────────────────────────────
  kitCard: {
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  kitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  kitCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  kitCardIcon: {
    fontSize: 28,
  },
  kitCardName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  kitCardTopic: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  kitCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expandArrow: {
    fontSize: 12,
    color: COLORS.textDisabled,
  },

  // ─── Component List ─────────────────────────────────────────────
  componentListBox: {
    backgroundColor: '#EEF6FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#D6E8FF',
  },
  componentListTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  componentTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#B8D4F0',
  },
  componentColLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  componentQtyHeader: {
    width: 88,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#D6E8FF',
  },
  componentRowLast: {
    borderBottomWidth: 0,
  },
  componentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    paddingRight: SPACING.sm,
  },
  componentImage: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E8FF',
  },
  componentQtyCell: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  componentDot: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
  componentInfo: {
    flex: 1,
    gap: 2,
  },
  componentName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  componentCodeBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#E8F4FF',
    borderWidth: 1,
    borderColor: '#B8D4F0',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    letterSpacing: 0.5,
  },
  componentQtyValue: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B8D4F0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  componentCode: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    backgroundColor: '#E0E7EF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
});

export default UserDashboardScreen;
