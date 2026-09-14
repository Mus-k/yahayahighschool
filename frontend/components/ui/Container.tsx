import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
}

export function Container({ className, children, as: Component = 'div', ...props }: ContainerProps) {
  return (
    <Component
      className={cn(
        'mx-auto w-full max-w-[1400px] px-[clamp(1rem,3vw,2.5rem)]',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
