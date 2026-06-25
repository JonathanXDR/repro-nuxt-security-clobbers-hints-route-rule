# nuxt-security overwrites user routeRules['/__nuxt_hints/**'] instead of merging

## The bug

When `@nuxt/hints` is present, `nuxt-security` assigns its own object to
`nuxt.options.routeRules['/__nuxt_hints/**']` directly at module setup. This is
an assignment, not a merge, so any keys the consuming app already declared on
that same route rule are silently dropped.

In this repro `nuxt.config.ts` declares:

```ts
routeRules: {
  '/__nuxt_hints/**': { csurf: false, robots: false },
},
security: { csrf: true },
```

After a build the resolved rule in `.output/server/chunks/nitro/nitro.mjs` is:

```json
"/__nuxt_hints/**": {
  "security": {
    "rateLimiter": false,
    "requestSizeLimiter": false,
    "xssValidator": false,
    "corsHandler": false
  }
}
```

The user-declared `csurf: false` and `robots: false` are gone. With
`security.csrf: true` this also means CSRF protection still runs on the
`@nuxt/hints` dev endpoint that the user explicitly opted out, so its POST
requests are rejected.

## To reproduce

https://stackblitz.com/github/JonathanXDR/repro-nuxt-security-clobbers-hints-route-rule

The StackBlitz start command runs `nuxi build` and prints the resolved
`/__nuxt_hints/**` rule, ending with `BUG REPRODUCED` when the user keys are
absent.

## Expected behavior

User-declared keys on `routeRules['/__nuxt_hints/**']` survive the module's
auto-configuration. The resolved rule should be a deep merge of the user rule
and the security defaults, so `csurf: false` and `robots: false` are preserved
alongside `security: { ... }`.

## Additional context

Root cause is the hints branch in the installed module
`node_modules/nuxt-security/dist/module.mjs:18-27`:

```js
if (hasNuxtModule("@nuxt/hints")) {
  nuxt.options.routeRules = nuxt.options.routeRules || {};
  nuxt.options.routeRules["/__nuxt_hints/**"] = {
    security: { rateLimiter: false, requestSizeLimiter: false, xssValidator: false, corsHandler: false }
  };
}
```

The assignment replaces the entire rule. Using `defu` (or the module's own
`defuReplaceArray`) to merge into the existing
`nuxt.options.routeRules['/__nuxt_hints/**']` would preserve adjacent keys.

Environment: nuxt-security 2.6.0, nuxt 4.4.6, @nuxt/hints 1.1.2, Node 20.19+.
The reproduction is native-dependency free and runs in WebContainer with npm.
