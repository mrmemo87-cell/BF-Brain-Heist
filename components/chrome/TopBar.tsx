
import React from 'react';

export const TopBar: React.FC = () => {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center justify-center">
                <h1 className="text-2xl font-bold font-heading text-[hsl(var(--primary))] tracking-widest" style={{textShadow: 'var(--glow-primary)'}}>
                    BRAIN HEIST
                </h1>
            </div>
        </header>
    );
};
