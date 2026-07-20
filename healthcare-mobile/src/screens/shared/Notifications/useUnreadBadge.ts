import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type { AppNotification } from '../../../types/notification.types';
import { getLastViewedAt } from './notificationStorage';

// Drives the decorative bell icons — re-checks whenever the host screen regains
// focus (e.g. navigating back after viewing the Notifications list).
export function useUnreadBadge(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [{ data }, cutoff] = await Promise.all([
        api.get<{ success: true; data: AppNotification[] }>(API.NOTIFICATIONS.LIST),
        getLastViewedAt(),
      ]);
      setCount(data.data.filter((n) => new Date(n.createdAt).getTime() > cutoff).length);
    } catch {
      setCount(0);
    }
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return count;
}
