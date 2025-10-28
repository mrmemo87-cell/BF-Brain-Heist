import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { supa } from '@/SupabaseClient'
import MCQSection from './quests/MCQSection'

type CheckinRes = { claimed: boolean; streak: number; xp: number; coins: number; message: string }

export default function QuestsPanel() {
  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supa.rpc('daily_checkin')
      if (error) throw error
      return data as CheckinRes
    },
  })

  return (
    <div className="space-y-4">
      <MCQSection />
      <section className="card-glass p-4 rounded-2xl">
        <h3 className="font-heading mb-2">Daily Check-in</h3>
        <p className="text-sm opacity-70 mb-3">Tap once per UTC day to keep your streak going.</p>

        <button
          className="rounded-xl px-4 py-2 border"
          onClick={() => claim.mutate()}
          disabled={claim.isPending}
        >
          {claim.isPending ? 'ClaimingвЂ¦' : 'Claim Today'}
        </button>

        {claim.data && (
          <div className="mt-3 text-sm">
            <div>Streak: <b>{claim.data.streak}</b></div>
            <div>Rewards: +{claim.data.xp} XP, +{claim.data.coins} coins</div>
            <div className="opacity-70">{claim.data.message}</div>
          </div>
        )}

        {claim.error && (
          <div className="text-red-400 text-sm mt-2">
            {(claim.error as any).message ?? 'Failed to claim'}
          </div>
        )}
      </section>
    </div>
  )
}


