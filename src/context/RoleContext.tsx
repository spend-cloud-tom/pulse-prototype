import React, { createContext, useContext, useState } from 'react';
import { Role } from '@/data/types';
import { useSignals, DbSignal, DbSignalInsert } from '@/hooks/useSignals';
import { useMaintenanceTickets, MaintenanceTicket, MaintenanceTicketInsert } from '@/hooks/useMaintenanceTickets';

interface RoleContextType {
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  signals: DbSignal[];
  signalsLoading: boolean;
  addSignal: (signal: DbSignalInsert) => Promise<DbSignal>;
  updateSignal: (id: string, updates: Partial<DbSignal>) => Promise<void>;
  tickets: MaintenanceTicket[];
  ticketsLoading: boolean;
  createTicket: (ticket: MaintenanceTicketInsert) => Promise<MaintenanceTicket>;
  updateTicket: (id: string, updates: Partial<MaintenanceTicket>) => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<Role>('anouk');
  const { signals, loading: signalsLoading, addSignal, updateSignal } = useSignals();
  const { tickets, loading: ticketsLoading, createTicket, updateTicket } = useMaintenanceTickets();

  return (
    <RoleContext.Provider value={{
      activeRole, setActiveRole,
      signals, signalsLoading, addSignal, updateSignal,
      tickets, ticketsLoading, createTicket, updateTicket,
    }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within RoleProvider');
  return context;
};
