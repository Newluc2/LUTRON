import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WsEvent } from '@lutron/shared';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(WS_URL, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function useSocket(event: WsEvent, handler: (data: unknown) => void) {
  useEffect(() => {
    const s = getSocket();
    s.on(event, handler);
    return () => {
      s.off(event, handler);
    };
  }, [event, handler]);
}

export function useSocketRefresh(event: WsEvent, refresh: () => void) {
  useSocket(event, refresh);
}
