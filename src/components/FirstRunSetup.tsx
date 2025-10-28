// src/components/FirstRunSetup.tsx
import React from 'react';
import { supa } from '@/SupabaseClient';

import { randomGravatar } from '@/lib/avatars';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

export default function FirstRunSetup({ me, onDone }: { me: any; onDone: () => void }) {
  const [username, setUsername] = React.useState(me?.username || '');
  const [batch, setBatch] = React.useState<string>(me?.batch || '8A');
  const [avatar, setAvatar] = React.useState(me?.avatarUrl || me?.avatar_url || randomGravatar());
  const [saving, setSaving] = React.useState(false);
  const [hasSession, setHasSession] = React.useState(false);

  React.useEffect(() => {
  let unsub: (() => void) | undefined;

  supa.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  const { data: sub } = supa.auth.onAuthStateChange(() => {
    supa.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  });
  unsub = () => sub.subscription.unsubscribe();

  return () => unsub?.();
}, []);

  const save = async () => {
    if (!hasSession) return; // guard
    if (!['8A','8B','8C'].includes((batch || '').toUpperCase())) {
      alert('Pick batch: 8A, 8B, or 8C'); return;
    }
    setSaving(true);
    try {
      const { error } = await supa.rpc('profile_bootstrap', {
        p_username: (username || 'agent').trim(),
        p_batch: (batch || '8A').toUpperCase(),
        p_avatar_url: (avatar || '').trim() || null,
      });
      if (error) throw error;
      onDone(); // parent invalidates whoAmI and hides modal
    } catch (e:any) {
      alert(e.message || 'Save failed');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-xl font-heading mb-4">Welcome! Set up your agent profile</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img src={avatar} className="w-16 h-16 rounded-xl object-cover" />
            <div className="space-x-2">
              <Button type="button" onClick={() => setAvatar(randomGravatar('identicon'))}>New Identicon</Button>
              <Button type="button" onClick={() => setAvatar(randomGravatar('monsterid'))}>New Monster</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Agent name</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="sobbi" />
          </div>

          <div className="space-y-2">
            <Label>Batch</Label>
            <div className="flex gap-2">
              {['8A','8B','8C'].map(b => (
                <Button key={b} variant={batch===b?'default':'secondary'} onClick={()=>setBatch(b)}>{b}</Button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={save} disabled={saving || !hasSession}>
            {saving ? 'SavingвЂ¦' : hasSession ? 'Save & Enter' : 'Waiting for sign-inвЂ¦'}
          </Button>
        </div>
      </div>
    </div>
  );
}

