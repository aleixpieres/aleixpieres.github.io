# Aleix Pieres — portfolio

A responsive, static portfolio for GitHub Pages. No build step or production JavaScript dependencies. The page uses semantic HTML, CSS illustrations, and a small vanilla JavaScript enhancement layer.

## Local development

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. On Windows PowerShell, use `npm.cmd` if execution policy prevents `npm.ps1` from running.

```sh
npm test
```

The Node/jsdom checks cover local assets and anchors, content without JavaScript, project filters, navigation and Escape behavior, both clipboard outcomes, project dealing, reduced-motion scrolling, structured metadata, and external link attributes. They do not render the layout or replace desktop/mobile browser QA.

## Editing

- `index.html`: profile, career history, projects, education, contact links, and metadata.
- `css/portfolio.css`: responsive layout, original CSS illustrations, typography, and reduced-motion behavior.
- `js/portfolio.js`: mobile navigation, project filters, the project dealer, and copy-email behavior.
- `pdf/ResumeAleixPieresCarrasco.pdf`: existing downloadable CV, retained unchanged.
- Legacy template assets remain in the repository but are no longer loaded by the page.

GitHub Pages publishes the root of the main branch at https://aleixpieres.github.io/. Pushes to main trigger the existing Pages build. The root-page structure and section anchors are preserved.

## Content sources and design references

Updated 29 October 2026. Career dates, role descriptions, personal interests, contact details, and the original projects are based on the existing portfolio. Publicly indexed [LinkedIn profile information](https://es.linkedin.com/in/aleix-pieres/es) confirms MediaMarktSaturn, EPSEVG / UPC (2018–2023), Spanish and Catalan at native/bilingual level, and English at full professional proficiency. Direct LinkedIn requests returned access errors, so the complete profile and detailed role history were not independently retrieved. The stale age reference was removed. No performance metrics, testimonials, or unverified project repository links were added.

The requested visual direction is casino-inspired: deep green, brass accents, condensed lettering, a portrait playing card, and ranked project cards. The project dealer selects a visible project, avoids immediate repeats, moves keyboard focus, and respects reduced motion. It never changes the active filter.

Public repositories selected for professional relevance:

- [Terraform HTTP load balancer](https://github.com/aleixpieres/Terraform-http-loadbalancer): README and mig.tf confirm VPC and load-balancer configuration, health checks, and two managed instance groups. The replica counts and CPU target shown are public configuration values, not production measurements.
- [PyPhantom](https://github.com/aleixpieres/PyPhantom): README and Python source confirm discord.py event handling, Ollama-generated replies, and a recent-message summary command. Described as an independent integration prototype; no production-readiness or deployment claims are made.
- [UDP server](https://github.com/aleixpieres/UDPserver): Python client and server source implement requests, data blocks, acknowledgements, and timeout handling. Described as an independent protocol exercise.

Professional work summaries are grounded in the existing career descriptions: data-pipeline development and maintenance, cloud infrastructure modernization, and Google Cloud networking support. They do not introduce customer names, internal project names, employee information, infrastructure identifiers, sample records, credentials, or measured business results. No private workplace documents or private repository contents were copied into the site. Existing public profile and contact details remain unchanged.

Employer contributions and independent public repositories are presented separately. Hobby sections and game projects are no longer part of the page.

## Verification limitation

The eleven interaction/content tests and HTML validation pass. CSS parses successfully. Browser visual QA remains unavailable: the browser access host is unavailable, and the earlier Windows tool attempt could not enforce URL policy for Firefox. Responsive layout, visual clipping, and real-browser accessibility still need visual verification.
