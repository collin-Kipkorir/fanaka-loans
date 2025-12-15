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
import { LoanApprovalToast } from '@/components/landing/LoanApprovalToast';
import PushSubscribe from '@/components/ui/PushSubscribe';

type Screen = 'landing' | 'login' | 'register' | 'otp' | 'dashboard' | 'apply' | 'repayment' | 'collateral-payment' | 'history';

const Index = () => {
  const { user, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [phoneForOTP, setPhoneForOTP] = useState('');
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

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
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000 }}>
        <PushSubscribe />
      </div>
      {renderScreen()}
      
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
