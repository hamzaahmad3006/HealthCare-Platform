import { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props): JSX.Element {
  useEffect(() => {
    const timer = setTimeout(async () => {
      const onboardingDone = await AsyncStorage.getItem('@hh_onboarding_done');
      if (onboardingDone === 'true') {
        navigation.replace('Login');
      } else {
        navigation.replace('Onboarding');
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* Logo area */}
      <View style={styles.logoWrapper}>
        {/* Green cross / medical icon */}
        <View style={styles.logoIcon}>
          <View style={styles.crossH} />
          <View style={styles.crossV} />
        </View>
        <Text style={styles.brandName}>HomeHealth</Text>
        <Text style={styles.brandSub}>Pakistan</Text>
      </View>

      {/* Tagline */}
      <Text style={styles.tagline}>Healthcare at your doorstep</Text>

      {/* Bottom dots loader */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoIcon: {
    width: 72,
    height: 72,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  crossH: {
    position: 'absolute',
    width: 40,
    height: 12,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  crossV: {
    position: 'absolute',
    width: 12,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  brandName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tagline: {
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    bottom: 56,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 22,
  },
});
