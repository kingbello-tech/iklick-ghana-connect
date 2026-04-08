

## Add a Projects Page

### Overview
Create a dedicated `/projects` page showcasing three project categories: Community WiFi, Fiber to the Home (FTTH), and University Hostel WiFi. The page will feature a hero banner, filterable project cards with hover animations, and individual project detail sections with compelling visuals.

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/Projects.tsx` | **Create** -- Full projects page |
| `src/components/Navbar.tsx` | **Edit** -- Add "Projects" nav link pointing to `/projects` |
| `src/App.tsx` | **Edit** -- Add `/projects` route |

### Page Structure

1. **Page Hero Banner** -- Gradient background with headline "Our Projects", subtitle about delivering connectivity across Ghana, fade-in animation

2. **Filter Tabs** -- Three pill-style filter buttons: "All", "Community WiFi", "FTTH", "University WiFi" with active state styling

3. **Project Cards Grid** -- 3-column responsive grid (1 col mobile, 2 col tablet, 3 col desktop). Each card includes:
   - Gradient placeholder image area with project-type icon overlay
   - Project title, location, description
   - Key stats (e.g., "500+ homes connected", "99.9% uptime")
   - Hover effect: scale-up, glow border, reveal "Learn More" button
   - Staggered fade-in-up entrance animations using Intersection Observer

4. **Featured Project Sections** -- Three detailed sections (one per category) with alternating left/right image-text layouts:
   - **Community WiFi**: Public hotspots connecting underserved communities
   - **Fiber to the Home**: Residential fiber rollouts in neighborhoods
   - **University Hostel WiFi**: Campus-wide high-speed wireless for student hostels
   - Each section has animated stat counters and descriptive text

5. **CTA Banner** -- "Have a project in mind?" with mailto link to sales@iklickgh.com

### Navigation
- Add "Projects" link to navbar between "Services" and "Support"
- Use React Router `Link` component for SPA navigation (not anchor hash)
- Navbar will use `useLocation` to detect route and render links accordingly

### Animations & Transitions
- Cards: `animate-fade-in-up` with staggered delays, `hover:scale-105` with `transition-all duration-300`
- Filter tabs: smooth active-state transition with sliding indicator
- Section text: fade-in on scroll via Intersection Observer
- Stats: count-up animation on visibility

### Technical Details
- Navbar links will use a mix of React Router `Link` (for `/projects`) and anchor tags (for `#services`, `#support`, `#contact`) 
- Project data stored as a typed array within the component
- Filter state managed with `useState`
- Scroll animations via `useEffect` + `IntersectionObserver`

