/**
 * screens/QRScanScreen.js — Quét mã QR hộp kit
 * Sau khi quét → hiển thị kit + linh kiện → bấm "Mượn" là xong
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Image, Alert, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { kitApi, borrowApi, userApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme/theme';
import { assignCodesToComponents, getComponentQuantity } from '../utils/componentCode';

const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ─── Modal kết quả sau khi quét QR ───────────────────────────────────────────
const KitResultModal = ({ visible, kit, onClose, onBorrowSuccess }) => {
  const { user, role } = useAuth();
  const [borrowing, setBorrowing] = useState(false);
  const [returning, setReturning] = useState(false);
  const [activeBorrowId, setActiveBorrowId] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (visible && kit) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(formatDate(d));

      if (role === 'admin') {
        userApi.getAll().then(res => {
          const students = res.data.data.filter(u => u.role === 'student' || u.role === 'user');
          setUsers(students);
          if (students.length > 0) setSelectedUserId(String(students[0]._id));
        }).catch(() => {});
      } else {
        setSelectedUserId(String(user?.id || user?._id || ''));
      }

      // Nếu đang mượn, tìm ID phiếu mượn để cho phép trả
      if (kit.status === 'Đang mượn') {
        borrowApi.getAll({ status: 'borrowed' }).then(res => {
          const borrows = res.data.data;
          const active = borrows.find(b => String(b.kit?._id || b.kit) === String(kit._id));
          if (active) {
            // Admin hoặc chính người mượn mới được trả
            if (role === 'admin' || String(active.user?._id || active.user) === String(user?.id || user?._id)) {
              setActiveBorrowId(active._id);
            }
          }
        }).catch(console.error);
      } else {
        setActiveBorrowId(null);
      }
    }
  }, [visible, kit, role, user]);

  const handleBorrow = async () => {
    if (!kit || !selectedUserId) {
      Alert.alert('Lỗi', 'Thiếu thông tin người mượn');
      return;
    }
    if (kit.status !== 'Sẵn sàng') {
      Alert.alert('Không thể mượn', `Hộp kit này đang ở trạng thái: ${kit.status}`);
      return;
    }
    setBorrowing(true);
    try {
      await borrowApi.create({
        kitId: String(kit._id),
        userId: selectedUserId,
        quantity: 1,
        dueDate: new Date(dueDate).toISOString(),
        note: `Mượn qua quét QR code`,
      });
      Alert.alert('✅ Thành công', `Đã mượn "${kit.name}" thành công!`);
      onBorrowSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setBorrowing(false);
    }
  };

  const handleReturn = async () => {
    if (!activeBorrowId) return;
    setReturning(true);
    try {
      await borrowApi.returnBorrow(activeBorrowId, { note: 'Trả hộp kit qua quét QR code' });
      Alert.alert('✅ Thành công', `Đã trả hộp kit "${kit.name}" thành công!`);
      onBorrowSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setReturning(false);
    }
  };

  if (!kit) return null;

  const statusColors = {
    'Sẵn sàng': { bg: '#E8F5E9', text: '#2E7D32' },
    'Đang mượn': { bg: '#FFF3E0', text: '#E65100' },
    'Thiếu đồ': { bg: '#FFEBEE', text: '#C62828' },
  };
  const sc = statusColors[kit.status] || statusColors['Sẵn sàng'];
  const components = assignCodesToComponents(kit.components || []);
  const canBorrow = kit.status === 'Sẵn sàng';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.resultModal}>
        {/* Header */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>📦 Thông tin hộp kit</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.resultBody} showsVerticalScrollIndicator={false}>
          {/* Kit info card */}
          <View style={styles.kitInfoCard}>
            <Text style={styles.kitName}>{kit.name}</Text>
            <Text style={styles.kitTopic}>📚 {kit.topic}</Text>
            <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusPillText, { color: sc.text }]}>{kit.status}</Text>
            </View>
          </View>

          {/* Danh sách linh kiện */}
          <View style={styles.compSection}>
            <Text style={styles.compSectionTitle}>
              🔧 Linh kiện bên trong ({components.length})
            </Text>
            <View style={styles.compTableHeader}>
              <Text style={styles.compColLabel}>Linh kiện</Text>
              <Text style={styles.compQtyHeader}>Số lượng</Text>
            </View>
            {components.map((c, i) => (
              <View key={c.id || i} style={styles.compRow}>
                <View style={styles.compRowLeft}>
                  <Image
                    source={{ uri: c.image || 'https://cdn-icons-png.flaticon.com/512/2885/2885417.png' }}
                    style={styles.compThumb}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compName} numberOfLines={2}>{c.name}</Text>
                    <Text style={styles.compCode}>{c.code}</Text>
                  </View>
                </View>
                <Text style={styles.compQty}>{getComponentQuantity(c)}</Text>
              </View>
            ))}
          </View>

          {/* Chọn người mượn (chỉ admin) */}
          {role === 'admin' && users.length > 0 && (
            <View style={styles.compSection}>
              <Text style={styles.compSectionTitle}>👤 Chọn người mượn</Text>
              {users.map(u => {
                const sel = String(selectedUserId) === String(u._id);
                return (
                  <TouchableOpacity
                    key={String(u._id)}
                    style={[styles.userItem, sel && styles.userItemActive]}
                    onPress={() => setSelectedUserId(String(u._id))}
                  >
                    <Text style={[styles.userItemText, sel && { color: COLORS.white }]}>
                      {u.name} — {u.studentId}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Chọn ngày trả (chỉ hiện khi kit sẵn sàng) */}
          {kit.status === 'Sẵn sàng' && (
            <View style={styles.compSection}>
              <Text style={styles.compSectionTitle}>📅 Ngày hẹn trả</Text>
              <TextInput
                style={styles.dateInput}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
              />
              <View style={styles.quickDates}>
              {[3, 7, 14, 30].map(days => {
                const d = new Date();
                d.setDate(d.getDate() + days);
                const f = formatDate(d);
                const active = dueDate === f;
                return (
                  <TouchableOpacity
                    key={days}
                    style={[styles.quickDateBtn, active && styles.quickDateBtnActive]}
                    onPress={() => setDueDate(f)}
                  >
                    <Text style={[styles.quickDateText, active && { color: COLORS.white }]}>
                      +{days}d
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          )}

          {/* Nút mượn / trả */}
          {kit.status === 'Đang mượn' && activeBorrowId ? (
            <TouchableOpacity
              style={[styles.borrowBtn, { backgroundColor: COLORS.success }]}
              onPress={handleReturn}
              disabled={returning}
              activeOpacity={0.85}
            >
              {returning ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.borrowBtnText}>✅ Trả lại hộp kit này</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.borrowBtn, !canBorrow && styles.borrowBtnDisabled]}
              onPress={handleBorrow}
              disabled={!canBorrow || borrowing}
              activeOpacity={0.85}
            >
              {borrowing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.borrowBtnText}>
                  {canBorrow ? '📥 Mượn hộp kit này' : `Không thể mượn (${kit.status})`}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Màn hình chính: Quét QR ─────────────────────────────────────────────────
const QRScanScreen = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState(null);
  const [showResult, setShowResult] = useState(false);
  // Web fallback: nhập token thủ công
  const [manualToken, setManualToken] = useState('');

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      // data có thể là qrToken thuần hoặc URL chứa token
      const token = data.includes('/') ? data.split('/').pop() : data;
      const res = await kitApi.getByQrToken(token);
      setKit(res.data.data);
      setShowResult(true);
    } catch (error) {
      Alert.alert(
        '❌ Không tìm thấy',
        'Mã QR này không hợp lệ hoặc không thuộc hệ thống AIR Manager.',
        [{ text: 'Quét lại', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualToken.trim()) return;
    setLoading(true);
    try {
      const res = await kitApi.getByQrToken(manualToken.trim());
      setKit(res.data.data);
      setShowResult(true);
    } catch (error) {
      Alert.alert('❌ Không tìm thấy', 'Mã QR token không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  // Web: hiển thị UI nhập token thủ công
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>⬅️ Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quét mã QR</Text>
        </View>
        <View style={styles.webFallback}>
          <Text style={{ fontSize: 64, marginBottom: SPACING.lg }}>📷</Text>
          <Text style={styles.webFallbackTitle}>Nhập mã QR Token</Text>
          <Text style={styles.webFallbackSub}>
            Trên web, hãy nhập QR Token của hộp kit (tìm trong phần Quản lý Kit)
          </Text>
          <TextInput
            style={styles.webTokenInput}
            value={manualToken}
            onChangeText={setManualToken}
            placeholder="Nhập QR Token..."
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity
            style={styles.borrowBtn}
            onPress={handleManualSearch}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.borrowBtnText}>🔍 Tìm hộp kit</Text>
            }
          </TouchableOpacity>
        </View>
        <KitResultModal
          visible={showResult}
          kit={kit}
          onClose={() => { setShowResult(false); setManualToken(''); }}
          onBorrowSuccess={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  // Mobile: yêu cầu quyền camera
  if (!permission) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }]}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.lg }}>📷</Text>
        <Text style={[styles.webFallbackTitle, { textAlign: 'center' }]}>Cần quyền truy cập Camera</Text>
        <Text style={[styles.webFallbackSub, { textAlign: 'center', marginBottom: SPACING.xl }]}>
          Ứng dụng cần quyền camera để quét mã QR hộp kit.
        </Text>
        <TouchableOpacity style={styles.borrowBtn} onPress={requestPermission}>
          <Text style={styles.borrowBtnText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: SPACING.md }} onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.textSecondary }}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay UI */}
      <SafeAreaView style={styles.cameraOverlay} edges={['top']}>
        <TouchableOpacity style={styles.cameraBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cameraBackText}>✕ Đóng</Text>
        </TouchableOpacity>
        <Text style={styles.cameraTip}>Đưa mã QR hộp kit vào khung hình</Text>
      </SafeAreaView>

      {/* Khung ngắm QR */}
      <View style={styles.scanFrame} pointerEvents="none">
        <View style={styles.scanFrameCornerTL} />
        <View style={styles.scanFrameCornerTR} />
        <View style={styles.scanFrameCornerBL} />
        <View style={styles.scanFrameCornerBR} />
      </View>

      {/* Loading / Quét lại */}
      <View style={styles.cameraBottom}>
        {loading ? (
          <View style={styles.cameraLoadingBox}>
            <ActivityIndicator color={COLORS.white} />
            <Text style={{ color: COLORS.white, marginLeft: 10 }}>Đang tra cứu...</Text>
          </View>
        ) : scanned ? (
          <TouchableOpacity
            style={styles.rescanBtn}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanBtnText}>🔄 Quét lại</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <KitResultModal
        visible={showResult}
        kit={kit}
        onClose={() => { setShowResult(false); setScanned(false); }}
        onBorrowSuccess={() => navigation.goBack()}
      />
    </View>
  );
};

const FRAME_SIZE = 240;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.round, paddingHorizontal: SPACING.md, paddingVertical: 6,
    ...SHADOWS.sm,
  },
  backBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },

  // Camera overlay
  cameraOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg,
    alignItems: 'center',
  },
  cameraBackBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.round,
  },
  cameraBackText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.sm },
  cameraTip: {
    marginTop: SPACING.lg,
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Khung ngắm
  scanFrame: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: FRAME_SIZE, height: FRAME_SIZE,
    marginTop: -FRAME_SIZE / 2,
    marginLeft: -FRAME_SIZE / 2,
  },
  scanFrameCornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: 32, height: 32,
    borderTopWidth: 4, borderLeftWidth: 4,
    borderColor: '#fff', borderTopLeftRadius: 8,
  },
  scanFrameCornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: 32, height: 32,
    borderTopWidth: 4, borderRightWidth: 4,
    borderColor: '#fff', borderTopRightRadius: 8,
  },
  scanFrameCornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: 32, height: 32,
    borderBottomWidth: 4, borderLeftWidth: 4,
    borderColor: '#fff', borderBottomLeftRadius: 8,
  },
  scanFrameCornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32,
    borderBottomWidth: 4, borderRightWidth: 4,
    borderColor: '#fff', borderBottomRightRadius: 8,
  },
  cameraBottom: {
    position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center',
  },
  cameraLoadingBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderRadius: RADIUS.round,
  },
  rescanBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md,
    borderRadius: RADIUS.round,
    ...SHADOWS.md,
  },
  rescanBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },

  // Web fallback
  webFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl,
  },
  webFallbackTitle: {
    fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  webFallbackSub: {
    fontSize: FONT_SIZES.sm, color: COLORS.textSecondary,
    marginBottom: SPACING.xl, textAlign: 'center',
  },
  webTokenInput: {
    width: '100%', maxWidth: 400,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },

  // Result modal
  resultModal: { flex: 1, backgroundColor: COLORS.background },
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white,
  },
  resultTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  closeBtn: { padding: SPACING.sm },
  closeBtnText: { fontSize: 20, color: COLORS.textSecondary },
  resultBody: { padding: SPACING.xl, gap: SPACING.lg, paddingBottom: 80 },

  kitInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl, padding: SPACING.xl,
    ...SHADOWS.sm, gap: SPACING.sm,
  },
  kitName: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  kitTopic: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  statusPillText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },

  compSection: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.sm,
  },
  compSectionTitle: {
    fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md,
  },
  compTableHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: SPACING.xs,
  },
  compColLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  compQtyHeader: { width: 72, fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center', textTransform: 'uppercase' },
  compRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  compRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  compThumb: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: '#EEF6FF', borderWidth: 1, borderColor: '#D6E8FF' },
  compName: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
  compCode: {
    alignSelf: 'flex-start', fontSize: 10, fontWeight: '700', color: COLORS.primary,
    backgroundColor: '#E8F4FF', borderWidth: 1, borderColor: '#B8D4F0',
    borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 1,
  },
  compQty: {
    width: 72, textAlign: 'center', fontSize: FONT_SIZES.md, fontWeight: '800',
    color: COLORS.primary, backgroundColor: '#EEF6FF', borderRadius: RADIUS.md,
    paddingVertical: 4, overflow: 'hidden',
  },

  // User picker
  userItem: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  userItemActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  userItemText: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textPrimary },

  // Date picker
  dateInput: {
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary, marginBottom: SPACING.sm,
  },
  quickDates: { flexDirection: 'row', gap: 8 },
  quickDateBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.md,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  quickDateBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickDateText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },

  // Borrow button
  borrowBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg, alignItems: 'center', ...SHADOWS.md,
  },
  borrowBtnDisabled: { backgroundColor: COLORS.textDisabled },
  borrowBtnText: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: '800' },
});

export default QRScanScreen;
