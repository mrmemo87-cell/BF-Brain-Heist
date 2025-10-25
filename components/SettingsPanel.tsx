import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDataAPI } from '../services/data'

export default function SettingsPanel() {
  const dataAPI = useDataAPI()
  const qc = useQueryClient()

  const me = useQuery({
    queryKey: ['whoAmI'],
    queryFn: () => dataAPI.whoAmI(),
  })

  const [username, setUsername] = React.useState('')
  const [avatarUrl, setAvatarUrl] = React.useState('')

  React.useEffect(() => {
    if (me.data) {
      setUsername(me.data.username ?? '')
      setAvatarUrl(me.data.avatarUrl ?? '')
    }
  }, [me.data])

  const save = useMutation({
    mutationFn: async () => dataAPI.profileUpdate(username, avatarUrl),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['whoAmI'] })
      alert('Saved!')
    },
    onError: (e: any) => alert(e?.message ?? 'Save failed'),
  })

  if (me.isLoading) return <div className="opacity-70 text-sm">Loading...</div>
  if (me.error) return <div className="text-red-400 text-sm">Failed to load profile.</div>

  return (
    <section className="glassmorphism rounded-2xl p-4 max-w-xl">
      <h3 className="font-heading mb-3">Settings</h3>

      <label className="block text-sm mb-1">Username</label>
      <input
        className="w-full mb-3 rounded-lg bg-transparent border px-3 py-2"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />

      <label className="block text-sm mb-1">Avatar URL (optional)</label>
      <input
        className="w-full mb-3 rounded-lg bg-transparent border px-3 py-2"
        value={avatarUrl}
        onChange={e => setAvatarUrl(e.target.value)}
      />

      <div className="flex items-center gap-3">
        {avatarUrl && <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full border" />}
        <button
          className="rounded-xl px-3 py-2 border"
          onClick={() => save.mutate()}
          disabled={save.isPending}
        >
          {save.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </section>
  )
}
