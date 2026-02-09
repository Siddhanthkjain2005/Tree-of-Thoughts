'use client';

import { Trash2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SessionList({ sessions, activeSessionId, onSessionClick, onDeleteSession }) {
    if (!sessions || sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">No sessions found</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {sessions.map(session => (
                <button
                    key={session.id}
                    type="button"
                    onClick={() => onSessionClick(session.id)}
                    className={cn(
                        "group relative w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-colors",
                        activeSessionId === session.id
                            ? "bg-accent/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        activeSessionId === session.id ? "bg-accent" : "bg-border-hover"
                    )} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono truncate">{session.model}</span>
                            <span className={cn(
                                "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
                                activeSessionId === session.id
                                    ? "border-accent/30 text-accent bg-accent/5"
                                    : "border-border text-muted-foreground"
                            )}>
                                {session.mode}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(session.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={(e) => onDeleteSession(e, session.id)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <Trash2 size={13} />
                        </button>
                        <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                </button>
            ))}
        </div>
    );
}
