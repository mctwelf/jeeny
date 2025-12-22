/**
 * OnboardingScreen - Beautiful animated onboarding for GoCap
 * Design: Yellow/Dark theme matching Behance mockups
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
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
};

// Onboarding slides data
const SLIDES = [
  {
    id: 1,
    titleKey: 'onboarding.slide1Title',
    descriptionKey: 'onboarding.slide1Description',
    image: require('../../../assets/images/onboarding-1.png'),
    icon: 'car-sport',
    backgroundColor: COLORS.primary,
  },
  {
    id: 2,
    titleKey: 'onboarding.slide2Title',
    descriptionKey: 'onboarding.slide2Description',
    image: require('../../../assets/images/onboarding-2.png'),
    icon: 'location',
    backgroundColor: COLORS.secondary,
  },
  {
    id: 3,
    titleKey: 'onboarding.slide3Title',
    descriptionKey: 'onboarding.slide3Description',
    image: require('../../../assets/images/onboarding-3.png'),
    icon: 'wallet',
    backgroundColor: COLORS.primary,
  },
];

// Animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface SlideProps {
  slide: typeof SLIDES[0];
  index: number;
  currentIndex: number;
}

const Slide: React.FC<SlideProps> = ({ slide, index, currentIndex }) => {
  const { t } = useTranslation();
  const isActive = index === currentIndex;
  const isDarkSlide = slide.backgroundColor === COLORS.secondary;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isActive ? 1 : 0.5, { duration: 300 }),
      transform: [
        {
          scale: withSpring(isActive ? 1 : 0.9, {
            damping: 15,
            stiffness: 100,
          }),
        },
      ],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(isActive ? 0 : 20, {
            damping: 12,
            stiffness: 80,
          }),
        },
        {
          scale: withSpring(isActive ? 1 : 0.8, {
            damping: 12,
            stiffness: 80,
          }),
        },
      ],
    };
  });

  return (
    <View style={styles.slide}>
      {/* Background gradient */}
      <LinearGradient
        colors={
          isDarkSlide
            ? [COLORS.secondary, COLORS.secondaryLight, COLORS.secondary]
            : [COLORS.primary, COLORS.primaryDark, COLORS.primary]
        }
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={styles.decorativeCirclesContainer}>
        <View
          style={[
            styles.decorativeCircle,
            styles.circle1,
            { backgroundColor: isDarkSlide ? COLORS.primary : COLORS.secondary },
          ]}
        />
        <View
          style={[
            styles.decorativeCircle,
            styles.circle2,
            { backgroundColor: isDarkSlide ? COLORS.primaryDark : COLORS.secondaryLight },
          ]}
        />
        <View
          style={[
            styles.decorativeCircle,
            styles.circle3,
            { backgroundColor: isDarkSlide ? COLORS.primary : COLORS.secondary },
          ]}
        />
      </View>

      {/* Content */}
      <View style={styles.slideContent}>
        {/* Icon/Image container */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDarkSlide
                  ? COLORS.primary
                  : COLORS.secondary,
              },
            ]}
          >
            <Ionicons
              name={slide.icon as any}
              size={80}
              color={isDarkSlide ? COLORS.secondary : COLORS.primary}
            />
          </View>
        </Animated.View>

        {/* Illustration placeholder */}
        <Animated.View style={[styles.illustrationContainer, animatedStyle]}>
          {/* You can replace this with actual images */}
          <View
            style={[
              styles.illustrationPlaceholder,
              {
                backgroundColor: isDarkSlide
                  ? 'rgba(255, 214, 0, 0.1)'
                  : 'rgba(26, 26, 46, 0.1)',
              },
            ]}
          >
            <Ionicons
              name={slide.icon as any}
              size={120}
              color={isDarkSlide ? COLORS.primary : COLORS.secondary}
              style={{ opacity: 0.5 }}
            />
          </View>
        </Animated.View>

        {/* Text content */}
        <Animated.View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: isDarkSlide ? COLORS.white : COLORS.secondary },
            ]}
          >
            {t(slide.titleKey)}
          </Text>
          <Text
            style={[
              styles.description,
              {
                color: isDarkSlide
                  ? 'rgba(255, 255, 255, 0.8)'
                  : 'rgba(26, 26, 46, 0.7)',
              },
            ]}
          >
            {t(slide.descriptionKey)}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

// Pagination dot component
interface PaginationDotProps {
  index: number;
  currentIndex: number;
  isDark: boolean;
}

