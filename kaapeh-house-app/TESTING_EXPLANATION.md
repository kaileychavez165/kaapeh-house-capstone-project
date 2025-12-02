# Admin Dashboard Testing Explanation

## Overview
The tests I created verify that the **Admin Dashboard** (AdminHome screen) works correctly. The dashboard shows business metrics to admins, so we need to ensure the calculations and display are accurate.

---

## What We're Testing

### 1. **Dashboard Service Tests** (Unit Tests)
**File:** `src/services/__tests__/dashboardService.test.ts`

These tests verify the **business logic** that calculates dashboard metrics:

#### ✅ Today's Metrics Calculation
- **What it tests:** The function that calculates today's sales, order count, and average per order
- **Why it matters:** Admins need accurate daily revenue numbers
- **What we verify:**
  - Correctly sums up all order totals for today
  - Counts the number of orders correctly
  - Calculates average per order (total sales ÷ number of orders)
  - **Only counts completed orders** (not pending/cancelled)
  - Handles edge cases (no orders = $0, 0 orders)

#### ✅ Weekly Sales Data
- **What it tests:** Aggregates sales for the last 7 days
- **Why it matters:** Shows trends over the week
- **What we verify:**
  - Fetches sales for each of the last 7 days
  - Handles errors gracefully (if one day fails, continues with others)
  - Returns data in correct format (day name, sales amount, date)

#### ✅ Top Items Today
- **What it tests:** Ranks the most popular items sold today
- **Why it matters:** Admins need to know what's selling best
- **What we verify:**
  - Aggregates quantities by menu item
  - Sorts items by quantity sold (highest first)
  - Limits results to top 3 (or specified limit)
  - Handles empty data (no orders = empty array)
  - Only counts items from **completed orders**

#### ✅ Error Handling
- **What it tests:** What happens when database queries fail
- **Why it matters:** App shouldn't crash if database is down
- **What we verify:**
  - Errors are properly caught and thrown
  - Error messages are meaningful

---

### 2. **Dashboard Hooks Tests** (Integration Tests)
**File:** `src/hooks/__tests__/useDashboardQueries.test.ts`

These tests verify the **React Query integration** - how data flows from the service to the component:

#### ✅ Data Fetching
- **What it tests:** The hooks that fetch dashboard data
- **Why it matters:** Ensures React Query is properly configured
- **What we verify:**
  - `useDashboardData()` successfully fetches all dashboard data
  - `useTodaysMetrics()` fetches today's metrics
  - `useWeeklySales()` fetches weekly data
  - `useTopItemsToday()` fetches top items with correct limit

#### ✅ Loading & Error States
- **What it tests:** How hooks handle loading and errors
- **Why it matters:** UI needs to show loading spinners and error messages
- **What we verify:**
  - Loading state is properly tracked
  - Errors are caught and exposed to components

---

### 3. **AdminHome Component Tests** (Component/Integration Tests)
**File:** `src/navigation/screens/__tests__/AdminHome.test.tsx`

These tests verify the **UI and user experience** of the admin dashboard:

#### ✅ Loading State
- **What it tests:** Shows a loading spinner while data is being fetched
- **Why it matters:** Users need feedback that something is happening
- **What we verify:**
  - "Loading dashboard data..." text appears
  - Loading indicator is displayed

#### ✅ Error State
- **What it tests:** Shows error message when data fetch fails
- **Why it matters:** Users need to know when something went wrong
- **What we verify:**
  - Error message is displayed
  - Error details are shown to the user

#### ✅ Dashboard Metrics Display
- **What it tests:** Today's sales, orders, and average are displayed correctly
- **Why it matters:** Admins rely on these numbers for business decisions
- **What we verify:**
  - "Today's Sales" shows correct amount (e.g., "$150.75")
  - "Orders Today" shows correct count (e.g., "10")
  - "Avg. Per Order" shows correct average (e.g., "$15.08")
  - Currency is formatted correctly ($XX.XX)

#### ✅ Weekly Sales Chart
- **What it tests:** The bar chart displays weekly sales data
- **Why it matters:** Visual representation helps admins see trends
- **What we verify:**
  - Chart title "Weekly Sales" appears
  - Data is sorted correctly (highest to lowest sales)
  - All day labels are displayed (Mon, Tue, Wed, etc.)

#### ✅ Top Items List
- **What it tests:** The list of top-selling items displays correctly
- **Why it matters:** Admins need to know what's popular
- **What we verify:**
  - "Top Items Today" title appears
  - Item names are displayed (e.g., "Caffe Mocha")
  - Quantities are shown (e.g., "12 sold")
  - Items are ranked correctly (1, 2, 3)

#### ✅ Sign Out Functionality
- **What it tests:** Admin can sign out of the app
- **Why it matters:** Security - admins need to log out
- **What we verify:**
  - Sign out button is clickable
  - Supabase signOut function is called when clicked

#### ✅ Empty States
- **What it tests:** What shows when there's no data
- **Why it matters:** Better UX than showing blank screens
- **What we verify:**
  - "No sales data available" message appears
  - "No items sold today" message appears

---

## Why These Tests Matter

### For Business Logic (Service Tests)
- **Accuracy:** Ensures calculations are correct (wrong numbers = bad business decisions)
- **Data Integrity:** Only counts completed orders (not pending/cancelled)
- **Reliability:** Handles errors gracefully without crashing

### For Data Flow (Hook Tests)
- **Integration:** Ensures React Query works with our services
- **State Management:** Verifies loading/error states are tracked correctly

### For User Experience (Component Tests)
- **Visual Feedback:** Users see loading states and error messages
- **Data Display:** Numbers and charts render correctly
- **Interactions:** Buttons and navigation work as expected

---

## Real-World Scenarios These Tests Cover

1. **Admin opens dashboard on Monday morning**
   - Tests verify: Shows $0 if no orders yet, handles empty state

2. **Admin views dashboard after a busy day**
   - Tests verify: Today's sales, orders, and average are calculated correctly

3. **Database connection fails**
   - Tests verify: Error message is shown, app doesn't crash

4. **Admin wants to see what's selling best**
   - Tests verify: Top items are ranked correctly by quantity sold

5. **Admin views weekly trends**
   - Tests verify: Chart shows last 7 days sorted by sales amount

6. **Admin signs out**
   - Tests verify: Sign out button works correctly

---

## What These Tests DON'T Cover (Future Testing)

- **OrdersHub screen** (managing orders)
- **CustomerPortal screen** (customer management)
- **Menu management** (adding/editing menu items)
- **Order status updates** (changing order status)
- **Real-time updates** (when new orders come in)

These can be added later as you expand admin features!

