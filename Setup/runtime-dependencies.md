# Runtime dependency compatibility notes

This update intentionally keeps Next.js 15, the current Auth.js 5 beta line, React 19, MUI 7, and the existing generator/Dataverse SDK versions.

- Next.js 15.5.25 supports Sharp 0.35.4 in its optional dependency range. Sharp's native image operations still need verification on the Linux hosting target as well as local testing.
- Azure Identity is pinned to 4.13.1. It includes the security-fixed MSAL dependency and declares Node 20 support; 4.13.2 raises its minimum Node version to 22. The resolved MSAL Node dependency moves from 3.8.0 to 5.6.0 despite the small top-level patch increment, which is why this belongs in the higher-risk batch. Keep any runtime migration separate from this compatibility update.
- Auth.js is pinned to 5.0.0-beta.32. Password and synthetic-session checks do not replace live Entra ID sign-in, group-access and logout validation.
- Next.js 15.5.25 still pins PostCSS 8.4.31. The scoped `overrides.next.postcss` selects 8.5.28 without upgrading the framework to Next.js 16. The lockfile removes the obsolete nested copy and resolves the patched root copy. Recheck this override when upgrading Next.js and remove it once the framework selects a patched compatible version itself. Verify both the resolved package tree and generated CSS/build output; changing only the override declaration can leave a stale nested lock entry.

An audit with zero findings is not proof of runtime compatibility or absence of vulnerabilities. Follow the pinning, canary and rollback procedure in [dependency-updates.md](dependency-updates.md) before allowing this change into daily deployments.

