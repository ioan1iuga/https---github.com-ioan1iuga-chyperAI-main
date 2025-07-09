import toast, { ToastOptions } from 'react-hot-toast';

/**
 * Centralized toast management for consistent notifications
 */

// Default toast options for each type
const defaultOptions: Record<string, ToastOptions> = {
  success: {
    duration: 3000,
    position: 'bottom-right',
    className: 'dark:bg-gray-800 dark:text-white',
    style: {
      borderRadius: '0.5rem',
      padding: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  },
  error: {
    duration: 5000,
    position: 'bottom-right',
    className: 'dark:bg-gray-800 dark:text-red-400',
    style: {
      borderRadius: '0.5rem',
      padding: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  },
  info: {
    duration: 3000,
    position: 'bottom-right',
    className: 'dark:bg-gray-800 dark:text-blue-400',
    style: {
      borderRadius: '0.5rem',
      padding: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  },
  warning: {
    duration: 4000,
    position: 'bottom-right',
    className: 'dark:bg-gray-800 dark:text-yellow-400',
    style: {
      borderRadius: '0.5rem',
      padding: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  },
  loading: {
    duration: Infinity,
    position: 'bottom-right',
    className: 'dark:bg-gray-800 dark:text-white',
    style: {
      borderRadius: '0.5rem',
      padding: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  }
};

export const toastManager = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...defaultOptions.success,
      ...options
    });
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...defaultOptions.error,
      ...options
    });
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions.info,
      ...options
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      icon: '⚠️',
      ...defaultOptions.warning,
      ...options
    });
  },

  /**
   * Show a loading toast that can be updated later
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...defaultOptions.loading,
      ...options
    });
  },

  /**
   * Update an existing toast
   */
  update: (id: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message, { id });
        break;
      case 'error':
        toast.error(message, { id });
        break;
      case 'warning':
        toast(message, { id, icon: '⚠️' });
        break;
      case 'info':
      default:
        toast(message, { id });
    }
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (id: string) => {
    toast.dismiss(id);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Create a promise toast that shows loading, success, or error based on promise resolution
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string | ((err: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        ...defaultOptions.info,
        ...options
      }
    );
  }
};