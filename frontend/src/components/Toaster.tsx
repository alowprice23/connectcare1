import { Toaster as SonnerToaster } from 'sonner';

/**
 * Global Toaster component for notifications
 * Uses sonner library for better UI and performance
 */
export const Toaster = () => {
  return (
    <SonnerToaster 
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)'
        },
      }}
    />
  );
};
