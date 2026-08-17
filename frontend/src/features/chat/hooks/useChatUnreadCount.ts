import { useCallback, useEffect, useState } from 'react';

import { chatUnreadUpdatedEvent, getChatUnreadCount } from '../api/chatApi';

export function useChatUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadCount = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await getChatUnreadCount(signal);
      setUnreadCount(result.unreadCount);
    } catch {
      // Navigation remains usable during a temporary backend interruption.
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadCount(controller.signal);
    const interval = window.setInterval(() => void loadCount(), 15_000);

    function handleUpdate(event: Event) {
      const detail = (event as CustomEvent<{ unreadCount?: number }>).detail;
      if (typeof detail?.unreadCount === 'number') {
        setUnreadCount(detail.unreadCount);
      } else {
        void loadCount();
      }
    }

    window.addEventListener(chatUnreadUpdatedEvent, handleUpdate);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener(chatUnreadUpdatedEvent, handleUpdate);
    };
  }, [loadCount]);

  return unreadCount;
}
