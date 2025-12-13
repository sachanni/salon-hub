# ML Analytics Dashboard - Implementation Specification

> **Status:** Implementation Complete
> 
> **Last Updated:** December 13, 2025
> 
> **Feature Type:** Premium (Professional/Enterprise/Premium tiers only)

---

## Overview

The ML Analytics Dashboard provides salon owners with insights into the prediction accuracy and performance patterns of the Smart Departure Notification System. This dashboard visualizes machine learning data to help salons understand how well the system predicts departure times and identifies patterns in staff performance and service timing.

## Business Value

| Stakeholder | Benefit |
|-------------|---------|
| **Salon Owners** | Understand prediction accuracy, identify slow/fast staff, optimize scheduling |
| **Staff Managers** | See performance patterns, identify training needs, balance workloads |
| **Platform** | Premium feature differentiator, data-driven value proposition |

---

## Dashboard Components

### 1. Overview KPI Cards

Display key metrics at a glance:

| KPI | Description | Calculation |
|-----|-------------|-------------|
| Prediction Accuracy | Overall accuracy percentage | Avg of (1 - abs(predicted - actual) / predicted) |
| Total Predictions | Count of predictions made | Count from prediction_accuracy_logs |
| Active Staff Tracked | Staff with performance data | Count from staff_performance_patterns |
| Avg Service Overrun | Average minutes services run over | Avg from service_timing_analytics |

### 2. Prediction Accuracy Chart

**Chart Type:** Line chart with confidence band (area)

**Data Points:**
- X-axis: Date (daily or weekly)
- Y-axis: Accuracy percentage (0-100%)
- Target line: 85% accuracy goal
- Confidence band: Upper/lower accuracy bounds

**Features:**
- Hover tooltips with exact values
- Threshold markers at 80% (warning) and 90% (excellent)
- Date range selector (7d, 30d, 90d)

### 3. Staff Performance Panel

**Chart Type:** Multi-line chart + Sortable table

**Visualization:**
- Line chart showing speed factor trends over time
- Each line represents a staff member
- Speed factor: 1.0 = average, <1.0 = faster, >1.0 = slower

**Table Columns:**
| Column | Description |
|--------|-------------|
| Staff Name | Staff member name |
| Speed Factor | Current speed factor (avg of last 7 days) |
| Consistency Score | How consistent their timing is (lower = more consistent) |
| Total Services | Number of services completed |
| Trend | Arrow indicator (improving/declining) |

### 4. Service Timing Heatmap

**Chart Type:** Heatmap matrix

**Axes:**
- X-axis: Hour of day (9am - 9pm)
- Y-axis: Day of week (Mon - Sun)

**Color Scale:**
- Blue (cool): Services running under estimated time
- White/neutral: On-time services
- Orange/red (warm): Services running over estimated time

**Interactions:**
- Click cell to see detailed breakdown
- Tooltip with avg overrun minutes and sample count

### 5. Service Type Trends

**Chart Type:** Bar chart with tabs

**Data:**
- Grouped by service type/category
- Shows avg duration deviation from estimate
- Identifies services that consistently run over/under

---

## Technical Architecture

### Database Tables Used

```typescript
// Pre-aggregated analytics data (populated by nightly jobs)
service_timing_analytics    // Service timing patterns by day/hour
staff_performance_patterns  // Staff-specific speed factors
prediction_accuracy_logs    // Track prediction accuracy
customer_timing_preferences // Personalized buffer data
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/premium-analytics/dashboard/overview` | GET | KPIs and data freshness |
| `/api/premium-analytics/predictions/accuracy` | GET | Accuracy trend data |
| `/api/premium-analytics/staff/performance` | GET | Staff performance data |
| `/api/premium-analytics/services/timing-trends` | GET | Service timing trends |

**Query Parameters (all endpoints):**
- `salonId` (required): Salon ID
- `startDate` (optional): Start of date range (ISO 8601)
- `endDate` (optional): End of date range (ISO 8601)
- `staffId` (optional): Filter by specific staff
- `serviceId` (optional): Filter by specific service

**Response Format:**
```typescript
interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  meta: {
    salonId: string;
    dateRange: { start: string; end: string };
    dataFreshness: string; // ISO timestamp of last aggregation
    sampleCount: number;
  };
}
```

### Security & Authorization

1. **Authentication:** JWT token required (existing middleware)
2. **Premium Tier Check:** Verify salon has premium/enterprise/professional subscription
3. **Salon Ownership:** Verify user has access to requested salonId
4. **Rate Limiting:** 100 requests/minute per salon

### Frontend Components

```
client/src/components/business-dashboard/ml-analytics/
├── MLAnalyticsDashboard.tsx        # Main container
├── OverviewKPICards.tsx            # KPI cards with icons
├── PredictionAccuracyChart.tsx     # Line chart with confidence bands
├── StaffPerformancePanel.tsx       # Line chart + table
├── ServiceTimingHeatmap.tsx        # Day/Hour heatmap
├── ServiceTypeTrends.tsx           # Bar chart by service
├── DateRangeSelector.tsx           # Date range filter
├── DataFreshnessBadge.tsx          # Last updated indicator
└── hooks/
    └── useMLAnalytics.ts           # TanStack Query hooks
```

