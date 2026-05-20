import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../theme/theme';

const UserManagementScreen = () => {
  const { studentAccounts, addStudentAccount } = useAuth();
  
  // State form tạo tài khoản
  const [newStudentId, setNewStudentId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleCreateAccount = async () => {
    if (!newStudentId || !newName || !newPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const result = await addStudentAccount(newStudentId, newName, newPassword);
    if (result.success) {
      Alert.alert('Thành công', result.message);
      // Xóa form
      setNewStudentId('');
      setNewName('');
      setNewPassword('');
    } else {
      Alert.alert('Thất bại', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Cấp Tài Khoản Sinh Viên</Text>
      </View>

      <ScrollView 
        style={{ flex: 1, width: '100%' }}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        
        {/* ── FORM TẠO TÀI KHOẢN ────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tạo tài khoản mới</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mã số sinh viên</Text>
            <TextInput 
              style={styles.input}
              placeholder="Nhập mã số sinh viên"
              placeholderTextColor="rgba(0,0,0,0.3)"
              value={newStudentId}
              onChangeText={setNewStudentId}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput 
              style={styles.input}
              placeholder="Nhập họ và tên"
              placeholderTextColor="rgba(0,0,0,0.3)"
              value={newName}
              onChangeText={setNewName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu cấp</Text>
            <TextInput 
              style={styles.input}
              placeholder="Nhập mật khẩu mặc định..."
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreateAccount}>
            <Text style={styles.submitBtnText}>+ CẤP TÀI KHOẢN</Text>
          </TouchableOpacity>
        </View>

        {/* ── DANH SÁCH TÀI KHOẢN ĐÃ CẤP ────────────────────────────── */}
        <Text style={styles.sectionTitle}>Tài khoản đã cấp ({studentAccounts.length})</Text>

        {studentAccounts.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có tài khoản sinh viên nào được cấp.</Text>
        ) : (
          studentAccounts.map((acc, index) => (
            <View key={index} style={styles.accountCard}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 24 }}>🎓</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accName}>{acc.name}</Text>
                <Text style={styles.accId}>{acc.studentId} · {acc.department}</Text>
              </View>
              <TouchableOpacity style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Reset Pass</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        
        <View style={{ height: 160 }} />
      </ScrollView>
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
  pageTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  scroll: { 
    width: '100%',
    maxWidth: 800, // Limit width on desktop web
    alignSelf: 'center', // Center content
    padding: SPACING.xl, 
    gap: SPACING.lg 
  },

  card: {
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.lg },
  
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },

  submitBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  submitBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '800' },

  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.lg },
  
  emptyText: { textAlign: 'center', color: COLORS.textDisabled, marginTop: SPACING.lg, fontSize: FONT_SIZES.md },

  accountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  accountInfo: { flex: 1 },
  accName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  accId: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  resetBtn: { padding: 8, backgroundColor: 'rgba(255, 77, 79, 0.1)', borderRadius: RADIUS.sm },
  resetBtnText: { color: COLORS.danger, fontSize: FONT_SIZES.xs, fontWeight: '700' },
});

export default UserManagementScreen;
