import { useQuery } from '@tanstack/react-query';
import { useDataAPI } from '@/services/data';

export function TopBar() {
  const api = useDataAPI();
  const { data: me, isLoading } = useQuery({
    queryKey: ['whoAmI'],
    queryFn: () => api.whoAmI(),
  });

  if (isLoading) return null; // or skeleton
  // if (!me) show "Sign in" or nothing — but DO NOT use demo fallback

  return (
    <div>
      {me ? (
        <>
          <span>{me.username}</span>
          <span>Batch {me.batch}</span>
          <span>L{me.level} • {me.xp} XP • {me.coins} coins</span>
        </>
      ) : (
        <span>Not signed in</span>
      )}
    </div>
  );
}
