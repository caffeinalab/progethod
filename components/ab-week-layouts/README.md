# A/B week layouts (temporary)

Experimental timesheet week presentations for A/B testing.

**Delete this entire folder** once a winner is chosen, then:
1. Keep only the winning layout (or fold it into `pages/index.vue`)
2. Remove `weekLayout` from `stores/preferences.ts` + persistence
3. Remove the "Vista settimana" picker from `layouts/default.vue`
4. Remove `week_layout_*` keys from `locales/it.json`
5. Remove the decision note from `.cursor/rules/project.mdc`

| Key | Component | Idea |
|-----|-----------|------|
| `classic` | `Classic.vue` | All 7 days fully open (current) |
| `accordion` | `Accordion.vue` | One open day; others dense status rows |
| `rail` | `Rail.vue` | Horizontal 7-day strip + single editor |
| `split` | `Split.vue` | Sticky day list + editor pane |
