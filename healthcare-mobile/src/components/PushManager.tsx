import { usePushRegistration } from '../hooks/usePushRegistration';
import { NotificationBanner } from './NotificationBanner';

// Single mount point for push: runs token registration/refresh + tap routing,
// and renders the foreground banner overlay. Placed at the app root, inside the
// Redux Provider (for auth state) and above the navigator (so the banner floats).
export function PushManager(): JSX.Element {
  usePushRegistration();
  return <NotificationBanner />;
}
