import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from './useGameStore';

export type OnlinePlayer = {
  socketId: string;
  playerId: string;
  username: string;
  district: string;
  x: number;
  z: number;
};

export function useSocket() {
  const store = useGameStore();
  const socketRef = useRef<Socket | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<Record<string, OnlinePlayer>>({});

  useEffect(() => {
    if (store.screen !== 'playing' || !store.username) return;

    const socket = io(window.location.origin, {
      path: '/api/socket.io',
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('player:join', {
        playerId: store.playerId ?? `guest_${socket.id}`,
        username: store.username,
        district: store.district,
      });
    });

    // Server sends full current player list when we connect
    socket.on('players:online', (players: OnlinePlayer[]) => {
      const map: Record<string, OnlinePlayer> = {};
      for (const p of players) {
        if (p.socketId !== socket.id) map[p.socketId] = p;
      }
      setOnlinePlayers(map);
    });

    // Another player joined
    socket.on('player:joined', (p: OnlinePlayer) => {
      setOnlinePlayers(prev => ({ ...prev, [p.socketId]: p }));
    });

    // Another player moved
    socket.on('player:moved', (data: { socketId: string; x: number; z: number; district: string }) => {
      setOnlinePlayers(prev => {
        const existing = prev[data.socketId];
        if (!existing) return prev;
        return { ...prev, [data.socketId]: { ...existing, x: data.x, z: data.z, district: data.district } };
      });
    });

    // Player disconnected
    socket.on('player:left', (data: { socketId: string }) => {
      setOnlinePlayers(prev => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [store.screen, store.username]);

  const emitMovement = (x: number, z: number, district: string) => {
    socketRef.current?.emit('player:move', { x, z, district });
  };

  return { onlinePlayers, emitMovement, socket: socketRef.current };
}
