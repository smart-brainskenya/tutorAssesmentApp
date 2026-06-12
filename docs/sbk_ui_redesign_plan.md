# SBK Tutor Intelligence System: UI/UX Redesign Plan

Based on the Smart Brains Kenya (SBK) brand kit and the principles of distinctive, intentional frontend design, here is the robust, end-to-end plan to redesign the application. 

This redesign transforms the app from a generic dashboard into a branded, focused, and premium assessment environment for both admins and tutors.

## 1. Token System

### **Color Palette (Derived from Brand Kit)**
We will update `tailwind.config.js` to replace default colors with the strict SBK palette.

*   **Primary Action (Trust & Focus):** `sbk-blue-dark` (`#1054b8`) - Used for primary buttons, active states, and admin headers.
*   **Secondary Action (Interactive & Soft):** `sbk-blue-light` (`#6fb8ea`) - Used for hover states, subtle highlights, and secondary buttons.
*   **Accent/Energy (Elite Status & Highlights):** `sbk-orange` (`#ffa500`) / `sbk-yellow` (`#f2be40`) - Used sparingly for rank highlights (Code Captain, SBK Elite), progress bars, and critical notifications.
*   **Background (Clean & Unobtrusive):** `sbk-bg-main` (`#ffffff`) with `sbk-bg-alt` (`#ebeaea`) for distinct panel separation.
*   **Text (High Contrast):** `sbk-text-main` (`#000000`) for primary readability.

### **Typography**
We are stepping away from default system fonts to give the platform an educational yet highly professional tech feel.
*   **Display / Headers:** **Outfit** (Sans-serif) - Brings a modern, geometric, and friendly tone to page titles, ranks, and assessment headers.
*   **Body / UI Controls:** **Inter** (Sans-serif) - Highly legible for long reading (Section B questions) and dense admin data tables.
*   **Monospace (For Code Snippets):** **JetBrains Mono** - Because this is an assessment for technical/tutor roles.

### **Signature Element**
**The "Focus Ring" & Dynamic Progress.** 
Instead of standard boxy cards, active elements (like the current question being answered or a selected admin row) will feature a subtle, animated `sbk-blue-light` (`#6fb8ea`) aura. For tutors taking assessments, a thick, smooth `sbk-orange` progress bar will anchor the top of the screen, providing a sense of momentum without causing anxiety.

---

## 2. End-to-End Layout & Experience

### **A. Authentication Flow (Login/Register)**
*   **Visuals:** A split-screen layout. Left side features a deep `sbk-blue-dark` background with a subtle, slow-moving geometric pattern and the SBK logo. Right side is a stark white (`#ffffff`) card for the form.
*   **Interactions:** The "Access Code" field for registration will have a deliberate, satisfying reveal animation when the correct code format is detected.

### **B. Tutor Experience (The Assessment Flow)**
*   **Tutor Dashboard:** 
    *   **Hero Section:** A personalized greeting highlighting their current rank (e.g., "Smart Operator"). If they are "SBK Elite", the card uses the `sbk-yellow` accent with a subtle metallic gradient.
    *   **Layout:** Focused, single-column design. The "Start Assessment" button is prominent, using `sbk-blue-dark` with a hover lift effect.
*   **Assessment View (The Core):**
    *   **Distraction-Free Mode:** The navigation bar shrinks. The layout shifts to a maximum width of `800px` centered, ensuring optimal reading line length.
    *   **Typography:** Question text is large (20px), utilizing the **Outfit** font for clarity.
    *   **Interactions:** Selecting multiple-choice options will have a crisp, snappy micro-animation, filling the radio/checkbox with `sbk-blue-dark`.
    *   **Completion:** Upon submission, if they hit a high rank, a custom Canvas Confetti sequence using strictly the brand colors (Blue, Light Blue, Orange, Yellow) will trigger.

### **C. Admin Experience (Data & Management)**
*   **Admin Dashboard (Control Center):**
    *   **Layout:** A sidebar navigation (Dark mode: `sbk-blue-dark`) to maximize horizontal space for data tables on the right (`#ffffff` background).
    *   **Tables:** We will replace standard borders with Zebra striping using `sbk-bg-alt` (`#ebeaea`) and white. Row hover states will use a very faint tint of `sbk-blue-light`.
    *   **Manual Review (Section B):** A side-by-side split view. Left side shows the tutor's answer; right side provides the scoring rubric and input field. This reduces cognitive load and scrolling.
    *   **Status Pills:** 
        *   `Pending Review`: `sbk-yellow` background with black text.
        *   `Completed`: `sbk-blue-light` background with dark blue text.

---

## 3. Execution Strategy

1.  **Tailwind Configuration:** First, update `tailwind.config.js` to inject the new color tokens and font families.
2.  **Global CSS Updates:** Modify `index.css` to apply the new fonts and set base background colors.
3.  **Component Refactoring:** 
    *   Update shared UI components (`Button`, `Input`, `Table`) to utilize the new semantic color classes.
    *   Add micro-animations (hover lifts, focus rings) to the base components.
4.  **View Implementations:**
    *   Redesign `Auth` pages.
    *   Refactor the `Tutor` dashboard and assessment taking experience.
    *   Refactor the `Admin` dashboard, specifically optimizing the data tables and review modal.
5.  **Polish:** Implement the custom confetti logic and ensure responsive design holds up on mobile (especially for the Tutor view).

---

> [!TIP]
> **Action Required:** Review this plan. If the color mappings and structural changes align with your vision for the brand, click **Proceed** to begin the Tailwind and global CSS implementation on the `feature/ui-redesign-brand-touch` branch!
