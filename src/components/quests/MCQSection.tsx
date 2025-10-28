import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supa } from '@/SupabaseClient'
import { toast } from '../../lib/toast'
import { useSfx } from '../../hooks/useSfx'
import { confettiBurst, shake } from '../../lib/fx'

type MCQResult = {
  is_correct: boolean
  xp_delta: number
  coins_delta: number
  correct_text?: string
}

export default function MCQSection() {
  const qc = useQueryClient()
  const sfx = useSfx()
  const boxRef = React.useRef<HTMLDivElement>(null)
  const [selected, setSelected] = React.useState<number[]>([])
  const [current, setCurrent] = React.useState<any | null>(null)
  const [result, setResult] = React.useState<MCQResult | null>(null)

  const subjects = useQuery({
    queryKey: ['mcqSubjects'],
    queryFn: async () => {
      const { data, error } = await supa.rpc('mcq_subjects_list')
      if (error) throw error
      return data as Array<{ id: number; name: string }>
    },
  })

  const loadQ = useMutation({
    mutationFn: async (ids: number[]) => {
      const { data, error } = await supa.rpc('mcq_questions_by_subjects', {
        p_subject_ids: ids,
        p_limit: 1,
      })
      if (error) throw error
      return (data ?? [])[0] ?? null
    },
    onSuccess: q => {
      setCurrent(q)
      setResult(null)
    },
  })

  const submitAnswer = useMutation({
    mutationFn: async (choice: 1 | 2 | 3 | 4) => {
      if (!current) throw new Error('No question loaded')
      const r = await supa.rpc('mcq_answer_submit', {
        p_question_id: current.id,
        p_choice: choice,
      })
      if (r.error) throw new Error(r.error.message)
      return r.data?.[0]
    },
    onSuccess: r => {
      setResult(r)
      if (r.is_correct) {
        sfx.play('reward')
        confettiBurst()
      } else {
        sfx.play('wrong')
        shake(boxRef.current)
      }
      qc.invalidateQueries({ queryKey: ['whoAmI'] })
      qc.invalidateQueries({ queryKey: ['newsFeed'] })
    },
    onError: (e: any) => toast.error('MCQ failed', e.message || 'RPC error'),
  })

  const handleNext = () => {
    if (selected.length) {
      loadQ.mutate(selected)
    } else {
      setCurrent(null)
      setResult(null)
    }
  }

  return (
    <section className="card-glass rounded-2xl p-4">
      <div className="mb-2 text-lg font-heading">MCQ</div>

      {/* subject filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        {subjects.data?.map(s => {
          const on = selected.includes(s.id)
          return (
            <label
              key={s.id}
              className={`cursor-pointer rounded-full border px-3 py-1 ${
                on ? 'btn-neon' : 'opacity-80'
              }`}>
              <input
                type="checkbox"
                className="hidden"
                checked={on}
                onChange={() =>
                  setSelected(on ? selected.filter(x => x !== s.id) : [...selected, s.id])
                }
              />
              {s.name}
            </label>
          )
        })}
      </div>

      <button
        className="btn-neon rounded-xl px-4 py-2"
        onClick={handleNext}
        disabled={!selected.length || loadQ.isPending}>
        {loadQ.isPending ? 'LoadingвЂ¦' : 'Next question'}
      </button>

      {/* question card */}
      <div ref={boxRef}>
        {current && !result && (
          <div className="shimmer2 card-glass mt-4 rounded-xl p-3">
            <div className="mb-3">{current.body}</div>
            <div className="grid grid-cols-1 gap-2">
              {[1, 2, 3, 4].map(i => (
                <button
                  key={i}
                  onClick={() => submitAnswer.mutate(i as 1 | 2 | 3 | 4)}
                  disabled={submitAnswer.isPending}
                  className="rounded-xl border px-3 py-2 text-left hover:bg-white/5">
                  {current[`opt${i}`]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* result card */}
      {result && (
        <div className="shimmer2 card-glass mt-4 rounded-xl p-4">
          <div className={`font-heading text-xl ${result.is_correct ? 'gradient-text' : ''}`}>
            {result.is_correct ? 'Correct!' : 'Oops, wrong'}
          </div>
          <div className="mt-2 text-sm">
            {result.is_correct ? (
              <>
                +{result.xp_delta} XP В· +{result.coins_delta} coins
              </>
            ) : (
              <>
                Correct answer: <b>{result.correct_text}</b>
                <br />
                {result.xp_delta} XP В· {result.coins_delta} coins
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

