/**
 * screens/ComponentsScreen.js — Danh sách linh kiện từ MongoDB
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { componentApi } from '../api/apiClient';
import Card from '../components/Card';
import { StatusBadge } from '../components/LoadingIndicator';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../theme/theme';

// ─── Danh mục filter ──────────────────────────────────────────────────────────
const CATEGORIES = ['Tất cả', 'Cảm biến', 'Vi điều khiển', 'Module', 'Điện trở', 'Tụ điện', 'Khác'];

// ─── Component Item Card ──────────────────────────────────────────────────────
const ComponentItem = ({ item, onPress }) => (
  <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.75}>
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 24 }}>🔩</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.itemCode}>{item.code}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.infoChip}>
          <Text style={styles.infoLabel}>Kho</Text>
          <Text style={styles.infoValue}>{item.availableQuantity}/{item.totalQuantity}</Text>
        </View>
        <View style={styles.infoChip}>
          <Text style={styles.infoLabel}>Vị trí</Text>
          <Text style={styles.infoValue}>{item.location || '—'}</Text>
        </View>
        <View style={styles.infoChip}>
          <Text style={styles.infoLabel}>Loại</Text>
          <Text style={styles.infoValue}>{item.category}</Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────
const ComponentsScreen = ({ navigation }) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const fetchComponents = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (activeCategory !== 'Tất cả') params.category = activeCategory;

      const res = await componentApi.getAll(params);
      setComponents(res.data.data);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, activeCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchComponents, 400); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchComponents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComponents();
  };

  const handleItemPress = (item) => {
    Alert.alert(
      item.name,
      `Mã: ${item.code}\nSố lượng: ${item.availableQuantity}/${item.totalQuantity}\nVị trí: ${item.location}\nDanh mục: ${item.category}\n\n${item.description || ''}`,
      [{ text: 'Đóng' }]
    );
  };

  if (loading) return <LoadingIndicator message="Đang tải danh sách linh kiện..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Linh Kiện</Text>
        <Text style={styles.count}>{components.length} loại</Text>
      </View>

      {/* ── Search Bar ──────────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên hoặc mã linh kiện..."
          placeholderTextColor={COLORS.textDisabled}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category Filter ──────────────────────────────────────────────── */}
      <View>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, activeCategory === item && styles.categoryChipActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === item && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── Danh sách ───────────────────────────────────────────────────── */}
      <FlatList
        data={components}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ComponentItem item={item} onPress={handleItemPress} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={styles.emptyTitle}>Không tìm thấy linh kiện</Text>
            <Text style={styles.emptyText}>Thử thay đổi bộ lọc hoặc thêm linh kiện mới</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: SPACING.md,
  },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  count: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.xl, marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg, height: 48,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  clearBtn: { fontSize: 16, color: COLORS.textSecondary, padding: SPACING.xs },

  categoryList: { paddingHorizontal: SPACING.xl, gap: SPACING.sm, paddingBottom: SPACING.md },
  categoryChip: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  categoryTextActive: { color: COLORS.white },

  list: { paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingBottom: SPACING.xxxl },

  itemCard: { gap: SPACING.md },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  iconBox: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  itemName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  itemCode: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },

  itemFooter: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  infoChip: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, gap: 2,
  },
  infoLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  infoValue: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center' },
});

export default ComponentsScreen;
