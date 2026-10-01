# DESIGN.md

> **Purpose:** This document is the visual design authority for this project.
> Any AI agent, designer, or developer working on the interface MUST follow these rules
> unless a deliberate design decision explicitly overrides them.

---

# 01 — Design Philosophy

Design the product as a **distinct visual experience**, not as a rearrangement of
familiar UI components.

The interface should communicate:

- What the product is
- Who it is for
- What makes it different
- What deserves attention
- How the user should move through the experience

### Core principle

> **Do not design from components first. Design from visual identity first.**

Every screen must have a recognizable visual character.

A visitor should be able to remove the logo and still identify the product from its
layout, typography, shapes, imagery, spacing, motion, and graphic language.

### Design priorities

1. Identity
2. Hierarchy
3. Clarity
4. Usability
5. Accessibility
6. Performance
7. Decoration

Decoration must never compensate for weak hierarchy or weak product thinking.

---

# 02 — Anti-Generic Rules

The following patterns are prohibited unless the product genuinely requires them.

## Avoid AI-generated visual clichés

Do NOT automatically use:

- Purple/blue gradient backgrounds
- Giant centered hero text
- Floating glass cards everywhere
- Excessive rounded rectangles
- Generic dashboard cards
- Repeated 3-column feature sections
- Random gradient blobs
- Excessive neon accents
- "Modern SaaS" styling by default
- Inter/Roboto/system font without considering alternatives
- Identical card → icon → heading → paragraph structures
- Excessive use of shadows
- Every section having the same spacing
- Every button being pill-shaped
- Generic stock photography
- Decorative shapes with no conceptual purpose
- Hero sections that occupy most of the viewport without useful content
- Repeated section separators
- Excessive glassmorphism
- Design decisions made only because they are popular

### Never produce "AI website soup"

If a design could plausibly belong to 1,000 unrelated startups,
it is not distinctive enough.

### Repetition test

If the same component structure appears three or more times consecutively,
investigate whether the content can be expressed through a different visual pattern.

---

# 03 — Design Direction Selection

Before designing, choose a deliberate visual direction.

Do NOT randomly combine aesthetics.

Possible directions include:

- Editorial
- Swiss / International
- Brutalist
- Neo-Brutalist
- Minimal
- Industrial
- Technical
- Luxury
- Retro-futurist
- Cybernetic
- Organic
- Playful
- Architectural
- Magazine
- Cinematic
- Monochromatic
- Experimental
- Data-centric
- Product-centric
- Art-directed

The selected direction must match:

- Product purpose
- Target audience
- Brand personality
- Content type
- Interaction model
- Emotional tone

### Direction rule

Select:

**1 primary direction + 1 supporting influence**

Example:

> Editorial + Industrial

Avoid combining five unrelated aesthetics.

### Design signature

Define at least **3 signature characteristics**.

Example:

- Oversized editorial typography
- Asymmetric layouts
- Thin technical linework

These signatures should recur throughout the product without becoming repetitive.

---

# 04 — Layout System

Do not treat layout as a collection of boxes.

Use:

- Asymmetry where useful
- Intentional whitespace
- Controlled density
- Visual rhythm
- Hierarchical scale
- Strong alignment
- Unexpected but understandable compositions

### Layout questions

For every major section ask:

- What is the visual anchor?
- What is the secondary focus?
- Where does the eye enter?
- Where does it travel?
- Where does it exit?
- What information is intentionally quieter?
- What should NOT compete for attention?

### Composition

Prefer meaningful variation such as:

- Full-width sections
- Split compositions
- Offset columns
- Overlapping elements
- Editorial blocks
- Full-bleed imagery
- Dense information zones
- Quiet whitespace zones

Do not make every section look structurally identical.

---

# 05 — Grid System

Establish a grid before placing major elements.

Define:

- Maximum content width
- Column count
- Gutter size
- Page margins
- Section spacing
- Breakpoint behavior

### Grid principle

The grid should create **order without making every section visually identical**.

Elements may intentionally break the grid when the design benefits from it.

Examples:

- Oversized heading extending beyond a column
- Image crossing multiple columns
- Graphic aligned to the viewport instead of content
- Pull quote offset from the main text
- Decorative line crossing grid boundaries

Grid-breaking must look intentional, not broken.

---

# 06 — Typography

Typography is a primary design element.

Do not select fonts after the layout is finished.

Define:

- Display typeface
- Body typeface
- Optional utility/mono typeface
- Font weights
- Scale
- Line heights
- Letter spacing
- Text measure

### Typography hierarchy

Create a meaningful scale:

- Display
- H1
- H2
- H3
- Lead
- Body
- Small
- Caption
- Label
- Metadata

Do not rely solely on font size.

Hierarchy can also come from:

- Weight
- Width
- Case
- Tracking
- Color
- Position
- Spacing
- Typeface contrast

