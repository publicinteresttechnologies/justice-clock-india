# Security

## Dependency baseline

The project currently targets:

- Next.js 16.2.11, the July 2026 patched Active LTS release
- React and React DOM 19.2.7
- Vitest 4.1.10
- Zod 4.2.1

CI runs both a production-only and a complete dependency audit. It fails when a high or critical advisory has a non-major fix available.

## Remaining audit findings

As of the dependency refresh in July 2026, `npm audit` still reports the following findings for which it does not provide a safe non-major upgrade path:

### Next.js transitive production dependencies

Next.js 16.2.11 pins PostCSS 8.4.31 and declares Sharp `^0.34.5`. Current npm advisories flag:

- PostCSS versions through 8.5.17
- Sharp versions below 0.35.0

The npm audit recommendation is a major downgrade to Next.js 9.3.3, which is not a viable security fix. Overriding Next.js's exact PostCSS pin or crossing Sharp's 0.x minor boundary would be an unsupported compatibility change, so these are documented and must be rechecked against the next patched Next.js 16.x release.

### Development-only ESLint dependency tree

The complete audit reports high-severity advisories through `minimatch` and `brace-expansion` in the ESLint 9 / `eslint-config-next` dependency tree. npm's proposed resolution requires the ESLint 10 major line or an invalid downgrade of `eslint-config-next`. These dependencies are used for development linting and are not included in the production application bundle.

The repository should upgrade this toolchain when Next.js officially supports a compatible patched ESLint 10 stack.

## Fixed in this update

- Next.js 16.0.10 was upgraded to 16.2.11.
- React and React DOM 19.2.1 were upgraded to 19.2.7.
- Vitest 4.0.15 was upgraded to 4.1.10 to address the critical Vitest UI server file-read/execution advisory.

## Reporting

Do not include sensitive user or court data in a public issue. Report security concerns privately to the repository owner where possible.
