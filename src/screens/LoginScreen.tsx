import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Field-specific validation errors from Laravel
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  // General server/network error
  const [generalError, setGeneralError] = useState<string | null>(null);

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

  const handleLoginSubmit = async () => {
    setErrors({});
    setGeneralError(null);
    
    // Quick client-side check
    let localErrors: Record<string, string[]> = {};
    if (!email.trim()) {
      localErrors.email = ['Email is required.'];
    }
    if (!password.trim()) {
      localErrors.password = ['Password is required.'];
    }
    
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      if (err.response) {
        const responseData = err.response.data;
        if (err.response.status === 422) {
          // Map Laravel validation errors
          setErrors(responseData?.errors || {});
          if (responseData?.message) {
            setGeneralError(responseData.message);
          }
        } else if (err.response.status === 401) {
          setGeneralError(responseData?.message || 'Invalid credentials.');
        } else {
          setGeneralError('An unexpected server error occurred. Please try again.');
        }
      } else {
        setGeneralError('Network error. Please check your connection to the Laravel backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.card}>
              <Text style={styles.title}>EMS Portal</Text>
              <Text style={styles.subtitle}>Sign in to manage your workplace</Text>

              {generalError && (
                <View style={styles.generalErrorBox}>
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="name@company.com"
                  placeholderTextColor="#a3a3a3"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.email;
                        return next;
                      });
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {renderError(errors.email)}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  placeholderTextColor="#a3a3a3"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.password;
                        return next;
                      });
                    }
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {renderError(errors.password)}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLoginSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171717',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 24,
  },
  generalErrorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
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
    height: 46,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#171717',
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fffbeb',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    height: 48,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#404040',
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
