import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { refreshAccessToken, logout } from '@/lib/auth';

export function SessionExpiryWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes in seconds
  const [isExtending, setIsExtending] = useState(false);

  // Listen for session expiry events
  useEffect(() => {
    const handleSessionExpiry = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.reason === 'token_refresh_failed') {
        setShowWarning(true);
        setCountdown(120); // Reset countdown
      }
    };

    window.addEventListener('session_expiry_warning', handleSessionExpiry);

    return () => {
      window.removeEventListener('session_expiry_warning', handleSessionExpiry);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout | undefined;

    if (showWarning && countdown > 0) {
      countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [showWarning, countdown]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await refreshAccessToken();
      setShowWarning(false);
      setCountdown(120);
    } catch (error) {
      console.error('Failed to extend session:', error);
      handleLogout();
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = async () => {
    setShowWarning(false);
    await logout();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Your Session Is About to Expire</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in <strong>{formatTime(countdown)}</strong> due to inactivity.
            You'll be automatically logged out unless you choose to extend your session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout} disabled={isExtending}>
            Logout Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtendSession} disabled={isExtending}>
            {isExtending ? 'Extending...' : 'Extend Session'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
