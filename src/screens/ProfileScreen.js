/**
 * screens/ProfileScreen.js — Trang hồ sơ người dùng + cài đặt
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import Card from '../components/Card';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../theme/theme';

// ─── Menu Item ────────────────────────────────────────────────────────────────
const MenuItem = ({ icon, label, value, onPress, hasArrow = true, rightElement, disabled = false }) => (
  <TouchableOpacity 
    style={[styles.menuItem, disabled && { opacity: 0.5 }]} 
    onPress={onPress} 
    activeOpacity={0.7}
    disabled={disabled}
  >
    <View style={styles.menuIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
    <Text style={styles.menuLabel}>{label}</Text>
    <View style={styles.menuRight}>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {rightElement}
      {hasArrow && !rightElement && <Text style={styles.arrow}>›</Text>}
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────
const ProfileScreen = () => {
  const { role, user, logout, updateProfile, refreshUserProfile, notificationsEnabled, setNotificationsEnabled } = useAuth();
  const isFocused = useIsFocused();

  // Tự động đồng bộ làm mới dữ liệu từ MongoDB khi mở tab Hồ sơ
  useEffect(() => {
    if (isFocused) {
      refreshUserProfile();
    }
  }, [isFocused]);
  
  // State Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // State Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Nạp dữ liệu khi mở Modal
  useEffect(() => {
    if (showEditModal && user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditDept(user.department || '');
      setEditEmail(user.email || '');
    }
  }, [showEditModal, user]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống!');
      return;
    }

    if (!editEmail.trim()) {
      Alert.alert('Lỗi', 'Email không được để trống!');
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(editEmail.trim())) {
      Alert.alert('Lỗi', 'Email không đúng định dạng!');
      return;
    }
    
    // Đẩy dữ liệu lên Context & MongoDB
    const result = await updateProfile({
      name: editName,
      phone: editPhone,
      department: editDept,
      email: editEmail.trim(),
    });
    
    if (result && result.success) {
      setShowEditModal(false);
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ cá nhân lên MongoDB!');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tất cả các trường!');
      return;
    }

    if (currentPassword !== user?.password) {
      Alert.alert('Lỗi', 'Mật khẩu hiện tại không chính xác!');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    if (newPassword.length < 3) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải từ 3 ký tự trở lên!');
      return;
    }

    const result = await updateProfile({ password: newPassword });
    if (result && result.success) {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Thành công', 'Đổi mật khẩu thành công lên MongoDB!');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Bạn muốn đăng xuất khỏi ứng dụng?');
      if (confirmLogout) {
        logout();
      }
    } else {
      Alert.alert(
        'Đăng xuất',
        'Bạn muốn đăng xuất khỏi ứng dụng?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView 
        style={{ flex: 1, width: '100%' }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Hồ Sơ {role === 'admin' ? '(Admin)' : '(User)'}</Text>
          <TouchableOpacity style={styles.editBtnTop} onPress={() => setShowEditModal(true)}>
            <Text style={styles.editBtnTopText}>✏️ Sửa</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar & Info ──────────────────────────────────────────────── */}
        <Card variant="highlight" style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 36 }}>{role === 'admin' ? '👨‍💻' : '🎓'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userSub}>{role === 'admin' ? 'Quản trị viên kho' : `${user?.studentId} · ${user?.department}`}</Text>
        </Card>

        {/* ── Thông tin cá nhân ───────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <Card>
          <MenuItem icon="📧" label="Email" value={user?.email} onPress={() => {}} hasArrow={false} />
          <MenuItem icon="📱" label="Điện thoại" value={user?.phone || 'Chưa cập nhật'} onPress={() => {}} hasArrow={false} />
          <MenuItem icon="🏫" label="Khoa / Phòng" value={user?.department || 'Chưa cập nhật'} onPress={() => {}} hasArrow={false} />
        </Card>

        {/* ── Cài đặt ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Cài đặt & Bảo mật</Text>
        <Card>
          <MenuItem 
            icon="🔑" 
            label="Đổi mật khẩu" 
            onPress={() => setShowPasswordModal(true)} 
          />
          <MenuItem
            icon="🔔"
            label="Thông báo"
            hasArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
        </Card>

        {/* ── Thao tác ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Thao tác</Text>
        <Card>
          <MenuItem icon="🚪" label="Đăng xuất" onPress={handleLogout} />
        </Card>

        <Text style={styles.version}>AI Robotic v2.0.0 (Bento Edition)</Text>
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* ─── MODAL CHỈNH SỬA HỒ SƠ ─────────────────────────────────────────── */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chỉnh sửa Hồ sơ</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Form Inputs */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Họ và Tên</Text>
                  <TextInput 
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Nhập tên..."
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput 
                    style={styles.input}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Nhập email..."
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Số điện thoại</Text>
                  <TextInput 
                    style={styles.input}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Nhập số điện thoại..."
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Khoa / Phòng ban</Text>
                  <TextInput 
                    style={[styles.input, role === 'admin' && styles.inputDisabled]}
                    value={editDept}
                    onChangeText={setEditDept}
                    placeholder="Nhập tên khoa..."
                    editable={role !== 'admin'}
                  />
                  {role === 'admin' && <Text style={styles.helpText}>* Quản trị viên không thể đổi khoa</Text>}
                </View>

                {/* Submit */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.8}>
                  <Text style={styles.saveBtnText}>LƯU THAY ĐỔI</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── MODAL ĐỔI MẬT KHẨU ───────────────────────────────────────────── */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Đổi Mật Khẩu</Text>
                <TouchableOpacity onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mật khẩu hiện tại</Text>
                  <TextInput 
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Nhập mật khẩu hiện tại..."
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mật khẩu mới</Text>
                  <TextInput 
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nhập mật khẩu mới..."
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                  <TextInput 
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Xác nhận mật khẩu mới..."
                    secureTextEntry
                  />
                </View>

                {/* Submit */}
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.primary }]} onPress={handleChangePassword} activeOpacity={0.8}>
                  <Text style={styles.saveBtnText}>CẬP NHẬT MẬT KHẨU</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    alignItems: 'center', // Center content on desktop web
  },
  scroll: { 
    width: '100%',
    maxWidth: 600, // Limit width on desktop web
    alignSelf: 'center', // Center content horizontally on desktop web
    paddingHorizontal: SPACING.xl, 
    paddingBottom: SPACING.xxxl 
  },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xl },
  pageTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  editBtnTop: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.round },
  editBtnTopText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.primary },

  profileCard: { alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xxl },
  avatarCircle: {
    width: 80, height: 80, borderRadius: RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  userName: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.white },
  userSub: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)' },

  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.xl, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },

  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  menuIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  menuValue: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  arrow: { fontSize: 20, color: COLORS.textDisabled, marginLeft: 4 },

  version: { textAlign: 'center', fontSize: FONT_SIZES.xs, color: COLORS.textDisabled, marginTop: SPACING.xxl },

  /* ── MODAL STYLES ── */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: {
    backgroundColor: COLORS.surfaceSolid,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    maxHeight: '80%',
    ...SHADOWS.lg,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn: { fontSize: 24, color: COLORS.textDisabled, padding: 4 },

  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  inputDisabled: { backgroundColor: COLORS.divider, color: COLORS.textDisabled },
  helpText: { fontSize: 11, color: COLORS.danger, marginTop: 4 },

  saveBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  saveBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '800', letterSpacing: 0.5 },
});

export default ProfileScreen;
