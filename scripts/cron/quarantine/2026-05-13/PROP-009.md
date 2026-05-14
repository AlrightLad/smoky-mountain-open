---
{
  "id": "PROP-009",
  "title": "Extract page-helpers from home.js",
  "lane": "Lane 4 \u2014 Code Quality",
  "rationale": "renderPageFooter, showRivalryDetail, doCopy, doRestore live in home.js but are imported by 11+ pages.",
  "scope": "Create src/core/page-helpers.js, move helpers, update imports.",
  "estimate_tokens": 24000,
  "files_affected": [
    "src/pages/home.js",
    "src/core/page-helpers.js",
    "src/pages/*.js (11 import updates)"
  ],
  "ship_target": "W1.S4"
}
---

## Body

Details would live here.
