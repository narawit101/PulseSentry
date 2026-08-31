import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { AppTraffic } from "../types";
import { STICKER_COLORS, StickerColorKey } from "../constants/theme";
import { ExportCsvButton } from "./ExportCsvButton";
import { formatDataVolume, formatRate } from "../utils/format";
import { Language } from "../i18n/translations";

interface AppsTabProps {
  apps: AppTraffic[];
  t: any;
  lang: Language;
}

export const AppsTab: React.FC<AppsTabProps> = ({ apps, t, lang }) => {
  const [appSearch, setAppSearch] = useState("");
  const [appSort, setAppSort] = useState<{
    key: keyof AppTraffic;
    order: "asc" | "desc";
  }>({ key: "dl", order: "desc" });

  const handleSort = (key: keyof AppTraffic) => {
    setAppSort((prev) => ({
      key,
      order: prev.key === key && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const sortedApps = useMemo(() => {
    const filtered = apps.filter(
      (a) =>
        a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
        a.pid.toString().includes(appSearch),
    );

    return [...filtered].sort((a, b) => {
      const valA = a[appSort.key];
      const valB = b[appSort.key];
      if (typeof valA === "string" && typeof valB === "string") {
        return appSort.order === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return appSort.order === "asc"
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    });
  }, [apps, appSearch, appSort]);

  return (
    <div className="bg-surface rounded-xl border border-hairline p-6 shadow-notion-card ps-fade-in">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink tracking-tight m-0">
            {t.tabApps}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-faint" />
            <input
              type="text"
              placeholder={t.filterApps}
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
              className="bg-canvas-soft border border-hairline rounded-lg py-1.5 pl-8 pr-3 text-xs text-ink outline-none focus:border-primary w-56 transition-colors"
            />
          </div>

          <ExportCsvButton
            filename="pulsesentry_app_traffic"
            label={lang === "th" ? "ส่งออกข้อมูล (CSV)" : "Export CSV"}
            headers={[
              "No",
              "Application",
              "PID",
              "Download Rate (MB/s)",
              "Upload Rate (KB/s)",
              "Session Total Download",
              "Session Total Upload",
              "Active Sockets",
            ]}
            rows={sortedApps.map((a, idx) => [
              idx + 1,
              a.name,
              a.pid,
              a.dl.toFixed(2),
              a.ul.toFixed(2),
              formatDataVolume(a.totalDl),
              formatDataVolume(a.totalUl),
              a.sockets,
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
                onClick={() => handleSort("name")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colApp}{" "}
                {appSort.key === "name"
                  ? appSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("pid")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                PID{" "}
                {appSort.key === "pid"
                  ? appSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("dl")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colDl}{" "}
                {appSort.key === "dl"
                  ? appSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("ul")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colUl}{" "}
                {appSort.key === "ul"
                  ? appSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("totalDl")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colTotalBandwidth}{" "}
                {appSort.key === "totalDl"
                  ? appSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("sockets")}
                className="pb-3 cursor-pointer select-none hover:text-ink transition-colors"
              >
                {t.colSockets}{" "}
                {appSort.key === "sockets"
                  ? appSort.order === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {sortedApps.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-xs text-ink-muted font-mono"
                >
                  {lang === "th"
                    ? "กำลังสแกนการใช้เน็ตของแอป..."
                    : "Scanning network processes..."}
                </td>
              </tr>
            ) : (
              sortedApps.map((app, idx) => {
                const sticker =
                  (app.sticker && STICKER_COLORS[app.sticker as StickerColorKey]) ||
                  STICKER_COLORS.sky;
                return (
                  <tr
                    key={app.pid}
                    className="hover:bg-canvas-soft/50 transition-colors"
                  >
                    <td className="py-3 font-mono text-ink-faint text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 font-semibold text-ink flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${sticker.dot} shrink-0`}
                      />
                      <span>{app.name}</span>
                    </td>
                    <td className="py-3 font-mono text-ink-faint">
                      #{app.pid}
                    </td>
                    <td className="py-3 font-mono font-semibold text-primary">
                      {formatRate(app.dl)}
                    </td>
                    <td className="py-3 font-mono font-semibold text-[#78350f]">
                      {formatRate(app.ul)}
                    </td>
                    <td className="py-3 text-ink-muted font-mono">
                      <span className="text-primary font-medium">
                        {formatDataVolume(app.totalDl)}
                      </span>
                      {" / "}
                      <span className="text-[#78350f] font-medium">
                        {formatDataVolume(app.totalUl)}
                      </span>
                    </td>
                    <td className="py-3 text-ink font-semibold font-mono">
                      {app.sockets}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
