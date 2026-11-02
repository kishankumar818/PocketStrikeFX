import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Dna,
  Download,
  ExternalLink,
  FolderTree,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Square,
  Terminal,
  WifiOff,
  Wrench,
} from 'lucide-react';
import {
  APP_CONFIG_PATH,
  AppConfigJson,
  DISCORD_SUPPORT_URL,
  DiagnosticCondition,
  EXACT_GRADLE_PROPERTIES,
  McpServerStatus,
  REA_GITHUB_URL,
  REA_MCP_CONFIG_PATH,
  REA_ROOT_PATH,
  REA_WEBSITE_URL,
  ReaInstallStatus,
  SetupLogStep,
  formatReaMcpConfigJson,
  getSetupTerminalSequence,
  validateMcpPort,
} from '../rea/reaEngineLogic';

interface ReaSettingsSectionProps {
  installStatus: ReaInstallStatus;
  reaVersion: string | null;
  mcpStatus: McpServerStatus;
  mcpPort: number;
  autoStartOnLaunch: boolean;
  showLogsInChat: boolean;
  diagnosticMode: DiagnosticCondition;
  onChangeDiagnosticMode: (mode: DiagnosticCondition) => void;
  onCompleteSetup: (version: string) => void;
  onResetRea: () => void;
  onSetMcpStatus: (status: McpServerStatus) => void;
  onSetMcpPort: (port: number) => void;
  onToggleAutoStart: (val: boolean) => void;
  onToggleShowLogs: (val: boolean) => void;
  onTriggerOutdated: () => void;
  onSimulateCrashRestart: () => void;
  onOpenStorageExplorer: () => void;
  onBack?: () => void;
  crashNotification: string | null;
}

