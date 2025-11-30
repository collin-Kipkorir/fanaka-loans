import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoanApplicationProps {
  onBack: () => void;
}

export const LoanApplication: React.FC<LoanApplicationProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; loan?: any } | null>(null);
  const { user, applyLoan, addNotification, loans } = useAuth();

  // Check if user has pending loan
  const hasPendingLoan = loans.some(loan => 
    loan.status === 'pending' || 
    loan.status === 'in_processing' || 
    loan.status === 'awaiting_disbursement'
  );

  const interestRate = 10;
  const loanAmount = parseFloat(amount) || 0;
  const totalRepayable = Math.round(loanAmount * (1 + interestRate / 100));
  const interestAmount = totalRepayable - loanAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !period || !purpose) {
      addNotification('Please fill in all fields', 'error');
      return;
    }

    if (hasPendingLoan) {
      addNotification('You already have a pending loan application. Please wait for it to be processed.', 'error');
      return;
    }
    
    if (user?.loanLimit && loanAmount > user.loanLimit) {
      addNotification(`Loan amount cannot exceed your limit of ${new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(user.loanLimit)}`, 'error');
      return;
    }
    
    if (loanAmount < 1000) {
      addNotification('Minimum loan amount is KES 1,000', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await applyLoan(loanAmount, parseInt(period), purpose);
      setResult(result);
      
      if (result.success) {
        addNotification('Loan application submitted successfully!', 'success');
      } else {
        addNotification('You already have a pending loan. Please wait for it to be processed before applying for another.', 'error');
      }
    } catch (error) {
      addNotification('Application failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
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
          <h1 className="text-2xl font-bold">Application Status</h1>
        </div>
        
        <div className="px-6 -mt-8">
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              {result.success ? (
                <>
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-xl font-bold text-success mb-2">Application Submitted!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your loan application for {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(loanAmount)} 
                    has been submitted. Please pay the processing fee to proceed.
                  </p>
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Loan Amount</p>
                        <p className="font-medium">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(loanAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interest ({interestRate}%)</p>
                        <p className="font-medium">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(interestAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Repayment Period</p>
                        <p className="font-medium">{period} days</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Repayable</p>
                        <p className="font-medium text-primary">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(totalRepayable)}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold text-destructive mb-2">Application Rejected</h3>
                  <p className="text-muted-foreground mb-6">
                    Unfortunately, we cannot approve your loan application at this time. 
                    Please try again later or contact support.
                  </p>
                </>
              )}
              
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
        <h1 className="text-2xl font-bold">Apply for Loan</h1>
        <p className="text-primary-foreground/80">Get instant access to funds</p>
      </div>
      
      <div className="px-6 py-3 -mt-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Loan Details
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {user?.loanLimit && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Your loan limit: <span className="font-semibold text-primary">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(user.loanLimit)}</span></p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="purpose">Loan Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select loan purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Loan Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={`Enter amount (1,000 - ${user?.loanLimit ? new Intl.NumberFormat('en-KE').format(user.loanLimit) : '70,000'})`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1000"
                  max={user?.loanLimit || 70000}
                  className="text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="period">Repayment Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select repayment period" />
                  </SelectTrigger>
                  <SelectContent>
              
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {loanAmount > 0 && period && (
                <div className="bg-gradient-gold/10 border border-gold/20 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-foreground">Loan Summary</h4>
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal Amount:</span>
                      <span className="font-medium">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest ({interestRate}%):</span>
                      <span className="font-medium">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(interestAmount)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Total Repayable:</span>
                        <span className="font-bold text-primary">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(totalRepayable)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary"
                disabled={isLoading || !amount || !period || !purpose || hasPendingLoan}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Application...
                  </>
                ) : hasPendingLoan ? (
                  'Pending Loan Exists'
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};