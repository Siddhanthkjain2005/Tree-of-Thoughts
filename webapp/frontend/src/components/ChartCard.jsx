import { cn } from '../lib/utils';

export default function ChartCard({ title, subtitle, action, children, className }) {
    return (
        <div className={cn(
            "rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-border-hover",
            className
        )}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
            <div className="px-3 pb-4">
                {children}
            </div>
        </div>
    );
}
