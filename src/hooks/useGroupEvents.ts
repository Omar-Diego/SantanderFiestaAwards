import { useState, useEffect } from 'react';
import { subscribeToEvents } from '../services/events';
import type { GroupEvent } from '../types';

/**
 * Real-time subscription to the group's activity feed (Alertas).
 * Events arrive ordered newest-first; the UI keeps the latest few.
 */
export function useGroupEvents(groupId: string | null) {
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToEvents(
      groupId,
      (updated) => {
        setEvents(updated);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, [groupId]);

  return { events, loading };
}
