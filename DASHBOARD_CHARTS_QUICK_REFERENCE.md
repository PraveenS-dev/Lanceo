# Dashboard Charts Quick Reference

## Three Main Charts on Dashboard

### 1. Bar Chart (Month-Wise Projects)
- **Purpose:** Shows project distribution across 12 months
- **Filter:** Year selector
- **Data:** Monthly project counts
- **Location:** Top of dashboard

### 2. Pie Chart (Bittings Statistics)
- **Purpose:** Shows bittings breakdown by status
- **Statuses:**
  - 🟨 Pending (Yellow)
  - 🟩 Accepted (Green)
  - 🟥 Rejected (Red)
- **Role-Based:** Admin sees all, Freelancer sees own, Client sees theirs
- **Refresh Button:** "Refresh Bittings"
- **Location:** Middle of dashboard

### 3. Pie Chart (Contracts Statistics)
- **Purpose:** Shows contracts breakdown by status
- **Statuses:**
  - 🟨 Payment Pending (Yellow)
  - 🟦 Working (Blue)
  - 🟧 Ticket Raised (Orange)
  - 🟩 Ticket Closed (Green)
  - 🟪 Submitted (Purple)
  - 🟦 Completed (Teal)
  - 🟥 Re-work Needed (Red)
- **Role-Based:** Admin sees all, Freelancer sees own, Client sees theirs
- **Refresh Button:** "Refresh Contracts"
- **Location:** Bottom of dashboard

## Filter Panel

Located at the top of the dashboard:

```
┌─────────────────────────────────────────────────┐
│ Year: [____] Month: [______] [Refresh B..] [Refresh C..]│
└─────────────────────────────────────────────────┘
```

- **Year Input:** Change year for bar chart
- **Month Dropdown:** Select specific month
- **Refresh Buttons:** Manual refresh for pie charts

## API Endpoints

### Get Bittings Statistics
```
GET /api/dashboard/BittingsStats
Query Parameters: user_id, role
Response: {
  stats: {
    total: number,
    pending: number,
    accepted: number,
    rejected: number,
    breakdown: Array<{status, statusName, count, color}>
  }
}
```

### Get Contracts Statistics
```
GET /api/dashboard/ContractsStats
Query Parameters: user_id, role
Response: {
  stats: {
    total: number,
    paymentPending: number,
    working: number,
    ticketRaised: number,
    ticketClosed: number,
    submitted: number,
    completed: number,
    reworkNeeded: number,
    breakdown: Array<{status, statusName, count, color}>
  }
}
```

## Role-Based Access

| Role | What They See |
|------|---------------|
| Admin (1) | All bittings, contracts, projects |
| Freelancer (2) | Own bittings, contracts where they're involved |
| Client (3) | Bittings, contracts for their projects |

## Frontend Files

### Components
- `frontend-react/src/pages/Dashboard.tsx` - Main dashboard component

### Services
- `frontend-react/src/services/Dashboard.ts` - API service layer

### Interfaces
```typescript
interface BittingsStatsData {
  stats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    breakdown: Array<{status, statusName, count, color}>;
  };
}

interface ContractsStatsData {
  stats: {
    total: number;
    paymentPending: number;
    working: number;
    ticketRaised: number;
    ticketClosed: number;
    submitted: number;
    completed: number;
    reworkNeeded: number;
    breakdown: Array<{status, statusName, count, color}>;
  };
}
```

## Backend Files

### Controllers
- `backend-node/controller/Admin/DashboardController.ts`
  - `MonthWiseProjects()` - Bar chart data
  - `BittingsStats()` - Bittings pie chart data
  - `ContractsStats()` - Contracts pie chart data

### Routes
- `backend-node/routes/DashboardRoutes.ts`
  - GET `/MonthWiseProjects` - Monthly projects
  - GET `/BittingsStats` - Bittings breakdown
  - GET `/ContractsStats` - Contracts breakdown

All routes protected with `authMiddleware` (JWT required)

## Dark Mode

All charts support dark mode automatically:
- Charts change colors based on theme
- Text adjusts for readability
- Backgrounds use dark variants
- Tooltips theme dynamically

## Responsive Design

- **Mobile:** Charts stack vertically, single-column statistics
- **Tablet:** Multi-column grid for statistics cards
- **Desktop:** Charts with side-by-side statistics cards

## Common Tasks

### How to add a new status to Contracts?

1. Add status to `contract_status` enum in `Contracts.ts` model
2. Add status mapping in `ContractsStats` controller
3. Add color to `colorMap` object
4. Update `contractsChartOptions` labels and colors
5. Add statistics card in Dashboard JSX

### How to refresh pie charts manually?

Click the "Refresh Bittings" or "Refresh Contracts" button in the filter panel.

### How to filter by month/year?

- Currently, month/year filter affects only the bar chart
- Pie charts show all-time data (can be extended in future)
- To implement month filtering for pie charts:
  1. Pass `selectedMonth` to `getContractsStats()` and `getBittingsStats()`
  2. Update backend controller to filter by month if provided
  3. Update service functions to send month parameter

## Known Limitations & Future Enhancements

### Current
- Pie charts show all-time statistics (not month-specific)
- Manual refresh required (no auto-refresh on data change)
- No detail view for individual contracts/bittings

### Planned
- [ ] Auto-refresh pie charts when clicking "Apply Filters"
- [ ] Month-specific filtering for pie charts
- [ ] Click status card to see detailed list
- [ ] Status transition timeline
- [ ] Export statistics as CSV/PDF
- [ ] Trend analysis (month-over-month changes)

## Troubleshooting

### Charts not showing data?
1. Check browser console for errors
2. Verify API endpoints in Network tab
3. Check user ID and role are correctly passed
4. Verify user has contracts/bittings data

### Wrong data showing?
1. Check role in user context
2. Verify role matches what backend expects
3. Clear browser cache
4. Check database for actual data

### Dark mode issues?
1. Check ThemeContext is properly imported
2. Verify theme value updates correctly
3. Check dark: classes in Tailwind CSS

## Additional Documentation

- `APEXCHARTS_IMPLEMENTATION.md` - ApexCharts setup and configuration
- `BITTINGS_PIE_CHART_IMPLEMENTATION.md` - Bittings chart details
- `AUTHENTICATION_SETUP.md` - JWT and auth middleware
- `BITTINGS_ARCHITECTURE_DIAGRAM.md` - System architecture
