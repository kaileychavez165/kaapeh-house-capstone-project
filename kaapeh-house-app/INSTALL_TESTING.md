# Installing Testing Dependencies

The TypeScript errors in the test files are because the testing dependencies haven't been installed yet. Follow these steps:

## Step 1: Install Dependencies

Run this command in the `kaapeh-house-app` directory:

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

## Step 2: Verify Installation

After installation, the TypeScript errors should disappear. The test files use `@ts-ignore` comments temporarily to suppress errors until packages are installed.

## Step 3: Run Tests

Once dependencies are installed, you can run:

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage report
```

## What Each Package Does

- **jest**: The testing framework
- **jest-expo**: Expo-specific Jest configuration
- **@testing-library/react-native**: React Native testing utilities
- **@testing-library/jest-native**: Additional Jest matchers for React Native
- **@types/jest**: TypeScript type definitions for Jest

After installation, you can remove the `@ts-ignore` comments from the test files if desired, though they won't cause any issues if left in.

