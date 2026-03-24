## 2024-05-17 - Icon-Only Buttons and Accessibility
**Learning:** Using raw text like 'x' for icon-only buttons causes screen readers to announce the letter literally, which provides poor context to users. Missing ARIA labels exacerbate this.
**Action:** Replace text-based icons with semantic SVGs and ensure `aria-label` attributes are consistently applied to icon-only buttons to clearly describe their action.
