## 2025-02-20 - Password Visibility Toggle
**Learning:** Adding a password visibility toggle is a high-value micro-UX improvement for login forms, especially on mobile. Using MUI's `InputAdornment` and `IconButton` with `Visibility/VisibilityOff` icons makes this easy and consistent with the design system. Crucially, `onMouseDown={e => e.preventDefault()}` is needed to prevent focus loss from the input field when clicking the toggle.
**Action:** Always verify keyboard accessibility and focus management when adding interactive elements inside form fields.
