import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';

export type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

export interface Slide {
  id: string;
  icon: string;
  accent: string;
  title: string;
  subtitle: string;
}
