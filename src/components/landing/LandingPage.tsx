import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, Smartphone, Shield, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-hero text-foreground relative overflow-hidden">
      {/* Animated background stars/particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-16 pb-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary animate-fade-in">
            NYOTA FUNDS
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-primary/90 animate-fade-in-delay">
            Premium Instant Loans • Powered by M-Pesa
          </p>

          <Button
            size="lg"
            onClick={onGetStarted}
            className="bg-primary hover:bg-primary-light text-primary-foreground font-semibold px-8 py-6 text-lg rounded-full shadow-glow transition-all duration-300 hover:scale-105 animate-fade-in-delay-2"
          >
            <Zap className="mr-2 h-5 w-5" />
            Get Started
          </Button>

          <div className="pt-8 animate-fade-in-delay-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              Up to KSh 70,000
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Instant approval • No paperwork • 100% digital
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="bg-card/80 backdrop-blur-sm border-border p-8 hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-4">Instant Approval</h3>
            <p className="text-card-foreground/80">
              Get approved in seconds with our advanced AI-powered credit assessment system.
            </p>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border p-8 hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
              <Smartphone className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-4">M-Pesa Integration</h3>
            <p className="text-card-foreground/80">
              Seamless integration with M-Pesa for instant disbursement and repayment.
            </p>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border p-8 hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-4">100% Secure</h3>
            <p className="text-card-foreground/80">
              Bank-grade security with end-to-end encryption for all transactions.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-12">
          How It Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            {
              step: '1',
              title: 'Apply Online',
              description: 'Complete our simple online application in under 2 minutes.',
            },
            {
              step: '2',
              title: 'Get Approved',
              description: 'Receive instant approval decision powered by AI technology.',
            },
            {
              step: '3',
              title: 'Receive Money',
              description: 'Get funds directly to your M-Pesa wallet within minutes.',
            },
            {
              step: '4',
              title: 'Repay Easily',
              description: 'Convenient repayment options through M-Pesa or bank transfer.',
            },
          ].map((item) => (
            <div key={item.step} className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto border-2 border-primary">
                <span className="text-2xl font-bold text-primary">{item.step}</span>
              </div>
              <h3 className="text-xl font-semibold text-primary">{item.title}</h3>
              <p className="text-card-foreground/80 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of satisfied customers who trust Nyota Funds
          </p>
          <Button
            size="lg"
            onClick={onGetStarted}
            className="bg-primary hover:bg-primary-light text-primary-foreground font-semibold px-8 py-6 text-lg rounded-full shadow-glow transition-all duration-300 hover:scale-105"
          >
            Apply Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2024 Nyota Funds. All rights reserved.</p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .stars-container {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: hsl(38 92% 50%);
          border-radius: 50%;
          animation: twinkle linear infinite;
          box-shadow: 0 0 4px hsl(38 92% 50% / 0.5);
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeIn 0.8s ease-out 0.2s backwards;
        }

        .animate-fade-in-delay-2 {
          animation: fadeIn 0.8s ease-out 0.4s backwards;
        }

        .animate-fade-in-delay-3 {
          animation: fadeIn 0.8s ease-out 0.6s backwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  );
};
