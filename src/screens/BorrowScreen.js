/**
 * screens/BorrowScreen.js — Quản lý mượn/trả linh kiện
 * Có tích hợp Camera giả lập quét mã vạch (expo-camera)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, Modal, TextInput, Alert, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { borrowApi, componentApi, userApi, kitApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { StatusBadge } from '../components/LoadingIndicator';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme/theme';
import { assignCodesToComponents, getComponentQuantity } from '../utils/componentCode';

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ activeTab, onChangeTab }) => (
  <View style={styles.tabBar}>
    {['Đang mượn', 'Lịch sử'].map((tab) => (
      <TouchableOpacity
        key={tab}
        style={[styles.tab, activeTab === tab && styles.tabActive]}
        onPress={() => onChangeTab(tab)}
      >
        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Borrow Record Item ────────────────────────────────────────────────────────
const BorrowItem = ({ record, onReturn }) => {
  const [showComponents, setShowComponents] = useState(false);
  const dueDate = record.dueDate ? new Date(record.dueDate) : null;
  const isOverdue = dueDate && new Date() > dueDate && record.status === 'borrowing';

  return (
    <Card style={styles.borrowCard}>
      <View style={styles.borrowHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.componentName} numberOfLines={1}>
            {record.kit?.name || 'Hộp Kit'}
          </Text>
          <Text style={styles.componentCode}>{record.kit?.topic || 'Robotics'}</Text>
        </View>
        <StatusBadge status={isOverdue ? 'overdue' : record.status} />
      </View>

      <View style={styles.borrowDetails}>
        <Detail icon="👤" label={record.user?.name || '—'} />
        <Detail icon="📦" label={`Chủ đề: ${record.kit?.topic || 'Robotics'}`} />
        <Detail
          icon="📅"
          label={`Hạn: ${dueDate?.toLocaleDateString('vi-VN') || '—'}`}
          danger={isOverdue}
        />
      </View>

      {record.kit?.components && record.kit.components.length > 0 && (
        <TouchableOpacity 
          style={styles.toggleComponentsBtn} 
          onPress={() => setShowComponents(!showComponents)}
        >
          <Text style={styles.toggleComponentsText}>
            {showComponents ? 'Ẩn linh kiện ▲' : `Xem linh kiện (${record.kit.components.length}) ▼`}
          </Text>
        </TouchableOpacity>
      )}

      {showComponents && record.kit?.components && (
        <View style={styles.componentsList}>
          <View style={styles.compTableHeader}>
            <Text style={styles.compColLabel}>Linh kiện</Text>
            <Text style={styles.compQtyHeader}>SL linh kiện</Text>
          </View>
          {assignCodesToComponents(record.kit.components).map((c, i) => (
            <View key={i} style={styles.compRowWithImage}>
              <View style={styles.compRowMain}>
                <Image
                  source={{ uri: c.image || 'https://cdn-icons-png.flaticon.com/512/2885/2885417.png' }}
                  style={styles.compThumb}
                />
                <View style={styles.compInfoCol}>
                  <Text style={styles.compNameText} numberOfLines={2}>{c.name}</Text>
                  <Text style={styles.compCodeBadge}>{c.code}</Text>
                </View>
              </View>
              <Text style={styles.compQtyBadge}>{getComponentQuantity(c)}</Text>
            </View>
          ))}
        </View>
      )}

      {record.status === 'borrowing' && (
        <Button
          title="Xác nhận trả"
          variant="secondary"
          size="sm"
          style={{ marginTop: SPACING.md }}
          onPress={() => onReturn(record._id)}
        />
      )}
    </Card>
  );
};

const Detail = ({ icon, label, danger }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Text style={{ fontSize: 13 }}>{icon}</Text>
    <Text style={[styles.detailText, danger && { color: COLORS.danger }]}>{label}</Text>
  </View>
);

const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ─── Modal tạo phiếu mượn mới ─────────────────────────────────────────────────
const BorrowModal = ({ visible, onClose, onSuccess }) => {
  const { user, role } = useAuth();
  const [kits, setKits] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    kitId: '',
    userId: '',
    dueDate: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      // Thiết lập ngày hẹn trả mặc định là 7 ngày sau hôm nay và reset form
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setForm({
        kitId: '',
        userId: '',
        dueDate: formatDate(defaultDate),
        note: '',
      });

      Promise.all([kitApi.getAll(), userApi.getAll()]).then(([k, u]) => {
        const availableKits = k.data.data.filter((x) => x.status === 'Sẵn sàng');
        setKits(availableKits);
        console.log('📦 Danh sách kit sẵn sàng:', availableKits.length, 'kits');
        if (availableKits.length > 0) {
          console.log('📦 Kit đầu tiên components:', availableKits[0].components?.length || 0);
        }
        
        // Tự động chọn Hộp Kit đầu tiên làm mặc định — ÉP KIỂU STRING
        let defaultKitId = '';
        if (availableKits.length > 0) {
          defaultKitId = String(availableKits[0]._id);
        }

        // Nếu là Admin, chỉ hiện các tài khoản sinh viên (loại bỏ Admin khỏi danh sách chọn)
        if (role === 'admin') {
          const students = u.data.data.filter((usr) => usr.role === 'student' || usr.role === 'user');
          setUsers(students);
          
          // Admin: Tự động chọn sinh viên đầu tiên làm mặc định
          const defaultUserId = students.length > 0 ? String(students[0]._id) : '';
          setForm((prev) => ({
            ...prev,
            kitId: defaultKitId,
            userId: defaultUserId,
          }));
        } else {
          // Nếu là Sinh viên, tự động khóa chặt người mượn là chính mình
          const loggedInUserId = String(user?.id || user?._id || '');
          setForm((prev) => ({
            ...prev,
            kitId: defaultKitId,
            userId: loggedInUserId,
          }));
        }
      }).catch((err) => {
        console.error('❌ Lỗi tải dữ liệu modal mượn:', err.message);
      });
    }
  }, [visible, role, user]);

  // Tìm kit đang được chọn
  const selectedKit = kits.find(k => String(k._id) === String(form.kitId));

  const handleSubmit = async () => {
    if (!form.kitId || !form.userId || !form.dueDate) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }
    setSaving(true);
    try {
      await borrowApi.create({
        kitId: form.kitId,
        userId: form.userId,
        quantity: 1,
        dueDate: new Date(form.dueDate).toISOString(),
        note: form.note,
      });
      Alert.alert('✅ Thành công', 'Đã tạo phiếu mượn Hộp Kit thành công!');
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tạo phiếu mượn</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalBody}>
          {/* Scan camera giả lập */}
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => Alert.alert('📷 Camera', 'Tính năng quét mã vạch đang được kích hoạt.\nTrên thiết bị thật, expo-camera sẽ mở camera để quét mã Hộp Kit.')}
          >
            <Text style={{ fontSize: 24 }}>📷</Text>
            <Text style={styles.scanText}>Quét mã vạch Hộp Kit</Text>
          </TouchableOpacity>

          <FieldLabel label="Hộp Kit (*)" />
          <View style={styles.pickerBox}>
            {kits.length === 0 ? (
              <Text style={styles.emptyPickerText}>Không có Hộp Kit nào sẵn sàng để mượn.</Text>
            ) : (
              kits.map((k) => {
                const isSelected = String(form.kitId) === String(k._id);
                return (
                  <TouchableOpacity
                    key={String(k._id)}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => setForm({ ...form, kitId: String(k._id) })}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.pickerText, isSelected && { color: COLORS.white }]}>
                        {k.name} — {k.topic}
                      </Text>
                      {k.components && k.components.length > 0 && (
                        <Text style={[styles.kitComponentBadge, isSelected && { color: COLORS.white, borderColor: COLORS.white }]}>
                          🔧 {k.components.length} LK
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ── HIỂN THỊ LINH KIỆN CỦA HỘP KIT ĐANG CHỌN ── */}
          {selectedKit && selectedKit.components && selectedKit.components.length > 0 && (
            <View style={styles.selectedKitComponentsBox}>
              <Text style={styles.selectedKitComponentsTitle}>
                📋 Kiểm tra linh kiện trong "{selectedKit.name}" ({selectedKit.components.length} linh kiện):
              </Text>
              <View style={styles.compTableHeader}>
                <Text style={styles.compColLabel}>Linh kiện</Text>
                <Text style={styles.compQtyHeader}>SL linh kiện</Text>
              </View>
              {assignCodesToComponents(selectedKit.components).map((c, i) => (
                <View key={c.id || i} style={styles.componentCheckRow}>
                  <View style={styles.compRowMain}>
                    <Image
                      source={{ uri: c.image || 'https://cdn-icons-png.flaticon.com/512/2885/2885417.png' }}
                      style={styles.compThumb}
                    />
                    <View style={styles.compInfoCol}>
                      <Text style={styles.compNameText} numberOfLines={2}>{c.name}</Text>
                      <Text style={styles.compCodeBadge}>{c.code}</Text>
                    </View>
                  </View>
                  <Text style={styles.compQtyBadge}>{getComponentQuantity(c)}</Text>
                </View>
              ))}
            </View>
          )}

          {role === 'admin' && (
            <>
              <FieldLabel label="Người mượn (*)" />
              <View style={styles.pickerBox}>
                {users.map((u) => {
                  const isUserSelected = String(form.userId) === String(u._id);
                  return (
                    <TouchableOpacity
                      key={String(u._id)}
                      style={[styles.pickerItem, isUserSelected && styles.pickerItemActive]}
                      onPress={() => setForm({ ...form, userId: String(u._id) })}
                    >
                      <Text style={[styles.pickerText, isUserSelected && { color: COLORS.white }]}>
                        {u.name} — {u.studentId}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <FieldLabel label="Ngày hẹn trả (*) — định dạng: YYYY-MM-DD" />
          <TextInput
            style={styles.input}
            value={form.dueDate}
            onChangeText={(v) => setForm({ ...form, dueDate: v })}
            placeholder="YYYY-MM-DD"
            type={Platform.OS === 'web' ? 'date' : 'default'}
          />

          {/* Hàng nút chọn nhanh ngày hẹn trả */}
          <View style={styles.quickDateRow}>
            {[3, 7, 14, 30].map((days) => {
              const d = new Date();
              d.setDate(d.getDate() + days);
              const formatted = formatDate(d);
              const isActive = form.dueDate === formatted;
              return (
                <TouchableOpacity
                  key={days}
                  style={[styles.quickDateBtn, isActive && styles.quickDateBtnActive]}
                  onPress={() => setForm({ ...form, dueDate: formatted })}
                >
                  <Text style={[styles.quickDateText, isActive && { color: COLORS.white }]}>
                    +{days} ngày
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FieldLabel label="Ghi chú" />
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={form.note}
            onChangeText={(v) => setForm({ ...form, note: v })}
            multiline
            placeholder="Ghi chú thêm..."
          />

          <Button
            title="Tạo phiếu mượn"
            onPress={handleSubmit}
            loading={saving}
            size="lg"
            style={{ marginTop: SPACING.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const FieldLabel = ({ label }) => (
  <Text style={styles.fieldLabel}>{label}</Text>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────
const BorrowScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Đang mượn');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = activeTab === 'Đang mượn' ? { status: 'borrowing' } : {};
      const res = await borrowApi.getAll(params);
      setRecords(res.data.data);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [activeTab]);

  const handleReturn = (id) => {
    if (Platform.OS === 'web') {
      const confirmReturn = window.confirm('Bạn muốn xác nhận trả Hộp Kit này?');
      if (confirmReturn) {
        (async () => {
          try {
            await borrowApi.returnItem(id);
            window.alert('Đã xác nhận trả Hộp Kit!');
            fetchRecords();
          } catch (error) {
            window.alert('Lỗi: ' + error.message);
          }
        })();
      }
    } else {
      Alert.alert('Xác nhận', 'Bạn muốn xác nhận trả Hộp Kit này?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận trả',
          onPress: async () => {
            try {
              await borrowApi.returnItem(id);
              Alert.alert('✅ Thành công', 'Đã xác nhận trả Hộp Kit!');
              fetchRecords();
            } catch (error) {
              Alert.alert('Lỗi', error.message);
            }
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backEmoji}>⬅️</Text>
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mượn / Trả</Text>
        </View>
        <Button title="+ Mượn mới" size="sm" onPress={() => setShowModal(true)} />
      </View>

      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />

      {loading ? (
        <LoadingIndicator />
      ) : (
        <FlatList
          style={{ flex: 1, width: '100%' }}
          data={records}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <BorrowItem record={item} onReturn={handleReturn} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📋</Text>
              <Text style={styles.emptyTitle}>Không có phiếu mượn</Text>
            </View>
          }
        />
      )}

      <BorrowModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchRecords}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    alignItems: 'center', // Center content on desktop web
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: SPACING.lg,
    width: '100%',
    maxWidth: 800, // Limit width on desktop web
  },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },

  tabBar: {
    flexDirection: 'row', 
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACING.lg,
    width: Platform.OS === 'web' ? 'calc(100% - 48px)' : undefined,
    maxWidth: Platform.OS === 'web' ? 800 - 48 : undefined,
    alignSelf: 'center', // Center tabbar on desktop web
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  list: { 
    width: '100%',
    maxWidth: 800, // Limit width on desktop web
    alignSelf: 'center', // Center content
    paddingHorizontal: SPACING.xl, 
    gap: SPACING.md, 
    paddingBottom: SPACING.xxxl 
  },
  borrowCard: { gap: SPACING.sm },
  borrowHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  componentName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  componentCode: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  borrowDetails: { gap: SPACING.xs },
  detailText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },

  // Modal styles
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white,
  },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  closeBtn: { fontSize: 20, color: COLORS.textSecondary, padding: SPACING.sm },
  modalBody: { padding: SPACING.xl, gap: 4 },

  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed',
  },
  scanText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.primary },

  fieldLabel: {
    fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary,
    marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pickerBox: { gap: SPACING.sm },
  pickerItem: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  pickerItemActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pickerText: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '500' },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: SPACING.md,
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  quickDateBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    gap: 4,
    ...SHADOWS.sm,
  },
  backEmoji: {
    fontSize: 14,
  },
  backText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  toggleComponentsBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  toggleComponentsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  componentsList: {
    marginTop: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    gap: 2,
  },
  componentItemText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  compTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#B8D4F0',
  },
  compColLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  compQtyHeader: {
    width: 88,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  compRowWithImage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  compRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    paddingRight: SPACING.sm,
  },
  compQtyBadge: {
    width: 88,
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#B8D4F0',
    borderRadius: RADIUS.md,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  compThumb: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E8FF',
  },
  compInfoCol: {
    flex: 1,
    gap: 2,
  },
  compNameText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  compCodeBadge: {
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
  },
  compCodeSmall: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  selectedKitComponentsBox: {
    padding: SPACING.md,
    backgroundColor: '#EEF6FF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  selectedKitComponentsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  componentCheckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D6E8FF',
  },
  kitComponentBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  componentCodeBadge: {
    fontSize: 10,
    color: COLORS.textSecondary,
    backgroundColor: '#E9ECEF',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontWeight: '600',
  },
});

export default BorrowScreen;
