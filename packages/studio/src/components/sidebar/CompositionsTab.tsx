import { memo } from "react";

interface CompositionsTabProps {
  projectId: string;
  compositions: string[];
  activeComposition: string | null;
  onSelect: (comp: string) => void;
}

function CompCard({
  comp,
  isActive,
  onSelect,
}: {
  comp: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  const name = comp.replace(/^compositions\//, "").replace(/\.html$/, "");

  return (
    <div
      onClick={onSelect}
      className={`w-full text-left px-2 py-1.5 flex items-center gap-2.5 transition-colors cursor-pointer ${
        isActive
          ? "bg-studio-accent/10 border-l-2 border-studio-accent"
          : "border-l-2 border-transparent hover:bg-neutral-800/50"
      }`}
    >
      <div className="w-20 h-[45px] rounded overflow-hidden bg-neutral-900/90 flex-shrink-0 relative border border-neutral-800">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(82,135,255,0.18),rgba(20,28,43,0.6))]" />
        <div className="absolute inset-y-0 left-0 w-[3px] bg-studio-accent/80" />
        <div className="absolute inset-x-0 top-0 px-2 py-1">
          <span className="block truncate text-[8px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Composition
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-2 py-1">
          <span className="block truncate text-[10px] font-medium text-neutral-200">{name}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-medium text-neutral-300 truncate block">{name}</span>
        <span className="text-[9px] text-neutral-600 truncate block">{comp}</span>
      </div>
    </div>
  );
}

export const CompositionsTab = memo(function CompositionsTab({
  projectId: _projectId,
  compositions,
  activeComposition,
  onSelect,
}: CompositionsTabProps) {
  if (compositions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-xs text-neutral-600 text-center">No compositions found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {compositions.map((comp) => (
        <CompCard
          key={comp}
          comp={comp}
          isActive={activeComposition === comp}
          onSelect={() => onSelect(comp)}
        />
      ))}
    </div>
  );
});
