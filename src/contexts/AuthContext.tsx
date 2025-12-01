import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  phone: string;
  password?: string; // Optional for security reasons
  isAuthenticated: boolean;
  loanLimit?: number;
  hasCheckedLimit?: boolean;
  loans?: Loan[];
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

// LocalStorage keys
const STORAGE_USERS_KEY = 'fanaka_users';
const STORAGE_CURRENT_USER_KEY = 'fanaka_current_user';

// Helper: get per-user loans key
function getLoansKeyForUser(userId: string): string {
  return `fanaka_loans_${userId}`;
}

// Helper: get users from localStorage
function getStoredUsers(): Array<{ id: string; name: string; phone: string; password: string }> {
  try {
    const stored = localStorage.getItem(STORAGE_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper: save users to localStorage
function saveUsers(users: Array<{ id: string; name: string; phone: string; password: string }>) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

// Helper: get current user from localStorage
function getStoredCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Helper: save current user to localStorage
function saveCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  }
}

// Helper: get loans from localStorage for a specific user
function getStoredLoansForUser(userId: string): Loan[] {
  try {
    const key = getLoansKeyForUser(userId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper: save loans to localStorage for a specific user
function saveLoansForUser(userId: string, loans: Loan[]) {
  const key = getLoansKeyForUser(userId);
  localStorage.setItem(key, JSON.stringify(loans));
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storedUser = getStoredCurrentUser();
  const [user, setUser] = useState<User | null>(storedUser);
  const [loans, setLoans] = useState<Loan[]>(() =>
    storedUser ? getStoredLoansForUser(storedUser.id) : []
  );
  const [notifications, setNotifications] = useState<Array<{ message: string; type: string }>>([]);

  // Ensure loans are updated from localStorage whenever user changes
  React.useEffect(() => {
    if (user) {
      setLoans(getStoredLoansForUser(user.id));
    } else {
      setLoans([]);
    }
  }, [user]);

  const currentLoan = loans.find(loan => 
    loan.status === 'disbursed' || loan.status === 'approved' || loan.status === 'pending' || 
    loan.status === 'in_processing' || loan.status === 'awaiting_disbursement'
  ) || null;

  const login = async (phone: string, password: string): Promise<void> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const users = getStoredUsers();
    const foundUser = users.find(u => u.phone === phone && u.password === password);
    if (foundUser) {
      const loggedInUser = { ...foundUser, isAuthenticated: true, password: undefined };
      setUser(loggedInUser); 
      saveCurrentUser(loggedInUser); // Persist logged-in user
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (name: string, phone: string, password: string): Promise<void> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const users = getStoredUsers();
    // Check if phone already registered
    if (users.some(u => u.phone === phone)) {
      throw new Error('Phone number already registered');
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      name,
      phone,
      isAuthenticated: true,
    };
    
    // Save to localStorage
    users.push({ id: newUser.id, name, phone, password });
    saveUsers(users);
    saveCurrentUser(newUser); // Persist logged-in user
    
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    setLoans([]);
    saveCurrentUser(null); // Clear persisted user
  };

  const checkLoanLimit = async (): Promise<number> => {
    // TODO: Replace with Supabase function call
    // Call edge function or RPC to calculate loan limit based on user data
    // Example: const { data } = await supabase.rpc('calculate_loan_limit', { user_id: user.id })
    
    // Simulate API call for loan limit check - REMOVE when using Supabase
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const loanLimits = [8000, 10000, 12000, 15000, 18000, 20000, 22000, 25000];
    const randomLimit = loanLimits[Math.floor(Math.random() * loanLimits.length)];
    
    setUser(prev => {
      const updated = prev ? { ...prev, loanLimit: randomLimit, hasCheckedLimit: true } : null;
      if (updated) {
        saveCurrentUser(updated); // Persist updated user
      }
      return updated;
    });
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
    
    setLoans(prev => {
      const updated = [newLoan, ...prev];
      if (user) saveLoansForUser(user.id, updated); // Persist loans for this user
      return updated;
    });
    return { success: true, loan: newLoan };
  };

  const payCollateralFee = async (loanId: string, amount: number): Promise<{ success: boolean }> => {
    // TODO: Replace with M-Pesa STK Push integration
    // Use Supabase Edge Functions to integrate with M-Pesa API
    // Update loan status in database after successful payment
    
    // Simulate STK Push payment - REMOVE when using Supabase
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setLoans(prev => {
      const updated = prev.map(loan => 
        loan.id === loanId 
            ? { ...loan, status: 'in_processing' as const }
          : loan
      );
      if (user) saveLoansForUser(user.id, updated); // Persist loans for this user
      return updated;
    });
    
    // After payment, change to in_processing and then to awaiting_disbursement after 1 day (simulated as 5 seconds)
    setTimeout(() => {
      setLoans(prev => {
        const updated = prev.map(loan => 
          loan.id === loanId 
            ? { ...loan, status: 'awaiting_disbursement' as const }
            : loan
        );
        if (user) saveLoansForUser(user.id, updated); // Persist loans for this user
        return updated;
      });
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
      
      setLoans(prev => {
        const updated = prev.map(loan => 
          loan.id === currentLoan.id
            ? { ...loan, balance: newBalance, status: newStatus as Loan['status'] }
            : loan
        );
        if (user) saveLoansForUser(user.id, updated); // Persist loans for this user
        return updated;
      });
      
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