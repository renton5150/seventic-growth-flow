
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  action,
  children,
  className
}: PageHeaderProps) => {
  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {(action || children) && (
        <div className="mt-2 sm:mt-0">{action || children}</div>
      )}
    </div>
  );
};
