import { ref } from 'vue'

const originData = ref(null)
const destinationData = ref(null)

export function useRouteContext() {
  return {
    originData,
    destinationData
  }
}