---

## Data Visualization Guidelines

### Color Palette (WCAG Accessible)

| Usage | Color | Hex |
|-------|-------|-----|
| Primary/Positive | Blue | #3B82F6 |
| Secondary | Purple | #8B5CF6 |
| Warning | Amber | #F59E0B |
| Negative | Orange | #F97316 |
| Neutral | Gray | #6B7280 |
| Success | Emerald | #10B981 |

### Chart Best Practices

1. **Line Charts:**
   - Smooth curves for trends
   - Distinct colors for each series
   - Interactive tooltips
   - Axis labels and legends

2. **Heatmaps:**
   - Diverging color scale (blue-white-orange)
   - Clear cell boundaries
   - Hover state with details
   - Color legend

3. **Bar Charts:**
   - Horizontal for long labels
   - Sorted by value (descending)
   - Reference lines for benchmarks

4. **Tables:**
   - Sortable columns
   - Pagination for large datasets
   - Row hover highlighting
   - Trend indicators (arrows/colors)

---

## Implementation Checklist

### Phase 1: Backend ✅
- [x] Create `MLAnalyticsService` with aggregation queries
- [x] Add database indexes for analytics performance
- [x] Create premium tier middleware
- [x] Implement `/api/premium-analytics/dashboard/overview` endpoint
- [x] Implement `/api/premium-analytics/predictions/accuracy` endpoint
- [x] Implement `/api/premium-analytics/staff/performance` endpoint
- [x] Implement `/api/premium-analytics/services/timing-trends` endpoint

### Phase 2: Frontend - Core ✅
- [x] Create `MLAnalyticsDashboard` page scaffold
- [x] Create `useMLAnalytics` hook with TanStack Query
- [x] Implement `DateRangeSelector` component
- [x] Implement `DataFreshnessBadge` component
- [x] Implement `OverviewKPICards` component

### Phase 3: Frontend - Charts ✅
- [x] Implement `PredictionAccuracyChart` (line + area)
- [x] Implement `StaffPerformancePanel` (chart + table)
- [x] Implement `ServiceTimingHeatmap`
- [ ] Implement `ServiceTypeTrends` (deferred - data included in heatmap endpoint)

### Phase 4: Polish ✅
- [x] Add loading skeletons
- [x] Add error boundaries (premium upgrade prompt)
- [x] Mobile responsive layout
- [x] Auto-refresh (60s polling via staleTime)
- [x] Update parent documentation

---

## Sample Data Structures

### Overview KPIs Response
```json
{
  "success": true,
  "data": {
    "predictionAccuracy": 87.5,
    "totalPredictions": 1250,
    "activeStaffTracked": 8,
    "avgServiceOverrun": 4.2,
    "trendsVsLastPeriod": {
      "accuracy": 2.3,
      "predictions": 15,
      "overrun": -0.8
    }
  },
  "meta": {
    "salonId": "salon-123",
    "dateRange": { "start": "2025-12-06", "end": "2025-12-13" },
    "dataFreshness": "2025-12-13T03:00:00Z",
    "sampleCount": 1250
  }
}
```

### Prediction Accuracy Response
```json
{
  "success": true,
  "data": {
    "trend": [
      { "date": "2025-12-07", "accuracy": 85.2, "confidence": 0.82, "samples": 45 },
      { "date": "2025-12-08", "accuracy": 88.1, "confidence": 0.85, "samples": 52 },
      { "date": "2025-12-09", "accuracy": 86.7, "confidence": 0.84, "samples": 48 }
    ],
    "summary": {
      "avgAccuracy": 86.7,
      "minAccuracy": 82.1,
      "maxAccuracy": 91.3,
      "targetAccuracy": 85.0
    }
  }
}
```

### Staff Performance Response
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "staffId": "staff-1",
        "name": "Priya Sharma",
        "speedFactor": 0.92,
        "consistencyScore": 0.15,
        "totalServices": 156,
        "trend": "improving",
        "history": [
          { "date": "2025-12-07", "speedFactor": 0.95 },
          { "date": "2025-12-08", "speedFactor": 0.93 },
          { "date": "2025-12-09", "speedFactor": 0.92 }
        ]
      }
    ]
  }
}
```

### Service Timing Heatmap Response
```json
{
  "success": true,
  "data": {
    "heatmap": [
      { "dayOfWeek": 1, "hourOfDay": 9, "avgOverrun": -2.5, "samples": 12 },
      { "dayOfWeek": 1, "hourOfDay": 10, "avgOverrun": 1.2, "samples": 18 },
      { "dayOfWeek": 1, "hourOfDay": 11, "avgOverrun": 3.8, "samples": 22 }
    ],
    "summary": {
      "busiestDay": 6,
      "busiestHour": 11,
      "calmestDay": 2,
      "calmestHour": 15
    }
  }
}
```

---

## Related Documentation

- [Smart Departure Notification System](./smart-departure-notification.md)
- [ML Prediction Service](../technical/ml-prediction-service.md) (if exists)

---

*Document Version: 1.0*
*Created: December 2025*
*Author: StudioHub Development Team*
