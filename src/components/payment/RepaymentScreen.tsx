import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RepaymentScreenProps {
  onBack: () => void;
}

export const RepaymentScreen: React.FC<RepaymentScreenProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('');
  const [showMPesaFlow, setShowMPesaFlow] = useState(false);
  const [mpesaStep, setMpesaStep] = useState('pin');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { currentLoan, repayLoan, addNotification } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleRepayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      addNotification('Please enter a valid amount', 'error');
      return;
    }
    
    if (parseFloat(amount) > (currentLoan?.balance || 0)) {
      addNotification('Amount cannot exceed outstanding balance', 'error');
      return;
    }
    
    setShowMPesaFlow(true);
  };

  const handleMPesaConfirm = async () => {
    if (pin !== '1234') {
      addNotification('Invalid PIN. Use 1234 for demo.', 'error');
      return;
    }
    
    setMpesaStep('processing');
    setIsProcessing(true);
    
    try {
      await repayLoan(parseFloat(amount));
      setMpesaStep('success');
      setIsComplete(true);
      addNotification('Payment successful!', 'success');
    } catch (error) {
      addNotification('Payment failed. Please try again.', 'error');
      setShowMPesaFlow(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [
    { label: '25%', value: Math.round((currentLoan?.balance || 0) * 0.25) },
    { label: '50%', value: Math.round((currentLoan?.balance || 0) * 0.5) },
    { label: '100%', value: currentLoan?.balance || 0 },
  ];

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-success text-white p-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Payment Complete</h1>
        </div>
        
        <div className="px-6 -mt-8">
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-success mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground mb-4">
                Your payment of {formatCurrency(parseFloat(amount))} has been processed successfully.
              </p>
              <div className="bg-muted rounded-lg p-4 mb-6">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Balance:</span>
                    <span className="font-medium text-primary">
                      {formatCurrency((currentLoan?.balance || 0) - parseFloat(amount))}
                    </span>
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

  if (showMPesaFlow) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-primary text-white p-6">
          <Button 
            variant="ghost" 
            onClick={() => setShowMPesaFlow(false)}
            className="text-white hover:bg-white/10 mb-4"
            disabled={isProcessing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">M-Pesa Payment</h1>
        </div>
        
        <div className="px-6 -mt-8">
          <Card className="shadow-card">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <CardTitle>M-Pesa STK Push</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {mpesaStep === 'pin' && (
                <>
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Enter your M-Pesa PIN to complete the payment
                    </p>
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>To:</span>
                          <span className="font-medium">Fanaka Loans</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pin">M-Pesa PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      placeholder="Enter your PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={4}
                      className="text-center text-lg tracking-widest"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      Use <span className="font-mono font-bold">1234</span> for demo
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleMPesaConfirm}
                    className="w-full bg-gradient-success"
                    disabled={pin.length !== 4}
                  >
                    Confirm Payment
                  </Button>
                </>
              )}
              
              {mpesaStep === 'processing' && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-success mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
                  <p className="text-muted-foreground">
                    Please wait while we process your M-Pesa payment...
                  </p>
                </div>
              )}
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
        <h1 className="text-2xl font-bold">Repay Loan</h1>
        <p className="text-primary-foreground/80">Pay via M-Pesa</p>
      </div>
      
      <div className="px-6 -mt-8">
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle>Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-2">
                {formatCurrency(currentLoan?.balance || 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                Due: {currentLoan?.dueDate ? new Date(currentLoan.dueDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-success" />
              M-Pesa Payment
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount to pay"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={currentLoan?.balance || 0}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((quick) => (
                  <Button
                    key={quick.label}
                    variant="outline"
                    onClick={() => setAmount(quick.value.toString())}
                    className="text-sm"
                  >
                    {quick.label}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(quick.value)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleRepayment}
              className="w-full bg-gradient-success"
              disabled={!amount || parseFloat(amount) <= 0}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Pay via M-Pesa
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};