import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { ListeningPort } from "../types";
import { ExportCsvButton } from "./ExportCsvButton";
import { Language } from "../i18n/translations";

interface PortsTabProps {
  ports: ListeningPort[];
  t: any;
  lang: Language;
}

export const PortsTab: React.FC<PortsTabProps> = ({ ports, t, lang }) => {
  const [portSearch, setPortSearch] = useState("");
  const [portProtocolFilter, setPortProtocolFilter] = useState("ALL");
  const [portExposureFilter, setPortExposureFilter] = useState("ALL");
  const [portSort, setPortSort] = useState<{
    key: keyof ListeningPort;
    order: "asc" | "desc";
  }>({ key: "port", order: "asc" });

  const handleSort = (key: keyof ListeningPort) => {
    setPortSort((prev) => ({
      key,
      order: prev.key === key && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const sortedPorts = useMemo(() => {
    const filtered = ports.filter((p) => {
      const matchSearch =
        p.port.toString().includes(portSearch) ||
        p.proc.toLowerCase().includes(portSearch.toLowerCase()) ||
        p.pid.toString().includes(portSearch) ||
        p.addr.toLowerCase().includes(portSearch.toLowerCase()) ||
        p.desc.toLowerCase().includes(portSearch.toLowerCase());
      const matchProto =
        portProtocolFilter === "ALL" || p.proto === portProtocolFilter;
      const matchExposure =
        portExposureFilter === "ALL" ||
        (portExposureFilter === "EXPOSED" && p.exposed) ||
        (portExposureFilter === "LOCAL" && !p.exposed);
      return matchSearch && matchProto && matchExposure;
    });

    return [...filtered].sort((a, b) => {
      const valA = a[portSort.key];
      const valB = b[portSort.key];
      if (typeof valA === "string" && typeof valB === "string") {
        return portSort.order === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === "boolean" && typeof valB === "boolean") {
        return portSort.order === "asc"
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      }
      return portSort.order === "asc"
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    });
  }, [ports, portSort, portSearch, portProtocolFilter, portExposureFilter]);

  return (
    <div className="bg-surface rounded-xl border border-hairline p-6 shadow-notion-card ps-fade-in">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink tracking-tight m-0">
            {t.portsTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-faint" />
            <input
              type="text"
              placeholder={
                lang === "th"
                  ? "ค้นหา Port, Process, IP..."
                  : "Search Port, Process, IP..."
              }
              value={portSearch}
              onChange={(e) => setPortSearch(e.target.value)}
              className="bg-canvas-soft border border-hairline rounded-lg py-1.5 pl-8 pr-3 text-xs text-ink outline-none focus:border-primary w-56 transition-colors"
            />
          </div>

          <select
            value={portProtocolFilter}
            onChange={(e) => setPortProtocolFilter(e.target.value)}
            className="bg-canvas-soft border border-hairline rounded-lg py-1.5 px-3 text-xs text-ink outline-none cursor-pointer font-mono"
          >
            <option value="ALL">{t.allProtocols}</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
          </select>

          <select
            value={portExposureFilter}
            onChange={(e) => setPortExposureFilter(e.target.value)}
            className="bg-canvas-soft border border-hairline rounded-lg py-1.5 px-3 text-xs text-ink outline-none cursor-pointer font-mono"
          >
            <option value="ALL">{t.allStatuses}</option>
            <option value="EXPOSED">{t.exposed}</option>
            <option value="LOCAL">{t.localhost}</option>
          </select>

          <ExportCsvButton
            filename="pulsesentry_listening_ports"
            label={lang === "th" ? "ส่งออกข้อมูล (CSV)" : "Export CSV"}
            headers={[
              "No",
              "Port",
              "Protocol",
              "Process",
              "PID",
              "Address",
              "Description",
              "Security Exposure",
            ]}
            rows={sortedPorts.map((p, idx) => [
              idx + 1,
              p.port,
              p.proto,
              p.proc,
              p.pid,
              p.addr,
              p.desc,
              p.exposed ? "EXPOSED" : "LOCAL",
            ])}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[850px]">
          <thead>
            <tr className="text-ink-muted border-b border-hairline uppercase text-[10px] tracking-wider font-semibold font-mono">
              <th className="py-2.5 px-3 w-10 font-mono text-ink-faint">#</th>
              <th
                onClick={() => handleSort("port")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors w-24"
              >
                Port{" "}
                {portSort.key === "port"
                  ? portSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("proto")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors w-20"
              >
                Proto{" "}
                {portSort.key === "proto"
                  ? portSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("proc")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors min-w-[150px]"
              >
                Process{" "}
                {portSort.key === "proc"
                  ? portSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("pid")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors w-20"
              >
                PID{" "}
                {portSort.key === "pid"
                  ? portSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("addr")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors min-w-[150px]"
              >
                Address{" "}
                {portSort.key === "addr"
                  ? portSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("desc")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors min-w-[160px]"
              >
                Description{" "}
                {portSort.key === "desc"
                  ? portSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("exposed")}
                className="py-2.5 px-3 cursor-pointer select-none hover:text-ink transition-colors min-w-[200px] text-right whitespace-nowrap"
              >
                Security Exposure{" "}
                {portSort.key === "exposed"
                  ? portSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {sortedPorts.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-xs text-ink-muted font-mono"
                >
                  {lang === "th"
                    ? "กำลังสแกนพอร์ตในเครื่อง Windows..."
                    : "Scanning local listening ports..."}
                </td>
              </tr>
            ) : (
              sortedPorts.map((p, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-canvas-soft/50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-ink-faint text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-primary text-sm">
                    :{p.port}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-ink-muted">
                    {p.proto}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-ink">
                    <div className="truncate max-w-[150px]" title={p.proc}>
                      {p.proc}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-ink-faint">
                    #{p.pid}
                  </td>
                  <td
                    className="py-2.5 px-3 font-mono text-ink-muted truncate max-w-[150px]"
                    title={p.addr}
                  >
                    {p.addr}
                  </td>
                  <td
                    className="py-2.5 px-3 text-ink-muted truncate max-w-[160px]"
                    title={p.desc}
                  >
                    {p.desc}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium inline-flex items-center gap-1.5 whitespace-nowrap border ${
                        p.exposed
                          ? "bg-[#FEF0E6] text-[#793400] border-[#FCD1B0]"
                          : "bg-canvas-soft text-ink-muted border-hairline"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          p.exposed ? "bg-sticker-orange" : "bg-ink-faint"
                        }`}
                      />
                      <span>{p.exposed ? t.exposed : t.localhost}</span>
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
