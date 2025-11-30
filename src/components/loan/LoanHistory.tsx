import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoanHistoryProps {
  onBack: () => void;
}

export const LoanHistory: React.FC<LoanHistoryProps> = ({ onBack }) => {
  const { loans, addNotification } = useAuth();

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'disbursed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'repaid':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
      case 'disbursed':
      case 'repaid':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleDownloadStatement = () => {
    addNotification('Statement download started', 'info');
    // Simulate download
    setTimeout(() => {
      addNotification('Statement downloaded successfully', 'success');
    }, 2000);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loan History</h1>
            <p className="text-primary-foreground/80">View all your loan transactions</p>
          </div>
          <Button 
            variant="ghost"
            onClick={handleDownloadStatement}
            className="text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="px-6 pt-3 -mt-8">
        {/* Summary Card */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle>Loan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">
                  {loans.filter(loan => loan.status === 'repaid').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed Loans</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    loans
                      .filter(loan => loan.status === 'repaid')
                      .reduce((sum, loan) => sum + loan.amount, 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Total Borrowed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loan List */}
        <div className="space-y-4">
          {loans.map((loan) => (
            <Card key={loan.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(loan.status)}
                    <div>
                      <p className="font-medium">{formatCurrency(loan.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        Applied on {formatDate(loan.appliedDate)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(loan.status) as any}>
                    {loan.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Repayment Period</p>
                    <p className="font-medium">{loan.period} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Repayable</p>
                    <p className="font-medium">{formatCurrency(loan.totalRepayable)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p className={`font-medium ${
                      loan.balance === 0 ? 'text-success' : 'text-warning'
                    }`}>
                      {formatCurrency(loan.balance || 0)}
                    </p>
                  </div>
                </div>
                
                {loan.dueDate && (
                  <div className="mt-3 p-2 bg-muted rounded flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium">{formatDate(loan.dueDate)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {loans.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Loan History</h3>
                <p className="text-muted-foreground">
                  You haven't applied for any loans yet. Apply for your first loan to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};