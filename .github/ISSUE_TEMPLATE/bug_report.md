---
name: Bug report
about: Something renders wrong or crashes
labels: bug
---

**What happened**

**What you expected**

**The content that triggers it**

Most layout bugs here depend on particular dates or on how many entries
overlap. The relevant block from `content/timeline/*.md`, and the `tracks`
part of `site.config.js`, usually pin it down:

```markdown
## Entry title

- start: YYYY-MM
- end: YYYY-MM
```

**Where**

- Browser and version:
- Desktop or mobile width (the timeline swaps layout under 700px):
- Light or dark theme:
