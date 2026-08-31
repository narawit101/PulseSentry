import React from "react";
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

export const GeoipTab: React.FC<GeoipTabProps> = ({ geoRegions, t, lang }) => {
  return (
    <div className="flex flex-col gap-6 ps-fade-in">
      <div className="bg-surface rounded-xl border border-hairline p-6 shadow-notion-card">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h3 className="text-lg font-bold text-ink tracking-tight m-0">
            {t.geoTitle}
          </h3>
          <ExportCsvButton
            filename="pulsesentry_geoip_destinations"
            label={lang === "th" ? "ส่งออกข้อมูล (CSV)" : "Export CSV"}
            headers={[
              "No",
              "Country",
              "Active Sockets",
              "Organizations",
              "Ping Latency",
              "Estimated Traffic",
            ]}
            rows={geoRegions.map((region, idx) => [
              idx + 1,
              region.country,
              region.count,
              region.orgs,
              region.ping,
              region.traffic,
            ])}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {geoRegions.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-ink-muted bg-canvas-soft rounded-xl border border-hairline font-mono">
              {lang === "th"
                ? "กำลังดึงข้อมูลตำแหน่งปลายทางจาก Socket จริงในเครื่อง..."
                : "Resolving remote destinations from active sockets..."}
            </div>
          ) : (
            geoRegions.map((region, idx) => (
              <div
                key={idx}
                className="bg-canvas-soft rounded-xl p-4 border border-hairline flex flex-col justify-between hover:bg-surface hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-ink-faint text-xs font-medium">
                        #{idx + 1}
                      </span>
                      <span className="text-base font-bold text-ink">
                        {region.country}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface border border-hairline font-mono text-ink">
                      {region.count} {t.activeSockets}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mb-3 m-0 line-clamp-1">
                    {region.orgs}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-hairline text-xs font-mono">
                  <span className="text-sticker-green font-semibold">
                    {region.ping}
                  </span>
                  <span className="text-primary font-semibold">
                    {region.traffic}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