### Typography rule

At least one typographic decision should contribute strongly to the project's identity.

---

# 07 — Color

Create a restrained color system.

Define:

- Background
- Surface
- Primary text
- Secondary text
- Border
- Primary accent
- Secondary accent
- Semantic colors

### Color principle

Do not add colors simply to make the interface feel "designed."

Every major color should have a role.

### Contrast

Ensure sufficient contrast for:

- Body text
- Buttons
- Form controls
- Interactive states
- Important metadata

Avoid relying on color alone to communicate meaning.

---

# 08 — Shape Language

Choose a consistent geometric language.

Possible characteristics:

- Sharp
- Slightly rounded
- Highly rounded
- Circular
- Angular
- Organic
- Technical
- Irregular

Define:

- Border radius scale
- Border thickness
- Corner treatment
- Button shape
- Card shape
- Image treatment

### Shape consistency

Do not mix:

> sharp technical containers + playful bubbles + excessive pill controls

unless the contrast is intentional and part of the concept.

---

# 09 — Imagery

Images must support the visual narrative.

Prefer:

- Original product imagery
- Art-directed photography
- Purposeful screenshots
- Diagrams
- Illustrations
- Textures
- Abstract compositions
- Data visualizations

Avoid generic stock imagery whenever possible.

### Image treatment

Define:

- Aspect ratios
- Cropping
- Radius
- Border
- Overlay behavior
- Caption treatment
- Interaction behavior

Images should feel like part of the design system rather than inserted assets.

---

# 10 — Graphic Elements

Graphic elements may include:

- Lines
- Rules
- Grids
- Coordinates
- Labels
- Technical annotations
- Numbers
- Patterns
- Textures
- Symbols
- Icons
- Abstract geometry

### Rule

Every decorative element must answer:

> "Why does this exist?"

If the answer is only "to make the page look cooler,"
remove it or redesign it.

---

# 11 — Components

Components must inherit the project's visual language.

Define intentionally:

- Navigation
- Buttons
- Links
- Cards
- Inputs
- Selects
- Tabs
- Tables
- Modals
- Tooltips
- Alerts
- Badges
- Pagination
- Empty states
- Loading states

### Component rule

A component should have:

- Default state
- Hover state
- Focus state
- Active state
- Disabled state
- Loading state
- Error state where relevant

Do not create components solely for visual reuse.

Create components when they represent a meaningful interaction or visual pattern.

---

# 12 — Motion

Motion should communicate rather than decorate.

Use motion for:

- Spatial relationships
- State changes
- Feedback
- Hierarchy
- Orientation
- Continuity

### Motion principles

Prefer:

- Short purposeful transitions
- Natural easing
- Subtle movement
- Staggered reveals where useful
- Meaningful transformations

Avoid:

- Animation on everything
- Constant floating effects
- Excessive parallax
- Slow decorative entrances
- Scroll hijacking
- Motion that delays user interaction

### Motion rule

If removing an animation does not reduce understanding, feedback,
or visual character, question whether it needs to exist.

---

# 13 — Micro-interactions

Micro-interactions should make the interface feel responsive.

Examples:

- Button press feedback
- Input validation
- Copy confirmation
- Toggle transitions
- Navigation state changes
- Loading feedback
- Hover transformations
- Drag feedback

Micro-interactions should feel:

- Immediate
- Predictable
- Consistent
- Proportional

Never make a micro-interaction more noticeable than the action itself.

---

# 14 — Responsive Art Direction

Responsive design is NOT:

> Desktop → shrink everything → mobile.

Treat each breakpoint as a composition problem.

Consider:

- Typography scale
- Grid transformation
- Navigation model
- Image cropping
- Content order
- Density
- Touch targets
- Whitespace
- Visual anchors

### Breakpoint principle

A mobile layout may use a different composition from desktop.

It is acceptable to:

- Change visual ordering
- Replace navigation patterns
- Change image ratios
- Simplify decorative graphics
- Remove secondary information
- Convert grids into editorial stacks

Preserve the design identity, not the exact geometry.

---

# 15 — Accessibility

Accessibility is part of the design system.

Ensure:

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Proper heading hierarchy
- Accessible labels
- Sufficient contrast
- Meaningful alt text
- Reduced-motion support
- Adequate touch targets
- Clear error messaging

### Never

Use visual styling that makes an inaccessible interaction appear acceptable.

Design should work for:

- Keyboard users
- Screen-reader users
- Touch users
- Low-vision users
- Users with reduced motion preferences

---

# 16 — Content Hierarchy

Content determines visual hierarchy.

For every screen define:

### Primary
What must the user notice first?

### Secondary
What supports the primary message?

### Tertiary
What can be discovered after the main interaction?

### Utility
What exists for users who need it?

Do not give every element equal visual weight.

### Content rule

Do not solve unclear content with visual decoration.

