import React, { useState } from 'react';
import {
  Bot,
  ChevronRight,
  Code2,
  Cpu,
  Dna,
  FolderTree,
  Layers,
  Menu,
  MessageSquare,
  Moon,
  Palette,
  Pin,
  Plug,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Terminal,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  AppConfigJson,
  DiagnosticCondition,
  McpServerStatus,
  REA_ROOT_PATH,
  ReaInstallStatus,
  ReaToolCall,
  SourceReaderProject,
  buildAndroidStudioProjectFiles,
} from './rea/reaEngineLogic';
import { ReaSettingsSection } from './components/ReaSettingsSection';
import { ReaToolCallCard } from './components/ReaToolCallCard';
import { SourceReaderStorageModal } from './components/SourceReaderStorageModal';

type ActiveView = 'chat' | 'settings' | 'settings_rea' | 'settings_providers' | 'settings_skills' | 'settings_termux' | 'settings_appearance';
type ChatMode = 'chat' | 'agent' | 'local';

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  reaToolCalls?: ReaToolCall[];
}

function createInitialProjects(): SourceReaderProject[] {
  const p1 = buildAndroidStudioProjectFiles('MyApp', 'com.example.myapp', 'test.apk');
  const p2 = buildAndroidStudioProjectFiles('FinVault_Auth', 'io.finvault.security', 'finvault_v4.apk');
  const p3 = buildAndroidStudioProjectFiles('NeoLauncher', 'dev.neolauncher.home', 'neolauncher.apk');

  return [
    {
      id: 'proj-myapp',
      name: 'MyApp_Copy',
      folderName: p1.folderName,
      packageName: 'com.example.myapp',
      apkFileName: 'test.apk',
      createdAt: '2026-11-02T00:15:00Z',
      updatedAt: 'Today',
      pinned: true,
      classesCount: 412,
      methodsCount: 3180,
      nativeLibs: ['lib/arm64-v8a/libcrypto_bridge.so'],
      files: p1.files,
    },
    {
      id: 'proj-finvault',
      name: 'FinVault_Auth_Copy',
      folderName: p2.folderName,
      packageName: 'io.finvault.security',
      apkFileName: 'finvault_v4.apk',
      createdAt: '2026-11-01T18:20:00Z',
      updatedAt: 'Today',
      pinned: false,
      classesCount: 894,
      methodsCount: 6410,
      nativeLibs: ['lib/arm64-v8a/libvault_jni.so', 'lib/arm64-v8a/libssl_engine.so'],
      files: p2.files,
    },
    {
      id: 'proj-neolauncher',
      name: 'NeoLauncher_Copy',
      folderName: p3.folderName,
      packageName: 'dev.neolauncher.home',
      apkFileName: 'neolauncher.apk',
      createdAt: '2026-10-31T14:00:00Z',
      updatedAt: 'Yesterday',
      pinned: false,
      classesCount: 276,
      methodsCount: 1940,
      nativeLibs: [],
      files: p3.files,
    },
  ];
}

