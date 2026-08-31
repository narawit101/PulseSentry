import React from "react";
import { Server, X, Search } from "lucide-react";
import { TestServer } from "../../constants/speedtestServers";
import { TranslationDict } from "../../i18n/translations";

interface ServerSelectModalProps {
  t: TranslationDict;
  isOpen: boolean;
  onClose: () => void;
  servers: TestServer[];
  selectedServerId: string;
  onSelectServer: (id: string) => void;
  serverSearch: string;
  onSearchChange: (query: string) => void;
}

export const ServerSelectModal: React.FC<ServerSelectModalProps> = ({
  t,
  isOpen,
  onClose,
  servers,
  selectedServerId,
  onSelectServer,
  serverSearch,
  onSearchChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface rounded-2xl border border-hairline shadow-lg max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-ink">
              {t.speedtestSelectServer}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-canvas-soft flex items-center justify-center text-ink-muted cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-hairline bg-canvas-soft">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder={t.speedtestSearchServer}
              value={serverSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-hairline text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Server List */}
        <div className="divide-y divide-hairline overflow-y-auto flex-1">
          {servers.map((srv) => (
            <button
              key={srv.id}
              onClick={() => {
                onSelectServer(srv.id);
                onClose();
              }}
              className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-canvas-soft transition-colors cursor-pointer ${
                selectedServerId === srv.id ? "bg-[#EBF5FD]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedServerId === srv.id ? "bg-primary" : "bg-hairline"
                  }`}
                />
                <div>
                  <span className="text-xs text-ink font-bold block">
                    {srv.name}
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {srv.location} • {srv.host}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-canvas-soft border border-hairline text-ink-muted">
                {srv.badge}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
