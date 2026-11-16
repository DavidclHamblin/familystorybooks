# Family Storybooks

Website for www.familiestorybooks.co.uk: classic fairy tales retold with your family as the characters. Part of the Family Presents group, sister site to Family Board Books (DavidclHamblin/familyboardbooks), and built on the same design system.

- `assets/js/data.js`  stories, roles and settings (the one source of truth)
- `assets/css/site.css`  styles, shared with Family Board Books plus storybook additions
- `src/build.py`  builds the site into `dist/` (`python3 src/build.py`, needs node)
- `.github/workflows/pages.yml`  publishes `dist/` to GitHub Pages on every push to main

Stage 1 is a coming-soon site with a waitlist (FormSubmit, emails hello@familyboardbooks.com).
The book maker comes next and will use the shared photo and cartoon service in the board books repo (`worker/`).
Illustrations on the site are our own placeholders. Customer photos are never published here.
