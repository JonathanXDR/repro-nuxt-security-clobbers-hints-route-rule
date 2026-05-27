# Repro: `nuxt-security@2.6.0` overwrites user `routeRules['/__nuxt_hints/**']`

Minimal Nuxt 4 project showing that `nuxt-security`'s auto-hints branch
assigns to `nuxt.options.routeRules['/__nuxt_hints/**']` directly instead of
merging, so any user-declared keys on that route rule (such as `csurf: false`,
`robots: false`) are silently dropped.

## Steps to reproduce

```bash
npm install
npm run dev
```

1. Open the printed local URL.
2. Click **POST /__nuxt_hints/lazy-load** in the page.
3. Observe in the page output and the Network panel:

   ```
   POST /__nuxt_hints/lazy-load → 403 CSRF Token Mismatch
   ```

   even though `nuxt.config.ts` declared `csurf: false` for the same prefix.

4. Optional: inspect the resolved Nitro config after `nuxi prepare`:

   ```bash
   grep -A6 '__nuxt_hints/\*\*' .nuxt/dev/index.mjs
   ```

   The user's `csurf: false` and `robots: false` keys are absent; only the
   security middleware overrides set by `nuxt-security` remain.

## Expected behaviour

User-declared keys on `routeRules['/__nuxt_hints/**']` survive
`nuxt-security`'s auto-configuration; the resolved rule is a deep merge.

## Actual behaviour

`nuxt-security` replaces the entire rule, so user-declared `csurf`, `robots`,
and any other adjacent keys are dropped at module-setup time.

## Root cause

Introduced by [`d935250`](https://github.com/Baroshem/nuxt-security/commit/d935250)
*("fix: support nuxt hints", 2026-05-09, shipped in v2.6.0)*, which switched
from `defu(nuxt.options.routeRules, …)` (deep merge) to a direct assignment.
Current `node_modules/nuxt-security/dist/module.mjs`:

```js
if (hasNuxtModule('@nuxt/hints')) {
  nuxt.options.routeRules = nuxt.options.routeRules || {}
  nuxt.options.routeRules['/__nuxt_hints/**'] = {
    security: {
      rateLimiter: false,
      requestSizeLimiter: false,
      xssValidator: false,
      corsHandler: false,
    },
  }
}
```

Restoring `defu(…)` (or the in-module `defuReplaceArray`) preserves any keys
the consuming app already set.

## User-side workaround

```ts
// nuxt.config.ts
hooks: {
  'nitro:config'(nitroConfig) {
    nitroConfig.routeRules ??= {}
    nitroConfig.routeRules['/__nuxt_hints/**'] = {
      ...nitroConfig.routeRules['/__nuxt_hints/**'],
      csurf: false,
      robots: false,
    }
  },
},
```

## Related upstream activity

No existing issue or PR addresses this regression at the time of writing.
Earlier hints-compatibility work — [`#671`](https://github.com/Baroshem/nuxt-security/pull/671)
and [`#674`](https://github.com/Baroshem/nuxt-security/pull/674) — used
`defu(...)` and is what the regression replaced.

## Environment

- `nuxt@4.4.6`
- `nuxt-security@2.6.0`
- `@nuxt/hints@1.1.2`
- `typescript@6.0.3`
- Node.js ≥ 20.19
