import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { hydrateAuth } from '../store/slices/authSlice';
import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { StaffNavigator } from './StaffNavigator';
import { Colors } from '../constants/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): JSX.Element {
  const dispatch = useAppDispatch();
  const { user, hydrated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user.role === 'STAFF' ? (
          <Stack.Screen name="Staff" component={StaffNavigator} />
        ) : (
          <Stack.Screen name="Customer" component={CustomerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
