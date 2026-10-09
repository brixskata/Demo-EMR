<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const error = ref('')
const logoAvailable = ref(true)
const logoPath = '/images/hospital-logo.png'

async function submit() {
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = 'Enter your username and password.'
    return
  }

  submitting.value = true
  await new Promise((resolve) => setTimeout(resolve, 350))
  submitting.value = false
  error.value = 'Authentication is not configured yet. Use the existing demo role selector to access the demo.'
}
</script>

<template>
  <main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f2f6f8] px-5 py-10 text-[#17233a] sm:px-8">
    <img
      v-if="logoAvailable"
      :src="logoPath"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute bottom-[-8rem] right-[-5rem] z-0 w-[34rem] max-w-[90vw] opacity-[0.045]"
      @error="logoAvailable = false"
    />
    <section class="relative z-10 w-full max-w-[440px] rounded-3xl border border-[#dce6eb] bg-white px-7 py-8 shadow-[0_20px_60px_rgba(38,54,80,0.08)] sm:px-10 sm:py-10">
      <div class="text-center">
        <img v-if="logoAvailable" :src="logoPath" alt="Hospital logo" class="mx-auto mb-4 h-20 max-w-[220px] object-contain" @error="logoAvailable = false" />
        <div v-else class="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-[#eaf2f5] text-[#527f99]"><span class="material-symbols-rounded text-4xl">health_and_safety</span></div>
        <h1 class="display text-2xl font-bold tracking-tight text-[#17233a]">SmartEHR</h1>
        <p class="mt-1 text-[10px] font-bold uppercase tracking-[.2em] text-[#8491a3]">Electronic Health Record</p>
        <h2 class="display mt-8 text-2xl font-bold text-[#263650]">Welcome Back</h2>
        <p class="mt-1 text-sm text-[#7b8799]">Sign in to access SmartEHR</p>
      </div>

      <form class="mt-8 space-y-5" novalidate @submit.prevent="submit">
        <label class="block">
          <span class="mb-2 block text-sm font-semibold text-[#263650]">Username</span>
          <span class="flex items-center gap-3 rounded-xl border border-[#dde5ee] bg-white px-4 py-3 focus-within:border-[#527f99] focus-within:ring-2 focus-within:ring-[#527f99]/20">
            <span class="material-symbols-rounded text-[#8491a3]">person</span>
            <input v-model="username" name="username" autocomplete="username" class="w-full bg-transparent text-sm outline-none placeholder:text-[#a5b1bf]" placeholder="Enter your username" />
          </span>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-semibold text-[#263650]">Password</span>
          <span class="flex items-center gap-3 rounded-xl border border-[#dde5ee] bg-white px-4 py-3 focus-within:border-[#527f99] focus-within:ring-2 focus-within:ring-[#527f99]/20">
            <span class="material-symbols-rounded text-[#8491a3]">lock</span>
            <input v-model="password" name="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" class="w-full bg-transparent text-sm outline-none placeholder:text-[#a5b1bf]" placeholder="Enter your password" />
            <button type="button" class="rounded-md text-[#8491a3] focus:outline-none focus:ring-2 focus:ring-[#527f99]/30" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
              <span class="material-symbols-rounded">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </span>
        </label>

        <p v-if="error" role="alert" class="rounded-xl bg-[#fff1ea] px-4 py-3 text-sm text-[#b54747]">{{ error }}</p>
        <button type="submit" class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#709db6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#709db6]/20 transition hover:bg-[#527f99] focus:outline-none focus:ring-2 focus:ring-[#527f99]/40 disabled:cursor-not-allowed disabled:opacity-60" :disabled="submitting">
          {{ submitting ? 'Checking…' : 'Sign In' }}
          <span v-if="!submitting" class="material-symbols-rounded">arrow_forward</span>
        </button>
      </form>

      <div class="mt-8 border-t border-[#edf1f5] pt-6 text-center text-xs leading-5 text-[#69778d]">
        <p class="flex items-center justify-center gap-1.5"><span class="material-symbols-rounded text-sm text-[#527f99]">verified_user</span>Authorized use only. All activities are monitored.</p>
        <p class="mt-1">© 2026 SmartEHR. All rights reserved.</p>
      </div>
    </section>
  </main>
</template>
