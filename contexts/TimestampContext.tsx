"use client"
import React, { createContext, useContext, useState } from 'react';

interface TimestampContextProps {
  hooktimestamp: string;
  setHookTimestamp: (timestamp: string) => void;
}

interface TimestampProviderProps {
  children: React.ReactNode;
}

const TimestampContext = createContext<TimestampContextProps>({
  hooktimestamp: '',
  setHookTimestamp: () => {},
});

export const useTimestamp = () => useContext(TimestampContext);

export const TimestampProvider: React.FC<TimestampProviderProps> = ({ children }) => {
  const [hooktimestamp, setHookTimestamp] = useState('');

  return (
    <TimestampContext.Provider value={{ hooktimestamp, setHookTimestamp }}>
      {children}
    </TimestampContext.Provider>
  );
};