import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAuth() {
    const nextEmail = email.trim();
    const nextFullName = fullName.trim();

    if (isSignup && nextFullName.length === 0) {
      Alert.alert('Full name required', 'Enter your name to create an account.');
      return;
    }

    if (nextEmail.length === 0 || password.length === 0) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignup) {
        const result = await signUp(nextFullName, nextEmail, password);

        if (result.session) {
          router.replace('/');
        } else {
          Alert.alert('Signup successful', 'Check your email if confirmation is enabled.');
          setIsSignup(false);
        }
      } else {
        await signIn(nextEmail, password);
        router.replace('/');
      }
    } catch (error) {
      Alert.alert(isSignup ? 'Signup failed' : 'Login failed', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <Text style={styles.eyebrow}>Welcome Fashion</Text>
            <Text style={styles.title}>{isSignup ? 'Create account' : 'Login'}</Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? 'Save your details and start browsing the latest drops.'
                : 'Use your Supabase account to continue shopping.'}
            </Text>
          </View>

          <View style={styles.form}>
            {isSignup && (
              <View style={styles.field}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your name"
                  placeholderTextColor="#8d949e"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  style={styles.input}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#8d949e"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor="#8d949e"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                secureTextEntry
                textContentType={isSignup ? 'newPassword' : 'password'}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              disabled={isSubmitting}
              onPress={handleAuth}
              style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>{isSignup ? 'Sign up' : 'Login'}</Text>
              )}
            </TouchableOpacity>

            <Pressable
              disabled={isSubmitting}
              onPress={() => setIsSignup((current) => !current)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                {isSignup ? 'Already have an account? Login' : 'New user? Create account'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandBlock: {
    marginBottom: 28,
  },
  eyebrow: {
    color: '#2f6f6d',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: '#111111',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 40,
  },
  subtitle: {
    color: '#59616b',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  form: {
    backgroundColor: '#ffffff',
    borderColor: '#e6e9ee',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#1e252d',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#dde3ea',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111111',
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.72,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  secondaryButtonText: {
    color: '#2f6f6d',
    fontSize: 14,
    fontWeight: '700',
  },
});
