import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import type { Props, Slide } from '../../types/OnboardingScreen.types';

const { width } = Dimensions.get('window');

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: '🏠',
    accent: Colors.primary,
    title: 'Book a Nurse at Home',
    subtitle: 'Get professional nursing care delivered right to your doorstep — at a time that works for you.',
  },
  {
    id: '2',
    icon: '📍',
    accent: Colors.primaryDark,
    title: 'Track Your Visit',
    subtitle: 'Know exactly when your healthcare provider will arrive with real-time tracking and updates.',
  },
  {
    id: '3',
    icon: '📋',
    accent: '#065f46',
    title: 'Get Your Reports',
    subtitle: 'All your medical reports, summaries, and prescriptions stored securely in one place.',
  },
];

export function OnboardingScreen({ navigation }: Props): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(activeIndex + 1);
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem('@hh_onboarding_done', 'true');
    navigation.replace('Login');
  };

  const skip = async () => {
    await AsyncStorage.setItem('@hh_onboarding_done', 'true');
    navigation.replace('Login');
  };

  const isLast = activeIndex === SLIDES.length - 1;

  const renderSlide = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={[styles.slide, { width }]}>
      {/* Illustration area */}
      <View style={[styles.illustrationBg, { backgroundColor: item.accent }]}>
        <Text style={styles.illustrationIcon}>{item.icon}</Text>
        {/* Decorative circles */}
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={skip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.list}
      />

      {/* Bottom area */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        {isLast ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={finish} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={goNext} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const ILLUSTRATION_HEIGHT = 340;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipBtn: {
    position: 'absolute',
    top: 52,
    right: Spacing.xl,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: FontSize.md,
    color: Colors.neutral,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  illustrationBg: {
    height: ILLUSTRATION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustrationIcon: {
    fontSize: 96,
    zIndex: 2,
  },
  circleTopRight: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -60,
  },
  circleBottomLeft: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -40,
  },
  textBlock: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  bottom: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 48,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.neutralBorder,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
