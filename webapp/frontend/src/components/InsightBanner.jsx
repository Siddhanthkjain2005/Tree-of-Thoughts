import { Sparkles } from 'lucide-react';

export default function InsightBanner({ text }) {
    if (!text) return null;

    return (
        <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-accent/10">
                <Sparkles size={16} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Performance Insight</p>
                <p className="text-sm text-foreground leading-relaxed">{text}</p>
            </div>
        </div>
    );
}