If the message is unclear, improve the content hierarchy first.

---

# 17 — Visual Consistency

Consistency does NOT mean repetition.

Maintain consistency in:

- Typography
- Spacing logic
- Color roles
- Interaction behavior
- Icon treatment
- Border language
- Motion behavior
- Component states

Allow variation in:

- Composition
- Section structure
- Image treatment
- Density
- Alignment
- Scale
- Visual rhythm

### Principle

> **Consistent rules + varied compositions = distinctive system.**

---

# 18 — Anti-Repetition Engine

Before approving a page, inspect every section.

Track:

- Layout pattern
- Alignment pattern
- Card structure
- Heading treatment
- Image treatment
- CTA placement
- Decorative treatment
- Section height
- Density

### Variation matrix

Do not repeatedly use:

| Pattern | Alternative |
|---|---|
| 3 cards | Editorial list |
| Centered hero | Split hero |
| Card grid | Horizontal sequence |
| Icon + text | Image + annotation |
| Repeated columns | Asymmetric composition |
| Rounded cards | Open layout |
| Full-width text | Offset text |
| Button row | Inline action |
| Large image | Detail crop |
| Standard section | Full-bleed composition |

### Anti-repetition rule

Two consecutive sections should not feel like the same composition
with different content.

Three consecutive sections using the same structure are prohibited
unless the repeated structure is itself the deliberate visual concept.

---

# 19 — Design Process

Follow this process before implementation.

## Phase 1 — Understand

Identify:

- Product
- Audience
- Goal
- Content
- Brand personality
- Primary user actions
- Technical constraints

## Phase 2 — Define

Create:

- Design direction
- Design signatures
- Typography system
- Color system
- Shape language
- Grid
- Spacing rhythm
- Motion language

## Phase 3 — Compose

Design:

1. Primary screen
2. Core interaction
3. Secondary screens
4. Edge states
5. Responsive versions

## Phase 4 — Challenge

Ask:

- Does this look generic?
- Does it resemble a common template?
- Is every section necessary?
- Is anything repeated unnecessarily?
- Is the hierarchy obvious?
- Does the visual identity survive without the logo?
- Are decorative elements meaningful?

## Phase 5 — Refine

Improve:

- Spacing
- Typography
- Alignment
- Contrast
- Interaction states
- Motion
- Responsive behavior
- Accessibility

## Phase 6 — Implement

Only after the visual rules are established.

Do not allow implementation constraints to accidentally define
the entire visual identity.

---

# 20 — Final Design Audit

Before considering the design complete, run this audit.

## Identity

- [ ] Does the interface have a recognizable visual identity?
- [ ] Are there at least 3 intentional design signatures?
- [ ] Does the design avoid generic SaaS aesthetics?
- [ ] Does the visual direction match the product?

## Layout

- [ ] Is the hierarchy obvious?
- [ ] Is the grid intentional?
- [ ] Is whitespace controlled?
- [ ] Are compositions varied?
- [ ] Are grid-breaking elements intentional?

## Typography

- [ ] Is typography part of the identity?
- [ ] Is hierarchy clear?
- [ ] Are line lengths readable?
- [ ] Are font weights purposeful?

## Color

- [ ] Does every color have a role?
- [ ] Is contrast sufficient?
- [ ] Is the palette restrained?
- [ ] Does color support hierarchy?

## Components

- [ ] Are states designed?
- [ ] Are components visually consistent?
- [ ] Are repeated components actually necessary?
- [ ] Do components feel native to this product?

## Motion

- [ ] Does motion communicate something?
- [ ] Are interactions responsive?
- [ ] Is reduced motion supported?
- [ ] Is animation restrained?

## Responsive

- [ ] Is mobile intentionally art-directed?
- [ ] Does hierarchy survive smaller screens?
- [ ] Are touch targets appropriate?
- [ ] Does the identity survive every breakpoint?

## Accessibility

- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Semantic structure exists
- [ ] Contrast is sufficient
- [ ] Labels and alt text are meaningful
- [ ] Reduced motion is supported

## Anti-Generic Check

Ask:

> If I changed the logo, product name, colors, and text,
> could this design belong to another random startup?

If **yes**, redesign the visual identity.

Ask:

> Does every visual choice have a reason?

If **no**, remove or justify it.

Ask:

> Are multiple sections using the same visual formula?

If **yes**, introduce intentional compositional variation.

---

# Final Rule

## Build a system, not a template.

The goal is not to make every screen different.

The goal is to create a coherent visual language capable of producing
different compositions without losing its identity.

**Distinctive ≠ chaotic.**

**Consistent ≠ repetitive.**

**Minimal ≠ empty.**

**Complex ≠ sophisticated.**

**Decorative ≠ designed.**

Every visual decision should improve one or more of:

**Identity · Hierarchy · Usability · Emotion · Meaning**

If it improves none of them, remove it.
