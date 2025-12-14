import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Loader2, CheckCircle, Smartphone, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { initiateStkPush, checkPaymentStatus } from '@/services/payhero';
import { validateAndFormatPhone, generatePaymentReference } from '@/lib/payhero-config';
import { usePaymentPolling } from '@/hooks/usePaymentPolling';

interface CollateralPaymentProps {
  onBack: () => void;
}

export const CollateralPayment: React.FC<CollateralPaymentProps> = ({ onBack }) => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionState, setTransactionState] = useState<'idle' | 'pending' | 'success' | 'failure' | 'timeout'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const { currentLoan, payCollateralFee, addNotification } = useAuth();
  const { isPolling, elapsedSeconds, error, startPolling, resetPolling } = usePaymentPolling({
    onSuccess: async (data) => {
      // Update loan status to 'in_processing' (processing) after successful payment
      // This will remove the action modal since it only shows for 'pending' status
      if (currentLoan) {
        try {
          await payCollateralFee(currentLoan.id, currentLoan.processingFee || 0);
          setTransactionState('success');
          addNotification('Payment successful! Loan is now being processed.', 'success');
        } catch (error) {
          console.error('Failed to update loan status:', error);
          // Still show success even if status update fails
          setTransactionState('success');
          addNotification('Payment successful!', 'success');
        }
      } else {
        setTransactionState('success');
        addNotification('Payment successful!', 'success');
      }
    },
    onTimeout: () => {
      setTransactionState('timeout');
      addNotification('Payment request timed out. Please try again.', 'error');
    },
    onError: (err) => {
      setTransactionState('failure');
      setErrorMessage(err);
      addNotification(`Payment failed: ${err}`, 'error');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      setErrorMessage('Please enter your phone number');
      return;
    }

    if (!validateAndFormatPhone(phone)) {
      setErrorMessage('Invalid phone number. Please enter a valid Kenyan phone number.');
      return;
    }

    if (!currentLoan) {
      setErrorMessage('No active loan found');
      return;
    }

    setIsLoading(true);
    setTransactionState('pending');
    setErrorMessage('');

    try {
      const formattedPhone = validateAndFormatPhone(phone);
      const generatedReference = generatePaymentReference();
      // Default to the generated external reference; we'll prefer PayHero's returned
      // `reference` when available.
      setPaymentReference(generatedReference);

      const result = await initiateStkPush(
        formattedPhone,
        currentLoan.processingFee || 0,
        'Customer',
        generatedReference
      );

      if (result.success || result.checkout_request_id) {
        // Prefer PayHero's authoritative reference for polling if returned.
  const authoritativeRef = result.reference || result.external_reference || generatedReference;
        setPaymentReference(authoritativeRef);

  // Start polling using the authoritative reference and provide the expected amount
  startPolling(authoritativeRef, currentLoan?.processingFee || 0);
        addNotification('STK push sent to your phone. Please enter your PIN.', 'success');
      } else {
        setTransactionState('failure');
        setErrorMessage(result.error || 'Failed to initiate payment');
        addNotification(result.error || 'Failed to initiate payment', 'error');
      }
    } catch (error) {
      setTransactionState('failure');
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(message);
      addNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetPolling();
    setTransactionState('idle');
    setPhone('');
    setErrorMessage('');
  };

  const handleRetry = () => {
    resetPolling();
    setTransactionState('idle');
    setErrorMessage('');
  };

  // Payment pending state
  if (transactionState === 'pending' || isPolling) {
    const maxTime = 180;
    const progressPercent = (elapsedSeconds / maxTime) * 100;

    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-primary text-white p-6">
          <h1 className="text-2xl font-bold">Payment Processing</h1>
          <p className="text-primary-foreground/80">Waiting for payment confirmation...</p>
        </div>
        
        <div className="px-6 pt-3 -mt-8">
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Waiting for M-Pesa Response</h3>
              <p className="text-muted-foreground mb-6">
                Enter your M-Pesa PIN on your phone to complete the payment.
              </p>

              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
                  <p className="text-3xl font-bold text-primary">
                    {Math.floor((maxTime - elapsedSeconds) / 60)}:{String((maxTime - elapsedSeconds) % 60).padStart(2, '0')}
                  </p>
                  <div className="mt-4 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="w-full"
                >
                  Cancel Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Payment success state
  if (transactionState === 'success') {
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
                    <span className="font-medium">{paymentReference}</span>
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

  // Payment failure/timeout state
  if (transactionState === 'failure' || transactionState === 'timeout') {
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
          <h1 className="text-2xl font-bold">Payment Failed</h1>
        </div>
        
        <div className="px-6 -mt-8">
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-destructive mb-2">
                {transactionState === 'timeout' ? 'Payment Request Expired' : 'Payment Failed'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {transactionState === 'timeout'
                  ? 'The payment request has expired. Please try again.'
                  : errorMessage || 'An error occurred while processing your payment.'}
              </p>

              <div className="space-y-3">
                <Button 
                  onClick={handleRetry}
                  className="w-full bg-gradient-primary"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Initial form state (idle)
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
      
      <div className="px-6 pt-3 -mt-8">
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
            
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleInitiatePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., 0712345678 or 254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your M-Pesa registered phone number
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary"
                disabled={isLoading || !phone}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initiating Payment...
                  </>
                ) : (
                  `Send STK Push - ${formatCurrency(currentLoan?.processingFee || 0)}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};