const PaginationDot: React.FC<PaginationDotProps> = ({
  index,
  currentIndex,
  isDark,
}) => {
  const isActive = index === currentIndex;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isActive ? 32 : 10, { damping: 15, stiffness: 100 }),
      backgroundColor: withTiming(
        isActive
          ? isDark
            ? COLORS.primary
            : COLORS.secondary
          : isDark
          ? 'rgba(255, 255, 255, 0.3)'
          : 'rgba(26, 26, 46, 0.3)',
        { duration: 300 }
      ),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

// Main Onboarding Screen
const OnboardingScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isDarkSlide = SLIDES[currentIndex].backgroundColor === COLORS.secondary;

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setCurrentIndex(e.nativeEvent.position);
    },
    []
  );

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      pagerRef.current?.setPage(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    router.replace('/auth/phone');
  }, [router]);

  const handleGetStarted = useCallback(() => {
    router.replace('/auth/phone');
  }, [router]);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(1, { damping: 15, stiffness: 100 }),
        },
      ],
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      {currentIndex < SLIDES.length - 1 && (
        <Animated.View
          entering={FadeIn.delay(300)}
          style={styles.skipContainer}
        >
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              style={[
                styles.skipText,
                { color: isDarkSlide ? COLORS.white : COLORS.secondary },
              ]}
            >
              {t('onboarding.skip')}
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Pager View */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
        layoutDirection={isRTL ? 'rtl' : 'ltr'}
      >
        {SLIDES.map((slide, index) => (
          <View key={slide.id} style={styles.page}>
            <Slide slide={slide} index={index} currentIndex={currentIndex} />
          </View>
        ))}
      </PagerView>

      {/* Bottom section */}
      <Animated.View
        entering={FadeInUp.delay(500)}
        style={[
          styles.bottomSection,
          {
            backgroundColor: isDarkSlide
              ? COLORS.secondary
              : COLORS.primary,
          },
        ]}
      >
        {/* Pagination */}
        <View style={styles.paginationContainer}>
          {SLIDES.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              currentIndex={currentIndex}
              isDark={isDarkSlide}
            />
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonsContainer}>
          {currentIndex === SLIDES.length - 1 ? (
            // Get Started button (last slide)
            <AnimatedPressable
              style={[
                styles.getStartedButton,
                buttonAnimatedStyle,
                {
                  backgroundColor: isDarkSlide
                    ? COLORS.primary
                    : COLORS.secondary,
                },
              ]}
              onPress={handleGetStarted}
            >
              <Text
                style={[
                  styles.getStartedText,
                  {
                    color: isDarkSlide ? COLORS.secondary : COLORS.primary,
                  },
                ]}
              >
                {t('onboarding.getStarted')}
              </Text>
              <Ionicons
                name={isRTL ? 'arrow-back' : 'arrow-forward'}
                size={24}
                color={isDarkSlide ? COLORS.secondary : COLORS.primary}
                style={styles.buttonIcon}
              />
            </AnimatedPressable>
          ) : (
            // Next button
            <AnimatedPressable
              style={[
                styles.nextButton,
                buttonAnimatedStyle,
                {
                  backgroundColor: isDarkSlide
                    ? COLORS.primary
                    : COLORS.secondary,
                },
              ]}
              onPress={handleNext}
            >
              <Ionicons
                name={isRTL ? 'arrow-back' : 'arrow-forward'}
                size={28}
                color={isDarkSlide ? COLORS.secondary : COLORS.primary}
              />
            </AnimatedPressable>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Medium',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  slide: {
    flex: 1,
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeCirclesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  circle1: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    top: -SCREEN_WIDTH * 0.2,
    right: -SCREEN_WIDTH * 0.3,
  },
  circle2: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    bottom: SCREEN_HEIGHT * 0.2,
    left: -SCREEN_WIDTH * 0.2,
  },
  circle3: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    bottom: -SCREEN_WIDTH * 0.1,
    right: SCREEN_WIDTH * 0.1,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  illustrationContainer: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.3,
    marginBottom: 32,
  },
  illustrationPlaceholder: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Gilroy-Bold',
    textAlign: 'center',
    marginBottom: 16,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    textAlign: 'center',
    lineHeight: 24,
    writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 24,
  },
  paginationContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  buttonsContainer: {
    alignItems: 'center',
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedText: {
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
  },
  buttonIcon: {
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
  },
});

export default OnboardingScreen;
