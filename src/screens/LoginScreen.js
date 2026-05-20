import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const CustomBlurView = ({ children, tint, intensity, style }) => {
  if (Platform.OS === 'web') {
    const bgColor = tint === 'dark' ? 'rgba(10, 25, 47, 0.9)' : 'rgba(15, 23, 42, 0.85)';
    return <View style={[style, { backgroundColor: bgColor }]}>{children}</View>;
  }
  return <BlurView tint={tint} intensity={intensity} style={style}>{children}</BlurView>;
};

const LoginScreen = () => {
  const { login } = useAuth();
  console.log('🔑 LoginScreen rendering');
  
  // State: 'user' hoặc 'admin'
  const [selectedRole, setSelectedRole] = useState('user');
  
  // Dữ liệu đăng nhập
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Gọi hàm login với username và password thực tế
    login(selectedRole, username, password);
  };

  return (
    <View style={styles.container}>
      {/* ── NỀN GRADIENT ────────────────────────────────────────────── */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.teal, '#0A192F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* ── HEADER / BRAND ─────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Image
                source={require('../../assets/logo-icon.png')}
                style={styles.logoIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>AI ROBOTIC</Text>
            <View style={styles.taglineRow}>
              <View style={styles.taglineDash} />
              <Text style={styles.appTagline}>Học AI nắm chắc tương lai</Text>
              <View style={styles.taglineDash} />
            </View>
          </View>

          {/* ── KHUNG ĐĂNG NHẬP (GLASSMORPHISM) ───────────────────── */}
          <View style={styles.glassWrapper}>
            <CustomBlurView intensity={60} tint="light" style={styles.glassCard}>
              
              {/* CHỌN VAI TRÒ */}
              <View style={styles.roleTabs}>
                <TouchableOpacity 
                  style={[styles.roleTab, selectedRole === 'user' && styles.roleTabActive]}
                  onPress={() => setSelectedRole('user')}
                >
                  <Text style={selectedRole === 'user' ? styles.roleTextActive : styles.roleText}>
                    👩‍🎓 Sinh viên
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.roleTab, selectedRole === 'admin' && styles.roleTabActive]}
                  onPress={() => setSelectedRole('admin')}
                >
                  <Text style={selectedRole === 'admin' ? styles.roleTextActive : styles.roleText}>
                    👨‍💻 Quản trị
                  </Text>
                </TouchableOpacity>
              </View>

              {/* FORM ĐĂNG NHẬP */}
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {selectedRole === 'admin' ? 'Email Quản trị' : 'Mã Sinh viên / Giảng viên'}
                  </Text>
                  <TextInput 
                    style={styles.input}
                    placeholder={selectedRole === 'admin' ? "Nhập email" : "Nhập mã sinh viên"}
                    placeholderTextColor="rgba(255,255,255,0.65)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mật khẩu</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="rgba(255,255,255,0.65)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                {/* NÚT ĐĂNG NHẬP */}
                <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8} onPress={handleLogin}>
                  <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
                </TouchableOpacity>

                {/* QUÊN MẬT KHẨU */}
                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

            </CustomBlurView>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', // Center content on desktop web
    padding: SPACING.xl 
  },
  
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
    width: '100%',
    maxWidth: 450,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  logoIcon: { width: 64, height: 64 },
  appName: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 3,
    textAlign: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  taglineDash: {
    flex: 1,
    maxWidth: 36,
    height: 1,
    backgroundColor: COLORS.brandCyan,
    opacity: 0.6,
  },
  appTagline: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.brandCyan,
    letterSpacing: 0.5,
    textAlign: 'center',
    flexShrink: 1,
  },

  glassWrapper: {
    width: '100%',
    maxWidth: 450, // Constrain width on desktop web
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  glassCard: {
    padding: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  roleTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.xxl,
  },
  roleTab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  roleTabActive: { backgroundColor: 'rgba(255, 255, 255, 0.95)', ...SHADOWS.sm },
  roleText: { fontSize: FONT_SIZES.md, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  roleTextActive: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: '700' },

  formContainer: { gap: SPACING.lg },
  inputGroup: { gap: SPACING.xs },
  inputLabel: { fontSize: FONT_SIZES.sm, color: COLORS.white, fontWeight: '600', marginLeft: 4 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },

  loginBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },

  forgotBtn: { alignItems: 'center', marginTop: SPACING.sm },
  forgotText: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.sm },
});

export default LoginScreen;
