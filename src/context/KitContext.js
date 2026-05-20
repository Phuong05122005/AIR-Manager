import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { kitApi } from '../api/apiClient';
import { useAuth } from './AuthContext';

export const KitContext = createContext();

export const KitProvider = ({ children }) => {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth() || {};

  // Hàm lấy tên người thực hiện thao tác
  const getOperatorName = () => {
    return user?.name || 'Quản trị viên';
  };

  // Tải danh sách Hộp Kit từ MongoDB
  const fetchKits = async () => {
    try {
      setLoading(true);
      const response = await kitApi.getAll();
      if (response.data && response.data.success) {
        // Map backend _id sang id của frontend để không lỗi giao diện
        const formattedKits = response.data.data.map(k => ({
          ...k,
          id: k._id.toString()
        }));
        setKits(formattedKits);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('❌ Lỗi khi tải danh sách hộp kit:', error.message);
    }
  };

  // Tải khi khởi động
  useEffect(() => {
    fetchKits();
  }, []);

  // Thêm hộp kit mới vào MongoDB
  const addKit = async (newKit) => {
    try {
      const response = await kitApi.create({
        name: newKit.name,
        topic: newKit.topic,
        status: newKit.status,
        components: newKit.components,
        operator: getOperatorName()
      });

      if (response.data && response.data.success) {
        await fetchKits(); // Đồng bộ lại từ database
        Alert.alert('Thành công', 'Đã tạo hộp kit mới thành công!');
        return true;
      }
    } catch (error) {
      Alert.alert('Thất bại', error.message || 'Lỗi khi tạo hộp kit');
      return false;
    }
  };

  // Xóa hộp kit khỏi MongoDB (bảo toàn dữ liệu qua log)
  const deleteKit = async (kitId) => {
    try {
      const response = await kitApi.delete(kitId, getOperatorName());
      if (response.data && response.data.success) {
        await fetchKits(); // Đồng bộ lại
        return true;
      }
    } catch (error) {
      Alert.alert('Thất bại', error.message || 'Lỗi khi xóa hộp kit');
      return false;
    }
  };

  // Cập nhật linh kiện của một hộp kit
  const updateKitComponents = async (kitId, updatedComponents) => {
    try {
      const response = await kitApi.update(kitId, {
        components: updatedComponents,
        operator: getOperatorName()
      });

      if (response.data && response.data.success) {
        await fetchKits(); // Đồng bộ lại
        Alert.alert('Thành công', 'Đã cập nhật linh kiện thành công!');
        return true;
      }
    } catch (error) {
      Alert.alert('Thất bại', error.message || 'Lỗi khi cập nhật linh kiện');
      return false;
    }
  };

  // Cập nhật thông tin cơ bản của hộp kit
  const updateKitInfo = async (kitId, name, topic) => {
    try {
      const response = await kitApi.update(kitId, {
        name,
        topic,
        operator: getOperatorName()
      });

      if (response.data && response.data.success) {
        await fetchKits(); // Đồng bộ lại
        Alert.alert('Thành công', 'Đã cập nhật thông tin thành công!');
        return true;
      }
    } catch (error) {
      Alert.alert('Thất bại', error.message || 'Lỗi khi cập nhật thông tin');
      return false;
    }
  };

  return (
    <KitContext.Provider value={{ kits, loading, fetchKits, addKit, deleteKit, updateKitComponents, updateKitInfo }}>
      {children}
    </KitContext.Provider>
  );
};

export const useKit = () => useContext(KitContext);
