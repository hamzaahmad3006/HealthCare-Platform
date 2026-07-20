import { usePushRegistration } from '../../hooks/usePushRegistration';

// Single mount point for web push: registers the service worker + FCM token when
// signed in and shows clickable foreground toasts. Renders nothing. Placed
// inside the Router (needs useNavigate) and the Redux Provider (needs auth).
export function PushManager(): null {
  usePushRegistration();
  return null;
}
