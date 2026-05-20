import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { useKit } from '../context/KitContext';
import {
  assignCodesToComponents,
  generateComponentCode,
  getComponentQuantity,
} from '../utils/componentCode';

const GAP = 16; // SPACING.md

const KitComponentsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { kitId } = route.params;
  const { kits, updateKitComponents } = useKit();
  
  const kit = kits.find(k => k.id === kitId);
  const components = kit?.components || [];

  const [selectedComponent, setSelectedComponent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editImage, setEditImage] = useState('');

  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width, 800);
  const PADDING = 24; // SPACING.xl
  // Trừ hao thêm một chút (GAP * 2.5) để đảm bảo không bị rớt dòng do sai số làm tròn pixel
  const ITEM_WIDTH = Math.floor((containerWidth - (PADDING * 2) - (GAP * 2.5)) / 3);

  const previewCode = editName.trim()
    ? generateComponentCode(editName.trim(), components, selectedComponent?.id)
    : '—';

  const openModal = (comp = null) => {
    setSelectedComponent(comp);
    if (comp) {
      setEditName(comp.name);
      setEditQuantity(String(getComponentQuantity(comp)));
      setEditImage(comp.image);
    } else {
      setEditName('');
      setEditQuantity('1');
      setEditImage('https://cdn-icons-png.flaticon.com/512/2885/2885417.png');
    }
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
    }
  };

  const saveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên linh kiện');
      return;
    }

    const quantity = Math.max(1, parseInt(editQuantity, 10) || 1);
    let updatedComponents;

    if (selectedComponent) {
      updatedComponents = components.map((c) => {
        if (c.id === selectedComponent.id) {
          return {
            ...c,
            name: editName.trim(),
            image: editImage,
            quantity,
          };
        }
        return c;
      });
    } else {
      const newComp = {
        id: `c_${Date.now()}`,
        name: editName.trim(),
        image: editImage,
        quantity,
      };
      updatedComponents = [...components, newComp];
    }

    updateKitComponents(kitId, assignCodesToComponents(updatedComponents));
    setModalVisible(false);
  };

  const deleteComponent = () => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa linh kiện "${selectedComponent.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive', 
        onPress: () => {
          const updatedComponents = components.filter(c => c.id !== selectedComponent.id);
          updateKitComponents(kitId, updatedComponents);
          setModalVisible(false);
        }
      }
    ]);
  };

  if (!kit) return <SafeAreaView style={styles.container}><Text>Không tìm thấy Hộp Kit</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Element Warehouse</Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={styles.subTitle}>{kit.name} - {kit.topic}</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.gridContainer}>
          {assignCodesToComponents(components).map((comp) => (
            <TouchableOpacity 
              key={comp.id} 
              style={[styles.gridItem, { width: ITEM_WIDTH }]} 
              activeOpacity={0.7}
              onPress={() => openModal(comp)}
            >
              <View style={[styles.imageBox, { width: ITEM_WIDTH - 16, height: ITEM_WIDTH - 16 }]}>
                <Image 
                  source={{ uri: comp.image }} 
                  style={styles.compImage} 
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.compName} numberOfLines={2}>{comp.name}</Text>
              <Text style={styles.compCode} numberOfLines={1}>{comp.code}</Text>
            </TouchableOpacity>
          ))}

          {/* Nút Thêm mới */}
          <TouchableOpacity 
            style={[styles.gridItem, styles.addGridItem, { width: ITEM_WIDTH }]} 
            activeOpacity={0.7}
            onPress={() => openModal(null)}
          >
            <View style={[styles.addImageBox, { width: ITEM_WIDTH - 16, height: ITEM_WIDTH - 16 }]}>
              <Text style={styles.addIconText}>+</Text>
            </View>
            <Text style={styles.addGridText}>Thêm</Text>
            <Text style={styles.addGridText}>Linh kiện</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{selectedComponent ? 'Chỉnh sửa linh kiện' : 'Thêm linh kiện mới'}</Text>
              {selectedComponent && (
                <TouchableOpacity onPress={deleteComponent} style={styles.deleteIconBtn}>
                  <Text style={{ fontSize: 20 }}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.inputLabel}>Tên linh kiện</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.inputLabel}>Mã linh kiện (tự động)</Text>
            <View style={styles.codePreviewBox}>
              <Text style={styles.codePreviewText}>{previewCode}</Text>
            </View>

            <Text style={styles.inputLabel}>Số lượng trong hộp</Text>
            <TextInput
              style={styles.input}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="number-pad"
              placeholder="1"
            />

            <Text style={styles.inputLabel}>Hình ảnh</Text>
            <View style={styles.imageEditContainer}>
              <Image source={{ uri: editImage }} style={styles.previewImage} />
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Text style={styles.uploadBtnText}>Tải ảnh từ máy 📸</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={saveEdit}
              >
                <Text style={styles.modalBtnSaveText}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, 
    backgroundColor: COLORS.background,
    width: '100%',
    maxWidth: 800,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  backBtnText: { fontSize: 24, color: COLORS.textPrimary, fontWeight: '700' },
  pageTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  
  subTitle: {
    fontSize: FONT_SIZES.md, color: COLORS.textSecondary,
    textAlign: 'center', marginBottom: SPACING.lg, fontWeight: '600',
    width: '100%',
    maxWidth: 800,
  },

  scroll: { 
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl, 
    paddingBottom: 100 
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  gridItem: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  imageBox: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  compImage: { width: '80%', height: '80%' },
  compName: { 
    fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textPrimary, 
    textAlign: 'center', marginBottom: 2, height: 32, // Đảm bảo chiếm đủ 2 dòng
  },
  compCode: { 
    fontSize: 10, color: COLORS.textSecondary, textAlign: 'center',
  },

  addGridItem: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  addImageBox: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  addIconText: { fontSize: 32, color: COLORS.textSecondary },
  addGridText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, 
    padding: SPACING.xl, paddingBottom: SPACING.xxxl,
    ...SHADOWS.lg 
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  deleteIconBtn: { padding: 8, backgroundColor: 'rgba(255, 77, 79, 0.1)', borderRadius: RADIUS.sm },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  codePreviewBox: {
    backgroundColor: '#E8F4FF',
    borderWidth: 1,
    borderColor: '#B8D4F0',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  codePreviewText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  imageEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  previewImage: {
    width: 60, height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    height: 60,
    justifyContent: 'center', alignItems: 'center',
  },
  uploadBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  modalBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: COLORS.background },
  modalBtnSave: { backgroundColor: COLORS.primary },
  modalBtnCancelText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textSecondary },
  modalBtnSaveText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.white },
});

export default KitComponentsScreen;
