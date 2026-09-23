'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

export const AdminRoute: React.FC = () => {
  const { isAdmin, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAdmin ? <AdminDashboard /> : <AdminLogin />;
};

export default AdminRoute;
