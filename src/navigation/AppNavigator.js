import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { COLORS, FONT_SIZES, SHADOWS, RADIUS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import UserDashboardScreen from '../screens/UserDashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import KitSetupScreen from '../screens/KitSetupScreen';
import AuditLogsScreen from '../screens/AuditLogsScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ProfileScreen from '../screens/ProfileScreen';
import KitComponentsScreen from '../screens/KitComponentsScreen';
import BorrowScreen from '../screens/BorrowScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Tab Icon tùy chỉnh ───────────────────────────────────────────────────────
const TabIcon = ({ emoji, label, focused }) => (
  <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
    <Text style={styles.emoji}>{emoji}</Text>
    {focused && <Text style={styles.activeLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>}
  </View>
);

// ─── Custom Tab Bar Background (Glassmorphism) ────────────────────────────────
const GlassTabBarBackground = () => (
  Platform.OS === 'web' ? (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} />
  ) : (
    <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
  )
);

// ─── Main Tab Navigator ──────────────────────────────────────────────────────
const MainTabNavigator = () => {
  const { role } = useAuth();

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: COLORS.background }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { justifyContent: 'center', padding: 0 },
        tabBarBackground: GlassTabBarBackground,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDisabled,
      }}
    >
      {/* TAB CHUNG HOẶC RIÊNG TÙY ROLE */}
      {role === 'admin' ? (
        <>
          <Tab.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Home" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="UserManage"
            component={UserManagementScreen}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Cấp TK" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="KitSetup"
            component={KitSetupScreen}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Kho" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="AuditLogs"
            component={AuditLogsScreen}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Log" focused={focused} />,
            }}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="UserDashboard"
            component={UserDashboardScreen}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
            }}
          />
        </>
      )}

      {/* TAB HỒ SƠ LUÔN HIỂN THỊ */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Hồ sơ" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// ─── Root Navigator ──────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { isAuthenticated } = useAuth();
  console.log('🗺️ AppNavigator rendering, isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="KitComponents" component={KitComponentsScreen} />
            <Stack.Screen name="Borrow" component={BorrowScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 24, // Nâng lên một chút cho thoáng
    left: Platform.OS === 'web' ? '50%' : 16, // Nới rộng thanh ra 2 bên một chút
    right: Platform.OS === 'web' ? 'auto' : 16,
    width: Platform.OS === 'web' ? 500 : undefined,
    marginLeft: Platform.OS === 'web' ? -250 : 0, // Căn giữa hoàn hảo trên web desktop
    height: 68, // Tăng chiều cao để nhìn thanh thoát hơn
    borderRadius: RADIUS.round, // Trở lại viên thuốc tuyệt đối
    borderTopWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingBottom: 0, // QUAN TRỌNG: Tắt padding mặc định của safe area
    paddingHorizontal: 16, // QUAN TRỌNG: Đẩy các nút xích vào trong 16px để hoàn toàn né góc bo tròn
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  tabIcon: {
    flexDirection: 'row', // Luôn là hàng ngang
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.round,
    paddingHorizontal: 12, // Rộng rãi hơn chút
    height: 44, // Chiều cao cố định cho nút
    gap: 6, // Trả lại gap rộng cho thoáng
  },
  tabIconActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  emoji: { fontSize: 20 },
  activeLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.primary,
  },
});

export default AppNavigator;
