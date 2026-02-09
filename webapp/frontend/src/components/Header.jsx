import { Activity, FlaskConical } from 'lucide-react';

export default function Header({ sessionCount }) {
    return (
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10">
                    <FlaskConical size={18} className="text-accent" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-foreground tracking-tight">Experiment Dashboard</h1>
                    <p className="text-xs text-muted-foreground">Model performance tracking and analysis</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground">
                    <Activity size={12} className="text-success" />
                    <span className="font-medium text-foreground">{sessionCount}</span>
                    <span>sessions</span>
                </div>
            </div>
        </header>
    );
}
