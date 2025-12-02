import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Loader2, CheckCircle, Smartphone, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { initiateStkPush, validateAndFormatPhone, isValidKenyaPhoneNumber } from '@/lib/payhero-service';
import { usePaymentPolling } from '@/hooks/usePaymentPolling';
import type { StatusCheckResponse } from '@/lib/payhero-types';

interface CollateralPaymentProps {
  onBack: () => void;
}

export const CollateralPayment: React.FC<CollateralPaymentProps> = ({ onBack }) => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionState, setTransactionState] = useState<'idle' | 'pending' | 'success' | 'failed' | 'timeout'>('idle');
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);
  
  const { currentLoan, user } = useAuth();
  const { startPolling, stopPolling, resetPolling, isPolling, status, elapsedSeconds, lastStatusCheck, error: pollingError } = usePaymentPolling();

  // Initialize phone from user context when available
  React.useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentLoan) {
      setError('No active loan found');
      return;
    }

    // Validate phone
    if (!phone) {
      setError('Please enter a phone number');
      return;
    }

    if (!isValidKenyaPhoneNumber(phone)) {
      setError('Please enter a valid Kenya phone number (07xx xxx xxx or 254xx xxx xxxx)');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[CollateralPayment] Initiating STK push for phone:', phone);

      const result = await initiateStkPush(
        phone,
        currentLoan.processingFee || 0,
        user?.name || 'Fanaka Loans Customer',
        `loan_${currentLoan.id}`
      );

      if (!result.success) {
        setError(result.error || 'Failed to initiate payment');
        setIsLoading(false);
        return;
      }

      // STK initiated successfully — start polling for payment status
      console.log('[CollateralPayment] STK initiated:', result.paymentReference);
      setPaymentReference(result.paymentReference);
      setTransactionState('pending');

      // Start polling for status
      startPolling(
        result.paymentReference,
        (statusResponse: StatusCheckResponse) => {
          // Payment succeeded
          console.log('[CollateralPayment] Payment success:', statusResponse);
          setMpesaReceipt(statusResponse.mpesa_receipt_number || null);
          setTransactionState('success');

          // TODO: In production, mark loan as paid and proceed with disbursement
          // - Call backend to confirm payment
          // - Update user credits
          // - Trigger loan approval flow
        },
        () => {
          // Polling timeout
          console.warn('[CollateralPayment] Payment polling timeout');
          setTransactionState('timeout');
        }
      );
    } catch (err) {
      const errorMsg = `Error: ${String(err)}`;
      console.error('[CollateralPayment] Exception:', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('[CollateralPayment] Cancelling payment');
    stopPolling();
    resetPolling();
    setTransactionState('idle');
    setPaymentReference(null);
    setError(null);
  };

  const handleRetry = () => {
    console.log('[CollateralPayment] Retrying payment');
    resetPolling();
    setTransactionState('idle');
    setPaymentReference(null);
    setError(null);
  };

  if (transactionState === 'pending' || isPolling) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-primary text-white p-6">
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel Payment
          </Button>
          <h1 className="text-2xl font-bold">Processing Payment</h1>
        </div>

        <div className="px-6 pt-3 -mt-8">
          <Card className="shadow-card">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Smartphone className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Confirm on Your Phone</h2>
                <p className="text-muted-foreground">
                  You should have received an M-Pesa STK prompt. Please complete the payment on your device.
                </p>
              </div>

              {/* Timer and status */}
              <div className="bg-muted rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Elapsed Time</p>
                    <p className="text-3xl font-bold font-mono">{formatElapsedTime(elapsedSeconds)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Timeout in 3:00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(currentLoan?.processingFee || 0)}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono text-xs">{paymentReference?.substring(0, 12)}...</span>
                  </div>
                  {lastStatusCheck && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium capitalize">{lastStatusCheck.status || 'Checking...'}</span>
                    </div>
                  )}
                </div>
              </div>

              {pollingError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-destructive">{pollingError}</div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Waiting for M-Pesa confirmation</p>
                    <p>The payment will be confirmed automatically once you approve it on your phone.</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleCancel} variant="outline" className="w-full">
                Cancel Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (transactionState === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-primary text-white p-6">
          <h1 className="text-2xl font-bold">Payment Successful</h1>
        </div>

        <div className="px-6 pt-3 -mt-8">
          <Card className="shadow-card">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Payment Complete</h2>
                <p className="text-muted-foreground">
                  Your M-Pesa payment has been successfully processed.
                </p>
              </div>

              {/* Success details */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-bold text-lg">{formatCurrency(currentLoan?.processingFee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">M-Pesa Receipt:</span>
                  <span className="font-mono text-sm font-medium">{mpesaReceipt || 'Confirmed'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Taken:</span>
                  <span className="font-medium">{formatElapsedTime(elapsedSeconds)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>Next Steps:</strong> Your loan application is now being processed. You'll receive notifications when we have updates.
                </p>
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

  if (transactionState === 'failed' || transactionState === 'timeout') {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-primary text-white p-6">
          <h1 className="text-2xl font-bold">Payment {transactionState === 'timeout' ? 'Timed Out' : 'Failed'}</h1>
        </div>

        <div className="px-6 pt-3 -mt-8">
          <Card className="shadow-card">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {transactionState === 'timeout' ? 'Payment Verification Timeout' : 'Payment Failed'}
                </h2>
                <p className="text-muted-foreground">
                  {transactionState === 'timeout'
                    ? 'We stopped waiting for payment confirmation after 3 minutes. Please check your M-Pesa app or try again.'
                    : pollingError || 'The payment could not be processed. Please try again.'}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 space-y-2">
                <p className="text-sm text-red-900 font-medium">What you can do:</p>
                <ul className="text-sm text-red-900 space-y-1 list-disc list-inside">
                  <li>Check your M-Pesa app to see if the payment went through</li>
                  <li>Verify that your phone number is correct</li>
                  <li>Ensure you have sufficient M-Pesa balance</li>
                  <li>Try again with a different phone number if needed</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full bg-gradient-primary">
                  Try Again
                </Button>
                <Button onClick={onBack} variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default: idle state - payment form
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
                A payment request will be sent to the phone number below. You'll receive a prompt from M-Pesa to approve the payment.
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-destructive">{error}</div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Payment Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07xxxxxxxx or 254xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  We'll send the M-Pesa prompt to this number. Make sure it's the number linked to your M-Pesa account.
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
                    Sending STK Push...
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