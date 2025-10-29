import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supa } from '@/SupabaseClient'

type ShopItem = {
  id: string; name: string; slot: string; price: number;
  atk: number; def: number; rarity: string; description: string;
  owned: number; affordable: boolean;
}
type InvItem = {
  userItemId: number; itemId: string; name: string; slot: string;
  atk: number; def: number; rarity: string; equipped: boolean; price: number;
}

export default function GearPanel() {
  const qc = useQueryClient()

  const shop = useQuery({
    queryKey: ['shop'],
    queryFn: async () => {
      const { data, error } = await supa.rpc('shop_list')
      if (error) throw error
      return (data ?? []) as ShopItem[]
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const inv = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      try {
        const { data, error } = await supa.rpc('inventory_list')
        if (error) throw error
        return (data ?? []) as InvItem[]
      } catch {
        const { data, error } = await supa.rpc('inventory_for_me')
        if (error) throw error
        return (data ?? []) as InvItem[]
      }
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const buy = useMutation({
    mutationFn: async (itemId: string) => {
      const { data, error } = await supa.rpc('shop_buy', { item_id: itemId })
      if (error) throw error
      return data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['inventory'] })
      await qc.invalidateQueries({ queryKey: ['shop'] })
      await qc.invalidateQueries({ queryKey: ['whoAmI'] }) // refresh coins in header
      alert('Purchased!')
    },
    onError: (e: any) => alert(e?.message ?? 'Purchase failed'),
  })

  const equip = useMutation({
    mutationFn: async (args: { id: number; equip: boolean }) => {
      const { data, error } = await supa.rpc('inventory_activate', {
        entry_id: args.id,
      })
      if (error) throw error
      return data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['inventory'] })
      await qc.invalidateQueries({ queryKey: ['raidTargets'] }) // power may change
      alert('Loadout updated!')
    },
    onError: (e: any) => alert(e?.message ?? 'Equip failed'),
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Shop */}
      <section className="glassmorphism rounded-2xl p-4">
        <h3 className="font-heading mb-2">Shop</h3>
        {shop.isLoading ? <div className="opacity-70 text-sm">LoadingвЂ¦</div> : (
          <div className="space-y-2">
            {shop.data!.map(it => (
              <div key={it.id} className="rounded-xl border p-3 flex items-center justify-between">
                <div>
                  <div className="font-heading">{it.name} <span className="opacity-60 text-xs">({it.rarity})</span></div>
                  <div className="text-xs opacity-70">Slot: {it.slot} вЂў ATK {it.atk} вЂў DEF {it.def}</div>
                  <div className="text-xs opacity-70">{it.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm mb-2">{it.price} coins</div>
                  <button
                    className="rounded-xl px-3 py-2 border text-sm"
                    onClick={() => buy.mutate(it.id)}
                    disabled={!it.affordable || buy.isPending}
                  >
                    {it.affordable ? (buy.isPending ? 'BuyingвЂ¦' : 'Buy') : 'Too pricey'}
                  </button>
                  <div className="text-xs opacity-60 mt-1">Owned: {it.owned}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Inventory / Loadout */}
      <section className="glassmorphism rounded-2xl p-4">
        <h3 className="font-heading mb-2">My Loadout</h3>
        {inv.isLoading ? <div className="opacity-70 text-sm">LoadingвЂ¦</div> : (
          inv.data!.length === 0 ? <div className="opacity-70 text-sm">No gear yet.</div> :
          <div className="space-y-2">
            {inv.data!.map(it => (
              <div key={it.userItemId} className="rounded-xl border p-3 flex items-center justify-between">
                <div>
                  <div className="font-heading">{it.name} <span className="opacity-60 text-xs">({it.slot})</span></div>
                  <div className="text-xs opacity-70">ATK {it.atk} вЂў DEF {it.def}</div>
                  {it.equipped && <div className="text-xs text-emerald-400">Equipped</div>}
                </div>
                <button
                  className="rounded-xl px-3 py-2 border text-sm"
                  onClick={() => equip.mutate({ id: it.userItemId, equip: !it.equipped })}
                  disabled={equip.isPending}
                >
                  {equip.isPending ? 'UpdatingвЂ¦' : (it.equipped ? 'Unequip' : 'Equip')}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}


