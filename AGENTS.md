# AI Studio Agent Instructions (AGENTS.md)

This file contains custom instructions and conventions for any AI models (like Gemini) working on this codebase in Google AI Studio. **You must follow these rules when assisting the user.**

## 1. Architectural Philosophy
*   **Framework:** React 18+ with Vite.
*   **Styling:** Tailwind CSS. Use utility classes explicitly (no arbitrary CSS-in-JS unless absolutely necessary).
*   **Icons:** Use `lucide-react`.
*   **State Management:** React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`). Push logic to custom hooks where possible to keep components clean.
*   **Type Safety:** Strict TypeScript. Always define interfaces/types in `types.ts` or locally within the component if they are not shared. Do not use `any`.

## 2. Refactoring & Code Modification Guidelines
*   **Modularization:** This codebase contains several large, complex components (e.g., `DataInput`, `ExportRenderer`, `BroadcastStudio`). When adding new features, prefer creating new sub-components and extracting logic into helpers or custom hooks rather than bloating existing large files.
*   **File Edits:** Only edit what is strictly necessary. Always read a file using `view_file` or check with `grep` before attempting substitutions. Ensure replacement code functionally maps to the exact structure replaced.
*   **Targeted Matching:** When using `edit_file` or `multi_edit_file`, ensure your `TargetContent` covers an entire, uniquely identifiable block or function to prevent "Target content not found" or identical line clashes.

## 3. Routine Verification Process
Before concluding any implementation or refactoring step:
1.  **Format/Lint:** Run `lint_applet` to check for unused variables and typescript errors.
2.  **Build:** Run `compile_applet` to ensure nothing is broken.
3.  **No Blind Edits:** If you encounter errors, trace the missing dependencies or type incompatibilities, read the surrounding code, and apply a fix intelligently. 

## 4. UI/UX and Asset Guidelines
*   **Visual Consistency:** Follow the existing "Tactical" and "Esports" dark mode themes. Rely on deep background colors, fluorescent accents (yellows, purples, blues), and a high-contrast aesthetic.
*   **Animations:** Use `framer-motion` (via `motion/react`) for smooth entry, exit, and state changes.

## 5. Staying Relevant & Update Routine
*   **Routine Checks:** When the user asks to "clean up" or "verify health", you should analyze large files for over-complexity, run a lines-of-code calculation, and suggest modularization targets.
*   **Keep this Document Updated:** If you establish a new major pattern (like a new state management approach or a new folder structure), suggest appending it to this `AGENTS.md` file.
