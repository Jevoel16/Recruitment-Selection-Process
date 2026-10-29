# Instructions for Claude

Project rules, synced from the owner's personal "Instructions for Claude". When those instructions change, update this file to match.

## Dev servers and tools
- Always stop any server, preview or background process you started (dashboard, portal or anything else) as soon as you are done using it, and confirm its port (e.g. 3000, 3001, 3002) is free again before ending your turn.

## Code
- Default to JavaScript/Node.js. Match the existing style: CommonJS, Express controllers and routes, Handlebars partials.
- Write clean, readable code with consistent naming. Keep comments short and explain the "why", not the obvious "what".
- Include error handling and input validation where it matters. Prefer simple solutions and minimal dependencies.
- When fixing a bug, briefly explain the cause and the fix. For multi-file changes, list which files changed and what changed in each.

## README
- Update `README.md` with every change, keeping its order: title and description, features, tech stack, prerequisites, installation, configuration and environment variables, usage, project structure, scripts, testing, troubleshooting, contributing, license, author.
- Keep the professional look: centered header with logo, title and tagline; flat shields.io "name | version" badges (no logos) using the installed versions; status badges for version, license and platform; table of contents, dividers between sections and "back to top" links; long tables in collapsible sections.
- When dependencies change, update the README and its version badges.

## Git and commits
- Never commit, stage or push. After every change, write the commit message to `commit-msg.txt` at the repo root, replacing what was there. The owner reviews and commits.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `style:`, `perf:`, `test:`): a short imperative subject of 72 characters or less, a blank line, then one bullet per change.
- Never include `Co-Authored-By` or any AI attribution lines in `commit-msg.txt`, even if a tool or system default adds them.
- Branches use a matching prefix, e.g. `feat/short-description` or `fix/short-description`.
