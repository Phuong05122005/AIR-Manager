import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { userApi, logApi } from '../api/apiClient';

// Tạo Context cho Auth
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null); // 'admin' hoặc 'user'
  
  // Thông tin user hiện tại đang đăng nhập
  const [user, setUser] = useState(null);

  // Danh sách tài khoản Sinh viên (tải từ MongoDB)
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quản lý trạng thái thông báo gạt trong Profile và banner toàn cục
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeNotification, setActiveNotification] = useState(null);
  const [notificationQueue, setNotificationQueue] = useState([]);
  
  // Ref lưu mốc thời gian của log mới nhất đã xử lý
  const lastLogTimeRef = useRef(null);

  // Thêm thông báo mới vào hàng đợi FIFO
  const triggerNotification = (notification) => {
    setNotificationQueue((prev) => [...prev, notification]);
  };

  // Lắng nghe hàng đợi để hiển thị tuần tự từng thông báo nổi
  useEffect(() => {
    if (!activeNotification && notificationQueue.length > 0) {
      const nextNotification = notificationQueue[0];
      setActiveNotification(nextNotification);
      setNotificationQueue((prev) => prev.slice(1));
    }
  }, [activeNotification, notificationQueue]);

  // Vòng lặp quét AuditLogs thực tế từ MongoDB sau mỗi 8 giây (Short Polling)
  useEffect(() => {
    let interval;
    
    if (isAuthenticated && role === 'admin' && notificationsEnabled) {
      const checkRealEvents = async () => {
        try {
          const response = await logApi.getAll();
          if (response.data && response.data.success) {
            const logs = response.data.data;
            if (logs.length === 0) return;

            // Nếu đây là lần chạy đầu tiên, thiết lập mốc thời gian hiện tại từ log mới nhất
            if (!lastLogTimeRef.current) {
              lastLogTimeRef.current = logs[0].createdAt;
              console.log('🔄 Đã thiết lập mốc log ban đầu:', lastLogTimeRef.current);
              return;
            }

            // Lọc ra các log mới hơn mốc đã lưu
            const newLogs = logs.filter(
              (log) => new Date(log.createdAt) > new Date(lastLogTimeRef.current)
            );

            if (newLogs.length > 0) {
              // Cập nhật mốc log mới nhất ngay để tránh quét lặp
              lastLogTimeRef.current = logs[0].createdAt;

              // Đảo chiều để hiển thị theo thứ tự thời gian (cũ nhất trong số mới -> mới nhất)
              newLogs.reverse();

              // Bản đồ chuyển đổi actionType -> giao diện thông báo
              const typeMap = {
                'BORROW': 'info',
                'RETURN': 'success',
                'CREATE_KIT': 'success',
                'UPDATE_KIT': 'warning',
                'DELETE_KIT': 'error',
                'UPDATE_COMPONENTS': 'warning',
                'LOGIN': 'success',
                'LOGIN_FAILED': 'error',
              };

              const titleMap = {
                'BORROW': 'Mượn thiết bị',
                'RETURN': 'Trả thiết bị',
                'CREATE_KIT': 'Tạo hộp Kit mới',
                'UPDATE_KIT': 'Cập nhật Hộp Kit',
                'DELETE_KIT': 'Xóa hộp Kit',
                'UPDATE_COMPONENTS': 'Cập nhật Linh kiện',
                'LOGIN': 'Đăng nhập hệ thống',
                'LOGIN_FAILED': 'Đăng nhập thất bại',
              };

              // Thêm từng sự kiện thực vào hàng đợi
              newLogs.forEach((log) => {
                triggerNotification({
                  title: titleMap[log.actionType] || 'Thông báo hệ thống',
                  message: log.description,
                  type: typeMap[log.actionType] || 'info',
                });
              });
            }
          }
        } catch (error) {
          console.error('❌ Lỗi khi quét nhật ký thời gian thực:', error.message);
        }
      };

      // Chạy kiểm tra ngay khi khởi động
      checkRealEvents();

      // Thiết lập chu kỳ quét mỗi 8 giây
      interval = setInterval(checkRealEvents, 8000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, role, notificationsEnabled]);

  // Tải danh sách tài khoản sinh viên từ backend
  const fetchStudentAccounts = async () => {
    try {
      const response = await userApi.getAll();
      if (response.data && response.data.success) {
        // Chỉ lọc lấy các tài khoản có vai trò 'student'
        const students = response.data.data.filter(u => u.role === 'student');
        setStudentAccounts(students);
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải tài khoản sinh viên:', error.message);
    }
  };

  // Tải tài khoản khi bắt đầu nếu là Admin
  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      fetchStudentAccounts();
    }
  }, [isAuthenticated, role]);

  // Hàm cho Admin tạo tài khoản sinh viên mới trực tiếp vào MongoDB
  const addStudentAccount = async (studentId, name, password) => {
    try {
      const response = await userApi.create({
        studentId: studentId.toUpperCase().trim(),
        name: name.trim(),
        password: password,
        department: 'Kỹ thuật Điện tử',
        email: `${studentId.toLowerCase().trim()}@airobotic.edu.vn`,
        phone: 'Chưa cập nhật',
      });

      if (response.data && response.data.success) {
        await fetchStudentAccounts(); // Cập nhật lại danh sách hiển thị
        return { success: true, message: 'Tạo tài khoản thành công!' };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Mã sinh viên hoặc email đã tồn tại!' };
    }
  };

  // Hàm đăng nhập kết nối database MongoDB
  const login = async (selectedRole, usernameInput, passwordInput) => {
    if (!usernameInput || !passwordInput) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return false;
    }

    try {
      setLoading(true);
      const apiRole = selectedRole === 'user' ? 'student' : selectedRole;
      const response = await userApi.login({
        studentId: usernameInput.trim(),
        password: passwordInput,
        role: apiRole
      });

      if (response.data && response.data.success) {
        const userData = response.data.data;
        setRole(userData.role);
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      }
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Đăng nhập thất bại', 
        error.message || 'Tài khoản hoặc mật khẩu không chính xác.'
      );
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
  };

  // Hàm cập nhật hồ sơ cá nhân lên MongoDB
  const updateProfile = async (updatedInfo) => {
    if (!user || !user.id) return { success: false, message: 'Người dùng chưa đăng nhập' };
    
    try {
      const response = await userApi.update(user.id, updatedInfo);
      if (response.data && response.data.success) {
        // Cập nhật state user hiện tại
        const updatedUser = response.data.data;
        const newUserState = { 
          ...user, 
          ...updatedUser,
          id: updatedUser._id.toString() // giữ trường id đồng bộ
        };
        setUser(newUserState);
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật hồ sơ:', error.message);
      Alert.alert('Thất bại', error.message || 'Lỗi khi cập nhật hồ sơ cá nhân lên server');
      return { success: false, message: error.message };
    }
  };

  // Hàm tải lại thông tin mới nhất của User từ MongoDB
  const refreshUserProfile = async () => {
    if (!user || !user.id) return;
    try {
      const response = await userApi.getById(user.id);
      if (response.data && response.data.success) {
        const freshUser = response.data.data;
        setUser({
          ...user,
          ...freshUser,
          id: freshUser._id.toString()
        });
      }
    } catch (error) {
      console.error('❌ Lỗi khi làm mới hồ sơ:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, role, user, loading,
      login, logout, updateProfile, refreshUserProfile,
      studentAccounts, addStudentAccount, fetchStudentAccounts,
      notificationsEnabled, setNotificationsEnabled, activeNotification, setActiveNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
