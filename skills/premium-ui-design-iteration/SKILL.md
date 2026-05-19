---
name: "Premium UI Design & Iteration"
description: "Iterative UI/UX design workflow using AI image generation and rapid prototyping. Ensures premium aesthetics (glassmorphism, dark mode, animations) and handles user feedback loops before final code implementation."
category: "design"
tags: ["ui-ux", "design-iteration", "mockups", "tailwind-css", "premium-aesthetics", "feedback-loop"]
---

# Premium UI Design & Iteration Skill

## Overview

This skill ensures that the project's visual identity meets high-end premium standards before any code is written. It uses a 3-step loop: **Generate Mockup -> Get User Feedback -> Implement in Code**.

## 🎨 Design Principles (The "WOW" Factor)

The AI must follow these modern design aesthetics:
- **Glassmorphism:** Frosted glass effects, subtle transparencies, and backdrop blurs.
- **Vibrant Gradients:** Harmonious, high-end color transitions (no flat primary colors).
- **Dark Mode First:** Sleek, high-contrast dark themes as a default option.
- **Typography:** Modern, clean fonts (Inter, Roboto, Outfit).
- **Micro-animations:** Hover effects, smooth transitions, and interactive elements that make the UI feel "alive."

## 🔄 The Feedback Loop Workflow

### Phase 1: Conceptualization (Mockup Generation)
1. Read the PRD or feature requirements.
2. Use the `generate_image` tool to create 2-3 visual concepts/mockups.
3. Present these to the user for a "Look & Feel" check.

### Phase 2: Refinement (Iterative Feedback)
1. Ask the user: *"Jani, design kaisa laga? Kuch change karna hai?"*
2. If the user dislikes anything (colors, layout, spacing), regenerate the mockup or adjust the concept.
3. **DO NOT** proceed to coding until the user gives a "Green Signal."

### Phase 3: Design-to-Code Implementation
1. Convert the approved visual mockup into functional code.
2. **For Web:** Use Tailwind CSS with custom theme configurations.
3. **For Mobile:** Use React Native with centralized `src/constant/colors.ts`.
4. Ensure every pixel of the code matches the "Premium" feel of the approved mockup.

### Phase 4: Premium Redesign (UI Overhaul)
1. Read and analyze existing code of a non-premium page/component.
2. Identify "Non-Premium" elements (e.g., standard hex colors, poor spacing, default browser elements).
3. Apply a "Premium Layer" over the existing logic:
   - Replace flat colors with gradients/tokens.
   - Add backdrop-blurs (glassmorphism) to cards and headers.
   - Implement smooth transitions and micro-interactions.
4. Ensure the overhaul does not break the existing business logic/hooks.

## 🚀 Execution Commands

### Generate Mockups for a Feature
```bash
# Generate visual concepts based on a PRD feature
npx claude-flow skill run premium-ui-design-iteration mockup --feature "Dashboard Analytics" --theme "Modern Dark"
```

### Apply Feedback
```bash
# Refine the design based on specific user feedback
npx claude-flow skill run premium-ui-design-iteration refine --feedback "Make it more minimalist and use deep blue accents"
```

### Finalize and Code
```bash
# Convert the final approved design into Tailwind/RN code
npx claude-flow skill run premium-ui-design-iteration finalize --platform "web" --output-dir "src/pages/Dashboard"
```

### Premium UI Overhaul
```bash
# Modernize an existing page to make it feel premium
npx claude-flow skill run premium-ui-design-iteration overhaul --file "src/pages/Settings.tsx" --style "Apple-Minimalist"
```

