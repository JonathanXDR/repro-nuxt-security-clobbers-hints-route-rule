# Repro: `nuxt-security@2.6.0` clobbers user `routeRules['/__nuxt_hints/**']`

Minimal Nuxt 4 project showing that `nuxt-security`'s auto-hints branch overwrites — rather than merges with — any pre-existing `routeRules['/__nuxt_hints/**']` declared by the user.

## What you should see

After `npm run dev` (or `nuxi prepare`), inspect the resolved Nitro route rules. The user's `csurf: false` and `robots: false` for `/__nuxt_hints/**` are gone; only `nuxt-security`'s auto-hints headers remain.

Running the dev server and POSTing to `/__nuxt_hints/lazy-load` then returns:

```
403 Forbidden — CSRF Token Mismatch
```

even though the user explicitly disabled CSURF for that prefix.

## Why it fails

`node_modules/nuxt-security/dist/module.mjs:20-28`:

```js
if (hasNuxtModule('@nuxt/hints')) {
  nuxt.options.routeRules['/__nuxt_hints/**'] = {
    // …security headers…
  }
}
```

The direct assignment replaces any keys the user already set on that route rule. `nuxt-security`'s own merge helper, `defuReplaceArray`, is not used here even though it is used elsewhere in the module.

## Workaround

Restore the user keys after every module's `setup` runs via a `nitro:config` hook:

```ts
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

## Ask

Merge the auto-hints route rule with `defuReplaceArray` (or `defu`) instead of replacing it, so user-declared keys on `/__nuxt_hints/**` survive.

## Versions

- `nuxt@4.4.6`
- `nuxt-security@2.6.0`
- `@nuxt/hints@1.1.2`
