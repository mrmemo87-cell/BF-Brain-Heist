
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  glowColor?: 'primary' | 'accent';
  children: React.ReactNode;
}

export const NeonCard: React.FC<NeonCardProps> = ({ title, children, glowColor = 'primary', className, ...props }) => {
    const glowClass = glowColor === 'primary' ? 'shadow-[var(--glow-primary)]' : 'shadow-[var(--glow-accent)]';
    const borderClass = glowColor === 'primary' ? 'border-[hsl(var(--primary))]' : 'border-[hsl(var(--accent))]';

    return (
        <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${glowClass} ${className || ''}`} {...props}>
            <div className={`absolute inset-0 border-2 rounded-2xl opacity-50 ${borderClass}`}></div>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
};

