export interface AppNotification {
  id: string;
  templateCode: string;
  renderedContent: string;
  bookingId: string;
  bookingVisitId: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationItem extends AppNotification {
  isUnread: boolean;
}