const INITIAL_MESSAGES: Record<string, ChatMessageItem[]> = {
  'proj-myapp': [
    {
      id: 'm1',
      role: 'user',
      content: 'Inspect test.apk in /SOURCE_READER/MyApp_Copy/ and decompile the MainActivity + token verification logic into an Android Studio project.',
      timestamp: '00:41',
    },
    {
      id: 'm2',
      role: 'assistant',
      content:
        'I inspected `test.apk` using the offline **REA Engine** MCP server (`rea`) and generated a complete Android Studio project inside `/SOURCE_READER/MyApp_Copy/` with fast-build `gradle.properties` settings (`-Xmx192m`, `UseSerialGC`, in-process Kotlin).',
      timestamp: '00:41',
      reaToolCalls: [
        {
          id: 'tc-1',
          tool: 'inspectApk',
          projectPath: '/SOURCE_READER/MyProject/',
          targetFile: 'test.apk',
          statusLine: 'scanning classes… (412 classes, 1 native .so)',
          outputSummary:
            'Package: com.example.myapp\nMinSDK: 26 | TargetSDK: 34\nEntry Activity: com.example.myapp.MainActivity\nNative Libraries: lib/arm64-v8a/libcrypto_bridge.so',
          durationMs: 184,
        },
        {
          id: 'tc-2',
          tool: 'decompileDex',
          projectPath: '/SOURCE_READER/MyApp_Copy/',
          targetFile: 'classes.dex',
          statusLine: 'decompiling smali → readable Java/Kotlin…',
          outputSummary:
            'Recovered MainActivity.java & AuthSignatureVerifier.java (SHA-256 session salt: "SR_REA_CORE_v1").\nAuto-wrote /SOURCE_READER/MyApp_Copy/gradle.properties.',
          durationMs: 312,
        },
      ],
    },
  ],
  'proj-finvault': [
    {
      id: 'f1',
      role: 'user',
      content: 'Trace JNI calls inside libvault_jni.so and check how HMAC headers are signed.',
      timestamp: '18:22',
    },
    {
      id: 'f2',
      role: 'assistant',
      content:
        'REA traced `Java_io_finvault_security_VaultBridge_signPayload` at offset `0x0014a80` in `libvault_jni.so` and recovered the ARM64 call graph into `/SOURCE_READER/FinVault_Auth_Copy/`.',
      timestamp: '18:23',
      reaToolCalls: [
        {
          id: 'tc-3',
          tool: 'analyzeNativeSo',
          projectPath: '/SOURCE_READER/FinVault_Auth_Copy/',
          targetFile: 'libvault_jni.so',
          statusLine: 'disassembling ARM64 exports & JNI bridge…',
          outputSummary:
            'Export: Java_io_finvault_security_VaultBridge_signPayload (0x14a80)\nUses HMAC-SHA256 with key material derived from Android KeyStore alias "finvault_master_v4".',
          durationMs: 265,
        },
      ],
    },
  ],
  'proj-neolauncher': [
    {
      id: 'n1',
      role: 'user',
      content: 'Extract AndroidManifest.xml and workspace grid layout logic from neolauncher.apk.',
      timestamp: 'Yesterday',
    },
    {
      id: 'n2',
      role: 'assistant',
      content:
        'Manifest, resources, and launcher grid classes have been recovered into `/SOURCE_READER/NeoLauncher_Copy/` with fast-build `gradle.properties`.',
      timestamp: 'Yesterday',
      reaToolCalls: [
        {
          id: 'tc-4',
          tool: 'inspectApk',
          projectPath: '/SOURCE_READER/NeoLauncher_Copy/',
          targetFile: 'neolauncher.apk',
          statusLine: 'scanning classes & binary XML resources…',
          outputSummary:
            'Recovered 276 classes and decoded AndroidManifest.xml + res/values/strings.xml.',
          durationMs: 142,
        },
      ],
    },
  ],
};

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [chatMode, setChatMode] = useState<ChatMode>('agent');
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // REA Engine state (persisted in memory + reflected in .app-config.json)
  const [installStatus, setInstallStatus] = useState<ReaInstallStatus>('not_installed');
  const [reaVersion, setReaVersion] = useState<string | null>(null);
  const [mcpStatus, setMcpStatus] = useState<McpServerStatus>('stopped');
  const [mcpPort, setMcpPort] = useState<number>(7331);
  const [autoStartOnLaunch, setAutoStartOnLaunch] = useState<boolean>(true);
  const [showLogsInChat, setShowLogsInChat] = useState<boolean>(true);
  const [diagnosticMode, setDiagnosticMode] = useState<DiagnosticCondition>('normal');
  const [crashNotification, setCrashNotification] = useState<string | null>(null);

  // Projects & Chat sessions
  const [projects, setProjects] = useState<SourceReaderProject[]>(createInitialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-myapp');
  const [messagesByProject, setMessagesByProject] =
    useState<Record<string, ChatMessageItem[]>>(INITIAL_MESSAGES);
  const [promptInput, setPromptInput] = useState('');
  const [storageModalOpen, setStorageModalOpen] = useState(false);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? projects[0];
  const currentMessages = messagesByProject[activeProject.id] ?? [];

  const isReaActive =
    (installStatus === 'ready' || installStatus === 'outdated') &&
    mcpStatus === 'running';

  const appConfig: AppConfigJson = {
    reaInstalled: installStatus === 'ready' || installStatus === 'outdated',
    reaVersion,
    reaPath: REA_ROOT_PATH,
    mcpServerStatus: mcpStatus,
    mcpPort,
    autoStartOnLaunch,
    showLogsInChat,
    lastUpdated: new Date().toISOString(),
  };

  const handleCompleteSetup = (version: string) => {
    setInstallStatus('ready');
    setReaVersion(version);
    setMcpStatus('running');
    setDiagnosticMode('normal');
  };

  const handleResetRea = () => {
    setInstallStatus('not_installed');
    setReaVersion(null);
    setMcpStatus('stopped');
    setDiagnosticMode('normal');
    setCrashNotification(null);
  };

  const handleSimulateCrashRestart = () => {
    setMcpStatus('stopped');
    setCrashNotification('MCP Server (port ' + mcpPort + ') unexpected exit — auto-restarting REA stdio bridge…');
    window.setTimeout(() => {
      setMcpStatus('running');
      setCrashNotification(
        `MCP Server crashed and was automatically restarted on port ${mcpPort}.`
      );
    }, 300);
  };

  const handleCreateProject = (
    appName: string,
    packageName: string,
    apkFileName: string
  ) => {
    const scaffold = buildAndroidStudioProjectFiles(appName, packageName, apkFileName);
    const newId = `proj-${Date.now()}`;
    const newProj: SourceReaderProject = {
      id: newId,
      name: scaffold.folderName,
      folderName: scaffold.folderName,
      packageName,
      apkFileName,
      createdAt: new Date().toISOString(),
      updatedAt: 'Today',
      pinned: false,
      classesCount: 328,
      methodsCount: 2490,
      nativeLibs: ['lib/arm64-v8a/libapp_core.so'],
      files: scaffold.files,
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newId);
    setMessagesByProject((prev) => ({
      ...prev,
      [newId]: [
        {
          id: `init-${Date.now()}`,
          role: 'assistant',
          content: `Scaffolded Android Studio project \`/SOURCE_READER/${scaffold.folderName}/\` from \`${apkFileName}\` with auto-generated fast-build \`gradle.properties\`.`,
          timestamp: 'Just now',
          reaToolCalls: [
            {
              id: `tc-${Date.now()}`,
              tool: 'inspectApk',
              projectPath: `/SOURCE_READER/${scaffold.folderName}/`,
              targetFile: apkFileName,
              statusLine: 'scanning classes…',
              outputSummary: `Package: ${packageName}\nAuto-wrote /SOURCE_READER/${scaffold.folderName}/gradle.properties (-Xmx192m, UseSerialGC, in-process Kotlin).`,
              durationMs: 156,
            },
          ],
        },
      ],
    }));
  };

  const handleSendChat = (e?: React.FormEvent, quickCommand?: string) => {
    if (e) e.preventDefault();
    const text = (quickCommand ?? promptInput).trim();
    if (!text) return;
    if (!quickCommand) setPromptInput('');

    const lower = text.toLowerCase();
    const toolType: ReaToolCall['tool'] = lower.includes('native') || lower.includes('.so')
      ? 'analyzeNativeSo'
      : lower.includes('trace')
      ? 'traceMethods'
      : lower.includes('decompile') || lower.includes('smali')
      ? 'decompileDex'
      : 'inspectApk';

    const statusLine =
      toolType === 'inspectApk'
        ? 'scanning classes…'
        : toolType === 'traceMethods'
        ? 'tracing method call graph…'
        : toolType === 'decompileDex'
        ? 'decompiling smali to Java/Kotlin…'
        : 'disassembling ARM64 .so symbols…';

    const userMsg: ChatMessageItem = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Now',
    };

    const assistantMsg: ChatMessageItem = {
      id: `a-${Date.now() + 1}`,
      role: 'assistant',
      content: `Executed \`rea › ${toolType}\` offline against \`${activeProject.apkFileName}\` in \`/SOURCE_READER/${activeProject.folderName}/\`. Recovered sources and verified \`gradle.properties\` for instant Android Studio build.`,
      timestamp: 'Now',
      reaToolCalls: [
        {
          id: `rea-call-${Date.now()}`,
          tool: toolType,
          projectPath: `/SOURCE_READER/${activeProject.folderName}/`,
          targetFile: activeProject.apkFileName,
          statusLine,
          outputSummary: `Target: /SOURCE_READER/${activeProject.folderName}/${activeProject.apkFileName}\nClasses indexed: ${activeProject.classesCount} | Methods: ${activeProject.methodsCount}\nFast-build gradle.properties verified.`,
          durationMs: 195,
        },
      ],
    };

    setMessagesByProject((prev) => ({
      ...prev,
      [activeProject.id]: [...(prev[activeProject.id] ?? []), userMsg, assistantMsg],
    }));
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.apkFileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Left Sidebar (Always visible on desktop, drawer on mobile) */}
      <aside
        aria-label="Project Sessions Sidebar"
        className={`${
          sidebarOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden md:flex'
        } w-72 shrink-0 flex-col bg-black border-r border-white/10 select-none`}
      >
        {/* Brand Header + New Project Button */}
        <div className="px-3.5 pt-3.5 pb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/25 flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.12)]">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Source Reader</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                  v2.4
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                PocketStrike • REA Core
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStorageModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/25 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Quick Navigation Pills: /SOURCE_READER/ Storage & REA Engine */}
        <div className="px-3 py-1.5 space-y-1.5">
          <button
            type="button"
            onClick={() => setStorageModalOpen(true)}
            className="w-full px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 flex items-center justify-between text-xs transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium text-zinc-200">
              <FolderTree className="w-4 h-4 text-red-400" />
              <span>/SOURCE_READER/ Projects</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white font-semibold">
              {projects.length} APKs
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('settings_rea');
              setSidebarOpen(false);
            }}
            className="w-full px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-between text-xs transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-semibold text-red-200">
              <span>🔴 REA Engine</span>
            </span>
            <span className="font-mono text-[10px] text-red-200 flex items-center gap-1.5">
              {isReaActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-rea-green-pulse" />
              )}
              <span>
                {isReaActive ? `:${mcpPort}` : installStatus === 'ready' ? 'Ready' : 'Setup'}
              </span>
            </span>
          </button>
        </div>

        {/* Search Sessions */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search APK sessions…"
              aria-label="Search APK sessions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* Session / Project Cards List (with "REA Engine" badge when REA is active) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            APK Reverse Sessions
          </div>
          {filteredProjects.map((proj) => {
            const isSelected = proj.id === activeProject.id && activeView === 'chat';
            return (
              <button
                key={proj.id}
                type="button"
                data-testid={`project-card-${proj.id}`}
                onClick={() => {
                  setActiveProjectId(proj.id);
                  setActiveView('chat');
                  setSidebarOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/12 border-white/30 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">
                    {proj.name}
                  </span>
                  {proj.pinned && <Pin className="w-3 h-3 text-zinc-400 shrink-0" />}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-zinc-400 truncate">
                  {proj.apkFileName} • {proj.packageName}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono text-zinc-400">
                    {proj.classesCount} cls
                  </span>
                  {isReaActive && (
                    <span
                      data-testid={`rea-active-badge-${proj.id}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[9px] font-mono font-bold text-red-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-rea-green-pulse" />
                      REA Engine
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom MCP & Settings Bar (matching AppDrawer in Flutter) */}
        <div className="p-3 border-t border-white/10 bg-zinc-950/90 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
              <Plug className="w-3.5 h-3.5 text-red-400" />
              <span>MCP SERVERS</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveView('settings_rea')}
              className="text-red-300 hover:underline font-semibold cursor-pointer"
            >
              {isReaActive ? 'rea (Connected)' : 'Configure REA'}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveView('settings_providers')}
              className="flex-1 h-8 px-2.5 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/15 text-xs font-medium text-white flex items-center justify-center gap-1.5 truncate cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
              <span className="truncate">Claude 3.7 / Gemini</span>
            </button>

            <button
              type="button"
              aria-label="Open Settings"
              onClick={() => {
                setActiveView('settings');
                setSidebarOpen(false);
              }}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                activeView.startsWith('settings')
                  ? 'bg-red-500/20 border-red-500/50 text-red-300'
                  : 'bg-white/[0.06] hover:bg-white/10 border-white/15 text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#040406]">
        {/* Top App Bar */}
        <header className="h-14 px-4 border-b border-white/10 flex items-center justify-between gap-3 bg-black/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>

            {activeView === 'chat' ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white truncate">
                    {activeProject.name}
                  </h1>
                  {isReaActive && (
                    <span
                      data-testid="header-rea-badge"
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/35 text-[10px] font-mono font-semibold text-red-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-rea-green-pulse" />
                      REA Engine Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-zinc-400 truncate">
                  /SOURCE_READER/{activeProject.folderName}/ • {activeProject.apkFileName}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white">
                  {activeView === 'settings'
                    ? '⚙️ Settings'
                    : activeView === 'settings_rea'
                    ? '⚙️ Settings › 🔴 REA Engine'
                    : activeView === 'settings_providers'
                    ? '⚙️ Settings › AI Providers'
                    : activeView === 'settings_skills'
                    ? '⚙️ Settings › Skills'
                    : activeView === 'settings_termux'
                    ? '⚙️ Settings › Termux Tools'
                    : '⚙️ Settings › Appearance'}
                </h1>
              </div>
            )}
          </div>

          {/* Right Top Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView(activeView === 'chat' ? 'settings' : 'chat')}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/12 border border-white/15 text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {activeView === 'chat' ? (
                <>
                  <Settings className="w-3.5 h-3.5 text-red-400" />
                  <span>Settings</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Session Chat</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Main Body Switcher */}
        <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-3 sm:px-6 py-4">
          {activeView === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* 3-Way Mode Switcher (Chat | Agent | Local) */}
              <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="grid grid-cols-3 p-1 rounded-2xl bg-white/[0.05] border border-white/10 max-w-xs w-full">
                  {(
                    [
                      { id: 'chat', label: 'Chat', icon: MessageSquare },
                      { id: 'agent', label: 'Agent', icon: Bot },
                      { id: 'local', label: 'Local', icon: Cpu },
                    ] as const
                  ).map((seg) => {
                    const Icon = seg.icon;
                    const selected = chatMode === seg.id;
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => setChatMode(seg.id)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selected
                            ? 'bg-white/15 text-white border border-white/25'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{seg.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick REA Agent Action Bar */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleSendChat(
                        undefined,
                        `Inspect ${activeProject.apkFileName} with REA and scan all DEX classes`
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-[11px] font-mono text-red-200 transition-colors cursor-pointer"
                  >
                    🔴 rea › inspectApk
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendChat(
                        undefined,
                        `Decompile smali in ${activeProject.apkFileName} to readable Java/Kotlin`
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer"
                  >
                    🔴 rea › decompileDex
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendChat(
                        undefined,
                        `Analyze native .so libraries in ${activeProject.apkFileName}`
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer"
                  >
                    🔴 rea › analyzeNativeSo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorageModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-[11px] font-mono text-emerald-200 transition-colors cursor-pointer"
                  >
                    View gradle.properties
                  </button>
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-white text-black font-medium'
                          : 'bg-[#0D0D11] border border-white/12 text-zinc-100'
                      }`}
                    >
                      <div>{msg.content}</div>
                    </div>

                    {/* Clozed Code-Style REA Tool Call Cards */}
                    {msg.reaToolCalls &&
                      msg.reaToolCalls.map((tc) => (
                        <ReaToolCallCard
                          key={tc.id}
                          call={tc}
                          showLogs={showLogsInChat}
                          onInspectProjectFiles={() => setStorageModalOpen(true)}
                        />
                      ))}
                  </div>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => handleSendChat(e)}
                className="mt-auto pt-2 border-t border-white/10 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder={`Ask AI Agent + REA Engine about ${activeProject.apkFileName}…`}
                  aria-label="Message AI Agent"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs sm:text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-red-500/60"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* ⚙️ SETTINGS MENU SCREEN */}
          {activeView === 'settings' && (
            <div className="space-y-6">
              {/* Primary Settings Hierarchy from Prompt */}
              <div className="space-y-2">
                <div className="px-1 text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  SOURCE READER SETTINGS
                </div>

                {/* 1. AI Providers */}
                <button
                  type="button"
                  onClick={() => setActiveView('settings_providers')}
                  className="w-full p-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/12 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">AI Providers</div>
                      <div className="text-xs text-zinc-400">
                        OpenAI, Claude, Gemini, Groq, OpenRouter & Ollama keys
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>

                {/* 2. Skills */}
                <button
                  type="button"
                  onClick={() => setActiveView('settings_skills')}
                  className="w-full p-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/12 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Skills</div>
                      <div className="text-xs text-zinc-400">
                        APK manifest reconstruction, DEX graphing, Hermes memory & personas
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>

                {/* 3. Termux Tools */}
                <button
                  type="button"
                  onClick={() => setActiveView('settings_termux')}
                  className="w-full p-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/12 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Termux Tools</div>
                      <div className="text-xs text-zinc-400">
                        Background shell bridge, Node.js runtime, SAF storage & permissions
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>

                {/* 4. Appearance */}
                <button
                  type="button"
                  onClick={() => setActiveView('settings_appearance')}
                  className="w-full p-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/12 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                      <Palette className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Appearance</div>
                      <div className="text-xs text-zinc-400">
                        Clozed Code OLED Dark theme, glass tokens & monospace font scale
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>

                {/* 5. 🔴 REA Engine (NEW SECTION) */}
                <button
                  type="button"
                  data-testid="settings-tile-rea-engine"
                  onClick={() => setActiveView('settings_rea')}
                  className="w-full p-3.5 rounded-xl bg-gradient-to-r from-red-950/45 via-zinc-900/80 to-zinc-950 hover:from-red-950/65 border border-red-500/45 flex items-center justify-between gap-3 text-left shadow-[0_0_24px_rgba(239,68,68,0.15)] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/45 flex items-center justify-center">
                      <Dna className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">🔴 REA Engine</span>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-red-500/20 text-red-200 border border-red-500/35">
                          {installStatus === 'ready' ? '✅ Ready' : '● Not Installed'}
                        </span>
                        {mcpStatus === 'running' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-rea-green-pulse" />
                            MCP :{mcpPort}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-300">
                        Reverse Engineering Core for AI Agent • Offline APK/DEX/Native analyzer
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-300" />
                </button>
              </div>

              {/* Inline REA Engine Section Directly Accessible on Settings Screen as well */}
              <div className="pt-2">
                <div className="px-1 pb-2 text-[11px] font-mono uppercase tracking-wider text-red-300 font-bold">
                  REA ENGINE — OFFLINE INTEGRATION MODULE
                </div>
                <ReaSettingsSection
                  installStatus={installStatus}
                  reaVersion={reaVersion}
                  mcpStatus={mcpStatus}
                  mcpPort={mcpPort}
                  autoStartOnLaunch={autoStartOnLaunch}
                  showLogsInChat={showLogsInChat}
                  diagnosticMode={diagnosticMode}
                  onChangeDiagnosticMode={setDiagnosticMode}
                  onCompleteSetup={handleCompleteSetup}
                  onResetRea={handleResetRea}
                  onSetMcpStatus={setMcpStatus}
                  onSetMcpPort={setMcpPort}
                  onToggleAutoStart={setAutoStartOnLaunch}
                  onToggleShowLogs={setShowLogsInChat}
                  onTriggerOutdated={() => setInstallStatus('outdated')}
                  onSimulateCrashRestart={handleSimulateCrashRestart}
                  onOpenStorageExplorer={() => setStorageModalOpen(true)}
                  crashNotification={crashNotification}
                />
              </div>
            </div>
          )}

          {/* Dedicated 🔴 REA Engine Screen */}
          {activeView === 'settings_rea' && (
            <ReaSettingsSection
              installStatus={installStatus}
              reaVersion={reaVersion}
              mcpStatus={mcpStatus}
              mcpPort={mcpPort}
              autoStartOnLaunch={autoStartOnLaunch}
              showLogsInChat={showLogsInChat}
              diagnosticMode={diagnosticMode}
              onChangeDiagnosticMode={setDiagnosticMode}
              onCompleteSetup={handleCompleteSetup}
              onResetRea={handleResetRea}
              onSetMcpStatus={setMcpStatus}
              onSetMcpPort={setMcpPort}
              onToggleAutoStart={setAutoStartOnLaunch}
              onToggleShowLogs={setShowLogsInChat}
              onTriggerOutdated={() => setInstallStatus('outdated')}
              onSimulateCrashRestart={handleSimulateCrashRestart}
              onOpenStorageExplorer={() => setStorageModalOpen(true)}
              onBack={() => setActiveView('settings')}
              crashNotification={crashNotification}
            />
          )}

          {/* Sub-pages for AI Providers, Skills, Termux Tools, Appearance */}
          {(activeView === 'settings_providers' ||
            activeView === 'settings_skills' ||
            activeView === 'settings_termux' ||
            activeView === 'settings_appearance') && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveView('settings')}
                className="text-xs font-mono text-zinc-400 hover:text-white"
              >
                ← Back to Settings
              </button>

              <div className="p-5 rounded-2xl border border-white/15 bg-[#0B0B0E] space-y-4">
                {activeView === 'settings_providers' && (
                  <>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-red-400" />
                      <span>AI Providers</span>
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Online AI coding providers automatically connect to the local offline REA Engine MCP server at <code className="text-red-300">/SOURCE_READER/rea/</code>.
                    </p>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-black border border-white/10 flex items-center justify-between">
                        <span>Anthropic Claude 3.7 Sonnet (Default Agent)</span>
                        <span className="text-emerald-400">Connected</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black border border-white/10 flex items-center justify-between">
                        <span>Google Gemini 2.5 Pro</span>
                        <span className="text-emerald-400">Standby</span>
                      </div>
                    </div>
                  </>
                )}

                {activeView === 'settings_skills' && (
                  <>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-400" />
                      <span>Agent Skills</span>
                    </h2>
                    <div className="space-y-2 text-xs text-zinc-300">
                      <div className="p-3 rounded-xl bg-black border border-white/10">
                        <div className="font-semibold text-white">APK Source Reconstruction</div>
                        <div className="text-zinc-400 mt-0.5">
                          Pairs with <code className="text-red-300">rea › decompileDex</code> to emit buildable Android Studio modules with fast-build <code className="text-emerald-300">gradle.properties</code>.
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-black border border-white/10">
                        <div className="font-semibold text-white">Native JNI & ARM64 Call-Graph Tracer</div>
                        <div className="text-zinc-400 mt-0.5">
                          Traces <code className="text-red-300">lib/*.so</code> exports and cryptographic routines via REA.
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeView === 'settings_termux' && (
                  <>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-red-400" />
                      <span>Termux Tools & Bridge</span>
                    </h2>
                    <div className="space-y-2 font-mono text-xs text-zinc-300">
                      <div className="p-3 rounded-xl bg-black border border-white/10 flex items-center justify-between">
                        <span>Termux Binary Bridge</span>
                        <span className="text-emerald-400">/data/data/com.termux/files/usr/bin</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black border border-white/10 flex items-center justify-between">
                        <span>Node.js / npx Runtime</span>
                        <span className="text-emerald-400">v22.11.0</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black border border-white/10 flex items-center justify-between">
                        <span>Workspace Root</span>
                        <span className="text-red-300">/SOURCE_READER/</span>
                      </div>
                    </div>
                  </>
                )}

                {activeView === 'settings_appearance' && (
                  <>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Palette className="w-4 h-4 text-red-400" />
                      <span>Appearance</span>
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                      {(['dark', 'light', 'system'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setThemeMode(m)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold capitalize ${
                            themeMode === m
                              ? 'bg-red-500/20 border-red-500/50 text-white'
                              : 'bg-black border-white/10 text-zinc-400'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* /SOURCE_READER/ Storage & gradle.properties Inspector Modal */}
      <SourceReaderStorageModal
        isOpen={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
        projects={projects}
        activeProjectId={activeProject.id}
        appConfig={appConfig}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
