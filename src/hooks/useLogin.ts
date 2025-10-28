import { useMutation } from '@tanstack/react-query'
import { useDataAPI } from '@/services/data'

export const useLogin = () => {
const api = useDataAPI()
return useMutation({
mutationFn: async ({ identifier, password }: { identifier: string; password?: string }) => {
return api.login(identifier, password)
},
})
}

