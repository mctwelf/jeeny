/**
 * DriverHomeScreen - Main home screen for drivers with online/offline toggle
 * Design: Matches the Behance UI/UX mockups with Yellow/Dark theme
 * Features: Online/Offline toggle, earnings display, map view, ride requests, RTL support
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
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  runOnJS,
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
  successLight: '#E8F5E9',
  online: '#4CAF50',
  offline: '#9E9E9E',
};

// Default location (Nouakchott, Mauritania)
const DEFAULT_REGION = {
  latitude: 18.0735,
  longitude: -15.9582,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Map custom style
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

// Animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Stat card component
interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color, onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.statCard, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </AnimatedPressable>
  );
};

// Online status toggle component
interface OnlineToggleProps {
  isOnline: boolean;
  onToggle: (value: boolean) => void;
  isLoading?: boolean;
}

const OnlineToggle: React.FC<OnlineToggleProps> = ({ isOnline, onToggle, isLoading }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isOnline) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isOnline]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onToggle(!isOnline);
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.2], [0.5, 0]),
  }));

  return (
    <AnimatedPressable
      style={[styles.onlineToggleContainer, containerAnimatedStyle]}
      onPress={handlePress}
      disabled={isLoading}
    >
      <View style={styles.onlineToggleInner}>
        {/* Pulse effect when online */}
        {isOnline && (
          <Animated.View
            style={[
              styles.onlinePulse,
              { backgroundColor: COLORS.online },
              pulseAnimatedStyle,
            ]}
          />
        )}

        {/* Main toggle button */}
        <LinearGradient
          colors={
            isOnline
              ? [COLORS.online, '#388E3C']
              : [COLORS.gray, COLORS.grayDark]
          }
          style={styles.onlineToggleButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons
            name={isOnline ? 'power' : 'power-outline'}
            size={40}
            color={COLORS.white}
          />
        </LinearGradient>

        {/* Status text */}
        <Text
          style={[
            styles.onlineStatusText,
            { color: isOnline ? COLORS.online : COLORS.gray },
          ]}
        >
          {isOnline
            ? isArabic
              ? 'متصل'
              : 'Online'
            : isArabic
            ? 'غير متصل'
            : 'Offline'}
        </Text>
        <Text style={styles.onlineToggleHint}>
          {isOnline
            ? isArabic
              ? 'أنت تستقبل طلبات الرحلات'
              : 'You are receiving ride requests'
            : isArabic
            ? 'اضغط للاتصال واستقبال الرحلات'
            : 'Tap to go online and receive rides'}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

// Quick action button
interface QuickActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onPress,
  badge,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickActionButton,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.quickActionIconContainer}>
        <Ionicons name={icon as any} size={24} color={COLORS.secondary} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.quickActionBadge}>
            <Text style={styles.quickActionBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
};

const DriverHomeScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const isArabic = i18n.language === 'ar';

  // State
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Mock data for earnings
  const todayEarnings = 2450;
  const todayTrips = 8;
  const rating = 4.9;
  const acceptanceRate = 95;

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
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, []);

  // Handle online/offline toggle
  const handleOnlineToggle = useCallback((value: boolean) => {
    if (value) {
      // Going online - request background location permission
      Alert.alert(
        isArabic ? 'تأكيد الاتصال' : 'Go Online',
        isArabic
          ? 'هل أنت مستعد لاستقبال طلبات الرحلات؟'
          : 'Are you ready to receive ride requests?',
        [
          {
            text: isArabic ? 'إلغاء' : 'Cancel',
            style: 'cancel',
          },
          {
            text: isArabic ? 'نعم، اتصل' : 'Yes, Go Online',
            onPress: () => {
              setIsOnline(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    } else {
      // Going offline
      setIsOnline(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [isArabic]);

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

  // Navigate to earnings
  const handleEarningsPress = () => {
    router.push('/earnings');
  };

  // Navigate to notifications
  const handleNotificationsPress = () => {
    router.push('/notifications');
  };

  // Navigate to profile/settings
  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isOnline ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={isOnline}
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={MAP_STYLE}
      >
        {/* Current location marker when offline */}
        {currentLocation && !isOnline && (
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

        {/* Active area circle when online */}
        {currentLocation && isOnline && (
          <Circle
            center={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            radius={2000}
            fillColor="rgba(76, 175, 80, 0.1)"
            strokeColor="rgba(76, 175, 80, 0.3)"
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'transparent', 'rgba(255,255,255,0.95)']}
        locations={[0, 0.3, 0.7]}
        style={styles.mapGradient}
        pointerEvents="none"
      />

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Animated.View entering={FadeIn.delay(200)} style={styles.headerContent}>
          {/* Menu/Profile Button */}
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleProfilePress}
          >
            <Ionicons name="menu" size={24} color={COLORS.secondary} />
          </Pressable>

          {/* Online Status Indicator */}
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: isOnline ? COLORS.successLight : COLORS.grayExtraLight },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? COLORS.online : COLORS.offline },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOnline ? COLORS.online : COLORS.gray },
              ]}
            >
              {isOnline
                ? isArabic
                  ? 'متصل'
                  : 'Online'
                : isArabic
                ? 'غير متصل'
                : 'Offline'}
            </Text>
          </View>

          {/* Notifications Button */}
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleNotificationsPress}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
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

      {/* Bottom Section */}
      <Animated.View
        entering={SlideInUp.delay(300).springify()}
        style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}
      >
        {/* Online Toggle */}
        <OnlineToggle isOnline={isOnline} onToggle={handleOnlineToggle} />

        {/* Stats Row */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.statsRow}
        >
          <StatCard
            icon="cash"
            value={`${todayEarnings} MRU`}
            label={isArabic ? 'أرباح اليوم' : "Today's Earnings"}
            color={COLORS.success}
            onPress={handleEarningsPress}
          />
          <StatCard
            icon="car"
            value={`${todayTrips}`}
            label={isArabic ? 'رحلات اليوم' : "Today's Trips"}
            color={COLORS.primary}
          />
          <StatCard
            icon="star"
            value={`${rating}`}
            label={isArabic ? 'التقييم' : 'Rating'}
            color={COLORS.primaryDark}
          />
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInUp.delay(500).springify()}
          style={styles.quickActionsRow}
        >
          <QuickActionButton
            icon="wallet-outline"
            label={isArabic ? 'المحفظة' : 'Wallet'}
            onPress={() => router.push('/wallet')}
          />
          <QuickActionButton
            icon="time-outline"
            label={isArabic ? 'السجل' : 'History'}
            onPress={() => router.push('/history')}
          />
          <QuickActionButton
            icon="document-text-outline"
            label={isArabic ? 'المستندات' : 'Documents'}
            onPress={() => router.push('/documents')}
            badge={1}
          />
          <QuickActionButton
            icon="help-circle-outline"
            label={isArabic ? 'المساعدة' : 'Help'}
            onPress={() => router.push('/support')}
          />
        </Animated.View>
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
    ...StyleSheet.absoluteFillObject,
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
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
  statusIndicator: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
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
    backgroundColor: 'rgba(26, 26, 46, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  onlineToggleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  onlineToggleInner: {
    alignItems: 'center',
  },
  onlinePulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  onlineToggleButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  onlineStatusText: {
    marginTop: 12,
    fontSize: 20,
    fontFamily: 'Gilroy-Bold',
  },
  onlineToggleHint: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Gilroy-Regular',
    color: COLORS.gray,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.grayExtraLight,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.gray,
    textAlign: 'center',
  },
  quickActionsRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.grayExtraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  quickActionBadgeText: {
    fontSize: 10,
    fontFamily: 'Gilroy-Bold',
    color: COLORS.white,
  },
  quickActionLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Medium',
    color: COLORS.secondary,
    textAlign: 'center',
  },
});

export default DriverHomeScreen;
