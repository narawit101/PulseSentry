import React, { useState, useMemo } from "react";
import { Search, Shield, ShieldCheck } from "lucide-react";
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
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-ink-muted border-b border-hairline uppercase text-[10px] tracking-wider font-semibold font-mono">
              <th className="pb-3 w-8 font-mono text-ink-faint">#</th>
              <th
                onClick={() => handleSort("port")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
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
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
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
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
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
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
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
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
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
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
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
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
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
                  <td className="py-3 font-mono text-ink-faint text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-3 font-mono font-bold text-primary text-sm">
                    :{p.port}
                  </td>
                  <td className="py-3 font-mono text-ink-muted">
                    {p.proto}
                  </td>
                  <td className="py-3 font-semibold text-ink">
                    {p.proc}
                  </td>
                  <td className="py-3 font-mono text-ink-faint">
                    {p.pid}
                  </td>
                  <td className="py-3 font-mono text-ink-muted">
                    {p.addr}
                  </td>
                  <td className="py-3 text-ink-muted">{p.desc}</td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-fit ${
                        p.exposed
                          ? "bg-[#FEF0E6] text-[#793400] border border-[#FCD1B0]"
                          : "bg-[#EBF8EE] text-[#0E5C1E] border border-[#C0ECC9]"
                      }`}
                    >
                      {p.exposed ? (
                        <Shield className="w-3 h-3" />
                      ) : (
                        <ShieldCheck className="w-3 h-3" />
                      )}
                      {p.exposed ? t.exposed : t.localhost}
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
