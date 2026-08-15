import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Department } from '@/types';

export default function DepartmentsScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const renderError = (fieldErrors: any) => {
    if (!fieldErrors) return null;
    if (Array.isArray(fieldErrors)) {
      return fieldErrors.map((err, i) => (
        <Text key={i} style={styles.errorText}>{err}</Text>
      ));
    }
    if (typeof fieldErrors === 'string') {
      return <Text style={styles.errorText}>{fieldErrors}</Text>;
    }
    return null;
  };

  // Fetch departments
  const fetchDepartments = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await api.get('/departments');
      // API returns { data: [...] }
      setDepartments(response.data.data || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch departments. Please check server connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Configure header
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Departments',
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerLeftBtn}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={22} color="#737373" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={() => {
            setEditingDepartment(null);
            setName('');
            setDescription('');
            setErrors({});
            setModalVisible(true);
          }}
        >
          <Text style={styles.headerCreateText}>Create</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDepartments(true);
  };

  // Create or Update Department
  const handleSaveDepartment = async () => {
    setErrors({});
    setFormLoading(true);
    try {
      const payload = { name, description: description.trim() || null };
      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.id}`, payload);
        Alert.alert('Success', 'Department updated successfully.');
      } else {
        await api.post('/departments', payload);
        Alert.alert('Success', 'Department created successfully.');
      }
      setModalVisible(false);
      fetchDepartments(true);
    } catch (err: any) {
      if (err.response) {
        const responseData = err.response.data;
        if (err.response.status === 422) {
          setErrors(responseData?.errors || {});
        } else {
          Alert.alert('Error', 'Failed to save department. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Network error. Please check server connection.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setName(dept.name);
    setDescription(dept.description || '');
    setErrors({});
    setModalVisible(true);
  };

  // Delete Department
  const handleDelete = (dept: Department) => {
    Alert.alert(
      'Delete Department',
      `Are you sure you want to delete the department "${dept.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/departments/${dept.id}`);
              Alert.alert('Success', 'Department deleted successfully.');
              fetchDepartments(true);
            } catch {
              Alert.alert('Error', 'Failed to delete department. It may have associated employees.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Department }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription}>
          {item.description || 'No description provided.'}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => handleEdit(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={16} color="#171717" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color="#ffffff" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0a0a0a" />
        </View>
      ) : (
        <FlatList
          data={departments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color="#737373" />
              <Text style={styles.emptyText}>No departments found</Text>
              <Text style={styles.emptySubtext}>Tap Create to add a department.</Text>
            </View>
          }
        />
      )}

      {/* Create / Edit Department Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingDepartment ? 'Edit Department' : 'Create Department'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#171717" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
                {/* Department Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Department Name</Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Engineering"
                    placeholderTextColor="#a3a3a3"
                  />
                  {renderError(errors.name)}
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Brief description of duties..."
                    placeholderTextColor="#a3a3a3"
                    multiline
                    numberOfLines={4}
                  />
                  {renderError(errors.description)}
                </View>

                {/* Actions */}
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.formBtn, styles.cancelFormBtn]}
                    onPress={() => setModalVisible(false)}
                    disabled={formLoading}
                  >
                    <Text style={styles.cancelFormText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formBtn, styles.saveFormBtn]}
                    onPress={handleSaveDepartment}
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.saveFormText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardInfo: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#737373',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  editBtn: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  editBtnText: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
  },
  deleteBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  headerLeftBtn: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  headerRightBtn: {
    marginRight: 16,
    backgroundColor: '#0a0a0a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  headerCreateText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#171717',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#737373',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171717',
  },
  modalForm: {
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#171717',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  formBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelFormBtn: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cancelFormText: {
    color: '#171717',
    fontWeight: '600',
  },
  saveFormBtn: {
    backgroundColor: '#0a0a0a',
  },
  saveFormText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
