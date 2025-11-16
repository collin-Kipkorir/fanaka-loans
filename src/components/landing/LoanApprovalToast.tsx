import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface LoanNotification {
  id: string;
  phone: string;
  amount: number;
  timeAgo: string;
}

export const LoanApprovalToast: React.FC = () => {
  const [notifications, setNotifications] = useState<LoanNotification[]>([]);

  const generateRandomNotification = (): LoanNotification => {
    const amounts = [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
    
    // Generate random phone number (masked)
    const randomDigits = Math.floor(Math.random() * 900) + 100;
    const maskedPhone = `254***${randomDigits}`;
    
    // Generate random time within 10 minutes
    const seconds = Math.floor(Math.random() * 600); // 0-600 seconds (10 minutes)
    const timeAgo = seconds < 60 
      ? `${seconds} seconds ago`
      : `${Math.floor(seconds / 60)} minutes ago`;
    
    return {
      id: Date.now().toString(),
      phone: maskedPhone,
      amount: randomAmount,
      timeAgo,
    };
  };

  useEffect(() => {
    const showRandomNotification = () => {
      const notification = generateRandomNotification();
      setNotifications(prev => [...prev, notification]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    };

    // Show first notification after 2 seconds
    const firstTimeout = setTimeout(showRandomNotification, 2000);

    // Show subsequent notifications every 8-15 seconds
    const interval = setInterval(() => {
      showRandomNotification();
    }, Math.random() * 7000 + 8000); // Random between 8-15 seconds

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-mpesa text-mpesa-foreground rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[300px] animate-slide-in-right pointer-events-auto"
          style={{
            animation: 'slideInRight 0.4s ease-out'
          }}
        >
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">Loan Approved!</p>
            <p className="text-xs opacity-95">
              {notification.phone} received <span className="font-bold">KSh {notification.amount.toLocaleString()}</span>
            </p>
            <p className="text-xs opacity-80 mt-1">{notification.timeAgo}</p>
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
};
