'use client';

import { ChevronDown } from 'lucide-react';

export default function ModelSelector({ models, selectedModel, onSelect }) {
    return (
        <div className="relative">
            <select
                className="appearance-none bg-card border border-border text-foreground text-sm pl-3 pr-8 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors cursor-pointer hover:border-border-hover"
                value={selectedModel ? `${selectedModel.provider}|||${selectedModel.model}` : ""}
                onChange={(e) => {
                    const [provider, model] = e.target.value.split("|||");
                    onSelect({ provider, model });
                }}
            >
                {models.map(m => (
                    <option key={`${m.provider}|||${m.model}`} value={`${m.provider}|||${m.model}`}>
                        {m.provider.toUpperCase()} / {m.model}
                    </option>
                ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
    );
}
