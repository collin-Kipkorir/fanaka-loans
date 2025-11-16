import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, CreditCard, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const validatePhoneNumber = (phone: string) => {
    const kenyanPhoneRegex = /^(07\d{8}|01\d{8})$/;
    return kenyanPhoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (name.length < 2) {
      setError('Please enter your full name');
      return;
    }
    
    if (!validatePhoneNumber(phone)) {
      setError('Please enter a valid Kenyan phone number (07XXXXXXXX)');
      return;
    }
    
    if (nationalId.length < 7) {
      setError('Please enter a valid National ID');
      return;
    }

    setIsLoading(true);
    
    try {
      await register(name, phone, nationalId);
      onRegisterSuccess();
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Join Fanaka</CardTitle>
          <p className="text-muted-foreground">Create your account to get started</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nationalId" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                National ID
              </Label>
              <Input
                id="nationalId"
                type="text"
                placeholder="Enter your National ID"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="text-base"
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:bg-primary-dark"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-primary font-medium hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};