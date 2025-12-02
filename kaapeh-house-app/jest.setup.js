import '@testing-library/jest-native/extend-expect';

// Mock Supabase
jest.mock('../utils/supabase', () => ({
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

