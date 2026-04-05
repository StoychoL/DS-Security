---
name: claudemd-generator
description: Interactive CLAUDE.md generator that creates well-structured project context files through a Q&A workflow. Use when asked to "generate CLAUDE.md", "create CLAUDE.md", "CLAUDE.md generator", "set up CLAUDE.md", "make a CLAUDE.md", "bootstrap CLAUDE.md", "initialize CLAUDE.md", or any task involving creating a new CLAUDE.md file for a project.
---

# CLAUDE.md Generator

Generates a structured CLAUDE.md file for any project through an interactive Q&A workflow. No scripts or API keys required.

**Output sections:** Project, Tech Stack, Conventions, File Structure, Rules

**Reference:** See `references/example-template.md` for the target output format.

---

## Phase 1: Output Location

1. Ask the user where the CLAUDE.md should be saved. Default to the current working directory root (`./CLAUDE.md`).
2. Check if a CLAUDE.md already exists at the target path.
   - If it exists, warn the user and ask whether to **overwrite** or **choose a different location**.
3. Confirm the output path before proceeding.

---

## Phase 2: Project Identity (Q&A Round 1)

Ask the user the following in a single combined question:

- **Project name** — What is the project called?
- **Description** — One-line description: what it does and who it's for.
- **Tech stack** — Language(s), framework(s), key libraries, database, deployment target.

Accept freeform answers. Extract and organize the details from whatever the user provides.

**Example prompt to the user:**
> Tell me about your project:
> 1. What's the project name?
> 2. One-line description (what it does, who it's for)
> 3. Tech stack (language, framework, key libraries, database, deployment)

---

## Phase 3: Conventions & Structure (Q&A Round 2)

Ask the user about:

### Coding Conventions
- Naming conventions (camelCase, snake_case, PascalCase for components, etc.)
- Architecture patterns (MVC, feature-based, etc.)
- Component patterns (functional vs class, server vs client components)
- Where things go (API routes, database queries, utilities)

Provide examples to help: _"e.g., camelCase for variables, PascalCase for components, prefer functional over class-based, all DB queries go through a service layer"_

### File Structure
Offer two options:
1. **Auto-detect**: If the project directory has files, scan the filesystem and present the structure for confirmation.
   - Use `ls` or similar to map the directory tree.
   - Limit to **3 levels deep**.
   - Ignore: `node_modules`, `.git`, `__pycache__`, `.next`, `dist`, `build`, `.venv`, `env`, `.env`.
2. **Manual**: The user describes or pastes their directory structure.

---

## Phase 4: Rules (Q&A Round 3)

Ask for hard constraints — things Claude must **always** or **never** do in this project.

Provide examples to spark thinking:
> Examples:
> - Never use `any` type in TypeScript
> - Always write tests before implementing features
> - Never modify database migrations manually
> - Always use environment variables, never hardcode keys
> - Never commit .env files
> - Always handle loading and error states in async components

Accept whatever the user provides. Normalize into clear imperative statements.

---

## Phase 5: Confirm

1. Present a summary of everything collected, organized by section:
   - **Project**: name + description
   - **Tech Stack**: organized list
   - **Conventions**: bullet points
   - **File Structure**: tree view
   - **Rules**: bullet points
2. Ask: _"Does this look correct? Any changes before I generate the file?"_
3. If the user wants changes, incorporate them and re-confirm.

---

## Phase 6: Generate

Write the CLAUDE.md file to the target path with this structure:

```markdown
# CLAUDE.md

## Project

**{Name}** — {Description}

## Tech Stack

- **Language**: {language}
- **Framework**: {framework}
- **Styling**: {styling} (if applicable)
- **Database**: {database} (if applicable)
- **Auth**: {auth} (if applicable)
- **Deployment**: {deployment}

## Conventions

- {convention 1}
- {convention 2}
- ...

## File Structure

```
├── {dir}/
│   ├── {subdir}/
│   └── {file}
└── {dir}/
```

## Rules

- NEVER {rule}
- ALWAYS {rule}
- ...
```

### Formatting Guidelines

- Keep every section **concise and scannable** — CLAUDE.md files should be quick to read.
- Use markdown: headers, bullet lists, code blocks for file trees.
- Rules should be **imperative and unambiguous**, prefixed with ALWAYS or NEVER.
- Include specific **versions** in tech stack if the user provided them.
- File structure should use a **tree-style code block** with `├──`, `└──`, `│` characters.
- Do not add sections the user didn't provide information for.

After writing the file, confirm success and display the file path.
