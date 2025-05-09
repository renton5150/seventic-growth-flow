
import React, { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        {children}
      </div>
    </AppLayout>
  );
};
