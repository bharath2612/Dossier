# Contributing to Dossier

Thank you for your interest in contributing to Dossier! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Examples of behavior that contributes to creating a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Git
- A code editor (VS Code recommended)
- Basic understanding of TypeScript, React, and Node.js

### Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/dossier.git
   cd dossier
   ```

3. **Add the upstream repository:**
   ```bash
   git remote add upstream https://github.com/original-owner/dossier.git
   ```

4. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

5. **Set up environment variables:**
   - Copy `.env.example` to `.env` in the backend directory
   - Copy `.env.example` to `.env.local` in the frontend directory
   - Fill in your API keys and configuration (see README.md for details)

6. **Set up the database:**
   - Create a Supabase project or use Docker Compose
   - Run the migration files in `supabase/migrations/`

7. **Start the development servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Development Process

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes:**
   - Write clear, readable code
   - Follow existing code style and patterns
   - Add comments for complex logic
   - Update documentation as needed

3. **Test your changes:**
   - Test manually in development
   - Ensure the code builds without errors
   - Check for linting errors: `npm run lint`

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```
   
   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance tasks

5. **Keep your branch up to date:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push your changes:**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request:**
   - Go to the GitHub repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Submit the PR

## Code Style

### TypeScript

- Use TypeScript strict mode
- Define explicit types for function parameters and return values
- Avoid `any` type; use `unknown` if necessary
- Use interfaces for object shapes, types for unions/intersections
- Prefer `const` over `let`, avoid `var`

### React/Next.js

- Use functional components with hooks
- Use TypeScript for all components
- Follow Next.js App Router conventions
- Use server components when possible
- Keep components small and focused
- Extract reusable logic into custom hooks

### Naming Conventions

- **Files**: Use kebab-case for files (`my-component.tsx`)
- **Components**: Use PascalCase (`MyComponent`)
- **Functions/Variables**: Use camelCase (`myFunction`)
- **Constants**: Use UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: Use PascalCase (`UserData`)

### Code Formatting

- Use 2 spaces for indentation
- Use single quotes for strings (JavaScript/TypeScript)
- Add trailing commas in objects and arrays
- Use semicolons at the end of statements
- Maximum line length: 100 characters (soft limit)

### Example

```typescript
// Good
interface UserData {
  id: string;
  email: string;
  name: string;
}

export function getUserData(userId: string): Promise<UserData> {
  return fetch(`/api/users/${userId}`).then((res) => res.json());
}

// Bad
export function getUserData(userId) {
  return fetch('/api/users/' + userId).then(res => res.json())
}
```

## Testing

Currently, the project uses manual testing. When adding new features:

1. Test all user flows manually
2. Test edge cases and error conditions
3. Test in different browsers (Chrome, Firefox, Safari)
4. Test responsive design on different screen sizes

Automated tests are planned for future releases.

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] All changes are tested
- [ ] Documentation is updated if needed
- [ ] No console.log or debug code left behind
- [ ] No hardcoded API keys or secrets
- [ ] Commit messages follow conventional commit format

### PR Description Template

When creating a PR, include:

1. **Description**: What changes does this PR introduce?
2. **Related Issue**: Link to related issues (if any)
3. **Type of Change**: Bug fix, new feature, documentation, etc.
4. **Testing**: How was this tested?
5. **Screenshots**: If applicable, include screenshots

### Review Process

1. All PRs require at least one approval
2. Maintainers will review your code
3. Address any feedback or requested changes
4. Once approved, a maintainer will merge your PR

## Documentation

When adding new features:

- Update relevant documentation files
- Add JSDoc comments for public APIs
- Update README.md if setup instructions change
- Update architecture.md for significant architectural changes

## Reporting Issues

### Bug Reports

When reporting a bug, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Step-by-step instructions
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, browser, Node.js version
6. **Screenshots**: If applicable

### Feature Requests

When requesting a feature:

1. **Description**: Clear description of the feature
2. **Use Case**: Why is this feature needed?
3. **Proposed Solution**: How should it work?
4. **Alternatives**: Any alternatives considered?

## Security

### Reporting Security Vulnerabilities

**Do not** open public issues for security vulnerabilities.

Instead, please email security concerns to the maintainers or use GitHub's private security advisory feature.

### Security Best Practices

- Never commit API keys, secrets, or credentials
- Use environment variables for sensitive data
- Validate and sanitize all user input
- Follow secure coding practices
- Keep dependencies up to date

## Getting Help

- **Documentation**: Check the README.md and other docs
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask questions in PR comments

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.

## Recognition

Contributors will be recognized in:
- GitHub Contributors page
- Release notes (for significant contributions)
- Project documentation (if applicable)

Thank you for contributing to Dossier! 🎉

