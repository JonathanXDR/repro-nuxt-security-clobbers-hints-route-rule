export default defineNuxtConfig({
  compatibilityDate: '2026-03-21',
  // @nuxt/hints must be present so nuxt-security takes its auto-hints branch
  // (node_modules/nuxt-security/dist/module.mjs:20-28).
  modules: ['@nuxt/hints', 'nuxt-security'],

  // The user opts the @nuxt/hints dev endpoint out of CSURF and robots.txt.
  // Expected: both keys survive into the resolved Nitro route rule.
  // Actual:   nuxt-security replaces this entire rule with its own
  //           `{ security: { … } }` object via direct assignment, so both
  //           keys are silently dropped.
  routeRules: {
    '/__nuxt_hints/**': {
      csurf: false,
      robots: false,
    },
  },

  // `csrf: true` is what makes the clobber observable at runtime — without
  // it nuxt-security skips installing nuxt-csurf entirely (default is
  // `false`) and there is no middleware to bypass.
  security: {
    csrf: true,
  },
})
