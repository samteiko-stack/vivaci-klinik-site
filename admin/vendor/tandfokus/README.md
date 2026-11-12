# Tandfokus design system (vendored copy)

**Snapshot copied from** `/Users/samuelteiko/Tandfokus` for Vivaci’s standalone content admin only.

- Not linked to Tandfokus CRM, database, or deploy
- Do not merge repos or share credentials
- React files under `components/ds/` are reference / future use; the Vivaci admin uses the **CSS class API** (`ds-*`) in `admin/ds/`

To refresh from Tandfokus (manual, intentional):

```bash
rsync -a /Users/samuelteiko/Tandfokus/components/ds/ admin/vendor/tandfokus/components/ds/
```

Update `admin/ds/design-system-core.css` slices separately if Tandfokus DS changes.
