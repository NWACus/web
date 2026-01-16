# Using Claude via GitHub Issues

This guide explains how to use Claude Code to work on issues and create pull requests directly from GitHub.

## How It Works

When you mention `@claude` in a GitHub issue or comment, Claude will:

1. Read the issue description and context
2. Analyze the codebase to understand what needs to change
3. Implement the requested changes
4. Create a pull request with the solution

A human developer should always review Claude's PR before merging.

## Triggering Claude

You can trigger Claude in several ways:

| Method | Example |
|--------|---------|
| New issue with `@claude` in body | Create issue, include `@claude` in description |
| Comment on existing issue | Add comment: `@claude please implement this` |
| Assign Claude to an issue | Assign the `claude` user (if configured) |

## Writing Good Prompts

### Structure Your Request

```
@claude [What you want done]

Context:
- [Relevant background information]
- [Links to related issues or designs]

Requirements:
- [ ] First requirement
- [ ] Second requirement
- [ ] Tests should pass
```

### Be Specific

| Good | Less Good |
|------|-----------|
| "Add a 'Back to top' button that appears after scrolling 500px on blog posts" | "Add a back to top button" |
| "Change the footer email from old@example.com to new@example.com" | "Update the contact info" |
| "Fix the typo on the About page: 'recieve' should be 'receive'" | "Fix typos" |

### Include Acceptance Criteria

Use checkboxes to define what "done" looks like:

```
@claude Add dark mode toggle to the settings page

Requirements:
- [ ] Toggle appears in user settings
- [ ] Persists preference to localStorage
- [ ] Applies immediately without page refresh
- [ ] Works with existing color scheme
```

## Example Prompts

### Simple Text Change

```
@claude Fix the typo in the footer - "Copywrite 2024" should be "Copyright 2024"
```

### UI Addition

```
@claude Add a "scroll to top" button on long pages

Requirements:
- [ ] Button appears after scrolling down 400px
- [ ] Styled consistently with existing buttons (use our Button component)
- [ ] Smooth scroll animation
- [ ] Accessible (has aria-label)
```

### Bug Fix

```
@claude The date picker on the events page shows the wrong timezone

Steps to reproduce:
1. Go to /events
2. Click "Add Event"
3. Select a date - it shows UTC instead of Pacific time

Expected: Dates should display in the user's local timezone
```

### Content Update

```
@claude Update the team members on the About page

Changes needed:
- Remove: Jane Smith (departed)
- Add: John Doe, role: "Avalanche Forecaster", joined 2024
- Update: Sarah's title from "Intern" to "Junior Forecaster"
```

## What Claude Can and Cannot Do

### Claude CAN:

- Read and understand the entire codebase
- Create new files and modify existing ones
- Run tests and fix failures
- Create well-documented pull requests
- Follow existing code patterns and styles

### Claude CANNOT:

- Access external services or APIs not in the codebase
- Deploy changes (PRs still need human approval)
- Access secrets or environment variables
- Make changes outside the repository

## Tips for Success

1. **Start simple** - Try small changes first to build confidence
2. **One task per issue** - Don't combine unrelated changes
3. **Provide context** - Link to designs, reference existing similar features
4. **Use the template** - The "Claude Task" issue template guides you through writing good prompts
5. **Review the PR** - Always review Claude's changes before merging

## Troubleshooting

### Claude didn't respond

- Ensure `@claude` is in the issue body or comment (not just the title)
- Check that the GitHub Action workflow ran (look in the Actions tab)
- The repo must have `ANTHROPIC_API_KEY` configured in secrets

### Claude made incorrect changes

- Add a comment with more specific instructions
- Reference specific files or line numbers if you know them
- Break the task into smaller pieces

### Claude's PR has test failures

- Comment on the PR: `@claude please fix the failing tests`
- Claude will analyze the failures and push fixes

## For Developers

See the workflow configuration in `.github/workflows/claude.yml` and the [CLAUDE.md](../CLAUDE.md) file for how Claude is configured for this repository.
