---
id: missing-autocomplete
title: 'Fill in the Blanks'
difficulty: intermediate
tags:
  - forms
points: 150
starter:
  html: starter.html
  css: starter.css
solution:
  html: solution.html
validators:
  - color-contrast
  - axe-no-violations
  - form-labels
  - autocomplete-attributes
links:
  - text: 'WCAG: Identify Input Purpose'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose.html'
  - text: 'H98: Using HTML autocomplete attributes'
    url: 'https://www.w3.org/WAI/WCAG21/Techniques/html/H98'
  - text: 'MDN: autocomplete attribute'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete'
  - text: 'WCAG: Input Purposes for UI Components'
    url: 'https://www.w3.org/TR/WCAG21/#input-purposes'
---

In this challenge you see a checkout form that collects personal and payment information. The form works visually, but it is missing `autocomplete` attributes on all fields. Without these attributes:

- Browsers and password managers cannot auto-fill the fields
- Users with cognitive disabilities or motor impairments must manually type every value
- The browser's autofill UI that provides visual cues about field purpose is absent
- Assistive technologies cannot identify the purpose of each input

This violates WCAG 2.1 Success Criterion 1.3.5 "Identify Input Purpose" (Level AA).

## Your Task

Add the correct `autocomplete` attribute to each input field:

- First name → `given-name`
- Last name → `family-name`
- Email → `email`
- Street address → `street-address`
- City → `address-level2`
- Postal code → `postal-code`
- Country → `country-name`
- Credit card number → `cc-number`
- Expiration date → `cc-exp`

## Tips

- The `autocomplete` attribute tells the browser what type of data a field expects
- WCAG defines a specific set of token values — use the exact tokens (e.g. `given-name`, not `first-name`)
- Fields that collect personal user data listed in the WCAG input purposes require `autocomplete`
- This helps everyone: users with disabilities, people on mobile, and anyone who fills out forms regularly
