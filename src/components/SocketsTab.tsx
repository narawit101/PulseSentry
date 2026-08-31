import React, { useState, useMemo } from "react";
import { Search, Terminal } from "lucide-react";
import { SocketConnection } from "../types";
import { ExportCsvButton } from "./ExportCsvButton";
import { Language } from "../i18n/translations";

interface SocketsTabProps {
  sockets: SocketConnection[];
  t: any;
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
    return [...filteredSockets].sort((a, b) => {
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
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-ink-muted border-b border-hairline uppercase text-[10px] tracking-wider font-semibold font-mono">
              <th className="pb-3 w-8 font-mono text-ink-faint">#</th>
              <th
                onClick={() => handleSort("proc")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colApp}{" "}
                {socketSort.key === "proc"
                  ? socketSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("proto")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                Proto{" "}
                {socketSort.key === "proto"
                  ? socketSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("local")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colLocal}{" "}
                {socketSort.key === "local"
                  ? socketSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("remote")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colRemote}{" "}
                {socketSort.key === "remote"
                  ? socketSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("status")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colStatus}{" "}
                {socketSort.key === "status"
                  ? socketSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("org")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colOrg}{" "}
                {socketSort.key === "org"
                  ? socketSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("country")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colCountry}{" "}
                {socketSort.key === "country"
                  ? socketSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("rtt")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colRtt}{" "}
                {socketSort.key === "rtt"
                  ? socketSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
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
                  <td className="py-3 font-mono text-ink-faint text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-3 font-semibold text-ink flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-ink-faint" />
                    {s.proc}{" "}
                    <span className="text-ink-faint font-normal font-mono text-[11px]">
                      #{s.pid}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-ink-muted">
                    {s.proto}
                  </td>
                  <td className="py-3 font-mono text-ink-faint">
                    {s.local}
                  </td>
                  <td className="py-3 font-mono text-ink font-semibold">
                    {s.remote}
                  </td>
                  <td className="py-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                  <td className="py-3 text-ink-muted">{s.org}</td>
                  <td className="py-3 font-mono">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-canvas-soft border border-hairline text-ink">
                      {s.country}
                    </span>
                  </td>
                  <td className="py-3 font-mono font-semibold">
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