export const ReaSettingsSection: React.FC<ReaSettingsSectionProps> = ({
  installStatus,
  reaVersion,
  mcpStatus,
  mcpPort,
  autoStartOnLaunch,
  showLogsInChat,
  diagnosticMode,
  onChangeDiagnosticMode,
  onCompleteSetup,
  onResetRea,
  onSetMcpStatus,
  onSetMcpPort,
  onToggleAutoStart,
  onToggleShowLogs,
  onTriggerOutdated,
  onSimulateCrashRestart,
  onOpenStorageExplorer,
  onBack,
  crashNotification,
}) => {
  const [terminalLogs, setTerminalLogs] = useState<SetupLogStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [needsNodeInstallPrompt, setNeedsNodeInstallPrompt] = useState(false);
  const [isInstallingNode, setIsInstallingNode] = useState(false);
  const [editingPort, setEditingPort] = useState(false);
  const [portDraft, setPortDraft] = useState(String(mcpPort));
  const [portError, setPortError] = useState<string | null>(null);
  const [activeConfigTab, setActiveConfigTab] = useState<'mcp' | 'gradle' | 'app'>('mcp');

  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    setPortDraft(String(mcpPort));
  }, [mcpPort]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const runSetupPipeline = (overrideMode?: DiagnosticCondition) => {
    const mode = overrideMode ?? diagnosticMode;
    clearTimers();
    setNeedsNodeInstallPrompt(false);

    if (mode === 'missing_termux') {
      setTerminalLogs([
        {
          step: 1,
          line: '[STEP 1/4] Checking Termux environment on device…',
          type: 'info',
        },
        {
          step: 1,
          line: '✗ Error: com.termux package not detected on device.',
          type: 'error',
        },
      ]);
      return;
    }

    if (mode === 'missing_nodejs') {
      setNeedsNodeInstallPrompt(true);
      setTerminalLogs([
        {
          step: 1,
          line: '[STEP 1/4] Checking Termux + Node.js runtime…',
          type: 'info',
        },
        {
          step: 1,
          line: '⚠ Node.js / npx not found in /data/data/com.termux/files/usr/bin',
          type: 'warn',
        },
      ]);
      return;
    }

    if (mode === 'no_internet') {
      setIsSettingUp(true);
      setCurrentStep(2);
      setTerminalLogs([
        {
          step: 1,
          line: '[STEP 1/4] Termux + Node.js v22.11.0 verified.',
          type: 'info',
        },
        {
          step: 2,
          line: '$ npx rea-agents@latest setup',
          type: 'cmd',
        },
        {
          step: 2,
          line: '✗ Network Error: ENOTFOUND registry.npmjs.org — No internet connection during download.',
          type: 'error',
        },
      ]);
      setIsSettingUp(false);
      return;
    }

    if (mode === 'setup_failed') {
      setIsSettingUp(true);
      setCurrentStep(3);
      setTerminalLogs([
        {
          step: 1,
          line: '[STEP 1/4] Termux + Node.js v22.11.0 verified.',
          type: 'info',
        },
        {
          step: 2,
          line: '$ npx rea-agents@latest setup',
          type: 'cmd',
        },
        {
          step: 3,
          line: '✗ Fatal Error: EACCES permission denied writing /SOURCE_READER/rea/bin/rea-core (exit code 126)',
          type: 'error',
        },
      ]);
      setIsSettingUp(false);
      return;
    }

    // Normal 4-step animated setup sequence
    const seq = getSetupTerminalSequence(mcpPort);
    setIsSettingUp(true);
    setTerminalLogs([]);
    setCurrentStep(1);

    seq.forEach((item, index) => {
      const timerId = window.setTimeout(() => {
        setCurrentStep(item.step);
        setTerminalLogs((prev) => [...prev, item]);
        if (index === seq.length - 1) {
          setIsSettingUp(false);
          onCompleteSetup('1.4.2');
        }
      }, (index + 1) * 140);
      timersRef.current.push(timerId);
    });
  };

  const handleInstallNodeViaTermux = () => {
    setIsInstallingNode(true);
    setTerminalLogs((prev) => [
      ...prev,
      {
        step: 1,
        line: '$ pkg install nodejs -y',
        type: 'cmd',
      },
      {
        step: 1,
        line: '  ↳ Installing nodejs (22.11.0-1) & npm (10.9.0) into Termux usr/bin…',
        type: 'info',
      },
    ]);

    const t = window.setTimeout(() => {
      setIsInstallingNode(false);
      setNeedsNodeInstallPrompt(false);
      onChangeDiagnosticMode('normal');
      runSetupPipeline('normal');
    }, 350);
    timersRef.current.push(t);
  };

  const handleSavePort = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateMcpPort(portDraft);
    if (!validation.valid) {
      setPortError(validation.error ?? 'Invalid port');
      return;
    }
    setPortError(null);
    onSetMcpPort(validation.port);
    setEditingPort(false);
  };

  const appConfigPreview: AppConfigJson = {
    reaInstalled: installStatus === 'ready' || installStatus === 'outdated',
    reaVersion: reaVersion,
    reaPath: REA_ROOT_PATH,
    mcpServerStatus: mcpStatus,
    mcpPort,
    autoStartOnLaunch,
    showLogsInChat,
    lastUpdated: new Date().toISOString(),
  };

  const isReady = installStatus === 'ready';
  const isOutdated = installStatus === 'outdated';

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb / Back Navigation when inside dedicated REA view */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Settings</span>
          </button>
          <div className="flex items-center gap-2">
            <a
              href={REA_WEBSITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors"
            >
              <span>rea.tools</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-zinc-700">•</span>
            <a
              href={REA_GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors"
            >
              <span>github.com/morluto/rea</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Crash Auto-Restart Notification Banner */}
      {crashNotification && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{crashNotification}</span>
          </div>
          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Auto-Recovered
          </span>
        </div>
      )}

      {/* Main Clozed Code-Style REA Engine Card */}
      <div
        data-testid="rea-engine-card"
        className="rounded-2xl border border-white/15 bg-[#0B0B0E] shadow-[0_8px_32px_rgba(0,0,0,0.75)] overflow-hidden"
      >
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-red-950/35 via-zinc-900/60 to-black flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center shadow-[0_0_16px_rgba(239,68,68,0.25)]">
              <Dna className="w-5 h-5 text-red-400" />
              <span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-black animate-rea-red-pulse"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  🔴 REA Engine
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-red-500/15 text-red-300 border border-red-500/30">
                  Offline Module
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Reverse Engineering Core for AI Agent
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenStorageExplorer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-zinc-200 transition-colors"
          >
            <FolderTree className="w-3.5 h-3.5 text-red-400" />
            <span>/SOURCE_READER/</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-5">
          {/* Status / Version / Path Monospace Block */}
          <div className="p-3.5 rounded-xl bg-[#070709] border border-white/10 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Status:</span>
              <span data-testid="rea-install-status" className="font-semibold">
                {isSettingUp ? (
                  <span className="text-amber-400">⚡ Installing (Step {currentStep}/4)…</span>
                ) : isReady ? (
                  <span className="text-emerald-400">✅ Ready</span>
                ) : isOutdated ? (
                  <span className="text-amber-400">⚠️ Update Available (v1.3.0 → v1.4.2)</span>
                ) : (
                  <span className="text-zinc-300">● Not Installed</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Version:</span>
              <span data-testid="rea-version-value" className="text-zinc-200">
                {reaVersion ? `v${reaVersion} (rea-agents@latest)` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Path:</span>
              <span className="text-red-300">{REA_ROOT_PATH}</span>
            </div>
          </div>

          {/* Primary CTA Button(s) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isSettingUp}
              onClick={() => runSetupPipeline()}
              className={`flex-1 min-w-[220px] py-2.5 px-4 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                isReady
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              }`}
            >
              {isReady ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                {isSettingUp
                  ? 'SETTING UP REA ENGINE…'
                  : isOutdated
                  ? 'UPDATE REA (npx rea-agents@latest setup)'
                  : isReady
                  ? 'REA INSTALLED & READY — RE-VERIFY'
                  : 'DOWNLOAD & SETUP REA'}
              </span>
            </button>

            {isReady && (
              <button
                type="button"
                onClick={onTriggerOutdated}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-zinc-300 transition-colors cursor-pointer"
              >
                Simulate Update Available
              </button>
            )}
          </div>

          {/* Guided Prompt: Node.js Missing in Termux (STEP 1 Fallback) */}
          {needsNodeInstallPrompt && (
            <div
              data-testid="nodejs-guided-prompt"
              className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <Terminal className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-200">
                    REA needs Node.js. Tap below to install via Termux.
                  </p>
                  <p className="text-[11px] font-mono text-amber-300/80">
                    Executes: pkg install nodejs -y (via Termux API bridge)
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isInstallingNode}
                onClick={handleInstallNodeViaTermux}
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold transition-colors"
              >
                {isInstallingNode
                  ? 'Running pkg install nodejs -y…'
                  : 'Install Node.js via Termux (pkg install nodejs -y)'}
              </button>
            </div>
          )}

          {/* Error Handling Card: Termux Not Installed */}
          {diagnosticMode === 'missing_termux' && (
            <div
              data-testid="termux-install-guide"
              className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2.5"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Termux Not Installed — Setup Guide</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Source Reader uses Termux once to unpack the offline REA Engine into{' '}
                <code className="text-red-300">/SOURCE_READER/rea/</code>. Install Termux + Termux:API from F-Droid or GitHub Releases, then tap Retry.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onChangeDiagnosticMode('normal');
                    runSetupPipeline('normal');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-semibold"
                >
                  Termux Installed — Retry Setup
                </button>
              </div>
            </div>
          )}

          {/* Error Handling Card: No Internet During Download */}
          {diagnosticMode === 'no_internet' && (
            <div
              data-testid="offline-retry-card"
              className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-amber-200">
                    No internet connection during download
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Once downloaded, REA runs 100% offline from /SOURCE_READER/rea/.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onChangeDiagnosticMode('normal');
                  runSetupPipeline('normal');
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold shrink-0"
              >
                Retry Download
              </button>
            </div>
          )}

          {/* Error Handling Card: Setup Failed + Exact Error Log + Discord Link */}
          {diagnosticMode === 'setup_failed' && (
            <div
              data-testid="setup-failed-discord-card"
              className="p-4 rounded-xl bg-red-950/35 border border-red-500/45 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  REA Setup Failed (Exit Code 126)
                </span>
                <a
                  href={DISCORD_SUPPORT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-mono"
                >
                  <span>Join Support Discord</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <pre className="p-2.5 rounded bg-black/80 border border-red-500/20 font-mono text-[11px] text-red-300 overflow-x-auto">
                {`EACCES: permission denied, chmod '/SOURCE_READER/rea/node_modules/.bin/rea-agents'\nNeed help? Share this log on Discord: ${DISCORD_SUPPORT_URL}`}
              </pre>
              <button
                type="button"
                onClick={() => {
                  onChangeDiagnosticMode('normal');
                  runSetupPipeline('normal');
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-mono"
              >
                Fix Permissions & Retry
              </button>
            </div>
          )}

          {/* Live Animated Terminal-Style Scrolling Log */}
          {terminalLogs.length > 0 && (
            <div
              data-testid="rea-terminal-log"
              className="rounded-xl border border-emerald-500/30 bg-[#050507] overflow-hidden"
            >
              <div className="px-3 py-1.5 bg-zinc-950 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>termux-shell — /SOURCE_READER/rea/</span>
                </span>
                <span className="text-emerald-400">
                  {isSettingUp ? `Step ${currentStep}/4` : 'Done'}
                </span>
              </div>
              <div
                ref={logContainerRef}
                className="p-3 max-h-44 overflow-y-auto font-mono text-xs space-y-1.5"
              >
                {terminalLogs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.type === 'error'
                        ? 'text-red-400'
                        : log.type === 'warn'
                        ? 'text-amber-300'
                        : log.type === 'cmd'
                        ? 'text-emerald-300 font-semibold'
                        : log.type === 'success'
                        ? 'text-emerald-400 font-bold'
                        : 'text-emerald-500/90'
                    }
                  >
                    {log.line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Banner after Step 4 */}
          {isReady && (
            <div
              data-testid="rea-ready-banner"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-200"
            >
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>✅ REA Engine is ready. AI agent can now use it offline.</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-300/80 shrink-0">
                5 MCP tools active
              </span>
            </div>
          )}

          {/* ── What REA does ── */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                ── What REA does
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              REA gives the AI agent the ability to inspect any APK, trace code logic, and recover full source structure. Stored 100% offline inside{' '}
              <code className="font-mono text-red-300">/SOURCE_READER/rea/</code> so no separate setup is ever needed again.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {[
                'Inspect APKs, binaries & JS bundles',
                'Trace function calls in static/running code',
                'Decompile DEX & native .so to pseudocode',
                'Analyse smali, ARM, x64 & recover rules',
              ].map((item) => (
                <div
                  key={item}
                  className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-zinc-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── MCP Server ── */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                ── MCP Server
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="p-3.5 rounded-xl bg-[#070709] border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Status:</span>
                <div
                  data-testid="mcp-server-status"
                  className="flex items-center gap-2 font-semibold"
                >
                  {mcpStatus === 'running' ? (
                    <>
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-rea-green-pulse"
                        aria-hidden="true"
                      />
                      <span className="text-emerald-400">🟢 Running</span>
                    </>
                  ) : (
                    <>
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-500"
                        aria-hidden="true"
                      />
                      <span className="text-zinc-400">● Stopped</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400">Port:</span>
                {!editingPort ? (
                  <div className="flex items-center gap-2">
                    <span data-testid="mcp-port-display" className="text-white font-semibold">
                      {mcpPort}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingPort(true)}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-[11px] text-red-300 transition-colors"
                    >
                      [Change]
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSavePort} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      aria-label="MCP Server Port"
                      value={portDraft}
                      onChange={(e) => setPortDraft(e.target.value)}
                      className="w-24 px-2 py-1 rounded bg-black border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-sans font-semibold"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPort(false);
                        setPortError(null);
                        setPortDraft(String(mcpPort));
                      }}
                      className="px-2 py-1 rounded bg-white/10 text-zinc-300 text-[11px] font-sans"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
              {portError && <div className="text-[11px] text-red-400">{portError}</div>}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onSetMcpStatus('running')}
                  disabled={mcpStatus === 'running'}
                  className="py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>START MCP SERVER</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetMcpStatus('stopped')}
                  disabled={mcpStatus === 'stopped'}
                  className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border border-white/15 text-zinc-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>STOP MCP SERVER</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Advanced ── */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                ── Advanced
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="space-y-2">
              <label className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.05] transition-colors">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Auto-start REA on app launch
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Automatically boots the stdio MCP bridge when Source Reader opens
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoStartOnLaunch}
                  onChange={(e) => onToggleAutoStart(e.target.checked)}
                  className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.05] transition-colors">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Show REA logs in agent chat
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Render Clozed Code-style 🔴 rea › tool-call cards during APK analysis
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showLogsInChat}
                  onChange={(e) => onToggleShowLogs(e.target.checked)}
                  className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    clearTimers();
                    setTerminalLogs([]);
                    onResetRea();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-300 font-mono text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset / Reinstall REA</span>
                </button>

                <button
                  type="button"
                  onClick={onSimulateCrashRestart}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 font-mono text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Crash Auto-Restart</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Offline Config & gradle.properties Inspector ── */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                ── Offline Config & Fast-Build gradle.properties
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveConfigTab('mcp')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                  activeConfigTab === 'mcp'
                    ? 'bg-red-500/20 text-red-200 border border-red-500/40'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {REA_MCP_CONFIG_PATH}
              </button>
              <button
                type="button"
                onClick={() => setActiveConfigTab('gradle')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                  activeConfigTab === 'gradle'
                    ? 'bg-red-500/20 text-red-200 border border-red-500/40'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                gradle.properties (Every Project)
              </button>
              <button
                type="button"
                onClick={() => setActiveConfigTab('app')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                  activeConfigTab === 'app'
                    ? 'bg-red-500/20 text-red-200 border border-red-500/40'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {APP_CONFIG_PATH}
              </button>
            </div>

            <pre
              data-testid="rea-config-preview"
              className="p-3.5 rounded-xl bg-[#050507] border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed"
            >
              {activeConfigTab === 'mcp'
                ? formatReaMcpConfigJson()
                : activeConfigTab === 'gradle'
                ? EXACT_GRADLE_PROPERTIES
                : JSON.stringify(appConfigPreview, null, 2)}
            </pre>
          </div>

          {/* Environment Condition Selector (for testing guided prompts & error recovery flows) */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-mono text-zinc-400 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-zinc-500" />
              <span>Environment / Error Recovery Mode:</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'normal', label: 'Normal (Ready)' },
                  { id: 'missing_nodejs', label: 'No Node.js' },
                  { id: 'missing_termux', label: 'No Termux' },
                  { id: 'no_internet', label: 'Offline Error' },
                  { id: 'setup_failed', label: 'Setup Error' },
                ] as { id: DiagnosticCondition; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChangeDiagnosticMode(item.id);
                    if (item.id !== 'normal') {
                      runSetupPipeline(item.id);
                    }
                  }}
                  className={`px-2 py-0.5 rounded font-mono transition-colors ${
                    diagnosticMode === item.id
                      ? 'bg-red-500/25 text-red-200 border border-red-500/40'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
