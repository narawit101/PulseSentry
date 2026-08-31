import React from "react";
import { Globe, Radio, Server } from "lucide-react";
import { ExportCsvButton } from "./ExportCsvButton";
import { Language } from "../i18n/translations";

interface GeoRegionItem {
  country: string;
  count: number;
  orgs: string;
  ping: string;
  traffic: string;
}

interface GeoipTabProps {
  geoRegions: GeoRegionItem[];
  t: any;
  lang: Language;
}

// Clean Country ISO Code Resolver (No emojis)
const getCountryCode = (country: string): string => {
  const c = country.toLowerCase().trim();
  if (c.includes("united states") || c === "us" || c === "usa") return "US";
  if (c.includes("singapore") || c === "sg") return "SG";
  if (c.includes("thailand") || c === "th") return "TH";
  if (c.includes("japan") || c === "jp") return "JP";
  if (c.includes("germany") || c === "de") return "DE";
  if (c.includes("india") || c === "in") return "IN";
  if (
    c.includes("united kingdom") ||
    c.includes("britain") ||
    c === "uk" ||
    c === "gb"
  )
    return "GB";
  if (c.includes("australia") || c === "au") return "AU";
  if (c.includes("canada") || c === "ca") return "CA";
  if (c.includes("france") || c === "fr") return "FR";
  if (c.includes("netherlands") || c.includes("holland") || c === "nl")
    return "NL";
  if (c.includes("hong kong") || c === "hk") return "HK";
  if (c.includes("taiwan") || c === "tw") return "TW";
  if (c.includes("south korea") || c.includes("korea") || c === "kr")
    return "KR";
  if (c.includes("china") || c === "cn") return "CN";
  if (c.includes("ireland") || c === "ie") return "IE";
  if (c.includes("finland") || c === "fi") return "FI";
  if (c.includes("sweden") || c === "se") return "SE";
  if (
    c.includes("lan") ||
    c.includes("local") ||
    c.includes("loopback") ||
    c === "local network"
  )
    return "LAN";
  return country.slice(0, 2).toUpperCase();
};

export const GeoipTab: React.FC<GeoipTabProps> = ({ geoRegions, t, lang }) => {
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
              "Active Sockets",
              "Organizations",
              "Estimated Traffic",
            ]}
            rows={geoRegions.map((region, idx) => [
              idx + 1,
              region.country,
              region.count,
              region.orgs,
              region.traffic,
            ])}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {geoRegions.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-ink-muted bg-canvas-soft rounded-xl border border-hairline font-mono">
              {lang === "th"
                ? "กำลังดึงข้อมูลตำแหน่งปลายทางจาก Socket จริงในเครื่อง..."
                : "Resolving remote destinations from active sockets..."}
            </div>
          ) : (
            geoRegions.map((region, idx) => {
              const code = getCountryCode(region.country);
              const isLan = code === "LAN";

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
