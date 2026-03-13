import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-800">{error}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );
}
