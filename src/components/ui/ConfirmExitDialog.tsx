import React from 'react';
import { X } from 'lucide-react';

interface Props {
  show: boolean;
  onStay: () => void;
  onExit: () => void;
}

const ConfirmExitDialog: React.FC<Props> = ({ show, onStay, onExit }) => {
  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-sm pointer-events-auto mx-4 rounded-2xl bg-white shadow-xl overflow-hidden">
          <div className="relative p-6 pb-4">
            <button
              onClick={onStay}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="mt-2">
              <h2 className="text-xl font-bold text-gray-900">Exit Fanaka Loans?</h2>
              <p className="text-sm text-gray-600 mt-2">Are you sure you want to close the app? You can always open it again.</p>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onStay}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all duration-200 text-sm"
            >
              Stay
            </button>

            <button
              onClick={onExit}
              className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all duration-200 text-sm"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmExitDialog;
