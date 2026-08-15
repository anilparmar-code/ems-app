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
import { Employee, Department } from '@/types';

export default function EmployeesScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

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

  // Department selector modal state
  const [deptSelectorVisible, setDeptSelectorVisible] = useState(false);

  // Fetch employees and departments
  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
      ]);
      setEmployees(empRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load employees or departments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Configure header
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Employees',
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
            if (departments.length === 0) {
              Alert.alert('Cannot Create Employee', 'You must create at least one department first.');
              return;
            }
            setEditingEmployee(null);
            setName('');
            setEmail('');
            setPhone('');
            setDesignation('');
            setSalary('');
            setDepartmentId(departments[0]?.id || null);
            setStatus('active');
            setErrors({});
            setModalVisible(true);
          }}
        >
          <Text style={styles.headerCreateText}>Create</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, departments, logout]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // Create or Update Employee
  const handleSaveEmployee = async () => {
    setErrors({});
    setFormLoading(true);
    try {
      const numSalary = salary.trim() !== '' ? parseFloat(salary) : null;
      const payload = {
        name,
        email,
        phone: phone.trim() || null,
        designation,
        salary: numSalary,
        department_id: departmentId,
        status,
      };

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, payload);
        Alert.alert('Success', 'Employee updated successfully.');
      } else {
        await api.post('/employees', payload);
        Alert.alert('Success', 'Employee created successfully.');
      }
      setModalVisible(false);
      fetchData(true);
    } catch (err: any) {
      if (err.response) {
        const responseData = err.response.data;
        if (err.response.status === 422) {
          setErrors(responseData?.errors || {});
        } else {
          Alert.alert('Error', 'Failed to save employee. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Network error. Please check server connection.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone || '');
    setDesignation(emp.designation);
    setSalary(emp.salary !== null && emp.salary !== undefined ? emp.salary.toString() : '');
    setDepartmentId(emp.department_id);
    setStatus(emp.status);
    setErrors({});
    setModalVisible(true);
  };

  // Delete Employee
  const handleDelete = (emp: Employee) => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete employee "${emp.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/employees/${emp.id}`);
              Alert.alert('Success', 'Employee deleted successfully.');
              fetchData(true);
            } catch {
              Alert.alert('Error', 'Failed to delete employee.');
            }
          },
        },
      ]
    );
  };

  const getSelectedDeptName = () => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.name : 'Select Department';
  };

  const renderItem = ({ item }: { item: Employee }) => {
    const isStatusActive = item.status === 'active';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.designation}</Text>
          </View>
          <View style={[styles.statusBadge, isStatusActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, isStatusActive ? styles.statusActiveText : styles.statusInactiveText]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={14} color="#737373" style={styles.infoIcon} />
            <Text style={styles.infoText}>{item.department?.name || 'No department'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={14} color="#737373" style={styles.infoIcon} />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>
          {item.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color="#737373" style={styles.infoIcon} />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          )}
          {item.salary !== null && item.salary !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={14} color="#737373" style={styles.infoIcon} />
              <Text style={styles.infoText}>${Number(item.salary).toLocaleString()}</Text>
            </View>
          )}
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
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0a0a0a" />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#737373" />
              <Text style={styles.emptyText}>No employees found</Text>
              <Text style={styles.emptySubtext}>Tap Create to add an employee.</Text>
            </View>
          }
        />
      )}

      {/* Create / Edit Employee Modal */}
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
                  {editingEmployee ? 'Edit Employee' : 'Create Employee'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#171717" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Jane Doe"
                    placeholderTextColor="#a3a3a3"
                  />
                  {renderError(errors.name)}
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="e.g. jane.doe@company.com"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {renderError(errors.email)}
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="e.g. 555-123-4567"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="phone-pad"
                  />
                  {renderError(errors.phone)}
                </View>

                {/* Designation */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Designation</Text>
                  <TextInput
                    style={[styles.input, errors.designation && styles.inputError]}
                    value={designation}
                    onChangeText={setDesignation}
                    placeholder="e.g. Staff Engineer"
                    placeholderTextColor="#a3a3a3"
                  />
                  {renderError(errors.designation)}
                </View>

                {/* Salary */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Salary (Annual)</Text>
                  <TextInput
                    style={[styles.input, errors.salary && styles.inputError]}
                    value={salary}
                    onChangeText={setSalary}
                    placeholder="e.g. 120000"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="numeric"
                  />
                  {renderError(errors.salary)}
                </View>

                {/* Department Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Department</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.selectorBtn, errors.department_id && styles.inputError]}
                    onPress={() => setDeptSelectorVisible(true)}
                  >
                    <Text style={styles.selectorBtnText}>{getSelectedDeptName()}</Text>
                    <Ionicons name="chevron-down" size={16} color="#737373" />
                  </TouchableOpacity>
                  {renderError(errors.department_id)}
                </View>

                {/* Status Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusToggleContainer}>
                    <TouchableOpacity
                      style={[styles.statusToggleBtn, status === 'active' && styles.statusToggleBtnActive]}
                      onPress={() => setStatus('active')}
                    >
                      <Text style={[styles.statusToggleText, status === 'active' && styles.statusToggleTextActive]}>
                        Active
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusToggleBtn, status === 'inactive' && styles.statusToggleBtnActive]}
                      onPress={() => setStatus('inactive')}
                    >
                      <Text style={[styles.statusToggleText, status === 'inactive' && styles.statusToggleTextActive]}>
                        Inactive
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {renderError(errors.status)}
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
                    onPress={handleSaveEmployee}
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

      {/* Custom Department Selector Overlay */}
      <Modal
        visible={deptSelectorVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeptSelectorVisible(false)}
      >
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContainer}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>Select Department</Text>
              <TouchableOpacity onPress={() => setDeptSelectorVisible(false)}>
                <Ionicons name="close" size={22} color="#171717" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={departments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectorItem,
                    item.id === departmentId && styles.selectorItemActive,
                  ]}
                  onPress={() => {
                    setDepartmentId(item.id);
                    setDeptSelectorVisible(false);
                  }}
                >
                  <Text style={[
                    styles.selectorItemText,
                    item.id === departmentId && styles.selectorItemTextActive,
                  ]}>
                    {item.name}
                  </Text>
                  {item.id === departmentId && (
                    <Ionicons name="checkmark" size={18} color="#0a0a0a" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.selectorList}
            />
          </View>
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#171717',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#737373',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusActiveText: {
    color: '#15803d',
  },
  statusInactive: {
    backgroundColor: '#f3f4f6',
  },
  statusInactiveText: {
    color: '#4b5563',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 6,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#171717',
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
  selectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorBtnText: {
    fontSize: 14,
    color: '#171717',
  },
  statusToggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusToggleBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  statusToggleBtnActive: {
    backgroundColor: '#0a0a0a',
    borderColor: '#0a0a0a',
  },
  statusToggleText: {
    fontSize: 14,
    color: '#737373',
    fontWeight: '600',
  },
  statusToggleTextActive: {
    color: '#ffffff',
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
  selectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  selectorContainer: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    padding: 20,
    maxHeight: '70%',
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 10,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#171717',
  },
  selectorList: {
    marginVertical: 4,
  },
  selectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectorItemActive: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  selectorItemText: {
    fontSize: 14,
    color: '#737373',
  },
  selectorItemTextActive: {
    color: '#171717',
    fontWeight: 'bold',
  },
});
