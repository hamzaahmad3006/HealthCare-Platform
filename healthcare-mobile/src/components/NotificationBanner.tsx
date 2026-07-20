import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { useAppSelector } from '../store';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';
import { navigateToNotification } from '../utils/notificationNavigation';
import {
  setForegroundBannerListener,
  type ForegroundBannerPayload,
} from '../utils/foregroundBanner';

const AUTO_DISMISS_MS = 4500;

// In-app banner for foreground push. Slides in from the top, auto-dismisses, and
// deep-links on tap (same routing as a system-tray tap). Rendered once at the
// app root above the navigator (see PushManager).
export function NotificationBanner(): JSX.Element | null {
  const insets = useSafeAreaInsets();
  const role = useAppSelector((s) => s.auth.user?.role);
  const [payload, setPayload] = useState<ForegroundBannerPayload | null>(null);
  const translateY = useRef(new Animated.Value(-200)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(translateY, {
      toValue: -200,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setPayload(null));
  }, [translateY]);

  useEffect(() => {
    setForegroundBannerListener((next) => {
      setPayload(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => hide(), AUTO_DISMISS_MS);
    });
    return () => {
      setForegroundBannerListener(null);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [hide]);

  // Slide in AFTER the payload is set and the view has mounted. Starting the
  // native-driver animation inside the listener raced the conditional mount —
  // the animation had no mounted view to attach to, so it never played and the
  // banner stayed off-screen at translateY -200.
  useEffect(() => {
    if (!payload) return;
    translateY.setValue(-200);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [payload, translateY]);

  if (!payload) return null;

  const onPress = (): void => {
    if (role) navigateToNotification(role, payload.data);
    hide();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + Spacing.sm, transform: [{ translateY }] },
      ]}
    >
      <Pressable style={styles.pressable} onPress={onPress}>
        <MaterialDesignIcons name="bell-ring-outline" size={22} color={Colors.primary} />
        <Text style={styles.textCol}>
          <Text style={styles.title}>{payload.title}{'\n'}</Text>
          <Text style={styles.body}>{payload.body}</Text>
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 1000,
    elevation: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: Colors.neutralBorder,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  textCol: { flex: 1 },
  title: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  body: { fontSize: FontSize.sm, color: Colors.textMuted },
});
