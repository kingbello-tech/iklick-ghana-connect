

# Recreate vidiq.com Layout & Animation Style for iKlick

## What vidiq.com does (adapted for iKlick)

vidiq.com follows this structure:
1. **Sticky navbar** -- logo, nav links, CTA button (dark bg, clean)
2. **Hero section** -- trust badge, big headline, subtitle, CTA button, scrolling creator avatars with stats
3. **Brand logos** -- horizontal auto-scrolling row of partner/client logos
4. **Feature tabs section** -- "One App for Everything" with tabbed content showing product screenshots
5. **Social proof / testimonials** -- scrolling cards with growth stories
6. **Pricing** -- 3-tier cards
7. **Footer**

## Plan for iKlick (mapping vidiq sections to ISP context)

### 1. Redesign Hero Section (keep 3D metropolis but add vidiq-style content overlay)
- Add a **trust badge** at top: "Trusted by 100+ Businesses in Ghana" with a star icon
- Add **big headline**: "Reliable High-Speed Internet for Ghana"
- Add **subtitle**: "Seamless fiber connectivity for businesses and homes with 98.5% uptime"
- Add **CTA button**: "Get Connected" (gradient style)
- Below the CTA, add a **horizontally scrolling row of client stats** (similar to vidiq's creator avatars) showing key clients with connection stats (e.g., "Connected Since 2022", "99.9% Uptime")
- The 3D metropolis remains as the background but content overlays on top with subtle glassmorphism
- Content fades out as user scrolls and metropolis zoom takes over

### 2. Redesign Clients Section (vidiq brand logo strip style)
- Two rows: first row scrolls left, second row scrolls right (like vidiq)
- Logos displayed in a clean, minimal style without cards/borders
- Grayscale logos that brighten on hover
- Seamless infinite scroll animation

### 3. Add Feature Tabs Section (new component -- "One Platform for All Connectivity")
- Tabbed interface with icons: "Enterprise", "Residential", "VoIP", "Managed IT"
- Each tab shows a styled feature card with description, benefits, and a mock UI screenshot area
- Replace the current separate EnterpriseServices and ResidentialServices with this unified tabbed view
- Smooth fade transitions between tabs

### 4. Redesign Testimonials / Social Proof Section (new component)
- Auto-scrolling horizontal cards (two rows, opposite directions like vidiq)
- Each card: client name, company, quote, and a stat (e.g., "60% cost savings")
- Glassmorphism card style

### 5. Redesign Pricing Section (vidiq 3-column style)
- 3 main tiers displayed (combine current 4 into 3 prominent ones + a "Contact for Custom" option)
- Highlight middle tier as "Most Popular"
- Clean card design matching vidiq's dark style with gradient accents

### 6. Redesign Footer (expanded, vidiq-style)
- Multi-column layout: Company info, Services links, Support links, Contact info
- Social media icons
- Bottom bar with copyright and legal links

### 7. Add Scroll-Based Animations
- Intersection Observer-based fade-in-up animations on all sections
- Staggered delays for grid items
- Smooth section transitions

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/Hero.tsx` | Redesign with trust badge, headline, CTA, scrolling client stats overlay on 3D scene |
| `src/components/Clients.tsx` | Two-row auto-scroll, grayscale logos, no card borders |
| `src/components/FeatureTabs.tsx` | **New** -- tabbed services section replacing Enterprise + Residential |
| `src/components/Testimonials.tsx` | **New** -- scrolling social proof cards |
| `src/components/Pricing.tsx` | Redesign to 3-tier vidiq-style layout |
| `src/components/Footer.tsx` | Expand to multi-column layout |
| `src/components/Navbar.tsx` | Minor refinements for vidiq-style spacing |
| `src/components/Contact.tsx` | Integrate as CTA banner instead of separate section |
| `src/pages/Home.tsx` | Update section order and component imports |
| `src/index.css` | Add new animation utilities for scroll and hover effects |
| `tailwind.config.ts` | Add scroll-reverse animation keyframe |

### Section Order (final page flow)
1. Navbar (sticky, appears after hero scroll)
2. Hero (3D metropolis + vidiq-style headline/CTA overlay)
3. Clients (dual-row scrolling logos)
4. Value Propositions (keep existing, minor style tweaks)
5. Feature Tabs (unified services section)
6. Support (keep existing)
7. Testimonials (new social proof)
8. Pricing (redesigned 3-tier)
9. Contact (CTA banner style)
10. Footer (expanded)

