import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';

interface AppDownloadPromptProps {
  onClose: () => void;
}

export const AppDownloadPrompt: React.FC<AppDownloadPromptProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    // Mark as installed and close
    localStorage.setItem('fanaka-app-installed', 'true');
    onClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-end transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <Card className={`w-full mx-4 mb-4 transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 scale-100' : 'translate-y-full scale-95'
      } shadow-2xl border-primary/20`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Get the Fanaka App</h3>
                <p className="text-sm text-muted-foreground">Better experience on mobile</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-gradient-to-r from-primary/10 to-gold/10 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="font-semibold text-primary">⚡ Faster</div>
                <div className="text-muted-foreground">Quick access</div>
              </div>
              <div>
                <div className="font-semibold text-success">🔔 Alerts</div>
                <div className="text-muted-foreground">Loan updates</div>
              </div>
              <div>
                <div className="font-semibold text-gold">📱 Native</div>
                <div className="text-muted-foreground">App experience</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              size="lg"
              className="flex-1 bg-gradient-primary hover:shadow-soft transition-all duration-300"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={handleClose}
              className="px-6"
            >
              Later
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-3">
            Add to your home screen for the best experience
          </p>
        </CardContent>
      </Card>
    </div>
  );
};