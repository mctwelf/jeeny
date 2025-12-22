/**
 * PhoneInputScreen - Phone number input for OTP authentication
 * Design: Matches the Behance UI/UX mockups with Yellow/Dark theme
 * Default country: Mauritania (+222)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInDown,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

// Theme colors matching design
const COLORS = {
  primary: '#FFD600',
  primaryDark: '#FFC107',
  secondary: '#1A1A2E',
  secondaryLight: '#16213E',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  grayLight: '#E0E0E0',
  grayDark: '#666666',
  error: '#F44336',
  success: '#4CAF50',
  inputBg: '#F5F5F5',
  inputBorder: '#E0E0E0',
  inputBorderFocus: '#FFD600',
};

// Mauritania country code
const COUNTRY = {
  code: '+222',
  flag: '🇲🇷',
  name: 'Mauritania',
  nameAr: 'موريتانيا',
  maxLength: 8,
  // Phone pattern: starts with 2, 3, or 4
  pattern: /^[234]\d{7}$/,
};

// Animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PhoneInputScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  // State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const buttonScale = useSharedValue(1);
  const inputBorderWidth = useSharedValue(1);

  // Format phone number with spaces (XX XX XX XX)
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, COUNTRY.maxLength);

    // Format as XX XX XX XX
    const parts = [];
    for (let i = 0; i < limited.length; i += 2) {
      parts.push(limited.slice(i, i + 2));
    }
    return parts.join(' ');
  };

  // Handle phone number change
  const handlePhoneChange = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    setPhoneNumber(cleaned.slice(0, COUNTRY.maxLength));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Validate phone number
  const validatePhone = (): boolean => {
    if (phoneNumber.length === 0) {
      setError(t('auth.enterPhone'));
      return false;
    }

    if (phoneNumber.length < COUNTRY.maxLength) {
      setError(t('auth.invalidPhone'));
      return false;
    }

    if (!COUNTRY.pattern.test(phoneNumber)) {
      setError(t('auth.invalidPhone'));
      return false;
    }

    return true;
  };

  // Handle send OTP
  const handleSendOtp = async () => {
    Keyboard.dismiss();

    if (!validatePhone()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Call API to send OTP
      // await authService.sendOtp(`${COUNTRY.code}${phoneNumber}`);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to OTP verification screen
      router.push({
        pathname: '/auth/otp',
        params: {
          phoneNumber: `${COUNTRY.code}${phoneNumber}`,
          formattedPhone: `${COUNTRY.code} ${formatPhoneNumber(phoneNumber)}`,
        },
      });
    } catch (err: any) {
      setError(err.message || t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    inputBorderWidth.value = withSpring(2);
  };

  // Handle input blur
  const handleBlur = () => {
    setIsFocused(false);
    inputBorderWidth.value = withSpring(1);
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

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderWidth: inputBorderWidth.value,
    borderColor: withTiming(
      error
        ? COLORS.error
        : isFocused
        ? COLORS.inputBorderFocus
        : COLORS.inputBorder,
      { duration: 200 }
    ),
  }));

  // Check if button should be enabled
  const isButtonEnabled = phoneNumber.length === COUNTRY.maxLength && !isLoading;

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(100)}
          style={styles.header}
        >
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
          {/* Logo/Brand */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.brandContainer}
          >
            <View style={styles.logoContainer}>
              <Ionicons
                name="car-sport"
                size={48}
                color={COLORS.secondary}
              />
            </View>
            <Text style={styles.appName}>{t('common.appName')}</Text>
          </Animated.View>

          {/* Welcome text */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.welcomeContainer}
          >
            <Text style={styles.welcomeTitle}>{t('auth.welcome')}</Text>
            <Text style={styles.welcomeSubtitle}>{t('auth.subtitle')}</Text>
          </Animated.View>

          {/* Phone input section */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.inputSection}
          >
            <Text style={styles.inputLabel}>{t('auth.phoneNumber')}</Text>

            <Animated.View style={[styles.inputContainer, inputAnimatedStyle]}>
              {/* Country code */}
              <View style={styles.countryCodeContainer}>
                <Text style={styles.countryFlag}>{COUNTRY.flag}</Text>
                <Text style={styles.countryCode}>{COUNTRY.code}</Text>
                <View style={styles.countryCodeDivider} />
              </View>

              {/* Phone input */}
              <TextInput
                ref={inputRef}
                style={styles.phoneInput}
                value={formatPhoneNumber(phoneNumber)}
                onChangeText={handlePhoneChange}
                placeholder={t('auth.phonePlaceholder')}
                placeholderTextColor={COLORS.gray}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={11} // XX XX XX XX (8 digits + 3 spaces)
                onFocus={handleFocus}
                onBlur={handleBlur}
                editable={!isLoading}
                textAlign={isRTL ? 'right' : 'left'}
              />

              {/* Clear button */}
              {phoneNumber.length > 0 && !isLoading && (
                <Pressable
                  onPress={() => setPhoneNumber('')}
                  style={styles.clearButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.gray}
                  />
                </Pressable>
              )}
            </Animated.View>

            {/* Error message */}
            {error && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={styles.errorContainer}
              >
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Hint text */}
            <Text style={styles.hintText}>{t('auth.phoneHint')}</Text>
          </Animated.View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Send OTP button */}
          <Animated.View
            entering={FadeInUp.delay(500).springify()}
            style={styles.buttonContainer}
          >
            <AnimatedPressable
              style={[
                styles.sendButton,
                buttonAnimatedStyle,
                !isButtonEnabled && styles.sendButtonDisabled,
              ]}
              onPress={handleSendOtp}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={!isButtonEnabled}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.secondary} />
              ) : (
                <>
                  <Text
                    style={[
                      styles.sendButtonText,
                      !isButtonEnabled && styles.sendButtonTextDisabled,
                    ]}
                  >
                    {t('auth.sendOtp')}
                  </Text>
                  <Ionicons
                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                    size={20}
                    color={
                      isButtonEnabled ? COLORS.secondary : COLORS.grayDark
                    }
                    style={styles.sendButtonIcon}
                  />
                </>
              )}
            </AnimatedPressable>
          </Animated.View>

          {/* Terms and conditions */}
          <Animated.View
            entering={FadeIn.delay(600)}
            style={styles.termsContainer}
          >
            <Text style={styles.termsText}>
              {t('auth.termsText')}{' '}
              <Text style={styles.termsLink}>{t('auth.termsLink')}</Text>
              {' '}{t('auth.and')}{' '}
              <Text style={styles.termsLink}>{t('auth.privacyLink')}</Text>
            </Text>
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
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.grayDark,
    textAlign: 'center',
    lineHeight: 24,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  inputSection: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
    marginBottom: 8,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  inputContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  countryCodeContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: isRTL ? 0 : 8,
    marginLeft: isRTL ? 8 : 0,
  },
  countryCode: {
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
  },
  countryCodeDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.inputBorder,
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.secondary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
  },
  errorContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.error,
    marginLeft: isRTL ? 0 : 6,
    marginRight: isRTL ? 6 : 0,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  hintText: {
    fontSize: 13,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.gray,
    marginTop: 12,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  sendButton: {
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
  sendButtonDisabled: {
    backgroundColor: COLORS.grayLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
  },
  sendButtonTextDisabled: {
    color: COLORS.grayDark,
  },
  sendButtonIcon: {
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
  },
  termsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  termsText: {
    fontSize: 13,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  termsLink: {
    color: COLORS.secondary,
    fontFamily: 'Gilroy-SemiBold',
    textDecorationLine: 'underline',
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

export default PhoneInputScreen;
