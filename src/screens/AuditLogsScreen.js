import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { logApi } from '../api/apiClient';

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}`;
};

const getActionLabel = (actionType) => {
  switch (actionType) {
    case 'CREATE_KIT': return 'Tạo Hộp';
    case 'UPDATE_KIT': return 'Sửa Hộp';
    case 'DELETE_KIT': return 'Xóa Hộp';
    case 'UPDATE_COMPONENTS': return 'Sửa Linh Kiện';
    case 'BORROW': return 'Mượn';
    case 'RETURN': return 'Trả';
    case 'LOGIN': return 'Đăng nhập';
    case 'LOGIN_FAILED': return 'Đ.nhập lỗi';
    case 'SYSTEM_INIT': return 'Khởi tạo';
    default: return actionType;
  }
};

const getActionColor = (actionType) => {
  if (actionType.includes('CREATE') || actionType === 'SYSTEM_INIT') return COLORS.success;
  if (actionType.includes('UPDATE')) return COLORS.warning;
  if (actionType.includes('DELETE')) return COLORS.danger;
  if (actionType === 'BORROW') return COLORS.primary;
  if (actionType === 'RETURN') return COLORS.teal;
  if (actionType === 'LOGIN') return '#4CAF50';
  if (actionType === 'LOGIN_FAILED') return '#FF5722';
  return COLORS.textSecondary;
};

const AuditLogsScreen = () => {
  const isFocused = useIsFocused();
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy nhật ký thực tế từ backend
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await logApi.getAll();
      if (response.data && response.data.success) {
        setLogs(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('❌ Lỗi khi tải nhật ký hệ thống:', error.message);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchLogs();
    }
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
          <Text style={styles.pageTitle}>Nhật ký hệ thống</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchLogs}>
            <Text style={{ fontSize: 16 }}>🔄 Tải lại</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Tìm theo người thực hiện, nội dung..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tableContainer}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Đang tải nhật ký...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tableInner}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.headerCell, { width: 110 }]}>Thời gian</Text>
                <Text style={[styles.headerCell, { width: 120 }]}>Người thực hiện</Text>
                <Text style={[styles.headerCell, { width: 120 }]}>Thao tác</Text>
                <Text style={[styles.headerCell, { width: 320 }]}>Nội dung chi tiết</Text>
              </View>

              {logs
                .filter(log => 
                  log.operator.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  log.actionType.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((log) => (
                  <TouchableOpacity 
                    key={log._id} 
                    style={styles.tableRow} 
                    activeOpacity={0.7}
                    onPress={() => {
                      if (log.details) {
                        Alert.alert(
                          'Chi tiết Snapshot dữ liệu',
                          JSON.stringify(log.details, null, 2)
                        );
                      }
                    }}
                  >
                    <Text style={[styles.cell, { width: 110, color: COLORS.textSecondary, fontSize: 13 }]}>
                      {formatTime(log.createdAt)}
                    </Text>
                    <Text style={[styles.cell, { width: 120, fontWeight: '700', fontSize: 13 }]}>
                      {log.operator}
                    </Text>
                    <View style={[styles.cell, { width: 120 }]}>
                      <View style={[styles.statusBadge, { backgroundColor: getActionColor(log.actionType) + '15' }]}>
                        <Text style={[styles.statusText, { color: getActionColor(log.actionType) }]}>
                          {getActionLabel(log.actionType)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.cell, { width: 320, color: COLORS.textPrimary, fontSize: 13 }]} numberOfLines={2}>
                      {log.description}
                    </Text>
                  </TouchableOpacity>
                ))}

              {logs.length === 0 && (
                <View style={{ width: 670, paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textDisabled }}>Chưa có nhật ký hoạt động nào được ghi nhận.</Text>
                </View>
              )}
              
              <View style={{ height: 160 }} />
            </ScrollView>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    alignItems: 'center', // Center content on desktop web
  },
  header: { 
    width: '100%',
    maxWidth: 800, // Limit width on desktop web
    padding: SPACING.xl, 
    backgroundColor: COLORS.white, 
    ...SHADOWS.sm, 
    zIndex: 10 
  },
  pageTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  refreshBtn: { padding: 6, backgroundColor: COLORS.background, borderRadius: RADIUS.sm },
  
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
 
  tableContainer: { 
    flex: 1, 
    width: '100%',
    maxWidth: 800, // Limit width on desktop web
    backgroundColor: COLORS.surfaceSolid,
    alignSelf: 'center', // Center container
  },
  tableInner: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2, borderBottomColor: COLORS.divider,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  headerCell: {
    fontSize: FONT_SIZES.sm, fontWeight: '700',
    color: COLORS.textSecondary, textTransform: 'uppercase',
  },
  
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  cell: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
});

export default AuditLogsScreen;
