import { cn } from '../lib/utils';

export default function StatCard({ label, value, icon: Icon, trend, className }) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-colors hover:border-border-hover",
            className
        )}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {Icon && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                        <Icon size={16} className="text-muted-foreground" />
                    </div>
                )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
                <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
                {trend && (
                    <span className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded",
                        trend > 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                    )}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
        </div>
    );
}
