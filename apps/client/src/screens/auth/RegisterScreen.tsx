/**
 * RegisterScreen - User registration/profile completion screen
 * Design: Matches the Behance UI/UX mockups with Yellow/Dark theme
 * Features: Profile photo, name input, gender selection, RTL support
 */

import React, { useState, useRef, useCallback } from 'react';
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
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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

// Animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GenderOptionProps {
  value: 'MALE' | 'FEMALE';
  label: string;
  icon: string;
  isSelected: boolean;
  onSelect: (value: 'MALE' | 'FEMALE') => void;
}

const GenderOption: React.FC<GenderOptionProps> = ({
  value,
  label,
  icon,
  isSelected,
  onSelect,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: withTiming(isSelected ? COLORS.primary : COLORS.inputBorder, {
      duration: 200,
    }),
    backgroundColor: withTiming(
      isSelected ? `${COLORS.primary}15` : COLORS.inputBg,
      { duration: 200 }
    ),
  }));

  return (
    <AnimatedPressable
      style={[styles.genderOption, animatedStyle]}
      onPress={() => {
        onSelect(value);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        style={[
          styles.genderIconContainer,
          { backgroundColor: isSelected ? COLORS.primary : COLORS.grayLight },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={isSelected ? COLORS.secondary : COLORS.grayDark}
        />
      </View>
      <Text
        style={[
          styles.genderLabel,
          { color: isSelected ? COLORS.secondary : COLORS.grayDark },
        ]}
      >
        {label}
      </Text>
      {isSelected && (
        <View style={styles.genderCheckmark}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        </View>
      )}
    </AnimatedPressable>
  );
};

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput>;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  autoCapitalize = 'words',
  keyboardType = 'default',
  returnKeyType = 'next',
  onSubmitEditing,
  inputRef,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderWidth = useSharedValue(1);

  const handleFocus = () => {
    setIsFocused(true);
    borderWidth.value = withSpring(2);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderWidth.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    borderColor: withTiming(
      error
        ? COLORS.error
        : isFocused
        ? COLORS.inputBorderFocus
        : COLORS.inputBorder,
      { duration: 200 }
    ),
  }));

  return (
    <View style={styles.inputFieldContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Animated.View style={[styles.inputContainer, animatedStyle]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          textAlign={isRTL ? 'right' : 'left'}
        />
      </Animated.View>
      {error && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.inputError}>
          <Ionicons name="alert-circle" size={14} color={COLORS.error} />
          <Text style={styles.inputErrorText}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  // Refs
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  // State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  }>({});

  // Animation values
  const buttonScale = useSharedValue(1);

  // Pick profile image
  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // Take photo
  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!firstName.trim()) {
      newErrors.firstName = t('register.firstNameRequired');
    }

    if (!lastName.trim()) {
      newErrors.lastName = t('register.lastNameRequired');
    }

    if (email.trim() && !isValidEmail(email)) {
      newErrors.email = t('register.invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle create account
  const handleCreateAccount = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call API to create/update user profile
      // await userService.updateProfile({
      //   firstName,
      //   lastName,
      //   email: email || undefined,
      //   gender: gender || undefined,
      //   profileImage,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to home
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('Error creating account:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
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

  // Check if form is valid
  const isFormValid = firstName.trim() && lastName.trim();

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
          <Text style={styles.headerTitle}>{t('register.title')}</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.profileImageSection}
          >
            <Pressable onPress={handlePickImage} style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={50} color={COLORS.gray} />
                </View>
              )}
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={18} color={COLORS.white} />
              </View>
            </Pressable>
            <Text style={styles.changePhotoText}>{t('profile.changePhoto')}</Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View
            entering={FadeInDown.delay(250).springify()}
            style={styles.subtitleContainer}
          >
            <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.formContainer}
          >
            {/* First Name */}
            <InputField
              label={t('register.firstName')}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName) {
                  setErrors((prev) => ({ ...prev, firstName: undefined }));
                }
              }}
              placeholder={t('register.firstName')}
              error={errors.firstName}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
            />

            {/* Last Name */}
            <InputField
              label={t('register.lastName')}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (errors.lastName) {
                  setErrors((prev) => ({ ...prev, lastName: undefined }));
                }
              }}
              placeholder={t('register.lastName')}
              error={errors.lastName}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              inputRef={lastNameRef}
            />

            {/* Email (Optional) */}
            <InputField
              label={t('register.email')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder={t('register.emailPlaceholder')}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="done"
              inputRef={emailRef}
            />

            {/* Gender Selection */}
            <View style={styles.genderSection}>
              <Text style={styles.inputLabel}>{t('register.gender')}</Text>
              <View style={styles.genderOptionsContainer}>
                <GenderOption
                  value="MALE"
                  label={t('register.male')}
                  icon="male"
                  isSelected={gender === 'MALE'}
                  onSelect={setGender}
                />
                <GenderOption
                  value="FEMALE"
                  label={t('register.female')}
                  icon="female"
                  isSelected={gender === 'FEMALE'}
                  onSelect={setGender}
                />
              </View>
            </View>
          </Animated.View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Create Account Button */}
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.buttonContainer}
          >
            <AnimatedPressable
              style={[
                styles.createButton,
                buttonAnimatedStyle,
                (!isFormValid || isLoading) && styles.createButtonDisabled,
              ]}
              onPress={handleCreateAccount}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.secondary} />
              ) : (
                <>
                  <Text
                    style={[
                      styles.createButtonText,
                      (!isFormValid || isLoading) &&
                        styles.createButtonTextDisabled,
                    ]}
                  >
                    {t('register.createAccount')}
                  </Text>
                  <Ionicons
                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                    size={20}
                    color={
                      isFormValid && !isLoading
                        ? COLORS.secondary
                        : COLORS.grayDark
                    }
                    style={styles.buttonIcon}
                  />
                </>
              )}
            </AnimatedPressable>
          </Animated.View>
        </ScrollView>
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
    flexDirection: isRTL ? 'row-reverse' : 'row',
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  profileImageSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    width: 110,
    height: 110,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  profileImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.grayLight,
    borderStyle: 'dashed',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.primary,
  },
  subtitleContainer: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.grayDark,
    textAlign: 'center',
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  formContainer: {
    gap: 16,
  },
  inputFieldContainer: {
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
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.secondary,
    paddingVertical: 0,
  },
  inputError: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  inputErrorText: {
    fontSize: 12,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.error,
  },
  genderSection: {
    marginTop: 8,
  },
  genderOptionsContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  genderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Gilroy-Medium',
  },
  genderCheckmark: {
    marginLeft: isRTL ? 0 : 'auto',
    marginRight: isRTL ? 'auto' : 0,
  },
  spacer: {
    height: 32,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 16,
  },
  createButton: {
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
  createButtonDisabled: {
    backgroundColor: COLORS.grayLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
  },
  createButtonTextDisabled: {
    color: COLORS.grayDark,
  },
  buttonIcon: {
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
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

export default RegisterScreen;
