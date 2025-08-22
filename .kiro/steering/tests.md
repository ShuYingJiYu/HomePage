---
inclusion: always
---

# Testing and TypeScript Guidelines

## Testing Requirements
- **All code must have corresponding tests** - Every component, hook, utility, and service should have test coverage
- **Test file organization**: All tests must be placed in the `tests/` directory, mirroring the `src/` structure
- **Test file naming**: Use `.test.ts` or `.test.tsx` extensions for test files
- **Test framework**: Use Vitest as the testing framework (configured in `vitest.config.ts`)

## Test Structure
- Mirror the `src/` directory structure in `tests/`:
  - `tests/components/` for component tests
  - `tests/hooks/` for custom hook tests  
  - `tests/utils/` for utility function tests
  - `tests/services/` for service layer tests
- Use descriptive test names that explain the expected behavior
- Group related tests using `describe` blocks
- Include setup and teardown as needed

## TypeScript Enforcement
- **All files must use TypeScript** - Use `.ts` and `.tsx` extensions exclusively
- **No JavaScript dependencies** - Avoid importing or depending on `.js` files
- **Strict typing**: Follow TypeScript strict mode conventions
- **Type safety**: Ensure all functions, components, and modules are properly typed
- **Import consistency**: Use the established path aliases (`@/components/`, `@/utils/`, etc.)

## Testing Commands
- Run tests: `yarn test`
- Run tests in watch mode: `yarn test --watch`
- Generate coverage: `yarn test --coverage`
- Type check before testing: `yarn type-check`

## Quality Standards
- Maintain high test coverage for critical business logic
- Test both happy paths and error scenarios
- Mock external dependencies appropriately
- Ensure tests are deterministic and don't rely on external state