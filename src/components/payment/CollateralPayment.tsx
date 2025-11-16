import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Loader2, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CollateralPaymentProps {
  onBack: () => void;
}

export const CollateralPayment: React.FC<CollateralPaymentProps> = ({ onBack }) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { currentLoan, payCollateralFee, addNotification } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin) {
      addNotification('Please enter your M-Pesa PIN', 'error');
      return;
    }
    
    if (pin !== '1234') {
      addNotification('Invalid M-Pesa PIN', 'error');
      return;
    }

    if (!currentLoan) {
      addNotification('No active loan found', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await payCollateralFee(currentLoan.id, currentLoan.processingFee || 0);
      
      if (result.success) {
        setIsSuccess(true);
        addNotification('Processing fee paid successfully!', 'success');
      } else {
        addNotification('Payment failed. Please try again.', 'error');
      }
    } catch (error) {
      addNotification('Payment failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-primary text-white p-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Payment Successful</h1>
        </div>
        
        <div className="px-6 -mt-8">
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-success mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground mb-6">
                Your processing fee of {formatCurrency(currentLoan?.processingFee || 0)} has been paid successfully.
                Your loan is now being processed.
              </p>
              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-2">Transaction Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{formatCurrency(currentLoan?.processingFee || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-medium">MP{Date.now().toString().slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-success">Completed</span>
                  </div>
                </div>
              </div>
              <Button onClick={onBack} className="w-full bg-gradient-primary">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-white p-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-white hover:bg-white/10 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Processing Fee Payment</h1>
        <p className="text-primary-foreground/80">Pay via M-Pesa to proceed</p>
      </div>
      
      <div className="px-6 -mt-8">
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-warning mb-2">Upfront Fees Required</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Pay processing fee to complete your loan application and proceed with loan processing.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Loan Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(currentLoan?.amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Processing Fee (1%):</span>
                  <span className="text-sm font-medium">{formatCurrency(currentLoan?.processingFee || 0)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-sm font-medium">Total Upfront Payment:</span>
                  <span className="text-sm font-bold text-warning">{formatCurrency(currentLoan?.processingFee || 0)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="font-medium">M-Pesa STK Push</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A payment request will be sent to your phone. Enter your M-Pesa PIN to complete the payment.
              </p>
            </div>
            
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">M-Pesa PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="text-base text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Demo PIN: 1234
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary"
                disabled={isLoading || pin.length !== 4}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ${formatCurrency(currentLoan?.processingFee || 0)}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};