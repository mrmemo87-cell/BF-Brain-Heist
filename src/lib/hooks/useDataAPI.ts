
import { useContext } from 'react';
import { DataContext } from '@/lib/api';

export const useDataAPI = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataAPI must be used within a DataProvider');
  }
  return context;
};

