import { queryClient } from '@/util/query';
import { createStore } from '@xstate/store';
import { useEffect, useState } from 'react';

interface AuthState {
  token: string | null;
  user: any | null;
}

// Initialize from localStorage if available
const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }
  
  const storedToken = localStorage.getItem('auth_token');
  const storedUser = localStorage.getItem('auth_user');
  
  return {
    token: storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,
  };
};

// Create custom event system for auth state changes
const authEvents = {
  listeners: new Set<() => void>(),
  notify() {
    this.listeners.forEach(listener => listener());
  },
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
};

// Create the auth store using the new API
export const authStore = createStore({
  context: getInitialState(),
  on: {
    login: (context, event: { token: string; user: any }) => {
      localStorage.setItem('auth_token', event.token);
      localStorage.setItem('auth_user', JSON.stringify(event.user));
      
      const result = {
        ...context,
        token: event.token,
        user: event.user
      };

      // Notify listeners of state change
      setTimeout(() => authEvents.notify(), 0);
      queryClient.invalidateQueries({});
      
      return result;
    },
    logout: (context) => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      const result = {
        ...context,
        token: null,
        user: null
      };

      // Notify listeners of state change
      setTimeout(() => authEvents.notify(), 0);
      queryClient.invalidateQueries({});
      
      return result;
    },
    updateUser: (context, event: { user: any }) => {
      localStorage.setItem('auth_user', JSON.stringify(event.user));
      
      const result = {
        ...context,
        user: event.user
      };
      
      // Notify listeners of state change
      setTimeout(() => authEvents.notify(), 0);
      queryClient.invalidateQueries({});
      
      return result;
    }
  }
});

// Original hook with direct store access
export const useAuthToken = () => {
  // Return the store with some helper methods for convenience
  return {
    getToken: () => authStore.getSnapshot().context.token,
    getUser: () => authStore.getSnapshot().context.user,
    isAuthenticated: () => !!authStore.getSnapshot().context.token,
    login: (token: string, user: any) => {
      authStore.trigger.login({ token, user });
    },
    logout: () => {
      authStore.trigger.logout();
    },
    updateUser: (user: any) => {
      authStore.trigger.updateUser({ user });
    },
    subscribe: authEvents.subscribe.bind(authEvents)
  };
};

// New reactive hook that provides state and update functions
export const useAuth = () => {
  const [token, setToken] = useState<string | null>(authStore.getSnapshot().context.token);
  const [user, setUser] = useState<any | null>(authStore.getSnapshot().context.user);
  
  useEffect(() => {
    // Check for token in URL query parameters
    const checkUrlForToken = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        
        if (urlToken) {
          // Remove token from URL
          params.delete('token');
          const newUrl = window.location.pathname + 
            (params.toString() ? `?${params.toString()}` : '') +
            window.location.hash;
          
          // Update URL without causing a page reload
          window.history.replaceState({}, document.title, newUrl);
          
          // Set the token in auth store
          const currentUser = authStore.getSnapshot().context.user;
          authStore.trigger.login({ token: urlToken, user: currentUser || {} });
        }
      }
    };
    
    // Run once on component mount
    checkUrlForToken();
    
    // Setup subscription to auth state changes
    const unsubscribe = authEvents.subscribe(() => {
      const state = authStore.getSnapshot();
      setToken(state.context.token);
      setUser(state.context.user);
    });
    
    return () => unsubscribe();
  }, []);
  
  return {
    token,
    user,
    isAuthenticated: !!token,
    login: (token: string, user: any) => {
      authStore.trigger.login({ token, user });
    },
    logout: () => {
      authStore.trigger.logout();
    },
    updateUser: (user: any) => {
      authStore.trigger.updateUser({ user });
    }
  };
};
