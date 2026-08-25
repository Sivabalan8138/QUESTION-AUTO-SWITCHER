import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:10000';

interface SocketContextType {
  socket: Socket | null;
  timerValue: number;
  auctionState: string;
  roundData: any;
  bids: any[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  timerValue: 0,
  auctionState: 'IDLE',
  roundData: null,
  bids: [],
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [timerValue, setTimerValue] = useState(0);
  const [auctionState, setAuctionState] = useState('IDLE');
  const [roundData, setRoundData] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('timer_sync', (data: { timerValue: number }) => {
      setTimerValue(data.timerValue);
    });

    newSocket.on('auction_state', (data: { state: string; timerValue: number; roundData: any; bids: any[] }) => {
      setAuctionState(data.state);
      setTimerValue(data.timerValue);
      setRoundData(data.roundData);
      setBids(data.bids);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, timerValue, auctionState, roundData, bids }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
