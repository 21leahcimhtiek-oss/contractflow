# Contributing to ContractFlow

Thank you for your interest in contributing to ContractFlow!

## Development Setup

```bash
git clone https://github.com/21leahcimhtiek-oss/contractflow.git
cd contractflow
npm install
cp .env.example .env.local
# Fill in your API keys (Supabase, OpenAI, Stripe)
npm run dev
```

## Code Standards

- **TypeScript**: Strict mode enabled. No `any` types.
- **Linting**: ESLint with Next.js config. Run `npm run lint`.
- **Formatting**: Prettier (auto-format on save recommended).
- **Testing**: Jest for unit tests, Playwright for E2E. Run `npm test`.

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Ensure no TypeScript errors: `npm run typecheck`
6. Ensure linting passes: `npm run lint`
7. Submit a pull request with a clear description

## Commit Convention

Follow [Conventional Commits](https://conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/tooling changes

## Reporting Issues

Please use GitHub Issues with the appropriate label:
- `bug` — Something is broken
- `enhancement` — New feature request
- `security` — Security vulnerability (use private disclosure for critical issues)
- `documentation` — Docs improvement

## Security Vulnerabilities

For security issues, email security@contractflow.app instead of opening a public issue.

## License

By contributing, you agree your contributions will be licensed under the MIT License.