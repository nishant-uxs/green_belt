# Screenshot Instructions for Green Belt Submission

## Required Screenshots

### 1. Mobile Responsive View (`mobile_responsive.png`)

**How to capture:**
1. Open your live demo: https://stellar-orangebelt.onrender.com
2. Open Chrome DevTools (F12)
3. Click the device toggle icon (Ctrl+Shift+M)
4. Select "iPhone 12 Pro" or similar mobile device
5. Navigate to show campaign cards in mobile view
6. Take screenshot:
   - **Option A**: Press `Ctrl+Shift+P` → type "Capture screenshot" → select "Capture full size screenshot"
   - **Option B**: Use Windows Snipping Tool (Win+Shift+S)
7. Save as `mobile_responsive.png` in project root

**What to show:**
- Mobile layout with single column
- Campaign cards stacked vertically
- Responsive navigation
- Touch-friendly buttons

---

### 2. CI/CD Pipeline Badge (`ci_cd_badge.png`)

**How to capture:**
1. Go to your GitHub repository: https://github.com/nishant-uxs/stellar-greenbelt
2. Click on "Actions" tab
3. Find your latest workflow run (should show green checkmark)
4. Take screenshot showing:
   - Workflow name: "CI/CD Pipeline"
   - Status: ✅ Passing
   - Test results: All tests passing
5. Save as `ci_cd_badge.png` in project root

**Alternative:**
If GitHub Actions badge is in README, screenshot the badge from the rendered README.

---

## Quick Command

After capturing screenshots, commit them:

```bash
git add mobile_responsive.png ci_cd_badge.png
git commit -m "docs: add required screenshots for Green Belt submission

Added mobile responsive view and CI/CD pipeline screenshots as required for Level 4 submission criteria.

Co-Authored-By: Warp <agent@warp.dev>"
git push origin master
```

---

## Verification

Ensure both files exist:
```bash
ls mobile_responsive.png ci_cd_badge.png
```

Both should be PNG format and clearly show the required elements.
