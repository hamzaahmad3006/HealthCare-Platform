import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type { AppNotification, NotificationItem } from '../../../types/notification.types';
import { getLastViewedAt, markNotificationsViewedNow } from './notificationStorage';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (): Promise<void> => {
    try {
      const previousCutoff = await getLastViewedAt();
      const { data } = await api.get<{ success: true; data: AppNotification[] }>(API.NOTIFICATIONS.LIST);
      const items: NotificationItem[] = data.data
        .map((n) => ({ ...n, isUnread: new Date(n.createdAt).getTime() > previousCutoff }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(items);
      await markNotificationsViewedNow();
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchNotifications();
  };

  return { notifications, loading, refreshing, onRefresh };
}
