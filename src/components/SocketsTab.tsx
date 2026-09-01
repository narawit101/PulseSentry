import React, { useState, useMemo } from "react";
import { Search, Terminal } from "lucide-react";
import { SocketConnection } from "../types";
import { ExportCsvButton } from "./ExportCsvButton";
import { Language, TranslationDict } from "../i18n/translations";

interface SocketsTabProps {
  sockets: SocketConnection[];
  t: TranslationDict;
  lang: Language;
}

export const SocketsTab: React.FC<SocketsTabProps> = ({ sockets, t, lang }) => {
  const [socketSearch, setSocketSearch] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [socketSort, setSocketSort] = useState<{
    key: keyof SocketConnection;
    order: "asc" | "desc";
  }>({ key: "rtt", order: "asc" });

  const handleSort = (key: keyof SocketConnection) => {
    setSocketSort((prev) => ({
      key,
      order: prev.key === key && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const filteredSockets = useMemo(() => {
    return sockets.filter((s) => {
      const matchSearch =
        s.proc.toLowerCase().includes(socketSearch.toLowerCase()) ||
        s.remote.toLowerCase().includes(socketSearch.toLowerCase()) ||
        s.org.toLowerCase().includes(socketSearch.toLowerCase()) ||
        s.country.toLowerCase().includes(socketSearch.toLowerCase()) ||
        s.pid.toString().includes(socketSearch);
      const matchProto =
        protocolFilter === "ALL" || s.proto === protocolFilter;
      const matchStatus =
        statusFilter === "ALL" || s.status === statusFilter;
      return matchSearch && matchProto && matchStatus;
    });
  }, [sockets, socketSearch, protocolFilter, statusFilter]);

  const sortedSockets = useMemo(() => {
    return filteredSockets.slice().sort((a, b) => {
      const valA = a[socketSort.key];
      const valB = b[socketSort.key];
      if (typeof valA === "string" && typeof valB === "string") {
        return socketSort.order === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return socketSort.order === "asc"
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    });
  }, [filteredSockets, socketSort]);

  return (
    <div className="bg-surface rounded-xl border border-hairline p-6 shadow-notion-card ps-fade-in">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink tracking-tight m-0">
            {t.tabSockets}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-faint" />
            <input
              type="text"
              placeholder={t.filterSockets}
              value={socketSearch}
              onChange={(e) => setSocketSearch(e.target.value)}
              className="bg-canvas-soft border border-hairline rounded-lg py-1.5 pl-8 pr-3 text-xs text-ink outline-none focus:border-primary w-56 transition-colors"
            />
          </div>

          <select
            value={protocolFilter}
            onChange={(e) => setProtocolFilter(e.target.value)}
            className="bg-canvas-soft border border-hairline rounded-lg py-1.5 px-3 text-xs text-ink outline-none cursor-pointer font-mono"
          >
            <option value="ALL">{t.allProtocols}</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-canvas-soft border border-hairline rounded-lg py-1.5 px-3 text-xs text-ink outline-none cursor-pointer font-mono"
          >
            <option value="ALL">{t.allStatuses}</option>
            <option value="ESTABLISHED">ESTABLISHED</option>
            <option value="LISTEN">LISTEN</option>
            <option value="TIME_WAIT">TIME_WAIT</option>
          </select>

          <ExportCsvButton
            filename="pulsesentry_active_sockets"
            label={lang === "th" ? "ส่งออกข้อมูล (CSV)" : "Export CSV"}
            headers={[
              "No",
              "Application",
              "PID",
              "Protocol",
              "Local Address",
              "Remote Address",
              "Status",
              "Organization / ISP",
              "Country",
              "Latency RTT (ms)",
            ]}
            rows={sortedSockets.map((s, idx) => [
              idx + 1,
              s.proc,
              s.pid,
              s.proto,
              s.local,
              s.remote,
              s.status,
              s.org,
              s.country,
              s.rtt,
            ])}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[960px]">
          <thead>
            <tr className="text-ink-muted border-b border-hairline uppercase text-[10px] tracking-wider font-semibold font-mono whitespace-nowrap">
              <th className="py-2.5 px-3 w-10 font-mono text-ink-faint">#</th>
              <th
                onClick={() => handleSort("proc")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors min-w-[180px]"
              >
                <div className="inline-flex items-center gap-1">
                  <span>{t.colApp}</span>
                  {socketSort.key === "proc" && (
                    <span>{socketSort.order === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("proto")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors w-20"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Proto</span>
                  {socketSort.key === "proto" && (
                    <span>{socketSort.order === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("local")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors min-w-[180px]"
              >
                <div className="inline-flex items-center gap-1">
                  <span>{t.colLocal}</span>
                  {socketSort.key === "local" && (
                    <span>{socketSort.order === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("remote")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors min-w-[190px]"
              >
                <div className="inline-flex items-center gap-1">
                  <span>{t.colRemote}</span>
                  {socketSort.key === "remote" && (
                    <span>{socketSort.order === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors w-28"
              >
                <div className="inline-flex items-center gap-1">
                  <span>{t.colStatus}</span>
                  {socketSort.key === "status" && (
                    <span>{socketSort.order === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("org")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors min-w-[140px]"
              >
                <div className="inline-flex items-center gap-1">
                  <span>{t.colOrg}</span>
                  {socketSort.key === "org" && (
                    <span>{socketSort.order === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("country")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors w-24"
              >
                <div className="inline-flex items-center gap-1">
                  <span>{t.colCountry}</span>
                  {socketSort.key === "country" && (
                    <span>{socketSort.order === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("rtt")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors min-w-[110px] text-right"
              >
                <div className="inline-flex items-center justify-end gap-1 w-full">
                  <span>{t.colRtt}</span>
                  {socketSort.key === "rtt" && (
                    <span>{socketSort.order === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {sortedSockets.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-8 text-center text-xs text-ink-muted font-mono"
                >
                  {lang === "th"
                    ? "กำลังรอข้อมูล Socket จาก Windows Agent..."
                    : "Waiting for socket telemetry from Host Agent..."}
                </td>
              </tr>
            ) : (
              sortedSockets.map((s, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-canvas-soft/50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-ink-faint text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-ink">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                      <span className="truncate max-w-[140px]" title={s.proc}>
                        {s.proc}
                      </span>
                      <span className="text-ink-faint font-normal font-mono text-[11px] shrink-0">
                        #{s.pid}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-ink-muted font-medium">
                    {s.proto}
                  </td>
                  <td
                    className="py-2.5 px-3 font-mono text-ink-faint text-[11px] truncate max-w-[180px]"
                    title={s.local}
                  >
                    {s.local}
                  </td>
                  <td
                    className="py-2.5 px-3 font-mono text-ink font-semibold truncate max-w-[190px]"
                    title={s.remote}
                  >
                    {s.remote}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-block ${
                        s.status === "ESTABLISHED"
                          ? "bg-[#EBF8EE] text-[#0E5C1E]"
                          : s.status === "LISTEN"
                            ? "bg-[#FEF0E6] text-[#793400]"
                            : "bg-canvas-soft text-ink-muted"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td
                    className="py-2.5 px-3 text-ink-muted truncate max-w-[140px]"
                    title={s.org}
                  >
                    {s.org}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-canvas-soft border border-hairline text-ink whitespace-nowrap">
                      {s.country}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-right whitespace-nowrap">
                    <span
                      className={
                        s.rtt <= 5
                          ? "text-sticker-green"
                          : s.rtt <= 50
                            ? "text-primary"
                            : "text-ink-charcoal"
                      }
                    >
                      {s.rtt} ms
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
