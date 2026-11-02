import React, { useState } from 'react';
import {
  Check,
  Copy,
  FileCode,
  Folder,
  FolderTree,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  APP_CONFIG_PATH,
  AppConfigJson,
  EXACT_GRADLE_PROPERTIES,
  REA_MCP_CONFIG_PATH,
  SourceReaderProject,
  formatReaMcpConfigJson,
} from '../rea/reaEngineLogic';

interface SourceReaderStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SourceReaderProject[];
  activeProjectId: string;
  appConfig: AppConfigJson;
  onCreateProject: (appName: string, packageName: string, apkFileName: string) => void;
}

export const SourceReaderStorageModal: React.FC<SourceReaderStorageModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  appConfig,
  onCreateProject,
}) => {
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];
  const defaultFileKey = `/SOURCE_READER/${activeProject.folderName}/gradle.properties`;
  const [selectedFile, setSelectedFile] = useState<string>(defaultFileKey);
  const [copied, setCopied] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newPkgName, setNewPkgName] = useState('com.example.recovered');
  const [newApkName, setNewApkName] = useState('target_release.apk');

  if (!isOpen) return null;

  const allFiles: Record<string, string> = {
    ...activeProject.files,
    [REA_MCP_CONFIG_PATH]: formatReaMcpConfigJson(),
    [APP_CONFIG_PATH]: JSON.stringify(appConfig, null, 2),
  };

  const currentFilePath = allFiles[selectedFile] !== undefined ? selectedFile : defaultFileKey;
  const currentContent = allFiles[currentFilePath] ?? EXACT_GRADLE_PROPERTIES;

  const handleCopy = () => {
    navigator.clipboard?.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    onCreateProject(newAppName.trim(), newPkgName.trim() || 'com.example.app', newApkName.trim() || 'app.apk');
    setNewAppName('');
    setShowNewForm(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SOURCE_READER Storage Explorer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6"
    >
      <div className="w-full max-w-4xl rounded-2xl border border-white/15 bg-[#09090B] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/35 flex items-center justify-center">
              <FolderTree className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>/SOURCE_READER/ Offline Storage</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Android Studio Ready
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Every recovered APK is structured as a standalone Android Studio project with fast-build gradle.properties
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Scaffold APK Project
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close storage explorer"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional New APK Project Form */}
        {showNewForm && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-4 bg-zinc-900/90 border-b border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                APK / App Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CryptoWallet"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Package Name
              </label>
              <input
                type="text"
                value={newPkgName}
                onChange={(e) => setNewPkgName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Source APK File
              </label>
              <input
                type="text"
                value={newApkName}
                onChange={(e) => setNewApkName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
            >
              Generate Project
            </button>
          </form>
        )}

        {/* Explorer Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Tree Column */}
          <div className="md:col-span-5 border-r border-white/10 p-3 overflow-y-auto bg-black/50 font-mono text-xs space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-1">
              /SOURCE_READER/ Directory Tree
            </div>

            {/* Active Project Folder */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold px-1.5 py-1">
                <Folder className="w-3.5 h-3.5 fill-amber-400/20" />
                <span>├── {activeProject.folderName}/</span>
                <span className="ml-auto text-[10px] text-zinc-400">APK Copy</span>
              </div>
              <div className="pl-4 space-y-1">
                {Object.keys(activeProject.files).map((filePath) => {
                  const shortName = filePath.replace(`/SOURCE_READER/${activeProject.folderName}/`, '');
                  const isGradleProps = shortName === 'gradle.properties';
                  const isSelected = currentFilePath === filePath;
                  return (
                    <button
                      key={filePath}
                      type="button"
                      onClick={() => setSelectedFile(filePath)}
                      className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-red-500/20 text-white border border-red-500/40'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <FileCode className="w-3.5 h-3.5 shrink-0 text-red-400" />
                        <span className="truncate">{shortName}</span>
                      </span>
                      {isGradleProps && (
                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          fast-build
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Offline REA Folder */}
            <div className="space-y-1 pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-red-400 font-semibold px-1.5 py-1">
                <Folder className="w-3.5 h-3.5 fill-red-500/20" />
                <span>├── rea/</span>
                <span className="ml-auto text-[10px] text-zinc-400">Offline Core</span>
              </div>
              <div className="pl-4 space-y-1">
                <div className="px-2 py-1 text-zinc-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-zinc-500" />
                  <span>node_modules/ (rea-agents@latest)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(REA_MCP_CONFIG_PATH)}
                  className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between gap-2 transition-colors ${
                    currentFilePath === REA_MCP_CONFIG_PATH
                      ? 'bg-red-500/20 text-white border border-red-500/40'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <FileCode className="w-3.5 h-3.5 text-red-400" />
                    <span>.mcp-config.json</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] rounded bg-red-500/20 text-red-300">
                    MCP stdio
                  </span>
                </button>
              </div>
            </div>

            {/* Root .app-config.json */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedFile(APP_CONFIG_PATH)}
                className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between gap-2 transition-colors ${
                  currentFilePath === APP_CONFIG_PATH
                    ? 'bg-red-500/20 text-white border border-red-500/40'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 truncate">
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>└── .app-config.json</span>
                </span>
                <span className="text-[10px] text-zinc-400">port {appConfig.mcpPort}</span>
              </button>
            </div>
          </div>

          {/* Right File Content Viewer */}
          <div className="md:col-span-7 flex flex-col min-h-0 bg-[#050507]">
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-2 bg-zinc-950/80">
              <span className="font-mono text-xs text-zinc-300 truncate">{currentFilePath}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-xs text-white transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre
                data-testid="storage-file-content"
                className="font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap"
              >
                {currentContent}
              </pre>
            </div>
            {currentFilePath.endsWith('gradle.properties') && (
              <div className="px-4 py-2.5 bg-emerald-950/30 border-t border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Auto-written by Source Reader for EVERY new project to ensure fast, low-memory builds (-Xmx192m,UseSerialGC, in-process Kotlin).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
