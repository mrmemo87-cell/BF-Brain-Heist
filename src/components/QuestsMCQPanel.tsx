import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useDataAPI } from '@/services/data'
import { Audio } from '@/lib/audio'
import { toast } from '@/lib/toast'
import { supa } from '@/SupabaseClient'

type Question = {
  id: number
  subject_id: number
  body: string
  opt1: string; opt2: string; opt3: string; opt4: string
  difficulty: number
}

export default function QuestsMCQPanel() {
  const dataAPI = useDataAPI()
  const qc = useQueryClient()
  const [subject, setSubject] = React.useState<number | null>(null)

  React.useEffect(()=>Audio.init(),[])

  const next = useQuery({
    queryKey: ['mcqNext', subject],
    queryFn: () => dataAPI.mcqNext(subject ?? undefined),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const submit = useMutation({
    mutationFn: (choice: 1|2|3|4) => dataAPI.mcqSubmit(((next.data as any)?.id) as number, choice),
    onSuccess: async (res: any) => {
      if ((res as any).correct) {
        toast.success('Correct!', `+${(res as any).xp} XP В· +${(res as any).coins} coins`)
        await supa.rpc('news_add', {
          p_kind: 'quest',
          p_title: 'MCQ complete',
          p_body: `+${(res as any).xp} XP В· +${(res as any).coins} coins`
        })
        Audio.play('success');
      } else {
        toast.warn('AlmostвЂ¦', 'Try the next one!')
        Audio.play('fail')
      }
      await qc.invalidateQueries({ queryKey: ['whoAmI'] })
      qc.invalidateQueries({ queryKey: ['newsFeed'] })
    }
  })

  const [revealed, setRevealed] = React.useState<null | {correctIndex:number; chosen:number}>(null)

  const choose = (i: 1|2|3|4) => {
    const d: any = next.data as any
    if (!d || ('done' in d) || submit.isPending) return
    submit.mutate(i, {
      onSuccess: (res)=> {
        setRevealed({ correctIndex: (res as any).correctIndex, chosen: i })
        setTimeout(()=>{
          setRevealed(null)
          qc.invalidateQueries({ queryKey: ['mcqNext', subject] })
        }, 900)
      }
    })
  }

  const d: any = next.data as any
  const q = (!next.isLoading && d && !('done' in d)) ? (d as Question) : null

  return (
    <div className="max-w-md mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="font-heading text-xl">Daily Quests</h3>
        <select
          className="border rounded-xl bg-transparent px-3 py-2 text-sm"
          value={subject ?? ''}
          onChange={(e)=> setSubject(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Subjects</option>
          {/* If you have a subjects table in UI, map it; else keep All */}
          <option value="1">Math</option>
          <option value="2">Science</option>
          <option value="3">History</option>
        </select>
      </header>

      <section className="glassmorphism rounded-2xl p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {next.isLoading ? (
            <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="opacity-70 text-sm">
              Loading questionвЂ¦
            </motion.div>
          ) : !q ? (
            <motion.div key="done" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
              <div className="text-center py-10">
                <div className="font-heading text-lg mb-2">YouвЂ™re all caught up рџЋ‰</div>
                <div className="opacity-70 text-sm">Come back later for more.</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key={q.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
              <div className="mb-3 font-medium">{q.body}</div>
              <div className="grid gap-2">
                {[q.opt1, q.opt2, q.opt3, q.opt4].map((opt, idx) => {
                  const i = (idx+1) as 1|2|3|4
                  const isCorrect = revealed && revealed.correctIndex === i
                  const isChosen = revealed && revealed.chosen === i
                  return (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      key={i}
                      disabled={!!revealed || submit.isPending}
                      onClick={() => { Audio.play('click'); choose(i) }}
                      className={`rounded-xl border px-3 py-3 text-left transition
                        ${isCorrect ? 'bg-green-600/30 border-green-500' : isChosen ? 'bg-red-600/30 border-red-500' : 'hover:bg-white/5'}`}
                      style={isCorrect ? {boxShadow: '0 0 12px rgba(34,197,94,.5)'} : undefined}
                    >
                      <span className="opacity-70 mr-2">{String.fromCharCode(64+i)}.</span>{opt}
                    </motion.button>
                  )
                })}
              </div>
              <div className="mt-3 text-xs opacity-70">Difficulty: {q.difficulty}/5</div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}


