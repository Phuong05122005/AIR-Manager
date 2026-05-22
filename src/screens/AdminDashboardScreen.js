import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useKit } from '../context/KitContext';
import { useNavigation, useIsFocused } from '@react-navigation/native';

// ─── Component Thẻ KPI (Bento Item) ───────────────────────────────────────────
const KPICard = ({ title, value, icon, color, style, onPress }) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  return (
    <CardComponent 
      style={[styles.kpiCard, style]} 
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
    </CardComponent>
  );
};

const AdminDashboardScreen = () => {
  const { user, studentAccounts, refreshUserProfile } = useAuth();
  const { kits, fetchKits } = useKit();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [alerts, setAlerts] = useState([]);

  // Tự động đồng bộ làm mới dữ liệu từ MongoDB khi mở tab Tổng quan
  React.useEffect(() => {
    if (isFocused) {
      refreshUserProfile();
      fetchKits();
      
      // Fetch danh sách đang mượn để tính toán cảnh báo quá hạn
      import('../api/apiClient').then(({ borrowApi }) => {
        borrowApi.getAll({ status: 'borrowing' })
          .then(res => {
            if (res.data && res.data.success) {
              const activeBorrows = res.data.data || [];
              const now = new Date();
              
              // Lọc các phiếu mượn quá hạn
              const overdueBorrows = activeBorrows.filter(b => new Date(b.dueDate) < now);
              
              const formattedAlerts = overdueBorrows.map(b => {
                // Tính toán thời gian trễ
                const diffMs = now - new Date(b.dueDate);
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                let delayStr = diffDays > 0 ? `Trễ ${diffDays} ngày` : `Trễ ${diffHours} tiếng`;
                if (diffHours === 0) delayStr = 'Vừa trễ hạn';

                return {
                  id: b._id || b.id,
                  type: 'overdue',
                  title: `${b.kit?.name || 'Hộp Kit'} - Quá hạn trả`,
                  studentName: b.user?.name || 'Sinh viên',
                  studentId: b.user?.studentId || 'N/A',
                  phone: b.user?.phone || 'Chưa cập nhật',
                  kitName: b.kit?.name || 'Không rõ',
                  topic: b.kit?.topic || '',
                  timeDetail: `${delayStr} (Hạn trả: ${new Date(b.dueDate).toLocaleString('vi-VN')})`,
                  components: b.kit?.components || []
                };
              });
              
              setAlerts(formattedAlerts);
            }
          })
          .catch(err => console.error('Lỗi tải cảnh báo:', err));
      });
    }
  }, [isFocused]);

  const totalKits = kits ? kits.length : 0;
  const borrowingKits = kits ? kits.filter(k => k.status === 'Đang mượn').length : 0;
  const readyKits = kits ? kits.filter(k => k.status === 'Sẵn sàng').length : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={{ flex: 1, width: '100%' }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Tổng quan kho,</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>

        {/* ── BENTO GRID ─────────────────────────────────────────────────── */}
        <View style={styles.bentoGrid}>
          {/* Hàng 1: Tổng & Đang mượn */}
          <View style={styles.bentoRow}>
            <KPICard 
              title="Tổng hộp kit" 
              value={totalKits.toString()} 
              icon="📦" 
              color={COLORS.primary} 
              style={{ flex: 1 }} 
            />
            <KPICard 
              title="Đang mượn" 
              value={borrowingKits.toString()} 
              icon="🔄" 
              color={COLORS.warning} 
              style={{ flex: 1 }} 
            />
          </View>

          {/* Hàng 2: Sinh viên & Sẵn sàng */}
          <View style={styles.bentoRow}>
            <KPICard 
              title="Sinh viên" 
              value={studentAccounts.length.toString()} 
              icon="👥" 
              color={COLORS.info} 
              style={{ flex: 1 }} 
              onPress={() => navigation.navigate('UserManage')}
            />
            <KPICard 
              title="Sẵn sàng" 
              value={readyKits.toString()} 
              icon="✅" 
              color={COLORS.success} 
              style={{ flex: 1 }} 
            />
          </View>
        </View>

        {/* ── CẢNH BÁO THỜI GIAN THỰC ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Cảnh báo thời gian thực</Text>
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertTitle}>Cần chú ý ngay ({alerts.length})</Text>
          </View>
          
          <View style={styles.alertList}>
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <View key={alert.id}>
                  <TouchableOpacity style={styles.alertItem} onPress={() => setSelectedAlert(alert)}>
                    <View style={[styles.alertDot, { backgroundColor: alert.type === 'overdue' ? COLORS.danger : COLORS.warning }]} />
                    <View style={styles.alertContent}>
                      <Text style={styles.alertItemTitle}>{alert.title}</Text>
                      <Text style={styles.alertItemSub}>
                        {alert.type === 'overdue' ? `SV ${alert.studentName} - ${alert.timeDetail.split('(')[0]}` : alert.issueDetail}
                      </Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                  {index < alerts.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: SPACING.md }}>
                🎉 Tuyệt vời! Hiện không có cảnh báo nào.
              </Text>
            )}
          </View>
        </View>

      </ScrollView>

      {/* ─── MODAL CHI TIẾT CẢNH BÁO (BENTO STYLE popup) ─────────────────────────── */}
      <Modal visible={!!selectedAlert} transparent animationType="slide" onRequestClose={() => setSelectedAlert(null)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={Platform.OS === 'ios' ? 30 : 100} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={styles.modalContent}>
            {selectedAlert && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: selectedAlert.type === 'overdue' ? COLORS.danger : COLORS.warning }]}>
                    {selectedAlert.type === 'overdue' ? '⏰ Cảnh Báo Quá Hạn' : '⚠️ Báo Mất Linh Kiện'}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedAlert(null)} style={styles.modalCloseTouch}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
                  <View style={styles.alertDetailCard}>
                    <Text style={styles.alertDetailTitle}>{selectedAlert.title}</Text>
                    <Text style={styles.alertDetailSub}>{selectedAlert.kitName} · {selectedAlert.topic}</Text>
                  </View>

                  <Text style={styles.detailSectionTitle}>Thông tin người mượn</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Họ và tên</Text>
                    <Text style={styles.infoValue}>{selectedAlert.studentName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mã số sinh viên</Text>
                    <Text style={styles.infoValue}>{selectedAlert.studentId}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Số điện thoại</Text>
                    <Text style={styles.infoValue}>{selectedAlert.phone}</Text>
                  </View>

                  <Text style={styles.detailSectionTitle}>Chi tiết sự cố</Text>
                  <View style={[styles.issueBox, { backgroundColor: selectedAlert.type === 'overdue' ? 'rgba(255, 77, 79, 0.08)' : 'rgba(255, 193, 7, 0.08)' }]}>
                    <Text style={[styles.issueText, { color: selectedAlert.type === 'overdue' ? COLORS.danger : '#B28900' }]}>
                      {selectedAlert.type === 'overdue' ? selectedAlert.timeDetail : selectedAlert.issueDetail}
                    </Text>
                  </View>

                  <Text style={styles.detailSectionTitle}>Danh sách linh kiện trong hộp kit</Text>
                  {selectedAlert.components.map((comp, idx) => (
                    <View key={idx} style={styles.componentItemRow}>
                      <Text style={[styles.compNameText, comp.missing && { color: COLORS.danger, fontWeight: '700' }]}>
                        {comp.name} {comp.missing ? '(⚠️ Thất lạc)' : ''}
                      </Text>
                      <Text style={styles.compCodeText}>{comp.code}</Text>
                    </View>
                  ))}

                  {/* Nút hành động */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, { backgroundColor: COLORS.teal }]}
                      onPress={() => {
                        const url = `tel:${selectedAlert.phone}`;
                        Linking.canOpenURL(url)
                          .then((supported) => {
                            if (supported) {
                              Linking.openURL(url);
                            } else {
                              Alert.alert('Không hỗ trợ', 'Thiết bị của bạn không hỗ trợ chức năng gọi điện.');
                            }
                          })
                          .catch(() => Alert.alert('Lỗi', 'Không thể kết nối cuộc gọi.'));
                      }}
                    >
                      <Text style={styles.modalActionBtnText}>📞 GỌI ĐIỆN NHẮC</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.modalActionBtn, { backgroundColor: COLORS.primary }]}
                      onPress={() => {
                        Alert.alert(
                          'Hệ thống',
                          'Ghi nhận xử lý thành công! Trạng thái hộp kit đã được cập nhật.',
                          [{ text: 'OK', onPress: () => setSelectedAlert(null) }]
                        );
                      }}
                    >
                      <Text style={styles.modalActionBtnText}>⚙️ XỬ LÝ NHANH</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    alignItems: 'center', // Center content horizontally on desktop web
  },
  scroll: { 
    width: '100%',
    maxWidth: 800, // Limit width on desktop web
    alignSelf: 'center', // Center content horizontally on desktop web
    paddingHorizontal: SPACING.xl, 
    paddingBottom: 180 
  },
  header: { 
    width: '100%',
    paddingTop: SPACING.xl, 
    paddingBottom: SPACING.lg 
  },
  greeting: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary },
  name: { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.textPrimary },
  
  bentoGrid: { gap: SPACING.md },
  bentoRow: { flexDirection: 'row', gap: SPACING.md },
  kpiCard: {
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  kpiValue: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: COLORS.textPrimary },
  kpiTitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },

  sectionTitle: {
    fontSize: FONT_SIZES.md, fontWeight: '700',
    color: COLORS.textSecondary, textTransform: 'uppercase',
    marginTop: SPACING.xxl, marginBottom: SPACING.md,
  },
  
  alertCard: {
    backgroundColor: 'rgba(255, 77, 79, 0.05)',
    borderWidth: 1, borderColor: 'rgba(255, 77, 79, 0.3)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  alertIcon: { fontSize: 20 },
  alertTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.danger },
  
  alertList: { gap: SPACING.sm },
  alertItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  alertDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger },
  alertContent: { flex: 1 },
  alertItemTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  alertItemSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  arrow: { fontSize: 24, color: COLORS.textDisabled },
  divider: { height: 1, backgroundColor: 'rgba(255, 77, 79, 0.1)', marginVertical: SPACING.xs },

  // Styles cho Modal Alert
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    width: '100%',
    maxHeight: '80%',
    padding: SPACING.xl,
    ...SHADOWS.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  modalCloseTouch: {
    padding: 6,
  },
  closeBtn: {
    fontSize: 20,
    color: COLORS.textDisabled,
    fontWeight: '700',
  },
  modalScrollBody: {
    paddingBottom: SPACING.xl,
  },
  alertDetailCard: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  alertDetailTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.primary,
  },
  alertDetailSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  detailSectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  issueBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  issueText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  componentItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  compNameText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  compCodeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  modalActionBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },
});

export default AdminDashboardScreen;
