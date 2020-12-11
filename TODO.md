# Migrating from electron to desktop + web

- need to copy public folder + @melodie/core deps on @melodie/desktop publish
- fonts are duplicated in @melodie/ui & @melodie/site
- in @melodie/desktop: "postinstall": "electron-builder install-app-deps",
- Hoisted deps, how to ensure same versions?
- What about publishing and releasing?
- version & name pulled from package.json (site, desktop, ui)
- Postcss (jest-css-modules-transform@4.1+ needs postcss8, which requires webpack@5, which storybook does not support yet)
