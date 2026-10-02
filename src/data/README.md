# projects.json — one entry per project

Fields: slug, name, client (null = "Private client"), system (restaurant | academy | real-estate | invoicing | madrassa),
year, permission, outcome, problem, built, screenshots[{src, alt, sample}], results[{value, label}],
quote ({text, attribution} or null).

A project is only published in a production build when `permission` is `"cleared"`. Set it only after the client
has agreed in writing to the name, screens and results shown. Mark demo screens with `"sample": true` so the page
labels them "Sample data". Draft entries (anything not cleared) are visible only in `npm run dev` and `npm run build:preview`.
