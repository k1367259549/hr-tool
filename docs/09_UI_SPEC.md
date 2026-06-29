# 09_UI_SPEC.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines the complete UI/UX specification for HR Daily AI V1.

It describes:

- Page structure
- Layout rules
- Component behavior
- Interaction flows
- UI constraints

All UI implementations MUST strictly follow this specification.

---

# 2. UI Design Principles

## 2.1 Simplicity First

- Minimal UI complexity
- No unnecessary animations
- Fast interaction > visual complexity

---

## 2.2 Data-First Design

UI is designed around structured data:

- Logs
- KPIs
- AI outputs
- Plans
- Knowledge entries

---

## 2.3 Feature-Based UI

Each module is independent:

- Log UI
- Dashboard UI
- Review UI
- Planner UI
- Knowledge UI

---

# 3. Global Layout

## 3.1 App Shell

```text
+--------------------------------------------------+
| Sidebar | Main Content Area                      |
|         |                                        |
|         |                                        |
|         |                                        |
+--------------------------------------------------+
```

## 3.2 Sidebar Structure

- Daily Log
- Dashboard
- AI Review
- Tomorrow Planner
- Knowledge Base

Rules:

- Always visible
- Fixed width
- Minimal icons + labels

## 3.3 Main Content Area

- Page-specific content
- Scrollable
- No global state inside UI

---

# 4. Page Specifications

## 4.1 Daily Log Page

Purpose:

Input and manage daily recruiting data.

Layout:

```text
[ Date Selector ]
[ Position Input ]

[ KPI Cards Row ]
- Resume Count
- Screen Count
- Phone Count
- Interview Count
- Offer Count
- Entry Count

[ Text Areas ]
- Summary
- Problems
- Reflection

[ Save Button ]
```

Interactions:

- Auto-save every 30 seconds
- Manual save button
- Editable fields
- Save state indicator

Validation:

- Numeric fields >= 0
- Date required
- One log per date

## 4.2 Dashboard Page

Purpose:

Display KPI overview and trends.

Layout:

```text
[ KPI Summary Cards ]

[ Trend Chart ]

[ Funnel View ]

[ Weekly / Monthly Switch ]
```

Components:

- KPI cards
- Simple line chart
- Funnel visualization (resume -> interview -> offer -> entry)
- Date range switch

## 4.3 AI Review Page

Purpose:

Display AI-generated analysis.

Layout:

```text
[ Generate Button ]

[ Score Card ]

[ Summary Section ]

[ Strengths ]

[ Weaknesses ]

[ Suggestions ]
```

Interactions:

- Click "Generate Review"
- Loading state required
- Cached result displayed if exists
- Retry available on AI failure

Display rules:

- Strengths, weaknesses, and suggestions must render as structured lists
- Score must be visually prominent
- Raw AI trace fields must not be exposed in normal UI

## 4.4 Tomorrow Planner Page

Purpose:

Display AI-generated next-day plan.

Layout:

```text
[ Generate Plan Button ]

[ Priority Summary ]

[ Schedule ]
- Morning
- Afternoon
- Evening

[ Priority Tasks ]

[ Goals ]

[ Risks ]

[ Expected Outcomes ]
```

Interactions:

- Regenerate plan allowed
- Tasks are read-only in V1
- Loading state required
- Retry available on AI failure

Display rules:

- Schedule must group tasks by morning, afternoon, and evening
- Priority must use LOW / MEDIUM / HIGH badges
- Risks must be visually separated from goals and expected outcomes

## 4.5 Knowledge Base Page

Purpose:

Manage structured knowledge entries.

Layout:

```text
[ Filter Bar ]
- Type Filter
- Tag Filter

[ Knowledge List ]

[ Create Button ]
```

Knowledge item layout:

- Title
- Type
- Tags
- Content Preview

Interactions:

- Filter by type
- Filter by tag
- Create knowledge entry
- Edit user-created knowledge entry
- Delete knowledge entry

Rules:

- AI-generated knowledge must preserve AI trace fields
- AI trace fields are not displayed in the standard list view

---

# 5. UI Components Library

## 5.1 Required Components

- Button
- Card
- Input
- Textarea
- Modal
- Table
- Badge
- Toast

## 5.2 Component Rules

- Use shadcn/ui only
- No custom UI framework
- No inline styles
- Tailwind only
- No business logic in UI components
- No direct Prisma access from UI
- No direct AI provider calls from UI

---

# 6. Interaction Rules

## 6.1 Loading States

Required for:

- AI generation
- Data fetching
- Save operations

## 6.2 Empty States

Each page must handle:

- No logs available
- No AI review generated
- No plan generated
- No knowledge entries

## 6.3 Error States

Must display:

- Friendly error message
- Retry button (for AI operations)
- No raw internal error messages

---

# 7. Responsive Design

V1 scope:

- Desktop-first
- Basic mobile compatibility only

No advanced responsive redesign required.

---

# 8. Data Display Rules

- All numbers must be formatted
- Dates must be human-readable
- AI outputs must be clearly separated into sections
- AI output arrays must render as lists
- JSON/raw AI output must not be shown in normal UI

---

# 9. Navigation Rules

- Sidebar is primary navigation
- No nested routing complexity in V1
- Each module is a top-level page

---

# 10. Performance Rules

- Page load < 2 seconds
- No blocking UI rendering
- AI calls must not freeze UI
- UI should remain usable while AI generation is running

---

# 11. Out of Scope (V1)

- Drag and drop dashboards
- Real-time collaboration
- Mobile native app
- Advanced charting libraries (Recharts only if needed)
- Custom design system
- Theme builder

---

# 12. Summary

This UI specification ensures:

- Consistent structure
- Minimal UI complexity
- Fast development with Codex
- Clear mapping between UI and data models
- Predictable user flows
