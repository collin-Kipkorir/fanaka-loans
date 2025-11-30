import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppDownloadPrompt } from '@/components/ui/app-download-prompt';
import { 
  CreditCard, 
  Calendar, 
  Banknote, 
  Plus, 
  History, 
  User,
  LogOut,
  Phone,
  IdCard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onLogout }) => {
  const { user, currentLoan, loans, checkLoanLimit } = useAuth();
  const [isCheckingLimit, setIsCheckingLimit] = React.useState(false);
  const [showLimitResult, setShowLimitResult] = React.useState(false);
  const [showAppPrompt, setShowAppPrompt] = React.useState(false);

  // App download prompt logic
  React.useEffect(() => {
    const isInstalled = localStorage.getItem('fanaka-app-installed');
    const hasSeenPrompt = sessionStorage.getItem('fanaka-prompt-shown');
    
    if (!isInstalled && !hasSeenPrompt) {
      const timer = setTimeout(() => {
        setShowAppPrompt(true);
        sessionStorage.setItem('fanaka-prompt-shown', 'true');
      }, 30000); // 30 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Processing fee options
  const processingFeeOptions = [100, 110, 120];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleCheckLimit = async () => {
    setIsCheckingLimit(true);
    try {
      await checkLoanLimit();
      setShowLimitResult(true);
    } catch (error) {
      console.error('Failed to check loan limit:', error);
    } finally {
      setIsCheckingLimit(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'in_processing': return 'bg-primary';
      case 'awaiting_disbursement': return 'bg-success';
      case 'disbursed': return 'bg-success';
      case 'approved': return 'bg-success';
      case 'rejected': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_processing': return 'In Processing';
      case 'awaiting_disbursement': return 'Awaiting Disbursement';
      case 'disbursed': return 'Disbursed';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-primary-foreground/80">{user?.name}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onLogout}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        
        {/* User Info Card */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" />
                <div>
                  <p className="text-xs text-primary-foreground/70">Phone</p>
                  <p className="text-sm font-medium">{user?.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IdCard className="h-4 w-4 text-gold" />
                <div>
                  <p className="text-xs text-primary-foreground/70">Account Status</p>
                  <p className="text-sm font-medium">Verified</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="px-6 -mt-8 space-y-6">
        {/* Hero Card for First Time Users */}
        {!user?.hasCheckedLimit && !currentLoan && (
          <Card className="shadow-soft mb-6 bg-gradient-to-br from-primary/10 via-gold/5 to-success/5 border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-gold opacity-10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="p-8 text-center relative">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
                <CreditCard className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-foreground">Unlock Your Financial Potential</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base">
                Get instant access to loans up to <span className="font-semibold text-primary">KES 70,000</span> with our quick and secure process. Check your personalized loan limit now!
              </p>
              <Button 
                size="lg"
                className="w-full max-w-sm bg-gradient-primary hover:shadow-soft transition-all duration-300 transform hover:scale-105" 
                onClick={handleCheckLimit}
                disabled={isCheckingLimit}
              >
                {isCheckingLimit ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Checking Your Limit...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-3 h-5 w-5" />
                    Check My Loan Limit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loan Limit Result - Enhanced */}
        {user?.hasCheckedLimit && user?.loanLimit && !currentLoan && showLimitResult && (
          <Card className="shadow-soft mb-6 bg-gradient-to-br from-success/10 via-primary/5 to-gold/5 border-success/30 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-success opacity-20 rounded-full -translate-y-12 -translate-x-12" />
            <CardContent className="p-8 text-center relative">
              <div className="w-20 h-20 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
                <Banknote className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-success mb-3">🎉 Congratulations!</h2>
              <p className="text-muted-foreground mb-4 text-base">
                You're pre-approved for a loan of up to
              </p>
              <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl p-4 mb-8">
                <p className="text-4xl font-bold text-primary mb-2">
                  {formatCurrency(user.loanLimit)}
                </p>
                <p className="text-sm text-muted-foreground">Available instantly</p>
              </div>
              <Button 
                size="lg"
                className="w-full max-w-sm bg-gradient-primary hover:shadow-soft transition-all duration-300 transform hover:scale-105"
                onClick={() => onNavigate('apply')}
              >
                <Plus className="mr-3 h-5 w-5" />
                Apply for Loan Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Active Loan Section - Only show when there's an active loan or user has checked limit */}
        {(currentLoan || user?.hasCheckedLimit) && (
          <Card className="shadow-card mb-6 border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                Current Loan Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentLoan ? (
                <div className="space-y-3">
                  {/* Loan Header Info */}
                  <div className="bg-gradient-to-r from-muted/50 to-accent/30 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {currentLoan.status === 'pending' ? 'Applied Amount' : 'Outstanding Balance'}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(currentLoan.status === 'pending' ? currentLoan.amount : (currentLoan.balance || 0))}
                        </p>
                        {currentLoan.purpose && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Purpose: {currentLoan.purpose}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <div className="inline-flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(currentLoan.status)} animate-pulse`} />
                          <span className="text-sm font-medium">
                            {getStatusText(currentLoan.status)}
                          </span>
                        </div>
                        {currentLoan.appliedDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Applied: {formatDate(currentLoan.appliedDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Processing Fee Payment - Enhanced (contrast + accessibility improvements) */}
                  {currentLoan.status === 'pending' && currentLoan.processingFee && (
                    <div className="bg-gradient-to-r from-warning/20 to-gold/10 border border-warning/40 rounded-xl p-6 shadow-sm">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-warning to-gold rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                          <Banknote className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-warning mb-2">⚡ Action Required</h3>
                        <p className="text-foreground mb-4">
                          Complete your loan processing by paying a small processing fee
                        </p>
                      </div>
                      
                      <div className="bg-white/90 rounded-lg p-4 mb-6 border border-primary/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-foreground/70">Processing Fee</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(currentLoan.processingFee)}
                          </span>
                        </div>
                        <div className="text-xs text-foreground/60">
                          Secure your loan • Fast processing • Instant approval
                        </div>
                      </div>

                      <Button 
                        size="lg"
                        aria-label={`Pay processing fee ${formatCurrency(currentLoan.processingFee)}`}
                        className="w-full bg-gradient-to-r from-warning to-gold text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        onClick={() => onNavigate('collateral-payment')}
                      >
                        <Banknote className="mr-3 h-5 w-5 text-white" />
                        Pay Processing Fee — {formatCurrency(currentLoan.processingFee)}
                      </Button>
                      
                      <div className="mt-4 text-center">
                        <p className="text-sm text-foreground/70">
                          💳 Pay securely via M-Pesa • Processing fee of {formatCurrency(currentLoan.processingFee)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Repayment Section */}
                  {currentLoan.status === 'disbursed' && (
                    <div className="bg-gradient-to-r from-success/10 to-primary/10 border border-success/30 rounded-xl p-6">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-success mb-2">Ready to Repay?</h3>
                        <p className="text-muted-foreground">
                          Make your loan repayment quickly and securely
                        </p>
                      </div>
                      <Button 
                        size="lg"
                        className="w-full bg-gradient-success hover:shadow-soft transition-all duration-300"
                        onClick={() => onNavigate('repayment')}
                      >
                        <Banknote className="mr-3 h-5 w-5" />
                        Repay via M-Pesa
                      </Button>
                    </div>
                  )}
                </div>
              ) : user?.hasCheckedLimit ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Ready to Get Started?</h3>
                  <p className="text-muted-foreground mb-2">
                    You're pre-approved for up to
                  </p>
                  <p className="text-2xl font-bold text-primary mb-6">
                    {formatCurrency(user.loanLimit || 0)}
                  </p>
                  <Button 
                    size="lg"
                    className="bg-gradient-primary hover:shadow-soft transition-all duration-300"
                    onClick={() => onNavigate('apply')}
                  >
                    <Plus className="mr-3 h-5 w-5" />
                    Apply for Loan
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Start Your Journey</h3>
                  <p className="text-muted-foreground mb-6">
                    Get instant access to loans up to KES 10,000
                  </p>
                  <Button 
                    size="lg"
                    className="bg-gradient-primary hover:shadow-soft transition-all duration-300"
                    onClick={() => onNavigate('apply')}
                  >
                    <Plus className="mr-3 h-5 w-5" />
                    Check Loan Eligibility
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="shadow-card hover:shadow-soft transition-all duration-300 border-primary/10 hover:border-primary/20">
            <CardContent className="p-0">
              <Button 
                variant="ghost" 
                className="w-full h-auto flex-col gap-4 p-6 hover:bg-gradient-to-br hover:from-primary/5 hover:to-gold/5"
                onClick={() => onNavigate('apply')}
              >
                <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center shadow-card">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-base">Apply Loan</span>
                  <p className="text-xs text-muted-foreground mt-1">Up to KES 70,000</p>
                </div>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-card hover:shadow-soft transition-all duration-300 border-gold/10 hover:border-gold/20">
            <CardContent className="p-0">
              <Button 
                variant="ghost" 
                className="w-full h-auto flex-col gap-4 p-6 hover:bg-gradient-to-br hover:from-gold/5 hover:to-warning/5"
                onClick={() => onNavigate('history')}
              >
                <div className="w-14 h-14 bg-gradient-gold rounded-xl flex items-center justify-center shadow-card">
                  <History className="h-7 w-7 text-white" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-base">Loan History</span>
                  <p className="text-xs text-muted-foreground mt-1">Track payments</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <Card className="shadow-card bg-gradient-to-r from-muted/30 to-accent/20 border-primary/10">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">5K+</div>
                <div className="text-xs text-muted-foreground">Happy Customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">99%</div>
                <div className="text-xs text-muted-foreground">Approval Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gold">24/7</div>
                <div className="text-xs text-muted-foreground">Support</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* App Download Prompt */}
      {showAppPrompt && (
        <AppDownloadPrompt onClose={() => setShowAppPrompt(false)} />
      )}
    </div>
  );
};