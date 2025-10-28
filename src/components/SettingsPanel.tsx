import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supa } from '@/SupabaseClient'

export default function SettingsPanel() {
  const qc = useQueryClient()

  const me = useQuery({
    queryKey: ['whoAmI'],
    queryFn: async () => {
      const { data, error } = await supa.rpc('who_am_i');
      if (error) throw error;
      return data;
    },
  })

  const [username, setUsername] = React.useState('')
  const [avatarUrl, setAvatarUrl] = React.useState('')
  const [batch, setBatch] = React.useState('')

  React.useEffect(() => {
    if (me.data) {
      setUsername(me.data.username ?? '')
      setAvatarUrl(me.data.avatar_url ?? '')
      setBatch(me.data.batch ?? '')
    }
  }, [me.data])

  const save = useMutation({
    mutationFn: async () => {
      const { data, error } = await supa.rpc('profile_update', {
        p_username: username || '',
        p_avatar_url: avatarUrl || '',
        p_batch: batch || null
      });
      if (error) throw error;
      return data;
    },
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

      <label className="block text-sm mb-1">Batch</label>
      <select
        className="w-full mb-3 rounded-lg bg-transparent border px-3 py-2"
        value={batch}
        onChange={e => setBatch(e.target.value)}
      >
        <option value="">Select batch</option>
        <option value="8A">8A</option>
        <option value="8B">8B</option>
        <option value="8C">8C</option>
      </select>

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


