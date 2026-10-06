import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
export const useDemoStore = defineStore('demo', () => {
  const role = ref(localStorage.getItem('demo-role') ?? 'RECORDS_STAFF')
  const roles = ['RECORDS_STAFF', 'PHYSICIAN', 'NURSE', 'ADMIN'] as const
  const canUpload = computed(() => role.value === 'RECORDS_STAFF' || role.value === 'NURSE' || role.value === 'ADMIN')
  function setRole(next: string) { role.value = next; localStorage.setItem('demo-role', next) }
  return { role, roles, canUpload, setRole }
})
