import React, { useMemo } from "react";
import { Globe, Radio, Server } from "lucide-react";
import { ExportCsvButton } from "./ExportCsvButton";
import { Language, TranslationDict } from "../i18n/translations";
import { SocketConnection, GeoRegionItem } from "../types";

interface GeoipTabProps {
  sockets?: SocketConnection[];
  geoRegions?: GeoRegionItem[];
  t: TranslationDict;
  lang: Language;
}

export const GeoipTab: React.FC<GeoipTabProps> = ({
  sockets = [],
  geoRegions: explicitRegions,
  t,
  lang,
}) => {
  // Lazy evaluation: Computed only when GeoipTab is mounted & active
  const regions = useMemo<GeoRegionItem[]>(() => {
    if (explicitRegions) return explicitRegions;

    const counts: Record<string, { count: number; code: string; orgs: Set<string> }> = {};
    sockets.forEach((s) => {
      if (
        s.country &&
        s.country !== "Unknown" &&
        s.country !== "-" &&
        s.country !== "LOCAL"
      ) {
        if (!counts[s.country]) {
          counts[s.country] = {
            count: 0,
            code: s.code || (s.country === "LAN" ? "LAN" : s.country.slice(0, 2).toUpperCase()),
            orgs: new Set(),
          };
        }
        counts[s.country].count += 1;
        if (s.code) {
          counts[s.country].code = s.code;
        }
        if (s.org && s.org !== "Local / Unknown") {
          counts[s.country].orgs.add(s.org);
        }
      }
    });

    return Object.entries(counts)
      .map(([country, data]) => ({
        country,
        code: data.code,
        count: data.count,
        orgs: Array.from(data.orgs).slice(0, 3).join(", ") || "Direct Connection",
        ping:
          data.code === "TH"
            ? "< 15ms"
            : data.code === "SG"
              ? "~35ms"
              : data.code === "US"
                ? "~180ms"
                : "~120ms",
        traffic: `${(data.count * 1.2).toFixed(1)} MB`,
      }))
      .sort((a, b) => b.count - a.count);
  }, [sockets, explicitRegions]);

  return (
    <div className="flex flex-col gap-6 ps-fade-in">
      <div className="bg-surface rounded-xl border border-hairline p-6 shadow-notion-card">
        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-lg font-bold text-ink tracking-tight m-0">
              {t.geoTitle}
            </h3>
          </div>
          <ExportCsvButton
            filename="pulsesentry_geoip_destinations"
            label={lang === "th" ? "ส่งออกข้อมูล (CSV)" : "Export CSV"}
            headers={[
              "No",
              "Country",
              "Code",
              "Active Sockets",
              "Organizations",
              "Estimated Traffic",
            ]}
            rows={regions.map((region, idx) => [
              idx + 1,
              region.country,
              region.code || "EXT",
              region.count,
              region.orgs,
              region.traffic,
            ])}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-ink-muted bg-canvas-soft rounded-xl border border-hairline font-mono">
              {lang === "th"
                ? "กำลังดึงข้อมูลตำแหน่งปลายทางจาก Socket จริงในเครื่อง..."
                : "Resolving remote destinations from active sockets..."}
            </div>
          ) : (
            regions.map((region, idx) => {
              const code = (
                region.code ||
                (region.country === "LAN"
                  ? "LAN"
                  : region.country.slice(0, 2))
              ).toUpperCase();
              const isLan =
                code === "LAN" || region.country.toUpperCase() === "LAN";

              return (
                <div
                  key={idx}
                  className="bg-surface rounded-xl p-5 border border-hairline flex flex-col justify-between hover:border-primary/40 shadow-2xs hover:shadow-xs transition-all group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${
                            isLan
                              ? "bg-[#FEF0E6] text-sticker-orange border-[#FCD1B0]"
                              : "bg-[#EBF5FD] text-primary border-[#B8DCFA] font-mono font-black text-xs tracking-wider"
                          }`}
                        >
                          {isLan ? (
                            <Server className="w-4 h-4 text-sticker-orange" />
                          ) : (
                            code
                          )}
                        </div>
                        <div>
                          <div className="text-base font-bold text-ink tracking-tight flex items-center gap-1.5">
                            <span>{region.country}</span>
                            <span className="font-mono text-ink-faint text-[11px] font-normal">
                              #{idx + 1}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#EBF5FD] border border-[#B8DCFA] text-primary flex items-center gap-1">
                        <Radio className="w-3 h-3 text-primary animate-pulse" />
                        <span>{region.count}</span>
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mb-4 line-clamp-2 leading-relaxed">
                      {region.orgs || "Local Network Host"}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-hairline text-xs font-mono">
                    <span className="text-ink-faint font-sans">
                      {lang === "th" ? "สัดส่วนทราฟฟิก" : "Traffic Share"}
                    </span>
                    <span className="font-bold text-primary">
                      {region.traffic}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
