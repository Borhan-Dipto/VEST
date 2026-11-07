'use client';
import { createContext, useContext } from 'react';
export const RoleCtx = createContext<string>('staff');
export const useRole = () => useContext(RoleCtx);
