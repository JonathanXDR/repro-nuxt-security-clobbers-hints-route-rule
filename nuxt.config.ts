export default defineNuxtConfig({
  compatibilityDate: '2026-03-21',
  // Module order is intentional: @nuxt/hints must be present so
  // nuxt-security takes its auto-hints branch (module.mjs:20-28).
  modules: ['@nuxt/hints', 'nuxt-security'],

  // The user declares routeRules for the @nuxt/hints dev endpoint.
  // Expected: csurf and robots are disabled for that prefix at runtime.
  // Actual:   nuxt-security 2.6.0 sets
  //           nuxt.options.routeRules['/__nuxt_hints/**'] = { ... }
  //           by direct assignment in its module setup, wiping both
  //           keys below.
  routeRules: {
    '/__nuxt_hints/**': {
      csurf: false,
      robots: false,
    },
  },

  // No `security` overrides — the bug fires with the default setup.
})
