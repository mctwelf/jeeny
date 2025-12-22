/**
 * SelectVehicleScreen - Vehicle type selection with fare estimates
 * Design: Matches the Behance UI/UX mockups with Yellow/Dark theme
 * Features: Vehicle options, fare breakdown, payment method, promotions, RTL support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  I18nManager,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  grayExtraLight: '#F5F5F5',
  error: '#F44336',
  success: '#4CAF50',
  // Vehicle type colors
  economy: '#4CAF50',
  comfort: '#2196F3',
  business: '#9C27B0',
  van: '#FF9800',
  luxury: '#FFD600',
};

// Vehicle types data
interface VehicleType {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: any;
  capacity: number;
  eta: number; // in minutes
  baseFare: number;
  perKm: number;
  perMin: number;
  multiplier: number;
  color: string;
}

const VEHICLE_TYPES: VehicleType[] = [
  {
    id: 'economy',
    name: 'Economy',
    nameAr: 'اقتصادي',
    description: 'Affordable rides for everyday trips',
    descriptionAr: 'رحلات بأسعار معقولة للرحلات اليومية',
    icon: require('../../../assets/icons/car_1.png'),
    capacity: 4,
    eta: 3,
    baseFare: 50,
    perKm: 15,
    perMin: 3,
    multiplier: 1.0,
    color: COLORS.economy,
  },
  {
    id: 'comfort',
    name: 'Comfort',
    nameAr: 'مريح',
    description: 'More space and better comfort',
    descriptionAr: 'مساحة أكبر وراحة أفضل',
    icon: require('../../../assets/icons/car_2.png'),
    capacity: 4,
    eta: 5,
    baseFare: 80,
    perKm: 20,
    perMin: 4,
    multiplier: 1.3,
    color: COLORS.comfort,
  },
  {
    id: 'business',
    name: 'Business',
    nameAr: 'أعمال',
    description: 'Premium vehicles for professionals',
    descriptionAr: 'سيارات فاخرة للمحترفين',
    icon: require('../../../assets/icons/car_3.png'),
    capacity: 4,
    eta: 7,
    baseFare: 120,
    perKm: 30,
    perMin: 5,
    multiplier: 1.6,
    color: COLORS.business,
  },
  {
    id: 'van',
    name: 'Van',
    nameAr: 'فان',
    description: 'Perfect for groups',
    descriptionAr: 'مثالي للمجموعات',
    icon: require('../../../assets/icons/car_4.png'),
    capacity: 6,
    eta: 8,
    baseFare: 100,
    perKm: 25,
    perMin: 4,
    multiplier: 1.4,
    color: COLORS.van,
  },
  {
    id: 'luxury',
    name: 'Luxury',
    nameAr: 'فاخر',
    description: 'High-end experience',
    descriptionAr: 'تجربة راقية',
    icon: require('../../../assets/icons/car_5.png'),
    capacity: 4,
    eta: 10,
    baseFare: 200,
    perKm: 50,
    perMin: 8,
    multiplier: 2.0,
    color: COLORS.luxury,
  },
];

// Payment methods
interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', nameAr: 'نقداً', icon: 'cash', color: COLORS.success },
  { id: 'bankily', name: 'Bankily', nameAr: 'بنكيلي', icon: 'phone-portrait', color: '#00A859' },
  { id: 'sedad', name: 'Sedad', nameAr: 'السداد', icon: 'card', color: '#1E3A8A' },
  { id: 'masrvi', name: 'Masrvi', nameAr: 'مصرفي', icon: 'wallet', color: '#E31837' },
];

// Animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Vehicle option card component
interface VehicleOptionProps {
  vehicle: VehicleType;
  isSelected: boolean;
  estimatedFare: number;
  onSelect: () => void;
  index: number;
}

const VehicleOption: React.FC<VehicleOptionProps> = ({
  vehicle,
  isSelected,
  estimatedFare,
  onSelect,
  index,
}) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: withTiming(isSelected ? COLORS.primary : COLORS.grayLight, {
      duration: 200,
    }),
    backgroundColor: withTiming(
      isSelected ? `${COLORS.primary}10` : COLORS.white,
      { duration: 200 }
    ),
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isSelected ? 1 : 0, { duration: 200 }),
    transform: [
      {
        scale: withSpring(isSelected ? 1 : 0.5, { damping: 15, stiffness: 300 }),
      },
    ],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.vehicleOption, animatedStyle]}
    >
      {/* Selection indicator */}
      <Animated.View style={[styles.selectionIndicator, checkAnimatedStyle]}>
        <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
      </Animated.View>

      {/* Vehicle image */}
      <View style={styles.vehicleImageContainer}>
        <Image
          source={vehicle.icon}
          style={styles.vehicleImage}
          resizeMode="contain"
        />
      </View>

      {/* Vehicle info */}
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleNameRow}>
          <Text style={styles.vehicleName}>
            {isArabic ? vehicle.nameAr : vehicle.name}
          </Text>
          <View style={[styles.etaBadge, { backgroundColor: `${vehicle.color}20` }]}>
            <Ionicons name="time-outline" size={12} color={vehicle.color} />
            <Text style={[styles.etaText, { color: vehicle.color }]}>
              {vehicle.eta} {t('ride.minutes')}
            </Text>
          </View>
        </View>
        <Text style={styles.vehicleDescription} numberOfLines={1}>
          {isArabic ? vehicle.descriptionAr : vehicle.description}
        </Text>
        <View style={styles.vehicleCapacity}>
          <Ionicons name="people" size={14} color={COLORS.gray} />
          <Text style={styles.capacityText}>
            {t('ride.seats', { count: vehicle.capacity })}
          </Text>
        </View>
      </View>

      {/* Fare */}
      <View style={styles.fareContainer}>
        <Text style={styles.fareAmount}>{estimatedFare}</Text>
        <Text style={styles.fareCurrency}>MRU</Text>
      </View>
    </AnimatedPressable>
  );
};

const SelectVehicleScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    pickupLat?: string;
    pickupLng?: string;
    dropoffLat?: string;
    dropoffLng?: string;
    pickupAddress?: string;
    dropoffAddress?: string;
  }>();

  const isArabic = i18n.language === 'ar';

  // State
  const [selectedVehicle, setSelectedVehicle] = useState<string>('economy');
  const [selectedPayment, setSelectedPayment] = useState<string>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  // Mock route data (would come from API)
  const routeData = {
    distance: 5.2, // km
    duration: 15, // minutes
  };

  // Calculate fare for each vehicle
  const calculateFare = useCallback(
    (vehicle: VehicleType): number => {
      const baseFare = vehicle.baseFare;
      const distanceFare = routeData.distance * vehicle.perKm;
      const timeFare = routeData.duration * vehicle.perMin;
      const total = (baseFare + distanceFare + timeFare) * vehicle.multiplier;
      return Math.round(total - (total * discount) / 100);
    },
    [routeData, discount]
  );

  // Get selected vehicle data
  const selectedVehicleData = useMemo(
    () => VEHICLE_TYPES.find((v) => v.id === selectedVehicle),
    [selectedVehicle]
  );

  // Animation values
  const buttonScale = useSharedValue(1);

  // Handle confirm booking
  const handleConfirmBooking = async () => {
    if (!selectedVehicleData) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // TODO: Call API to create ride request
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to ride tracking screen
      router.push({
        pathname: '/ride/searching',
        params: {
          vehicleType: selectedVehicle,
          paymentMethod: selectedPayment,
          estimatedFare: calculateFare(selectedVehicleData).toString(),
        },
      });
    } catch (error) {
      console.error('Error booking ride:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Button animation
  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle payment method change
  const handlePaymentPress = () => {
    // TODO: Show payment method picker
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle promo code
  const handlePromoPress = () => {
    // TODO: Show promo code input
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Get selected payment method
  const selectedPaymentMethod = PAYMENT_METHODS.find((p) => p.id === selectedPayment);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <Text style={styles.headerTitle}>{t('ride.selectVehicle')}</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Route Summary */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={styles.routeSummary}
      >
        {/* Pickup */}
        <View style={styles.routePoint}>
          <View style={styles.routePointDot}>
            <View style={styles.pickupDot} />
          </View>
          <View style={styles.routePointInfo}>
            <Text style={styles.routePointLabel}>{t('search.pickup')}</Text>
            <Text style={styles.routePointAddress} numberOfLines={1}>
              {params.pickupAddress || 'موقعك الحالي'}
            </Text>
          </View>
        </View>

        {/* Route line */}
        <View style={styles.routeLine}>
          <View style={styles.routeLineDashed} />
        </View>

        {/* Dropoff */}
        <View style={styles.routePoint}>
          <View style={styles.routePointDot}>
            <View style={styles.dropoffDot} />
          </View>
          <View style={styles.routePointInfo}>
            <Text style={styles.routePointLabel}>{t('search.destination')}</Text>
            <Text style={styles.routePointAddress} numberOfLines={1}>
              {params.dropoffAddress || 'مطار نواكشوط الدولي'}
            </Text>
          </View>
        </View>

        {/* Route stats */}
        <View style={styles.routeStats}>
          <View style={styles.routeStat}>
            <Ionicons name="navigate" size={16} color={COLORS.gray} />
            <Text style={styles.routeStatValue}>{routeData.distance} km</Text>
          </View>
          <View style={styles.routeStatDivider} />
          <View style={styles.routeStat}>
            <Ionicons name="time" size={16} color={COLORS.gray} />
            <Text style={styles.routeStatValue}>
              {routeData.duration} {t('ride.minutes')}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Vehicle Options */}
      <ScrollView
        style={styles.vehicleList}
        contentContainerStyle={styles.vehicleListContent}
        showsVerticalScrollIndicator={false}
      >
        {VEHICLE_TYPES.map((vehicle, index) => (
          <Animated.View
            key={vehicle.id}
            entering={FadeInDown.delay(300 + index * 50).springify()}
          >
            <VehicleOption
              vehicle={vehicle}
              isSelected={selectedVehicle === vehicle.id}
              estimatedFare={calculateFare(vehicle)}
              onSelect={() => setSelectedVehicle(vehicle.id)}
              index={index}
            />
          </Animated.View>
        ))}

        {/* Spacer for bottom content */}
        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Bottom Section */}
      <Animated.View
        entering={SlideInUp.delay(500).springify()}
        style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}
      >
        {/* Payment & Promo Row */}
        <View style={styles.paymentPromoRow}>
          {/* Payment Method */}
          <Pressable
            style={({ pressed }) => [
              styles.paymentMethod,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handlePaymentPress}
          >
            <View
              style={[
                styles.paymentIcon,
                { backgroundColor: `${selectedPaymentMethod?.color}20` },
              ]}
            >
              <Ionicons
                name={selectedPaymentMethod?.icon as any}
                size={18}
                color={selectedPaymentMethod?.color}
              />
            </View>
            <Text style={styles.paymentText}>
              {isArabic
                ? selectedPaymentMethod?.nameAr
                : selectedPaymentMethod?.name}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={COLORS.gray}
            />
          </Pressable>

          {/* Promo Code */}
          <Pressable
            style={({ pressed }) => [
              styles.promoButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handlePromoPress}
          >
            <Ionicons name="pricetag" size={16} color={COLORS.primary} />
            <Text style={styles.promoText}>
              {promoCode || t('ride.promoCode')}
            </Text>
          </Pressable>
        </View>

        {/* Fare Breakdown */}
        {selectedVehicleData && (
          <View style={styles.fareBreakdown}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>{t('ride.estimatedFare')}</Text>
              <View style={styles.fareValueContainer}>
                <Text style={styles.fareTotalValue}>
                  {calculateFare(selectedVehicleData)}
                </Text>
                <Text style={styles.fareTotalCurrency}>MRU</Text>
              </View>
            </View>
            {discount > 0 && (
              <View style={styles.discountRow}>
                <Ionicons name="pricetag" size={14} color={COLORS.success} />
                <Text style={styles.discountText}>
                  {discount}% {t('ride.discount')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Confirm Button */}
        <AnimatedPressable
          style={[styles.confirmButton, buttonAnimatedStyle]}
          onPress={handleConfirmBooking}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.secondary} />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>
                {t('ride.confirmBooking')}
              </Text>
              <View style={styles.confirmButtonIcon}>
                <Ionicons
                  name={isRTL ? 'arrow-back' : 'arrow-forward'}
                  size={20}
                  color={COLORS.primary}
                />
              </View>
            </>
          )}
        </AnimatedPressable>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayExtraLight,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.grayExtraLight,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
    textAlign: 'center',
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  headerSpacer: {
    width: 44,
  },
  routeSummary: {
    backgroundColor: COLORS.grayExtraLight,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  routePoint: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 12,
  },
  routePointDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
  },
  routePointInfo: {
    flex: 1,
  },
  routePointLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.gray,
    marginBottom: 2,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  routePointAddress: {
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  routeLine: {
    width: 32,
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeLineDashed: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.grayLight,
    borderRadius: 1,
  },
  routeStats: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    gap: 16,
  },
  routeStat: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeStatValue: {
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
  },
  routeStatDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayLight,
  },
  vehicleList: {
    flex: 1,
    marginTop: 16,
  },
  vehicleListContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  vehicleOption: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.grayLight,
    gap: 12,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: isRTL ? undefined : 8,
    left: isRTL ? 8 : undefined,
  },
  vehicleImageContainer: {
    width: 80,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImage: {
    width: 70,
    height: 45,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNameRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  etaBadge: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  etaText: {
    fontSize: 11,
    fontFamily: 'Gilroy-SemiBold',
  },
  vehicleDescription: {
    fontSize: 13,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.gray,
    marginBottom: 4,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  vehicleCapacity: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontSize: 12,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.gray,
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
  },
  fareCurrency: {
    fontSize: 12,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.gray,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  paymentPromoRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  paymentMethod: {
    flex: 1,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayExtraLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  promoButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  promoText: {
    fontSize: 13,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.primary,
  },
  fareBreakdown: {
    backgroundColor: COLORS.grayExtraLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  fareRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
