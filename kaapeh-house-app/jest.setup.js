import '@testing-library/jest-native/extend-expect';

// Setup expo global for expo-modules-core
if (typeof globalThis.expo === 'undefined') {
  globalThis.expo = {};
}
if (typeof globalThis.expo.EventEmitter === 'undefined') {
  const EventEmitter = require('events');
  globalThis.expo.EventEmitter = EventEmitter;
}
// Ensure NativeModule is available for jest-expo
if (typeof globalThis.expo.NativeModule === 'undefined') {
  // NativeModule is a class that expo-modules-core uses
  globalThis.expo.NativeModule = class NativeModule {
    constructor() {
      // Create a plain object that can have properties assigned
      return Object.create(null);
    }
  };
}
// Ensure SharedObject is available
if (typeof globalThis.expo.SharedObject === 'undefined') {
  globalThis.expo.SharedObject = class SharedObject {
    constructor() {
      return Object.create(null);
    }
  };
}

// Mock expo-linear-gradient to avoid viewManagersMetadata issues
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }) => React.createElement(View, props, children),
  };
});

// Mock Supabase
jest.mock('./utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: [],
              error: null,
            })),
          })),
          in: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
        in: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
    auth: {
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}));

// Silence console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

