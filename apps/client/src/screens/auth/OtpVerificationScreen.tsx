/**
 * OtpVerificationScreen - 6-digit OTP verification with beautiful animations
 * Design: Matches the Behance UI/UX mockups with Yellow/Dark theme
 * Features: Auto-focus, paste support, countdown timer, resend functionality
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  ActivityIndicator,
  Dimensions,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInDown,
  useAnimatedKeyboard,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// Theme colors matching design
const COLORS = {
  primary: '#FFD600',
  primaryDark: '#FFC107',
  primaryLight: '#FFEB3B',
  secondary: '#1A1A2E',
  secondaryLight: '#16213E',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  grayLight: '#E0E0E0',
  grayDark: '#666666',
  error: '#F44336',
  errorLight: '#FFEBEE',
  success: '#4CAF50',
  successLight: '#E8F5E9',
  inputBg: '#F5F5F5',
  inputBorder: '#E0E0E0',
  inputBorderFocus: '#FFD600',
};

// OTP configuration
const OTP_LENGTH = 6;
const RESEND_DELAY_SECONDS = 60;

// Animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OtpInputBoxProps {
  value: string;
  index: number;
  isFocused: boolean;
  isError: boolean;
  isSuccess: boolean;
}

const OtpInputBox: React.FC<OtpInputBoxProps> = ({
  value,
  index,
  isFocused,
  isError,
  isSuccess,
}) => {
  const scale = useSharedValue(1);
  const borderColor = useSharedValue(COLORS.inputBorder);

  useEffect(() => {
    if (value) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }
  }, [value]);

  useEffect(() => {
    if (isError) {
      borderColor.value = withTiming(COLORS.error, { duration: 200 });
      scale.value = withSequence(
        withTiming(1.05, { duration: 50 }),
        withTiming(0.95, { duration: 50 }),
        withTiming(1.05, { duration: 50 }),
        withTiming(1, { duration: 50 })
      );
    } else if (isSuccess) {
      borderColor.value = withTiming(COLORS.success, { duration: 200 });
    } else if (isFocused) {
      borderColor.value = withTiming(COLORS.primary, { duration: 200 });
    } else {
      borderColor.value = withTiming(
        value ? COLORS.secondary : COLORS.inputBorder,
        { duration: 200 }
      );
    }
  }, [isFocused, isError, isSuccess, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: borderColor.value,
    borderWidth: isFocused || value ? 2 : 1,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(value ? 1 : 0, { duration: 150 }),
    transform: [
      {
        scale: withSpring(value ? 1 : 0.5, { damping: 15, stiffness: 300 }),
      },
    ],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.otpBox, animatedStyle]}
    >
      <Animated.Text style={[styles.otpText, textAnimatedStyle]}>
        {value}
      </Animated.Text>
      {isFocused && !value && (
        <Animated.View
          style={styles.cursor}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <CursorBlink />
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Blinking cursor component
const CursorBlink: React.FC = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.cursorLine, animatedStyle]} />;
};

const OtpVerificationScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    phoneNumber: string;
    formattedPhone: string;
  }>();

  // Refs
  const inputRef = useRef<TextInput>(null);

  // State
  const [otp, setOtp] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY_SECONDS);
  const [canResend, setCanResend] = useState(false);

  // Animation values
  const buttonScale = useSharedValue(1);
  const shakeAnimation = useSharedValue(0);

  // Start resend countdown timer
  useEffect(() => {
    if (resendTimer > 0 && !canResend) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendTimer, canResend]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !isVerifying && !isSuccess) {
      handleVerifyOtp();
    }
  }, [otp]);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle OTP input change
  const handleOtpChange = (text: string) => {
    // Only allow digits
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(cleaned);
    setFocusedIndex(Math.min(cleaned.length, OTP_LENGTH - 1));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }

    // Haptic feedback
    if (cleaned.length > otp.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Handle verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) {
      setError(t('auth.invalidOtp'));
      triggerShake();
      return;
    }

    Keyboard.dismiss();
    setIsVerifying(true);
    setError(null);

    try {
      // TODO: Call API to verify OTP
      // await authService.verifyOtp(params.phoneNumber, otp);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate success/failure (for demo, accept any 6-digit OTP)
      const isValid = otp.length === OTP_LENGTH; // Replace with actual validation

      if (isValid) {
        setIsSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navigate after success animation
        setTimeout(() => {
          router.replace('/auth/register');
        }, 1000);
      } else {
        throw new Error(t('auth.invalidOtp'));
      }
    } catch (err: any) {
      setError(err.message || t('errors.unknownError'));
      setIsSuccess(false);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Clear OTP on error
      setOtp('');
      setFocusedIndex(0);
      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Call API to resend OTP
      // await authService.sendOtp(params.phoneNumber);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset timer
      setResendTimer(RESEND_DELAY_SECONDS);
      setCanResend(false);

      // Clear current OTP
      setOtp('');
      setFocusedIndex(0);
      inputRef.current?.focus();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger shake animation on error
  const triggerShake = () => {
    shakeAnimation.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Vibration.vibrate(100);
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Button press animation
  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  // Handle input focus
  const handleInputFocus = () => {
    setFocusedIndex(Math.min(otp.length, OTP_LENGTH - 1));
  };

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  // Check if verify button should be enabled
  const isVerifyEnabled = otp.length === OTP_LENGTH && !isVerifying && !isSuccess;

  // Format timer
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={24}
              color={COLORS.secondary}
            />
          </Pressable>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.iconContainer}
          >
            <View style={styles.iconCircle}>
              {isSuccess ? (
                <Ionicons name="checkmark" size={48} color={COLORS.white} />
              ) : (
                <Ionicons name="mail-open" size={48} color={COLORS.secondary} />
              )}
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.titleContainer}
          >
            <Text style={styles.title}>{t('auth.otp')}</Text>
            <Text style={styles.subtitle}>{t('auth.otpSentTo')}</Text>
            <Text style={styles.phoneNumber}>{params.formattedPhone}</Text>
          </Animated.View>

          {/* OTP Input */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={[styles.otpContainer, shakeAnimatedStyle]}
          >
            {/* Hidden TextInput for keyboard */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={otp}
              onChangeText={handleOtpChange}
              onFocus={handleInputFocus}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={OTP_LENGTH}
              caretHidden
              autoFocus
            />

            {/* OTP Boxes */}
            <Pressable
              style={styles.otpBoxesContainer}
              onPress={() => inputRef.current?.focus()}
            >
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <OtpInputBox
                  key={index}
                  value={otp[index] || ''}
                  index={index}
                  isFocused={focusedIndex === index && !isSuccess}
                  isError={!!error}
                  isSuccess={isSuccess}
                />
              ))}
            </Pressable>

            {/* Hint */}
            <Text style={styles.hintText}>{t('auth.otpHint')}</Text>
          </Animated.View>

          {/* Error message */}
          {error && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.errorContainer}
            >
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Success message */}
          {isSuccess && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.successContainer}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={COLORS.success}
              />
              <Text style={styles.successText}>{t('auth.verifyOtp')}</Text>
            </Animated.View>
          )}

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Verify Button */}
          <Animated.View
            entering={FadeInUp.delay(500).springify()}
            style={styles.buttonContainer}
          >
            <AnimatedPressable
              style={[
                styles.verifyButton,
                buttonAnimatedStyle,
                !isVerifyEnabled && styles.verifyButtonDisabled,
                isSuccess && styles.verifyButtonSuccess,
              ]}
              onPress={handleVerifyOtp}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={!isVerifyEnabled}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color={COLORS.secondary} />
              ) : isSuccess ? (
                <>
                  <Ionicons
                    name="checkmark"
                    size={24}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.verifyButtonText, { color: COLORS.white }]}>
                    {t('auth.verifyOtp')}
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.verifyButtonText,
                    !isVerifyEnabled && styles.verifyButtonTextDisabled,
                  ]}
                >
                  {t('auth.verifyOtp')}
                </Text>
              )}
            </AnimatedPressable>
          </Animated.View>

          {/* Resend OTP */}
          <Animated.View
            entering={FadeIn.delay(600)}
            style={styles.resendContainer}
          >
            <Text style={styles.resendText}>{t('auth.didntReceive')}</Text>
            {canResend ? (
              <Pressable
                onPress={handleResendOtp}
                disabled={isLoading}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.resendLink}>{t('auth.resendOtp')}</Text>
                )}
              </Pressable>
            ) : (
              <Text style={styles.timerText}>
                {t('auth.resendIn', { seconds: formatTimer(resendTimer) })}
              </Text>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* Decorative elements */}
      <View style={styles.decorativeContainer}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.grayDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  otpContainer: {
    width: '100%',
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  otpBoxesContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'center',
    gap: 10,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpText: {
    fontSize: 28,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
  },
  cursor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorLine: {
    width: 2,
    height: 28,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  hintText: {
    fontSize: 13,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.gray,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.error,
  },
  successContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.success,
  },
  spacer: {
    flex: 1,
    minHeight: 32,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  verifyButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.grayLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonSuccess: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  verifyButtonText: {
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
  },
  verifyButtonTextDisabled: {
    color: COLORS.grayDark,
  },
  buttonIcon: {
    marginRight: isRTL ? 0 : 8,
    marginLeft: isRTL ? 8 : 0,
  },
  resendContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 24,
    gap: 4,
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.gray,
  },
  resendLink: {
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  timerText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.secondary,
  },
  decorativeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    opacity: 0.05,
  },
  circle1: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    top: -SCREEN_WIDTH * 0.4,
    right: -SCREEN_WIDTH * 0.3,
  },
  circle2: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    bottom: -SCREEN_WIDTH * 0.2,
    left: -SCREEN_WIDTH * 0.2,
  },
});

export default OtpVerificationScreen;
