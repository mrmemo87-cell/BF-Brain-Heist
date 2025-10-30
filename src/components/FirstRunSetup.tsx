// src/components/FirstRunSetup.tsx
import * as React from 'react';
import { supa } from '@/SupabaseClient';
import { randomGravatar } from '@/lib/avatars';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useNavigate } from 'react-router-dom';

type Props = {
  me: any;            // parent provides current profile (or null-ish on first run)
  onDone?: () => void; // optional - parent should invalidate whoAmI and close overlay
};

export default function FirstRunSetup({ me, onDone }: Props) {
  const nav = useNavigate();
  const done = onDone ?? (() => nav('/leaderboard')); // <- default fallback
  const [username, setUsername] = React.useState<string>(me?.username ?? '');
  const [batch, setBatch] = React.useState<string>((me?.batch ?? '').toUpperCase());
  const [avatar, setAvatar] = React.useState<string>(me?.avatar_url ?? me?.avatarUrl ?? randomGravatar());
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const validBatch = (b: string) => ['8A', '8B', '8C'].includes((b ?? '').toUpperCase());

  async function save() {
    setMsg(null);
    try {
      setSaving(true);
      const b = (batch || '8A').toUpperCase();
      if (!validBatch(b)) {
        setMsg('Choose batch: 8A, 8B, or 8C.');
        return;
      }

      // 1) lock batch exactly once (creates profile if missing)
      const r1 = await supa.rpc('set_batch_once', { p_batch: b });
      if (r1.error && !/already chosen/i.test(r1.error.message || '')) throw r1.error;

      // 2) optional cosmetics (ignore if rpc missing in some envs)
      const uname = (username ?? '').trim();
      const aurl = (avatar ?? '').trim();
      if (uname || aurl) {
        const r2 = await supa.rpc('profile_update', {
          p_username: uname || null,
          p_avatar_url: aurl || null,
          p_batch: b,
        });
        // PGRST116 = rpc not found; skip in older DBs
        if (r2.error && r2.error.code !== 'PGRST116') throw r2.error;
      }

      // 3) let parent refresh its "me" query
      done();
    } catch (e: any) {
      setMsg(e?.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-xl font-semibold mb-4 text-white">Welcome! Set up your agent profile</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img src={avatar} className="w-16 h-16 rounded-xl object-cover" alt="avatar" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => setAvatar(randomGravatar('identicon'))}>New Identicon</Button>
              <Button type="button" onClick={() => setAvatar(randomGravatar('monsterid'))}>New Monster</Button>
              <Button type="button" variant="secondary" onClick={() => setAvatar(randomGravatar())}>Random</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Agent name</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="sobbi" />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Batch</Label>
            <div className="flex gap-2">
              {['8A', '8B', '8C'].map(b => (
                <Button
                  key={b}
                  variant={batch === b ? 'default' : 'secondary'}
                  onClick={() => setBatch(b)}
                >
                  {b}
                </Button>
              ))}
            </div>
            <p className="text-xs text-white/60">Once you pick a batch, it’s locked forever.</p>
          </div>

          {msg && <div className="text-sm text-rose-400">{msg}</div>}

          <Button className="w-full" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Enter'}
          </Button>
        </div>
      </div>
    </div>
  );
}
