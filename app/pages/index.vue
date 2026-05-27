<script setup lang="ts">
const status = ref<number | null>(null)
const body = ref('')

async function send() {
  const res = await fetch('/__nuxt_hints/lazy-load', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'demo',
      route: '/',
      state: { pageLoaded: true, hasReported: true, directImports: [] },
    }),
  })
  status.value = res.status
  body.value = await res.text()
}
</script>

<template>
  <main>
    <h1>repro: nuxt-security clobbers /__nuxt_hints/** route rule</h1>
    <p>
      <code>nuxt.config.ts</code> declared
      <code>routeRules['/__nuxt_hints/**'] = { csurf: false, robots: false }</code>.
      Expected: csurf is disabled, the POST reaches the @nuxt/hints dev handler.
      Actual: <code>nuxt-security</code> replaced the user route rule at module
      setup, csurf still runs, the request is blocked with
      <code>403 CSRF Token Mismatch</code>.
    </p>
    <button @click="send">
      POST /__nuxt_hints/lazy-load
    </button>
    <pre v-if="status !== null">status: {{ status }}
body: {{ body }}</pre>
  </main>
</template>
