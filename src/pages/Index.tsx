import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/landing/LandingPage';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { RegisterScreen } from '@/components/auth/RegisterScreen';
import { OTPScreen } from '@/components/auth/OTPScreen';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { LoanApplication } from '@/components/loan/LoanApplication';
import { RepaymentScreen } from '@/components/payment/RepaymentScreen';
import { CollateralPayment } from '@/components/payment/CollateralPayment';
import { LoanHistory } from '@/components/loan/LoanHistory';
import { Notification } from '@/components/ui/notification';
import NotificationPermissionPrompt from '@/components/ui/NotificationPermissionPrompt';
import { LoanApprovalToast } from '@/components/landing/LoanApprovalToast';
import ConfirmExitDialog from '@/components/ui/ConfirmExitDialog';

type Screen = 'landing' | 'login' | 'register' | 'otp' | 'dashboard' | 'apply' | 'repayment' | 'collateral-payment' | 'history';

type Loan = {
  status?: string;
  // Add other loan properties as needed
};

const Index = () => {
  const { user, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [phoneForOTP, setPhoneForOTP] = useState('');
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [showNotifyPrompt, setShowNotifyPrompt] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Auto-redirect to dashboard if user is authenticated
  React.useEffect(() => {
    if (user?.isAuthenticated && (currentScreen === 'login' || currentScreen === 'landing')) {
      setCurrentScreen('dashboard');
    }
  }, [user, currentScreen]);

  // Handle Android back button (Capacitor event)
  React.useEffect(() => {
    const handleBackButton = () => {
      // If on landing or login, show exit confirmation
      if (currentScreen === 'landing' || currentScreen === 'login' || currentScreen === 'register') {
        setShowExitConfirm(true);
        return;
      }
      // Otherwise, navigate back: from detail screens → dashboard, from dashboard → landing
      if (currentScreen === 'dashboard') {
        setCurrentScreen('landing');
      } else {
        setCurrentScreen('dashboard');
      }
    };

    document.addEventListener('backbutton', handleBackButton);
    return () => document.removeEventListener('backbutton', handleBackButton);
  }, [currentScreen]);

  const handleSwitchToRegister = () => {
    setAuthMode('register');
    setCurrentScreen('register');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
    setCurrentScreen('login');
  };

  const handleAuthSuccess = () => {
    if (user?.phone) {
      setPhoneForOTP(user.phone);
      setCurrentScreen('otp');
    }
  };

  const handleOTPSuccess = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentScreen('login');
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Helper: send browser notification
  function sendLoanReminderNotification(message: string) {
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification('Fanaka Loans', {
        body: message,
        icon: '/logo-192.png',
      });
    }
  }
  // Reminder interval ref so we can start/stop from handlers
  const reminderRef = React.useRef<number | null>(null);

  const startReminders = React.useCallback(() => {
    // Avoid duplicate intervals
    if (reminderRef.current) return;

    if (!user?.isAuthenticated) return;

    const loans: Loan[] = user.loans || [];
    const hasApplied = loans.length > 0;
    const hasIncomplete = loans.some((loan) => loan.status === 'pending' || loan.status === 'in_processing' || loan.status === 'awaiting_disbursement');
    if (!hasApplied && !hasIncomplete && !hasApplied) return; // nothing to remind

    // Only start if notifications are granted
    if (!('Notification' in window) || window.Notification.permission !== 'granted') return;

    // Send one immediate notification, then schedule repeating ones
    if (!hasApplied) {
      sendLoanReminderNotification('Need cash? Apply for a Fanaka loan now and get instant approval!');
    } else if (hasIncomplete) {
      sendLoanReminderNotification('Complete your loan application to get your funds quickly!');
    }

    const id = window.setInterval(() => {
      if (!hasApplied) {
        sendLoanReminderNotification('Need cash? Apply for a Fanaka loan now and get instant approval!');
      } else if (hasIncomplete) {
        sendLoanReminderNotification('Complete your loan application to get your funds quickly!');
      }
    }, 180000);
    reminderRef.current = id;
  }, [user]);

  const stopReminders = React.useCallback(() => {
    if (reminderRef.current) {
      clearInterval(reminderRef.current);
      reminderRef.current = null;
    }
  }, []);

  // Start reminders when user changes or when permission already granted
  React.useEffect(() => {
    // If permission already granted, start reminders if needed
    if (user?.isAuthenticated && 'Notification' in window && window.Notification.permission === 'granted') {
      startReminders();
    }

    return () => stopReminders();
  }, [user, startReminders, stopReminders]);

  // Show a custom notification-permission dialog on app open until notifications are allowed
  React.useEffect(() => {
    try {
      if (!user?.isAuthenticated) {
        setShowNotifyPrompt(false);
        return;
      }

      if (!('Notification' in window)) {
        setShowNotifyPrompt(false);
        return;
      }

      const permission = window.Notification.permission;
      console.debug('[PWA] Current notification permission on load:', permission);
      
      // Only show prompt if permission is 'default' (user hasn't decided yet)
      // Don't show if 'granted' (already enabled) or 'denied' (user already declined)
      if (permission === 'default') {
        console.log('[PWA] Showing notification permission prompt (permission is default)');
        setShowNotifyPrompt(true);
      } else {
        console.log('[PWA] Not showing notification permission prompt (permission is', permission, ')');
        setShowNotifyPrompt(false);
      }
    } catch (err) {
      // safe fallback
      console.warn('[PWA] Error checking notification permission:', err);
      setShowNotifyPrompt(false);
    }
  }, [user?.isAuthenticated]);

  const handleAllowNotifications = async () => {
    try {
      if (!('Notification' in window)) return;
      
      console.log('[PWA] User clicked Allow — requesting browser permission...');
      const result = await window.Notification.requestPermission();
      console.log('[PWA] Browser permission request result:', result);
      
      if (result === 'granted') {
        console.log('[PWA] Permission granted! Hiding prompt and starting reminders...');
        setShowNotifyPrompt(false);
        
        // Optionally send a welcome notification
        try { 
          new window.Notification('Fanaka Loans', { 
            body: 'Notifications enabled — we will remind you about loan opportunities.', 
            icon: '/logo-192.png' 
          }); 
        } catch (err) { 
          console.warn('[PWA] Failed to show welcome notification:', err); 
        }
        
        // Start scheduled reminders now that permission is granted
        try { 
          startReminders(); 
        } catch (err) { 
          console.warn('[PWA] Failed to start reminders:', err); 
        }
      } else {
        console.warn('[PWA] User denied notification permission or closed the dialog. Result:', result);
        // Permission was denied or dismissed — hide prompt and don't show again unless user resets permissions
        setShowNotifyPrompt(false);
      }
    } catch (err) {
      console.warn('[PWA] Exception requesting notification permission:', err);
      setShowNotifyPrompt(false);
    }
  };

  const handleDeclineNotifications = () => {
    // Close for current session
    // Prompt will only re-appear if user later clears browser site permissions and permission reverts to 'default'
    console.log('[PWA] User declined notification permission for now');
    setShowNotifyPrompt(false);
  };

  const renderScreen = () => {
    if (!user?.isAuthenticated) {
      switch (currentScreen) {
        case 'landing':
          return (
            <LandingPage 
              onGetStarted={() => setCurrentScreen('login')}
            />
          );
        case 'register':
          return (
            <RegisterScreen 
              onSwitchToLogin={handleSwitchToLogin}
              onRegisterSuccess={handleAuthSuccess}
            />
          );
        case 'otp':
          return (
            <OTPScreen 
              phoneNumber={phoneForOTP}
              onVerifySuccess={handleOTPSuccess}
            />
          );
        case 'login':
          return (
            <LoginScreen 
              onSwitchToRegister={handleSwitchToRegister}
              onLoginSuccess={handleAuthSuccess}
            />
          );
        default:
          return (
            <LandingPage 
              onGetStarted={() => setCurrentScreen('login')}
            />
          );
      }
    }

    switch (currentScreen) {
      case 'apply':
        return <LoanApplication onBack={handleBackToDashboard} />;
      case 'repayment':
        return <RepaymentScreen onBack={handleBackToDashboard} />;
      case 'collateral-payment':
        return <CollateralPayment onBack={handleBackToDashboard} />;
      case 'history':
        return <LoanHistory onBack={handleBackToDashboard} />;
      default:
        return (
          <Dashboard 
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <>
      <LoanApprovalToast />
      {renderScreen()}

      {/* Notification permission prompt (shows until user grants permission) */}
      <NotificationPermissionPrompt
        show={showNotifyPrompt}
        onAllow={handleAllowNotifications}
        onDecline={handleDeclineNotifications}
      />

      {/* Confirm exit dialog (shows when back button pressed on home page) */}
      <ConfirmExitDialog
        show={showExitConfirm}
        onStay={() => setShowExitConfirm(false)}
        onExit={() => {
          // Exit the app
          if (typeof window !== 'undefined' && 'cordova' in window) {
            // Cordova/Capacitor apps
            const navApp = (window as Record<string, unknown>).navigator as Record<string, unknown>;
            if (navApp && navApp.app) {
              (navApp.app as Record<string, () => void>).exitApp();
            }
          } else {
            // Web fallback
            window.close();
          }
        }}
      />
      
      {/* Notifications */}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
};

export default Index;
