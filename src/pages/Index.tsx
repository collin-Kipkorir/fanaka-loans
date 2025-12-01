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

  // Auto-redirect to dashboard if user is authenticated
  React.useEffect(() => {
    if (user?.isAuthenticated && (currentScreen === 'login' || currentScreen === 'landing')) {
      setCurrentScreen('dashboard');
    }
  }, [user, currentScreen]);

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

  React.useEffect(() => {
    let reminderInterval: NodeJS.Timeout | undefined;

    // Request notification permission on mount
    if ('Notification' in window && window.Notification.permission !== 'granted') {
      window.Notification.requestPermission();
    }

    // Only set reminders if user is authenticated
    if (user?.isAuthenticated) {
      // Check if user has applied for a loan or has incomplete application
      const loans: Loan[] = Array.isArray((user as any).loans) ? (user as any).loans as Loan[] : [];
      const hasApplied = loans.length > 0;
      const hasIncomplete = loans.some((loan) => loan.status === 'pending' || loan.status === 'in_processing' || loan.status === 'awaiting_disbursement');

      if (!hasApplied || hasIncomplete) {
        // Send reminder every 3 minutes (180000 ms)
        reminderInterval = setInterval(() => {
          if (!hasApplied) {
            sendLoanReminderNotification('Need cash? Apply for a Fanaka loan now and get instant approval!');
          } else if (hasIncomplete) {
            sendLoanReminderNotification('Complete your loan application to get your funds quickly!');
          }
        }, 180000);
      }
    }

    return () => {
      if (reminderInterval) clearInterval(reminderInterval);
    };
  }, [user]);

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
      // If not granted, show our friendly prompt — we will ask permission only when user clicks allow
      if (permission !== 'granted') {
        setShowNotifyPrompt(true);
      } else {
        setShowNotifyPrompt(false);
      }
    } catch (err) {
      // safe fallback
      setShowNotifyPrompt(false);
    }
  }, [user]);

  const handleAllowNotifications = async () => {
    try {
      if (!('Notification' in window)) return;
      const result = await window.Notification.requestPermission();
      console.log('[PWA] Notification permission result:', result);
      if (result === 'granted') {
        setShowNotifyPrompt(false);
        // Optionally send a welcome notification
        try { new window.Notification('Fanaka Loans', { body: 'Notifications enabled — we will remind you about loan opportunities.', icon: '/logo-192.png' }); } catch (err) { console.warn('Failed to show welcome notification', err); }
      } else {
        // keep prompt hidden for this session; per requirement it will re-appear on next app open until allowed
        setShowNotifyPrompt(false);
      }
    } catch (err) {
      console.warn('Failed to request notification permission', err);
    }
  };

  const handleDeclineNotifications = () => {
    // Close for current session; it will re-appear on next app open until user grants permission
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
