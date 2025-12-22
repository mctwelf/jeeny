/**
 * SearchingDriverScreen - Animated screen while searching for a driver
 * Design: Matches the Behance UI/UX mockups with Yellow/Dark theme
 * Features: Pulsing animation, car radar effect, cancel option, RTL support
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  I18nManager,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

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
  grayExtraLight: '#F5F5F5',
  error: '#F44336',
  success: '#4CAF50',
};

// Animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Pulse ring component
interface PulseRingProps {
  delay: number;
  size: number;
}

const PulseRing: React.FC<PulseRingProps> = ({ delay, size }) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    width: size,
    height: size,
    borderRadius: size / 2,
  }));

  return <Animated.View style={[styles.pulseRing, animatedStyle]} />;
};

// Rotating car icon
const RotatingCar: React.FC = () => {
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    bounce.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(bounce);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { translateY: bounce.value },
    ],
  }));

  return (
    <Animated.View style={[styles.carIconContainer, animatedStyle]}>
      <Ionicons name="car-sport" size={40} color={COLORS.secondary} />
    </Animated.View>
  );
};

// Searching dots animation
const SearchingDots: React.FC = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 }),
        withDelay(600, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );

    dot2.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 }),
          withDelay(600, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      )
    );

    dot3.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 }),
          withDelay(600, withTiming(0, { duration: 0 }))
        ),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(dot1);
      cancelAnimation(dot2);
      cancelAnimation(dot3);
    };
  }, []);

  const dotStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(dot1.value, [0, 1], [0.8, 1.2]) }],
  }));

  const dotStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(dot2.value, [0, 1], [0.8, 1.2]) }],
  }));

  const dotStyle3 = useAnimatedStyle(() => ({
    opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(dot3.value, [0, 1], [0.8, 1.2]) }],
  }));

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, dotStyle1]} />
      <Animated.View style={[styles.dot, dotStyle2]} />
      <Animated.View style={[styles.dot, dotStyle3]} />
    </View>
  );
};

// Cancel confirmation modal
interface CancelModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelModal: React.FC<CancelModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeInUp.springify()}
          style={styles.modalContent}
        >
          <View style={styles.modalIconContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          </View>
          <Text style={styles.modalTitle}>{t('ride.cancelRide')}</Text>
          <Text style={styles.modalMessage}>
            {t('ride.cancelRideConfirm')}
          </Text>
          <Text style={styles.modalWarning}>
            {t('ride.cancellationFee')}
          </Text>

          <View style={styles.modalButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.modalButtonSecondary,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonSecondaryText}>
                {t('ride.keepRide')}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modalButtonPrimary,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonPrimaryText}>
                {t('ride.confirmCancel')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const SearchingDriverScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    vehicleType?: string;
    paymentMethod?: string;
    estimatedFare?: string;
  }>();

  const isArabic = i18n.language === 'ar';

  // State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [driversNearby, setDriversNearby] = useState(5);

  // Animation values
  const cancelButtonScale = useSharedValue(1);

  // Search timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate finding driver after some time
  useEffect(() => {
    const driverFoundTimer = setTimeout(() => {
      // Navigate to driver found screen
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/ride/driver-found',
        params: {
          ...params,
        },
      });
    }, 8000); // 8 seconds for demo

    return () => clearTimeout(driverFoundTimer);
  }, []);

  // Update drivers nearby count
  useEffect(() => {
    const nearbyTimer = setInterval(() => {
      setDriversNearby((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newValue = prev + change;
        return Math.max(1, Math.min(10, newValue));
      });
    }, 3000);

    return () => clearInterval(nearbyTimer);
  }, []);

  // Format search time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle cancel
  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowCancelModal(false);
    router.replace('/(tabs)/home');
  };

  // Cancel button animation
  const handleCancelPressIn = () => {
    cancelButtonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handleCancelPressOut = () => {
    cancelButtonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelButtonScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.white, COLORS.grayExtraLight, COLORS.white]}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.searchTime}>{formatTime(searchTime)}</Text>
          <Text style={styles.searchLabel}>{t('ride.findingDriver')}</Text>
        </View>
      </Animated.View>

      {/* Main animation area */}
      <View style={styles.animationContainer}>
        {/* Pulse rings */}
        <View style={styles.pulseContainer}>
          <PulseRing delay={0} size={280} />
          <PulseRing delay={500} size={280} />
          <PulseRing delay={1000} size={280} />
        </View>

        {/* Center circle with car */}
        <Animated.View
          entering={FadeIn.delay(300).springify()}
          style={styles.centerCircle}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.centerCircleGradient}
          >
            <RotatingCar />
          </LinearGradient>
        </Animated.View>

        {/* Searching text with dots */}
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={styles.searchingTextContainer}
        >
          <View style={styles.searchingRow}>
            <Text style={styles.searchingText}>{t('ride.findingDriver')}</Text>
            <SearchingDots />
          </View>
        </Animated.View>
      </View>

      {/* Info cards */}
      <Animated.View
        entering={FadeInUp.delay(600).springify()}
        style={styles.infoCardsContainer}
      >
        {/* Drivers nearby */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="car" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardValue}>{driversNearby}</Text>
            <Text style={styles.infoCardLabel}>
              {isArabic ? 'سائقين قريبين' : 'Drivers nearby'}
            </Text>
          </View>
        </View>

        {/* Estimated fare */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="cash" size={20} color={COLORS.success} />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardValue}>
              {params.estimatedFare || '150'} MRU
            </Text>
            <Text style={styles.infoCardLabel}>
              {t('ride.estimatedFare')}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Trip summary */}
      <Animated.View
        entering={FadeInUp.delay(700).springify()}
        style={styles.tripSummary}
      >
        <View style={styles.tripRoute}>
          <View style={styles.tripRoutePoint}>
            <View style={[styles.routeDot, styles.pickupDot]} />
            <Text style={styles.tripRouteText} numberOfLines={1}>
              {isArabic ? 'موقعك الحالي' : 'Your location'}
            </Text>
          </View>
          <View style={styles.tripRouteLine} />
          <View style={styles.tripRoutePoint}>
            <View style={[styles.routeDot, styles.dropoffDot]} />
            <Text style={styles.tripRouteText} numberOfLines={1}>
              {isArabic ? 'مطار نواكشوط الدولي' : 'Nouakchott Airport'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Cancel button */}
      <Animated.View
        entering={FadeInUp.delay(800).springify()}
        style={[styles.cancelButtonContainer, { paddingBottom: insets.bottom + 16 }]}
      >
        <AnimatedPressable
          style={[styles.cancelButton, cancelButtonAnimatedStyle]}
          onPress={handleCancel}
          onPressIn={handleCancelPressIn}
          onPressOut={handleCancelPressOut}
        >
          <Ionicons name="close" size={20} color={COLORS.error} />
          <Text style={styles.cancelButtonText}>{t('ride.cancelRide')}</Text>
        </AnimatedPressable>
      </Animated.View>

      {/* Cancel confirmation modal */}
      <CancelModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  searchTime: {
    fontSize: 42,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  searchLabel: {
    fontSize: 16,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.gray,
  },
  animationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  centerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  centerCircleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingTextContainer: {
    position: 'absolute',
    bottom: 20,
  },
  searchingRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchingText: {
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  infoCardsContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayExtraLight,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardValue: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  infoCardLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.gray,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  tripSummary: {
    marginHorizontal: 20,
    backgroundColor: COLORS.grayExtraLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tripRoute: {
    gap: 8,
  },
  tripRoutePoint: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickupDot: {
    backgroundColor: COLORS.success,
  },
  dropoffDot: {
    backgroundColor: COLORS.error,
  },
  tripRouteLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.grayLight,
    marginLeft: isRTL ? 0 : 5,
    marginRight: isRTL ? 5 : 0,
    borderRadius: 1,
  },
  tripRouteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.secondary,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  cancelButtonContainer: {
    paddingHorizontal: 20,
  },
  cancelButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.error,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.error}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.grayDark,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: 13,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.grayExtraLight,
    borderRadius: 14,
    paddingVertical: 14,
  },
  modalButtonSecondaryText: {
    fontSize: 15,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
  },
  modalButtonPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 14,
    paddingVertical: 14,
  },
  modalButtonPrimaryText: {
    fontSize: 15,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.white,
  },
});

export default SearchingDriverScreen;
