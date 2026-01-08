import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Eye, EyeOff, ChevronLeft, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/cn';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verification-sent';

export default function AuthScreen() {
  const { signIn, signUp, forgotPassword, isSupabaseReady } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error: signInError } = await signIn(email.trim(), password);

    setIsLoading(false);

    if (signInError) {
      setError(signInError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error: signUpError, requiresVerification } = await signUp(email.trim(), password, fullName.trim());

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (requiresVerification) {
      setMode('verification-sent');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error: resetError } = await forgotPassword(email.trim());

    setIsLoading(false);

    if (resetError) {
      setError(resetError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setMode('verification-sent');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setError(null);
    setMode(newMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Show setup instructions if Supabase is not configured
  if (!isSupabaseReady) {
    return (
      <View className="flex-1 bg-[#0a0a0f]">
        <LinearGradient
          colors={['#0f1419', '#0a0a0f']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
        />
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-6 pt-12">
            <Animated.View entering={FadeInDown.duration(600)}>
              <Text className="text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-2">Setup Required</Text>
              <Text className="text-white text-3xl font-bold mb-4">Connect Supabase</Text>
              <Text className="text-gray-400 text-base leading-relaxed mb-8">
                To enable authentication and multi-user collaboration, you need to set up Supabase.
              </Text>

              <View className="bg-[#1a1a2e] rounded-2xl p-5 mb-6">
                <Text className="text-white font-semibold text-lg mb-4">Setup Steps:</Text>

                <View className="space-y-4">
                  <View className="flex-row">
                    <View className="w-6 h-6 rounded-full bg-emerald-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-emerald-400 font-bold text-xs">1</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">Create a Supabase project</Text>
                      <Text className="text-gray-500 text-sm mt-1">Go to supabase.com and create a free project</Text>
                    </View>
                  </View>

                  <View className="flex-row mt-4">
                    <View className="w-6 h-6 rounded-full bg-emerald-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-emerald-400 font-bold text-xs">2</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">Run the database schema</Text>
                      <Text className="text-gray-500 text-sm mt-1">Execute the SQL schema in the Supabase SQL editor</Text>
                    </View>
                  </View>

                  <View className="flex-row mt-4">
                    <View className="w-6 h-6 rounded-full bg-emerald-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-emerald-400 font-bold text-xs">3</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">Add environment variables</Text>
                      <Text className="text-gray-500 text-sm mt-1">Use the ENV tab to add:</Text>
                      <View className="bg-black/30 rounded-lg p-3 mt-2">
                        <Text className="text-emerald-400 font-mono text-xs">EXPO_PUBLIC_SUPABASE_URL</Text>
                        <Text className="text-emerald-400 font-mono text-xs mt-1">EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <Text className="text-gray-500 text-sm text-center">
                Find these values in your Supabase project settings under API
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Verification sent screen
  if (mode === 'verification-sent') {
    return (
      <View className="flex-1 bg-[#0a0a0f]">
        <LinearGradient
          colors={['#0f1419', '#0a0a0f']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
        />
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-6 items-center justify-center">
            <Animated.View entering={FadeIn.duration(600)} className="items-center">
              <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-6">
                <CheckCircle size={40} color="#00d4aa" />
              </View>
              <Text className="text-white text-2xl font-bold mb-3 text-center">Check Your Email</Text>
              <Text className="text-gray-400 text-center mb-8 px-4">
                We sent a verification link to{'\n'}
                <Text className="text-white font-medium">{email}</Text>
              </Text>
              <Pressable
                onPress={() => switchMode('login')}
                className="bg-emerald-500 py-3 px-8 rounded-xl"
              >
                <Text className="text-white font-semibold">Back to Login</Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <LinearGradient
        colors={['#0f1419', '#0a0a0f']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back button for forgot password */}
            {mode === 'forgot-password' && (
              <Animated.View entering={FadeIn.duration(300)} className="px-4 pt-4">
                <Pressable
                  onPress={() => switchMode('login')}
                  className="flex-row items-center"
                >
                  <ChevronLeft size={20} color="#00d4aa" />
                  <Text className="text-emerald-400 ml-1">Back</Text>
                </Pressable>
              </Animated.View>
            )}

            <View className="flex-1 px-6 pt-12 pb-8">
              {/* Header */}
              <Animated.View entering={FadeInDown.duration(600)}>
                <Text className="text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-2">
                  Tour Flow
                </Text>
                <Text className="text-white text-3xl font-bold mb-2">
                  {mode === 'login' && 'Welcome Back'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot-password' && 'Reset Password'}
                </Text>
                <Text className="text-gray-400 text-base mb-8">
                  {mode === 'login' && 'Sign in to access your tours'}
                  {mode === 'signup' && 'Join your team on Tour Flow'}
                  {mode === 'forgot-password' && 'Enter your email to reset your password'}
                </Text>
              </Animated.View>

              {/* Error message */}
              {error && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6"
                >
                  <Text className="text-red-400 text-sm">{error}</Text>
                </Animated.View>
              )}

              {/* Form */}
              <Animated.View entering={FadeInDown.delay(200).duration(600)} className="space-y-4">
                {/* Full Name (signup only) */}
                {mode === 'signup' && (
                  <View className="mb-4">
                    <Text className="text-gray-400 text-sm mb-2">Full Name</Text>
                    <View className="flex-row items-center bg-[#1a1a2e] rounded-xl px-4">
                      <User size={20} color="#6b7280" />
                      <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="John Smith"
                        placeholderTextColor="#4b5563"
                        autoCapitalize="words"
                        className="flex-1 text-white py-4 ml-3 text-base"
                      />
                    </View>
                  </View>
                )}

                {/* Email */}
                <View className={mode === 'signup' ? '' : 'mb-4'}>
                  <Text className="text-gray-400 text-sm mb-2">Email</Text>
                  <View className="flex-row items-center bg-[#1a1a2e] rounded-xl px-4">
                    <Mail size={20} color="#6b7280" />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor="#4b5563"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="flex-1 text-white py-4 ml-3 text-base"
                    />
                  </View>
                </View>

                {/* Password (not for forgot password) */}
                {mode !== 'forgot-password' && (
                  <View className="mt-4">
                    <Text className="text-gray-400 text-sm mb-2">Password</Text>
                    <View className="flex-row items-center bg-[#1a1a2e] rounded-xl px-4">
                      <Lock size={20} color="#6b7280" />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor="#4b5563"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        className="flex-1 text-white py-4 ml-3 text-base"
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff size={20} color="#6b7280" />
                        ) : (
                          <Eye size={20} color="#6b7280" />
                        )}
                      </Pressable>
                    </View>
                    {mode === 'signup' && (
                      <Text className="text-gray-500 text-xs mt-2">Minimum 6 characters</Text>
                    )}
                  </View>
                )}

                {/* Forgot password link (login only) */}
                {mode === 'login' && (
                  <Pressable onPress={() => switchMode('forgot-password')} className="self-end mt-2">
                    <Text className="text-emerald-400 text-sm">Forgot password?</Text>
                  </Pressable>
                )}
              </Animated.View>

              {/* Submit button */}
              <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mt-8">
                <Pressable
                  onPress={
                    mode === 'login'
                      ? handleSignIn
                      : mode === 'signup'
                        ? handleSignUp
                        : handleForgotPassword
                  }
                  disabled={isLoading}
                  className={cn(
                    'py-4 rounded-xl items-center justify-center',
                    isLoading ? 'bg-emerald-500/50' : 'bg-emerald-500'
                  )}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      {mode === 'login' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot-password' && 'Send Reset Link'}
                    </Text>
                  )}
                </Pressable>
              </Animated.View>

              {/* Switch mode */}
              {mode !== 'forgot-password' && (
                <Animated.View
                  entering={FadeInDown.delay(600).duration(600)}
                  className="flex-row justify-center mt-6"
                >
                  <Text className="text-gray-400">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  </Text>
                  <Pressable onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                    <Text className="text-emerald-400 font-semibold">
                      {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
