import React, { createContext, useContext } from 'react'
import type { DataAPI } from './DataAPI'
import { supaAPI } from './supa/SupaAPI'
import { mockAPI } from './mock/MockAPI'


const impl = (import.meta.env.VITE_BACKEND === 'supabase') ? supaAPI : mockAPI


const Ctx = createContext<DataAPI>(impl)
export const DataAPIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
<Ctx.Provider value={impl}>{children}</Ctx.Provider>
)
export const useDataAPI = () => useContext(Ctx)