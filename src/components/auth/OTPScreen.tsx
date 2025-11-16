import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Smartphone } from 'lucide-react';

interface OTPScreenProps {
  phoneNumber: string;
  onVerifySuccess: () => void;
}

export const OTPScreen: React.FC<OTPScreenProps> = ({ phoneNumber, onVerifySuccess }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    setError('');
    
    if (otp.length !== 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }
    
    if (otp !== '1234') {
      setError('Invalid OTP. Use 1234 for demo.');
      return;
    }

    setIsLoading(true);
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    onVerifySuccess();
  };

  const handleResend = () => {
    setCountdown(60);
    setError('');
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Verify Your Phone</CardTitle>
          <p className="text-muted-foreground">
            Enter the 4-digit code sent to<br />
            <span className="font-medium text-foreground">{phoneNumber}</span>
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md text-center">
                {error}
              </div>
            )}
            
            <div className="text-center text-sm text-muted-foreground">
              Use <span className="font-mono font-bold text-primary">1234</span> for demo
            </div>
            
            <Button 
              onClick={handleVerify}
              className="w-full bg-gradient-primary hover:bg-primary-dark"
              disabled={isLoading || otp.length !== 4}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </div>
          
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend OTP in {countdown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-primary font-medium hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};