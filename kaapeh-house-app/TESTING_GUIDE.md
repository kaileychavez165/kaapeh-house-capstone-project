# Testing Guide for Admin Features

## Overview
This guide covers unit and integration testing for the admin side of the Kaapeh House app.

## What to Test

### 1. **Dashboard Service** (`dashboardService.ts`)
**Unit Tests** - Test business logic and data transformations:
- ✅ `fetchTodaysMetrics()` - Calculate today's sales, orders, and average
- ✅ `fetchWeeklySales()` - Aggregate weekly sales data
- ✅ `fetchTopItemsToday()` - Aggregate and rank top items
- ✅ Date range calculations (`getTodayRange`, `getDayRange`)
- ✅ Data filtering (only completed orders)
- ✅ Error handling

### 2. **Dashboard Hooks** (`useDashboardQueries.ts`)
**Integration Tests** - Test React Query integration:
- ✅ `useDashboardData()` - Fetches all dashboard data
- ✅ `useTodaysMetrics()` - Fetches today's metrics
- ✅ `useWeeklySales()` - Fetches weekly sales
- ✅ `useTopItemsToday()` - Fetches top items
- ✅ Query caching and refetching behavior
- ✅ Loading and error states

### 3. **AdminHome Component**
**Component Tests** - Test UI and user interactions:
- ✅ Renders loading state
- ✅ Renders error state
- ✅ Displays dashboard metrics correctly
- ✅ Renders weekly sales chart with sorted data
- ✅ Displays top items list
- ✅ Sign out functionality
- ✅ Navigation interactions

### 4. **Data Transformations**
**Unit Tests** - Test data processing:
- ✅ Sorting weekly data by sales (highest to lowest)
- ✅ Calculating max sales for chart scaling
- ✅ Formatting currency values
- ✅ Handling empty data states

## Test Setup

### Install Dependencies
```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest
```

### Jest Configuration
Create `jest.config.js` in the root of `kaapeh-house-app/`

## Running Tests
```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage report
npm test dashboardService   # Run specific test file
```

## Test Structure
```
kaapeh-house-app/
├── src/
│   ├── services/
│   │   └── __tests__/
│   │       └── dashboardService.test.ts
│   ├── hooks/
│   │   └── __tests__/
│   │       └── useDashboardQueries.test.ts
│   └── navigation/
│       └── screens/
│           └── __tests__/
│               └── AdminHome.test.tsx
```

## Best Practices
1. **Mock Supabase** - Always mock Supabase client in tests
2. **Test Edge Cases** - Empty data, errors, null values
3. **Test Calculations** - Verify math is correct
4. **Test Filtering** - Ensure only completed orders are counted
5. **Test Sorting** - Verify data is sorted correctly
6. **Isolate Tests** - Each test should be independent

