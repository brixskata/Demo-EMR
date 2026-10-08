import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
export const useDemoStore = defineStore('demo', () => {
  const roles = ['ADMIN', 'AUDITOR', 'RECORDS_VIEWER'] as const
  const savedRole = localStorage.getItem('demo-role')
  const role = ref(roles.includes(savedRole as typeof roles[number]) ? savedRole! : 'ADMIN')
  const canUpload = computed(() => role.value === 'AUDITOR' || role.value === 'ADMIN')
  function setRole(next: string) { role.value = next; localStorage.setItem('demo-role', next) }
  return { role, roles, canUpload, setRole }
})
