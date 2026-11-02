import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FolderOpen, Terminal } from 'lucide-react';
import { ReaToolCall } from '../rea/reaEngineLogic';

interface ReaToolCallCardProps {
  call: ReaToolCall;
  showLogs?: boolean;
  onInspectProjectFiles?: () => void;
}

export const ReaToolCallCard: React.FC<ReaToolCallCardProps> = ({
  call,
  showLogs = true,
  onInspectProjectFiles,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      data-testid={`rea-tool-card-${call.tool}`}
      className="my-2.5 max-w-xl rounded-xl border border-red-500/40 bg-[#09090B] shadow-[0_0_20px_rgba(239,68,68,0.12)] overflow-hidden transition-all"
    >
      {/* Clozed Code-style Header Box */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-red-950/40 via-zinc-900/80 to-zinc-950 border-b border-red-500/25 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs sm:text-sm font-semibold tracking-tight text-red-300 truncate">
            🔴 rea › {call.tool}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-red-500/15 text-red-300 border border-red-500/30 rounded">
            MCP • STDIO
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] text-zinc-400">{call.durationMs}ms</span>
          {showLogs && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-label={`Toggle logs for rea ${call.tool}`}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Path & Live Status Line (Clozed Code ASCII box aesthetic) */}
      <div className="px-3.5 py-2.5 font-mono text-xs space-y-1 bg-[#070709]">
        <div className="text-zinc-300 break-all">{call.projectPath}</div>
        <div className="text-emerald-400 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 shrink-0 text-red-400" />
          <span>
            {call.targetFile} → {call.statusLine}
          </span>
        </div>
      </div>

      {/* Expandable REA trace/decompile log */}
      {showLogs && expanded && (
        <div className="px-3.5 py-2.5 bg-black/90 border-t border-white/10 font-mono text-[11px] text-zinc-300 space-y-2">
          <pre className="whitespace-pre-wrap text-emerald-300/90 leading-relaxed">
            {call.outputSummary}
          </pre>
          {onInspectProjectFiles && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={onInspectProjectFiles}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-sans font-medium transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-red-400" />
                Open in /SOURCE_READER/ Explorer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
