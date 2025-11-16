import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  phone: string;
  password?: string; // Optional for security reasons
  isAuthenticated: boolean;
  loanLimit?: number;
  hasCheckedLimit?: boolean;
}

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  period: number;
  totalRepayable: number;
  status: 'pending' | 'in_processing' | 'awaiting_disbursement' | 'approved' | 'rejected' | 'disbursed' | 'repaid';
  appliedDate: string;
  dueDate?: string;
  balance?: number;
  purpose?: string;
  processingFee?: number;
}

interface AuthContextType {
  user: User | null;
  loans: Loan[];
  currentLoan: Loan | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  checkLoanLimit: () => Promise<number>;
  applyLoan: (amount: number, period: number, purpose: string) => Promise<{ success: boolean; loan?: Loan }>;
  payCollateralFee: (loanId: string, amount: number) => Promise<{ success: boolean }>;
  repayLoan: (amount: number) => Promise<{ success: boolean }>;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// TODO: Replace with Supabase integration
// Mock data for demonstration - REMOVE when connecting to Supabase
const mockUsers = [
  { id: '1', name: 'John Kamau', phone: '0712345678', password: 'password123' },
  { id: '2', name: 'Grace Wanjiku', phone: '0723456789', password: 'password123' },
];

// TODO: Replace with Supabase database queries
// Start with empty loans for first-time users
const mockLoans: Loan[] = [];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);  // Start with empty loans always
  const [notifications, setNotifications] = useState<Array<{ message: string; type: string }>>([]);

  const currentLoan = loans.find(loan => 
    loan.status === 'disbursed' || loan.status === 'approved' || loan.status === 'pending' || 
    loan.status === 'in_processing' || loan.status === 'awaiting_disbursement'
  ) || null;

  const login = async (phone: string, password: string): Promise<void> => {
    // TODO: Replace with Supabase Auth
    // Use: supabase.auth.signInWithPassword() for phone/password auth
    // Or: supabase.auth.signInWithOtp() for phone OTP verification
    
    // Simulate API call - REMOVE when using Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.phone === phone && u.password === password);
    if (foundUser) {
      setUser({ ...foundUser, isAuthenticated: true, password: undefined }); // Don't store password in state
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (name: string, phone: string, password: string): Promise<void> => {
    // TODO: Replace with Supabase Auth
    // Use: supabase.auth.signUp() with phone and password
    // Then insert user profile data into 'users' table
    
    // Simulate API call - REMOVE when using Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: Date.now().toString(),
      name,
      phone,
      isAuthenticated: true,
    };
    
    mockUsers.push({ id: newUser.id, name, phone, password });
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    setLoans([]); // Always start fresh with no loans
  };

  const checkLoanLimit = async (): Promise<number> => {
    // TODO: Replace with Supabase function call
    // Call edge function or RPC to calculate loan limit based on user data
    // Example: const { data } = await supabase.rpc('calculate_loan_limit', { user_id: user.id })
    
    // Simulate API call for loan limit check - REMOVE when using Supabase
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const loanLimits = [8000, 10000, 12000, 15000, 18000, 20000, 22000, 25000];
    const randomLimit = loanLimits[Math.floor(Math.random() * loanLimits.length)];
    
    setUser(prev => prev ? { ...prev, loanLimit: randomLimit, hasCheckedLimit: true } : null);
    return randomLimit;
  };

  const applyLoan = async (amount: number, period: number, purpose: string): Promise<{ success: boolean; loan?: Loan }> => {
    // TODO: Replace with Supabase database insert
    // Insert new loan application into 'loans' table
    // Example: const { data } = await supabase.from('loans').insert({...})
    
    // Check if user already has a pending or awaiting disbursement loan
    const hasPendingLoan = loans.some(loan => 
      loan.status === 'pending' || 
      loan.status === 'in_processing' || 
      loan.status === 'awaiting_disbursement'
    );
    
    if (hasPendingLoan) {
      return { success: false };
    }
    
    // Simulate API call - REMOVE when using Supabase
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const interestRate = 10;
    const totalRepayable = Math.round(amount * (1 + interestRate / 100));
    const processingFee = Math.round(amount * 0.01); // 1% processing fee

    const newLoan: Loan = {
      id: Date.now().toString(),
      amount,
      interestRate,
      period,
      totalRepayable,
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + period * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      balance: totalRepayable,
      purpose,
      processingFee,
    };
    
    setLoans(prev => [newLoan, ...prev]);
    return { success: true, loan: newLoan };
  };

  const payCollateralFee = async (loanId: string, amount: number): Promise<{ success: boolean }> => {
    // TODO: Replace with M-Pesa STK Push integration
    // Use Supabase Edge Functions to integrate with M-Pesa API
    // Update loan status in database after successful payment
    
    // Simulate STK Push payment - REMOVE when using Supabase
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setLoans(prev => prev.map(loan => 
      loan.id === loanId 
          ? { ...loan, status: 'in_processing' as const }
        : loan
    ));
    
    // After payment, change to in_processing and then to awaiting_disbursement after 1 day (simulated as 5 seconds)
    setTimeout(() => {
      setLoans(prev => prev.map(loan => 
        loan.id === loanId 
          ? { ...loan, status: 'awaiting_disbursement' as const }
          : loan
      ));
      addNotification('Loan is awaiting disbursement to your M-Pesa', 'info');
    }, 5000); // Simulate 1 day as 5 seconds
    
    return { success: true };
  };

  const repayLoan = async (amount: number): Promise<{ success: boolean }> => {
    // TODO: Replace with M-Pesa payment integration
    // Use Supabase Edge Functions for M-Pesa API integration
    // Update loan balance in 'loans' table after successful payment
    
    // Simulate M-Pesa payment - REMOVE when using Supabase
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (currentLoan) {
      const newBalance = Math.max(0, (currentLoan.balance || 0) - amount);
      const newStatus = newBalance === 0 ? 'repaid' : currentLoan.status;
      
      setLoans(prev => prev.map(loan => 
        loan.id === currentLoan.id
          ? { ...loan, balance: newBalance, status: newStatus as any }
          : loan
      ));
      
      return { success: true };
    }
    
    return { success: false };
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotifications(prev => [...prev, { message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loans,
      currentLoan,
      login,
      register,
      logout,
      checkLoanLimit,
      applyLoan,
      payCollateralFee,
      repayLoan,
      addNotification,
    }}>
      {children}
    </AuthContext.Provider>
  );
};