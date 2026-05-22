import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { useKit } from '../context/KitContext';
import { assignCodesToComponents } from '../utils/componentCode';

const getStatusColor = (status) => {
  if (status === 'Sẵn sàng') return COLORS.success;
  if (status === 'Đang mượn') return COLORS.warning;
  if (status === 'Thiếu đồ') return COLORS.danger;
  return COLORS.textDisabled;
};

const KitSetupScreen = () => {
  const navigation = useNavigation();
  const { kits, addKit, deleteKit, updateKitInfo } = useKit();
  
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [editingKitId, setEditingKitId] = useState(null);
  const [newKitName, setNewKitName] = useState('');
  const [newKitTopic, setNewKitTopic] = useState('');
  const [newKitComponentsStr, setNewKitComponentsStr] = useState('');
  // QR Modal state
  const [qrKit, setQrKit] = useState(null);

  const handleDeleteKit = (id, kitName) => {
    Alert.alert(
      'Xóa Hộp Kit',
      `Bạn có chắc chắn muốn xóa ${kitName}? Dữ liệu không thể khôi phục.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => deleteKit(id)
        }
      ]
    );
  };

  const handleOpenAddModal = () => {
    setEditingKitId(null);
    setNewKitName('');
    setNewKitTopic('');
    setNewKitComponentsStr('');
    setAddModalVisible(true);
  };

  const handleOpenEditInfoModal = (kit) => {
    setEditingKitId(kit.id);
    setNewKitName(kit.name);
    setNewKitTopic(kit.topic);
    setAddModalVisible(true);
  };

  const handleSaveKit = () => {
    if (!newKitName.trim() || !newKitTopic.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên và chủ đề!');
      return;
    }

    if (editingKitId) {
      // Cập nhật thông tin hộp kit
      updateKitInfo(editingKitId, newKitName.trim(), newKitTopic.trim());
    } else {
      // Thêm mới hộp kit
      const compArray = assignCodesToComponents(
        newKitComponentsStr.split(',').map((item, index) => ({
          id: `new_c_${Date.now()}_${index}`,
          name: item.trim() || 'Linh kiện chưa tên',
          image: 'https://cdn-icons-png.flaticon.com/512/2885/2885417.png',
          quantity: 1,
        })).filter((i) => i.name !== 'Linh kiện chưa tên')
      );

      const newKit = {
        id: Date.now().toString(),
        name: newKitName.trim(),
        topic: newKitTopic.trim(),
        components: compArray,
        status: 'Sẵn sàng',
      };
      addKit(newKit);
    }
    
    setAddModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Quản lý Hộp Kit</Text>
      </View>

      <ScrollView 
        style={{ flex: 1, width: '100%' }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        {/* Nút thêm Hộp Kit dạng Card */}
        <TouchableOpacity 
          style={[styles.kitCard, { 
            borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.primary, 
            backgroundColor: 'rgba(23, 114, 210, 0.05)', 
            alignItems: 'center', justifyContent: 'center', 
            paddingVertical: SPACING.xxl 
          }]}
          activeOpacity={0.7}
          onPress={handleOpenAddModal}
        >
          <Text style={{ fontSize: 32, color: COLORS.primary, marginBottom: 8 }}>+</Text>
          <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary }}>Tạo Hộp Kit Mới</Text>
        </TouchableOpacity>
        {kits.map((kit) => (
          <View key={kit.id} style={styles.kitCard}>
            <View style={styles.kitHeader}>
              <View style={{ flex: 1, paddingRight: SPACING.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={styles.kitName}>{kit.name}</Text>
                  <TouchableOpacity onPress={() => handleOpenEditInfoModal(kit)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 16 }}>✏️</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tagContainer}>
                  <Text style={styles.tagIcon}>📚</Text>
                  <Text style={styles.kitTopic} numberOfLines={1}>{kit.topic}</Text>
                </View>
                <View style={styles.tagContainer}>
                  <Text style={styles.tagIcon}>⚙️</Text>
                  <Text style={styles.kitComponents} numberOfLines={2}>
                    {kit.components.map(c => c.name).join(', ')}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(kit.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(kit.status) }]}>{kit.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.kitActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => navigation.navigate('KitComponents', { kitId: kit.id })}
              >
                <Text style={styles.actionBtnIcon}>📦</Text>
                <Text style={styles.actionBtnText}>Linh kiện</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.printBtn]}
                onPress={() => setQrKit(kit)}
              >
                <Text style={styles.actionBtnIcon}>🔳</Text>
                <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Xem QR</Text>
              </TouchableOpacity>

              {/* Nút xóa hộp kit */}
              <TouchableOpacity 
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleDeleteKit(kit.id, kit.name)}
              >
                <Text style={{ fontSize: 16 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {kits.length === 0 && (
          <Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginTop: 20 }}>Không có hộp kit nào. Hãy thêm mới!</Text>
        )}
      </ScrollView>

      {/* MODAL THÊM/SỬA HỘP KIT */}
      <Modal visible={isAddModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingKitId ? 'Sửa thông tin Hộp Kit' : 'Thêm Hộp Kit Mới'}</Text>
            
            <Text style={styles.inputLabel}>Tên Hộp Kit <Text style={{ color: COLORS.danger }}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Hộp Kit #05"
              value={newKitName}
              onChangeText={setNewKitName}
            />

            <Text style={styles.inputLabel}>Chủ đề dạy <Text style={{ color: COLORS.danger }}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="VD: IoT Cơ bản, Robotics..."
              value={newKitTopic}
              onChangeText={setNewKitTopic}
            />

            {!editingKitId && (
              <>
                <Text style={styles.inputLabel}>Danh sách linh kiện ban đầu</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="VD: Arduino, Mạch Cảm Biến..."
                  value={newKitComponentsStr}
                  onChangeText={setNewKitComponentsStr}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveKit}
              >
                <Text style={styles.modalBtnSaveText}>{editingKitId ? 'Lưu Thay Đổi' : 'Tạo Mới'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL XEM QR CODE — dùng api.qrserver.com, không cần cài thêm package */}
      <Modal visible={!!qrKit} transparent animationType="fade" onRequestClose={() => setQrKit(null)}>
        <View style={styles.qrOverlay}>
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>🔳 Mã QR Hộp Kit</Text>
            <Text style={styles.qrKitName}>{qrKit?.name}</Text>
            <Text style={styles.qrKitTopic}>{qrKit?.topic}</Text>

            {qrKit?.qrToken ? (
              <View style={styles.qrBox}>
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrKit.qrToken)}&color=1772D2&bgcolor=FFFFFF&margin=10`,
                  }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
                <Text style={styles.qrTokenLabel}>QR Token:</Text>
                <Text style={styles.qrTokenText} selectable>
                  {qrKit.qrToken}
                </Text>
              </View>
            ) : (
              <View style={styles.qrBox}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>⚠️</Text>
                <Text style={{ color: COLORS.danger, textAlign: 'center', fontWeight: '600' }}>
                  Hộp kit này chưa có QR Token.{"\n"}Chạy: node scripts/migrateQrTokens.js
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md }}>
              <TouchableOpacity 
                style={[styles.qrCloseBtn, { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border }]} 
                onPress={() => setQrKit(null)}
              >
                <Text style={[styles.qrCloseBtnText, { color: COLORS.textPrimary }]}>Đóng</Text>
              </TouchableOpacity>
              
              {qrKit?.qrToken && (
                <TouchableOpacity 
                  style={[styles.qrCloseBtn, { flex: 1, backgroundColor: COLORS.primary }]} 
                  onPress={() => {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrKit.qrToken)}&color=1772D2&bgcolor=FFFFFF&margin=10`;
                    Linking.openURL(qrUrl);
                  }}
                >
                  <Text style={styles.qrCloseBtnText}>🖨️ Lưu / In Mã QR</Text>
                </TouchableOpacity>
              )}
            </View>
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
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.xl, backgroundColor: COLORS.white, ...SHADOWS.sm, zIndex: 10,
    width: '100%',
    maxWidth: 800, // Constrain width on desktop web
  },
  pageTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.round },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.sm },
  
  scroll: { 
    width: '100%',
    maxWidth: 800, // Constrain width on desktop web
    alignSelf: 'center', // Center content horizontally on desktop web
    padding: SPACING.xl, 
    paddingBottom: 160, 
    gap: SPACING.lg 
  },
  
  kitCard: {
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  kitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kitName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  tagContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  tagIcon: { fontSize: 14 },
  kitTopic: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  kitComponents: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1, lineHeight: 20 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  
  kitActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.background, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, gap: 6,
  },
  printBtn: { backgroundColor: COLORS.primaryLight },
  deleteBtn: { flex: 0, width: 44, backgroundColor: 'rgba(255, 77, 79, 0.1)' },
  actionBtnIcon: { fontSize: 16 },
  actionBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.xl },
  modalContainer: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xl, ...SHADOWS.lg },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg, textAlign: 'center' },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  modalBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: COLORS.background },
  modalBtnSave: { backgroundColor: COLORS.primary },
  modalBtnCancelText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textSecondary },
  modalBtnSaveText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.white },

  // QR Modal Styles
  qrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  qrContainer: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.xl, alignItems: 'center', width: '100%', maxWidth: 360,
    ...SHADOWS.lg,
  },
  qrTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  qrKitName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  qrKitTopic: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  qrBox: { alignItems: 'center', padding: SPACING.lg, backgroundColor: '#F0F7FF', borderRadius: RADIUS.lg, width: '100%', marginBottom: SPACING.lg },
  qrImage: { width: 200, height: 200, borderRadius: RADIUS.md },
  qrTokenLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md, textTransform: 'uppercase' },
  qrTokenText: { fontSize: 11, color: COLORS.textPrimary, fontFamily: 'monospace', textAlign: 'center', marginTop: 4 },
  qrCloseBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.round, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md },
  qrCloseBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
});

export default KitSetupScreen;
