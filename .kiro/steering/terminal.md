---
inclusion: always
---

# Terminal and Execution Guidelines

## Package Management
- **Always use yarn** - Never use npm or other package managers
- Install dependencies: `yarn add <package>` or `yarn add -D <package>` for dev dependencies
- Run scripts: `yarn <script-name>` (e.g., `yarn dev`, `yarn build`, `yarn test`)
- Check available scripts in `package.json` before creating new commands

## JavaScript Execution Rules
- **Never execute JavaScript files directly** with `node` command
- **Never run `.js` files** from scripts directory directly
- Use configured yarn scripts instead of direct file execution
- All JavaScript execution must go through build tools or yarn scripts

## Development Commands
- Development server: `yarn dev` or `yarn dev:fresh` (with fresh data)
- Build production: `yarn build` (includes type checking and SEO generation)
- Type checking: `yarn type-check`
- Linting: `yarn lint`
- Formatting: `yarn format`
- Testing: `yarn test`

## Error Handling Strategy
- Terminal environment may be unstable - failures aren't always code issues
- When commands fail:
  1. Retry the command once
  2. Check if it's an environmental issue vs code problem
  3. Use alternative approaches if available
  4. Don't immediately modify code for execution failures

## File Execution Patterns
- Scripts in `/scripts/` directory should be run via yarn scripts, not directly
- Configuration files should be imported/required, not executed
- Use build tools (Vite) for bundling and execution
- Prefer declarative configuration over imperative scripts

## Command Verification
- Always check `package.json` scripts section for available commands
- Verify command exists before execution
- Use `yarn --help` or `yarn <script> --help` for command options