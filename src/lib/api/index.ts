
'use client';

import React from 'react';
import { DataAPI } from './DataAPI';
import { MockAPI } from './MockAPI';

export const DataContext = React.createContext<DataAPI | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In a real app, you would swap this based on environment variables.
  const [api] = React.useState(() => new MockAPI());
  return React.createElement(DataContext.Provider, { value: api }, children);
};

