/**
 * HomeScreen - Main home screen with map, search, and quick actions
 * Design: Matches the Behance UI/UX mockups with Yellow/Dark theme
 * Features: Map view, location search, saved places, promotions, RTL support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  I18nManager,
  Dimensions,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
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
  mapOverlay: 'rgba(255, 255, 255, 0.95)',
};

// Map custom style (dark style for better visibility of markers)
const MAP_STYLE = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
];

// Default location (Nouakchott, Mauritania)
const DEFAULT_REGION = {
  latitude: 18.0735,
  longitude: -15.9582,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Quick action button component
interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
  delay?: number;
  iconFamily?: 'ionicons' | 'material';
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  onPress,
  delay = 0,
  iconFamily = 'ionicons',
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const IconComponent = iconFamily === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <AnimatedPressable
      style={[styles.quickAction, animatedStyle]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        entering={FadeInDown.delay(delay).springify()}
        style={styles.quickActionInner}
      >
        <View style={styles.quickActionIconContainer}>
          <IconComponent name={icon as any} size={24} color={COLORS.secondary} />
        </View>
        <Text style={styles.quickActionLabel} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
};

// Saved place item component
interface SavedPlaceProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isAdd?: boolean;
}

const SavedPlaceItem: React.FC<SavedPlaceProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  isAdd = false,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.savedPlaceItem,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.savedPlaceIcon,
          isAdd && styles.savedPlaceIconAdd,
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={isAdd ? COLORS.primary : COLORS.white}
        />
      </View>
      <View style={styles.savedPlaceContent}>
        <Text style={[styles.savedPlaceTitle, isAdd && styles.savedPlaceTitleAdd]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.savedPlaceSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={COLORS.gray}
      />
    </Pressable>
  );
};

// Promotion card component
interface PromotionCardProps {
  title: string;
  description: string;
  discount: string;
  bgColor: string;
  onPress: () => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({
  title,
  description,
  discount,
  bgColor,
  onPress,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.promotionCard,
        { backgroundColor: bgColor, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.promotionContent}>
        <Text style={styles.promotionDiscount}>{discount}</Text>
        <Text style={styles.promotionTitle}>{title}</Text>
        <Text style={styles.promotionDescription}>{description}</Text>
      </View>
      <View style={styles.promotionIconContainer}>
        <Ionicons name="gift" size={40} color="rgba(255,255,255,0.3)" />
      </View>
    </Pressable>
  );
};

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // State
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [address, setAddress] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Animation values
  const bottomSheetTranslate = useSharedValue(0);
  const searchBarScale = useSharedValue(1);

  // Get user's current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setIsLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // Get address from coordinates
        const [addressResult] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addressResult) {
          const formattedAddress = [
            addressResult.street,
            addressResult.district,
            addressResult.city,
          ]
            .filter(Boolean)
            .join(', ');
          setAddress(formattedAddress || t('home.currentLocation'));
        }
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, []);

  // Handle search bar press
  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/search');
  };

  // Handle recenter map
  const handleRecenterMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Handle quick actions
  const handleBookRide = () => {
    router.push('/search');
  };

  const handleScheduleRide = () => {
    router.push('/search?scheduled=true');
  };

  const handleRideHistory = () => {
    router.push('/(tabs)/activity');
  };

  // Handle saved places
  const handleAddHome = () => {
    router.push('/favorites/add?type=home');
  };

  const handleAddWork = () => {
    router.push('/favorites/add?type=work');
  };

  // Get greeting based on time
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greetingMorning', { name: 'محمد' });
    if (hour < 18) return t('home.greetingAfternoon', { name: 'محمد' });
    return t('home.greetingEvening', { name: 'محمد' });
  };

  // Search bar animation
  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));

  const handleSearchPressIn = () => {
    searchBarScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handleSearchPressOut = () => {
    searchBarScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={MAP_STYLE}
        mapPadding={{ top: 0, right: 0, bottom: SCREEN_HEIGHT * 0.4, left: 0 }}
      >
        {/* Current location marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Map Gradient Overlay */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', COLORS.white]}
        style={styles.mapGradient}
        pointerEvents="none"
      />

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Animated.View
          entering={FadeIn.delay(200)}
          style={styles.headerContent}
        >
          {/* Menu Button */}
          <Pressable
            style={({ pressed }) => [
              styles.menuButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="menu" size={24} color={COLORS.secondary} />
          </Pressable>

          {/* Location Display */}
          <View style={styles.locationContainer}>
            <View style={styles.locationDot} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>{t('home.currentLocation')}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {isLoadingLocation ? '...' : address || t('home.currentLocation')}
              </Text>
            </View>
          </View>

          {/* Notification Button */}
          <Pressable
            style={({ pressed }) => [
              styles.notificationButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      {/* Recenter Button */}
      <Animated.View
        entering={FadeIn.delay(400)}
        style={[styles.recenterButton, { top: insets.top + 70 }]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.recenterButtonInner,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleRecenterMap}
        >
          <Ionicons name="locate" size={22} color={COLORS.secondary} />
        </Pressable>
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        entering={SlideInUp.delay(300).springify()}
        style={styles.bottomSheet}
      >
        {/* Handle */}
        <View style={styles.bottomSheetHandle}>
          <View style={styles.handleBar} />
        </View>

        <ScrollView
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Greeting */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.greetingContainer}
          >
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </Animated.View>

          {/* Search Bar */}
          <AnimatedPressable
            style={[styles.searchBar, searchBarAnimatedStyle]}
            onPress={handleSearchPress}
            onPressIn={handleSearchPressIn}
            onPressOut={handleSearchPressOut}
          >
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.searchPlaceholder}>{t('home.whereToGo')}</Text>
            <View style={styles.searchDivider} />
            <Pressable style={styles.searchTimeButton}>
              <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
              <Text style={styles.searchTimeText}>{t('time.now')}</Text>
            </Pressable>
          </AnimatedPressable>

          {/* Quick Actions */}
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={styles.quickActionsContainer}
          >
            <QuickAction
              icon="car-sport"
              label={t('home.bookRide')}
              onPress={handleBookRide}
              delay={100}
            />
            <QuickAction
              icon="calendar-outline"
              label={t('home.scheduleRide')}
              onPress={handleScheduleRide}
              delay={150}
            />
            <QuickAction
              icon="time-outline"
              label={t('home.rideHistory')}
              onPress={handleRideHistory}
              delay={200}
            />
            <QuickAction
              icon="gift-outline"
              label={t('home.promotions')}
              onPress={() => router.push('/promotions')}
              delay={250}
            />
          </Animated.View>

          {/* Saved Places */}
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            style={styles.savedPlacesContainer}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.savedPlaces')}</Text>
              <Pressable onPress={() => router.push('/favorites')}>
                <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
              </Pressable>
            </View>

            <View style={styles.savedPlacesList}>
              <SavedPlaceItem
                icon="home"
                title={t('home.home')}
                subtitle={t('home.addHome')}
                onPress={handleAddHome}
                isAdd
              />
              <View style={styles.savedPlaceDivider} />
              <SavedPlaceItem
                icon="briefcase"
                title={t('home.work')}
                subtitle={t('home.addWork')}
                onPress={handleAddWork}
                isAdd
              />
            </View>
          </Animated.View>

          {/* Promotions */}
          <Animated.View
            entering={FadeInDown.delay(700).springify()}
            style={styles.promotionsContainer}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.promotions')}</Text>
              <Pressable onPress={() => router.push('/promotions')}>
                <Text style={styles.seeAllText}>{t('home.viewAllPromotions')}</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promotionsScroll}
            >
              <PromotionCard
                title="رحلتك الأولى"
                description="خصم على أول رحلة لك"
                discount="50%"
                bgColor={COLORS.secondary}
                onPress={() => {}}
              />
              <PromotionCard
                title="عرض نهاية الأسبوع"
                description="رحلات مخفضة في عطلة نهاية الأسبوع"
                discount="20%"
                bgColor={COLORS.primaryDark}
                onPress={() => {}}
              />
            </ScrollView>
          </Animated.View>

          {/* Recent Places */}
          <Animated.View
            entering={FadeInDown.delay(800).springify()}
            style={styles.recentPlacesContainer}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.recentPlaces')}</Text>
            </View>

            <View style={styles.recentPlacesList}>
              <Pressable
                style={({ pressed }) => [
                  styles.recentPlaceItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.recentPlaceIcon}>
                  <Ionicons name="time" size={18} color={COLORS.gray} />
                </View>
                <View style={styles.recentPlaceContent}>
                  <Text style={styles.recentPlaceTitle}>مطار نواكشوط الدولي</Text>
                  <Text style={styles.recentPlaceSubtitle}>نواكشوط، موريتانيا</Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.recentPlaceItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.recentPlaceIcon}>
                  <Ionicons name="time" size={18} color={COLORS.gray} />
                </View>
                <View style={styles.recentPlaceContent}>
                  <Text style={styles.recentPlaceTitle}>سوق كابيتال</Text>
                  <Text style={styles.recentPlaceSubtitle}>تفرغ زينة، نواكشوط</Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationContainer: {
    flex: 1,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 10,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.gray,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  locationAddress: {
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.white,
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  recenterButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.65,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayLight,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  greetingContainer: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  searchBar: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayExtraLight,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  searchIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isRTL ? 0 : 8,
    marginLeft: isRTL ? 8 : 0,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.grayDark,
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  },
  searchDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.grayLight,
    marginHorizontal: 12,
  },
  searchTimeButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    gap: 6,
  },
  searchTimeText: {
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
    color: COLORS.secondary,
  },
  quickActionsContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionInner: {
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.grayExtraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  quickActionLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.secondary,
    textAlign: 'center',
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  savedPlacesContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Gilroy
