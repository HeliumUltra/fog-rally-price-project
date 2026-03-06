import { useState, useCallback, useMemo } from "react";

const BASELINE_REVENUE = 159870;
const FERRARI_RED = "#ED1C24";
const DARK_RED = "#C41E1E";
const GREEN = "#2E8B57";

const DEFAULTS = {
  soloStandard: 5495,
  soloReturning: 4995,
  coStandard: 6995,
  coReturning: 6495,
  costSolo: 0,
  costCo: 0,
  flatFairmont: 0,
  flatAllegretto: 0,
  flatOps: 0,
  scenarios: [
    { total: 25, returning: 15, soloPct: 23 },
    { total: 30, returning: 15, soloPct: 23 },
    { total: 35, returning: 15, soloPct: 23 },
  ],
};

const COLORS = {
  bg: "#ffffff",
  headerBg: "#0a0a0a",
  card: "#ffffff",
  cardBorder: "#e5e5e5",
  sectionBg: "#f7f7f7",
  redAccent: FERRARI_RED,
  text: "#1C1C1C",
  textSecondary: "#555555",
  textMuted: "#888888",
  inputBg: "#ffffff",
  inputBorder: "#d0d0d0",
  inputFocus: FERRARI_RED,
  rowHover: "#fafafa",
  rowBorder: "#f0f0f0",
  footerBg: "#0a0a0a",
};

const FONT = {
  heading: "'Barlow', 'Poppins', 'Segoe UI', sans-serif",
  body: "'Poppins', 'Segoe UI', Roboto, sans-serif",
  mono: "'SF Mono', 'Fira Code', 'Consolas', monospace",
};

function fmt(n) {
  if (n == null || isNaN(n)) return "$0";
  const neg = n < 0;
  const abs = Math.abs(Math.round(n));
  const s = abs.toLocaleString("en-US");
  return (neg ? "\u2212$" : "$") + s;
}

function fmtDelta(n) {
  if (n === 0) return "$0";
  const sign = n > 0 ? "+" : "\u2212";
  return sign + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
}

function splitReg(total, soloPct) {
  const solo = Math.round((total * soloPct) / 100);
  const co = total - solo;
  return { solo, co };
}

function CurrencyInput({ value, onChange, label, small }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");
  const display = focused ? raw : fmt(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{
          fontSize: 11,
          color: COLORS.textMuted,
          fontFamily: FONT.body,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}>
          {label}
        </label>
      )}
      <input
        type="text"
        value={display}
        onFocus={() => { setFocused(true); setRaw(String(value)); }}
        onBlur={() => {
          setFocused(false);
          const parsed = parseInt(raw.replace(/[^0-9.-]/g, ""), 10);
          if (!isNaN(parsed)) onChange(parsed);
        }}
        onChange={(e) => setRaw(e.target.value)}
        style={{
          background: COLORS.inputBg,
          border: `2px solid ${focused ? COLORS.inputFocus : COLORS.inputBorder}`,
          borderRadius: 6,
          color: COLORS.text,
          padding: "10px 12px",
          fontSize: small ? 15 : 16,
          fontFamily: FONT.mono,
          fontWeight: 600,
          width: small ? 110 : 130,
          outline: "none",
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
}

function NumberInput({ value, onChange, label, min, max, small }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{
          fontSize: 11,
          color: COLORS.textMuted,
          fontFamily: FONT.body,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}>
          {label}
        </label>
      )}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          let v = parseInt(e.target.value, 10);
          if (isNaN(v)) v = 0;
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        }}
        style={{
          background: COLORS.inputBg,
          border: `2px solid ${COLORS.inputBorder}`,
          borderRadius: 6,
          color: COLORS.text,
          padding: "10px 12px",
          fontSize: small ? 15 : 16,
          fontFamily: FONT.mono,
          fontWeight: 600,
          width: small ? 70 : 90,
          outline: "none",
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
}

function PctSlider({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
      <span style={{
        fontSize: 11, color: COLORS.textMuted, fontFamily: FONT.body,
        textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500, minWidth: 34,
      }}>Solo</span>
      <input
        type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ flex: 1, accentColor: FERRARI_RED, cursor: "pointer", height: 6 }}
      />
      <span style={{
        fontSize: 11, color: COLORS.textMuted, fontFamily: FONT.body,
        textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500, minWidth: 60,
      }}>Co-Driver</span>
      <span style={{
        fontFamily: FONT.mono,
        fontSize: 12, color: COLORS.textSecondary, minWidth: 72, textAlign: "right",
        fontWeight: 600,
      }}>
        {value}% / {100 - value}%
      </span>
    </div>
  );
}

function DataRow({ label, value, highlight, negative, indent, bold }) {
  const color = negative ? FERRARI_RED : highlight ? GREEN : COLORS.text;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "7px 0", borderBottom: `1px solid ${COLORS.rowBorder}`,
      paddingLeft: indent ? 12 : 0,
    }}>
      <span style={{
        fontSize: 13, color: COLORS.textSecondary, fontFamily: FONT.body, fontWeight: 400,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: bold ? 17 : 14, fontWeight: bold ? 700 : 600, color,
        fontFamily: FONT.mono, letterSpacing: "-0.02em",
      }}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, color: FERRARI_RED, textTransform: "uppercase",
      letterSpacing: "0.12em", fontFamily: FONT.heading, marginBottom: 6,
      fontWeight: 700, paddingBottom: 6, borderBottom: `2px solid ${FERRARI_RED}`,
    }}>
      {children}
    </div>
  );
}

function ScenarioColumn({ index, scenario, onUpdate, prices, costs, flatCosts }) {
  const { total, returning, soloPct } = scenario;
  const effectiveReturning = Math.min(returning, total);
  const newDrivers = total - effectiveReturning;

  const retSplit = splitReg(effectiveReturning, soloPct);
  const newSplit = splitReg(newDrivers, soloPct);

  const totalSolo = retSplit.solo + newSplit.solo;
  const totalCo = retSplit.co + newSplit.co;

  const revReturning = retSplit.solo * prices.soloReturning + retSplit.co * prices.coReturning;
  const revNew = newSplit.solo * prices.soloStandard + newSplit.co * prices.coStandard;
  const grossRevenue = revReturning + revNew;
  const perDriverCost = totalSolo * costs.costSolo + totalCo * costs.costCo;
  const totalFlatCosts = flatCosts.flatFairmont + flatCosts.flatAllegretto + flatCosts.flatOps;
  const totalCost = perDriverCost + totalFlatCosts;
  const hasPerDriverCosts = costs.costSolo > 0 || costs.costCo > 0;
  const hasFlatCosts = totalFlatCosts > 0;
  const hasCosts = hasPerDriverCosts || hasFlatCosts;
  const netRevenue = grossRevenue - totalCost;
  const vs2025 = grossRevenue - BASELINE_REVENUE;
  const avgGross = total > 0 ? grossRevenue / total : 0;
  const avgNet = total > 0 ? netRevenue / total : 0;

  const discountSolo = prices.soloStandard - prices.soloReturning;
  const discountCo = prices.coStandard - prices.coReturning;
  const totalDiscountCost = retSplit.solo * discountSolo + retSplit.co * discountCo;

  const scenarioLabel = String.fromCharCode(65 + index);

  return (
    <div style={{
      flex: 1, background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 12, padding: 0, display: "flex", flexDirection: "column",
      overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      transition: "box-shadow 0.2s",
    }}>
      {/* Scenario header with red bar */}
      <div style={{
        background: COLORS.headerBg, padding: "16px 20px", textAlign: "center",
        borderBottom: `3px solid ${FERRARI_RED}`,
      }}>
        <div style={{
          fontSize: 14, color: "#ffffff", textTransform: "uppercase",
          letterSpacing: "0.15em", fontFamily: FONT.heading, fontWeight: 700,
        }}>
          Scenario {scenarioLabel}
        </div>
      </div>

      <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <NumberInput label="Total Registrations" value={total} min={0} max={200} small
            onChange={(v) => onUpdate({ ...scenario, total: v })} />
          <NumberInput label="Returning Drivers" value={returning} min={0} max={total} small
            onChange={(v) => onUpdate({ ...scenario, returning: Math.min(v, total) })} />
          {effectiveReturning < returning && (
            <div style={{ fontSize: 11, color: FERRARI_RED, fontFamily: FONT.body, fontWeight: 500 }}>
              Capped to total registrations
            </div>
          )}
          <div style={{
            fontSize: 12, color: COLORS.textMuted, fontFamily: FONT.body, fontWeight: 500,
          }}>
            New drivers: <span style={{ color: COLORS.text, fontWeight: 700 }}>{newDrivers}</span>
          </div>
          <PctSlider value={soloPct} onChange={(v) => onUpdate({ ...scenario, soloPct: v })} />
        </div>

        <div style={{ paddingTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          <SectionLabel>Registration Breakdown</SectionLabel>
          <DataRow label="Returning Solo" value={retSplit.solo} indent />
          <DataRow label="Returning Co-Driver" value={retSplit.co} indent />
          <DataRow label="New Solo" value={newSplit.solo} indent />
          <DataRow label="New Co-Driver" value={newSplit.co} indent />
        </div>

        <div style={{ paddingTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          <SectionLabel>Revenue</SectionLabel>
          <DataRow label="Returning Revenue" value={fmt(revReturning)} indent />
          <DataRow label="New Revenue" value={fmt(revNew)} indent />
          <DataRow label="Total Gross Revenue" value={fmt(grossRevenue)} bold
            highlight={grossRevenue > BASELINE_REVENUE} negative={grossRevenue < BASELINE_REVENUE} />
          {hasCosts && (
            <>
              {costs.costSolo > 0 && <DataRow label={`Solo Cost (${totalSolo} × ${fmt(costs.costSolo)})`} value={"\u2212" + fmt(totalSolo * costs.costSolo)} indent />}
              {costs.costCo > 0 && <DataRow label={`Co-Driver Cost (${totalCo} × ${fmt(costs.costCo)})`} value={"\u2212" + fmt(totalCo * costs.costCo)} indent />}
              {flatCosts.flatFairmont > 0 && <DataRow label="Fairmont" value={"\u2212" + fmt(flatCosts.flatFairmont)} indent />}
              {flatCosts.flatAllegretto > 0 && <DataRow label="Allegretto" value={"\u2212" + fmt(flatCosts.flatAllegretto)} indent />}
              {flatCosts.flatOps > 0 && <DataRow label="General Ops" value={"\u2212" + fmt(flatCosts.flatOps)} indent />}
              <DataRow label="Total Cost" value={"\u2212" + fmt(totalCost)} indent />
              <DataRow label="Total Net Revenue" value={fmt(netRevenue)} bold
                highlight={netRevenue > 0} negative={netRevenue < 0} />
            </>
          )}
        </div>

        <div style={{ paddingTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          <SectionLabel>Analysis</SectionLabel>
          <DataRow label="vs. 2025 Baseline" value={fmtDelta(vs2025)}
            highlight={vs2025 > 0} negative={vs2025 < 0} />
          <DataRow label="Avg Revenue / Reg" value={fmt(avgGross)} />
          {hasCosts && (
            <DataRow label="Avg Net / Reg" value={fmt(avgNet)}
              highlight={avgNet > 0} negative={avgNet < 0} />
          )}
          <DataRow label="Loyalty Discount Cost" value={fmt(totalDiscountCost)}
            negative={totalDiscountCost > 0} />
        </div>

        {netRevenue < 0 && hasCosts && (
          <div style={{
            background: "#fef2f2", border: `2px solid ${FERRARI_RED}`, borderRadius: 8,
            padding: "10px 14px", fontSize: 12, color: DARK_RED,
            fontFamily: FONT.body, textAlign: "center", fontWeight: 600,
          }}>
            Net revenue is negative — cost per driver exceeds average revenue
          </div>
        )}
      </div>
    </div>
  );
}

function computeScenario(scenario, prices, costs, flatCosts) {
  const { total, returning, soloPct } = scenario;
  const effectiveReturning = Math.min(returning, total);
  const newDrivers = total - effectiveReturning;
  const retSplit = splitReg(effectiveReturning, soloPct);
  const newSplit = splitReg(newDrivers, soloPct);
  const totalSolo = retSplit.solo + newSplit.solo;
  const totalCo = retSplit.co + newSplit.co;
  const revReturning = retSplit.solo * prices.soloReturning + retSplit.co * prices.coReturning;
  const revNew = newSplit.solo * prices.soloStandard + newSplit.co * prices.coStandard;
  const gross = revReturning + revNew;
  const totalFlatCosts = flatCosts.flatFairmont + flatCosts.flatAllegretto + flatCosts.flatOps;
  const net = gross - (totalSolo * costs.costSolo + totalCo * costs.costCo) - totalFlatCosts;
  return { gross, net };
}

export default function App() {
  const [prices, setPrices] = useState({
    soloStandard: DEFAULTS.soloStandard,
    soloReturning: DEFAULTS.soloReturning,
    coStandard: DEFAULTS.coStandard,
    coReturning: DEFAULTS.coReturning,
  });
  const [costs, setCosts] = useState({ costSolo: DEFAULTS.costSolo, costCo: DEFAULTS.costCo });
  const [flatCosts, setFlatCosts] = useState({ flatFairmont: DEFAULTS.flatFairmont, flatAllegretto: DEFAULTS.flatAllegretto, flatOps: DEFAULTS.flatOps });
  const [scenarios, setScenarios] = useState(DEFAULTS.scenarios.map((s) => ({ ...s })));

  const totalFlatCosts = flatCosts.flatFairmont + flatCosts.flatAllegretto + flatCosts.flatOps;
  const hasCosts = costs.costSolo > 0 || costs.costCo > 0 || totalFlatCosts > 0;

  const resetAll = () => {
    setPrices({
      soloStandard: DEFAULTS.soloStandard, soloReturning: DEFAULTS.soloReturning,
      coStandard: DEFAULTS.coStandard, coReturning: DEFAULTS.coReturning,
    });
    setCosts({ costSolo: DEFAULTS.costSolo, costCo: DEFAULTS.costCo });
    setFlatCosts({ flatFairmont: DEFAULTS.flatFairmont, flatAllegretto: DEFAULTS.flatAllegretto, flatOps: DEFAULTS.flatOps });
    setScenarios(DEFAULTS.scenarios.map((s) => ({ ...s })));
  };

  const updateScenario = useCallback((idx, val) => {
    setScenarios((prev) => { const next = [...prev]; next[idx] = val; return next; });
  }, []);

  const results = useMemo(
    () => scenarios.map((s) => computeScenario(s, prices, costs, flatCosts)),
    [scenarios, prices, costs, flatCosts]
  );

  const maxGrossIdx = results.reduce((best, r, i) => (r.gross > results[best].gross ? i : best), 0);
  const maxNetIdx = results.reduce((best, r, i) => (r.net > results[best].net ? i : best), 0);
  const grossRange = Math.max(...results.map((r) => r.gross)) - Math.min(...results.map((r) => r.gross));

  return (
    <div style={{
      background: COLORS.bg, minHeight: "100vh", color: COLORS.text,
      fontFamily: FONT.body,
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header bar */}
      <header style={{
        background: COLORS.headerBg, padding: "20px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `4px solid ${FERRARI_RED}`,
      }}>
        <div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, fontFamily: FONT.heading,
            margin: 0, color: "#ffffff", letterSpacing: "0.02em",
          }}>
            FOG Rally 2026
          </h1>
          <div style={{
            fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4,
            fontFamily: FONT.body, fontWeight: 300,
          }}>
            Registration Pricing Scenarios
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            textAlign: "right", color: "rgba(255,255,255,0.5)", fontSize: 12,
            fontFamily: FONT.body, fontWeight: 400,
          }}>
            <div>2025 Baseline</div>
            <div style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, fontFamily: FONT.mono }}>
              {fmt(BASELINE_REVENUE)}
            </div>
            <div style={{ fontSize: 11 }}>26 registrations</div>
          </div>
          <button
            onClick={resetAll}
            style={{
              background: "transparent", border: `1px solid rgba(255,255,255,0.3)`,
              color: "rgba(255,255,255,0.8)", padding: "8px 20px", fontSize: 12,
              fontFamily: FONT.body, textTransform: "uppercase",
              letterSpacing: "0.08em", cursor: "pointer", borderRadius: 6,
              fontWeight: 500, transition: "all 0.2s",
            }}
          >
            Reset
          </button>
        </div>
      </header>

      <div style={{ padding: "32px 40px", maxWidth: 1260, margin: "0 auto" }}>

        {/* Price Configuration */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 14, textTransform: "uppercase", letterSpacing: "0.15em",
            color: FERRARI_RED, fontFamily: FONT.heading, fontWeight: 700,
            marginBottom: 20, paddingBottom: 10,
            borderBottom: `2px solid ${FERRARI_RED}`,
          }}>
            Price Configuration
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {/* Solo Driver card */}
            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12, padding: 0, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                background: COLORS.sectionBg, padding: "12px 20px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
              }}>
                <div style={{
                  fontSize: 13, color: COLORS.text, textTransform: "uppercase",
                  letterSpacing: "0.1em", fontFamily: FONT.heading, fontWeight: 700,
                }}>Solo Driver</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <CurrencyInput label="Standard (New)" value={prices.soloStandard} small
                    onChange={(v) => setPrices((p) => ({ ...p, soloStandard: v }))} />
                  <CurrencyInput label="Returning" value={prices.soloReturning} small
                    onChange={(v) => setPrices((p) => ({ ...p, soloReturning: v }))} />
                </div>
                {prices.soloStandard > prices.soloReturning && (
                  <div style={{
                    fontSize: 12, color: GREEN, marginTop: 12,
                    fontFamily: FONT.mono, fontWeight: 600,
                  }}>
                    Loyalty discount: {fmt(prices.soloStandard - prices.soloReturning)}/driver
                  </div>
                )}
              </div>
            </div>

            {/* Co-Driver card */}
            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12, padding: 0, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                background: COLORS.sectionBg, padding: "12px 20px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
              }}>
                <div style={{
                  fontSize: 13, color: COLORS.text, textTransform: "uppercase",
                  letterSpacing: "0.1em", fontFamily: FONT.heading, fontWeight: 700,
                }}>Rally + Co-Driver</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <CurrencyInput label="Standard (New)" value={prices.coStandard} small
                    onChange={(v) => setPrices((p) => ({ ...p, coStandard: v }))} />
                  <CurrencyInput label="Returning" value={prices.coReturning} small
                    onChange={(v) => setPrices((p) => ({ ...p, coReturning: v }))} />
                </div>
                {prices.coStandard > prices.coReturning && (
                  <div style={{
                    fontSize: 12, color: GREEN, marginTop: 12,
                    fontFamily: FONT.mono, fontWeight: 600,
                  }}>
                    Loyalty discount: {fmt(prices.coStandard - prices.coReturning)}/driver
                  </div>
                )}
              </div>
            </div>

            {/* Per-Driver Cost card */}
            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12, padding: 0, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                background: COLORS.sectionBg, padding: "12px 20px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
              }}>
                <div style={{
                  fontSize: 13, color: COLORS.text, textTransform: "uppercase",
                  letterSpacing: "0.1em", fontFamily: FONT.heading, fontWeight: 700,
                }}>Per-Driver Cost</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <CurrencyInput label="Per Solo Driver" value={costs.costSolo} small
                    onChange={(v) => setCosts((c) => ({ ...c, costSolo: v }))} />
                  <CurrencyInput label="Per Co-Driver" value={costs.costCo} small
                    onChange={(v) => setCosts((c) => ({ ...c, costCo: v }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Flat Costs row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 20 }}>
            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12, padding: 0, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                background: COLORS.sectionBg, padding: "12px 20px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
              }}>
                <div style={{
                  fontSize: 13, color: COLORS.text, textTransform: "uppercase",
                  letterSpacing: "0.1em", fontFamily: FONT.heading, fontWeight: 700,
                }}>Fairmont</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <CurrencyInput label="Flat Cost" value={flatCosts.flatFairmont} small
                  onChange={(v) => setFlatCosts((f) => ({ ...f, flatFairmont: v }))} />
              </div>
            </div>

            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12, padding: 0, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                background: COLORS.sectionBg, padding: "12px 20px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
              }}>
                <div style={{
                  fontSize: 13, color: COLORS.text, textTransform: "uppercase",
                  letterSpacing: "0.1em", fontFamily: FONT.heading, fontWeight: 700,
                }}>Allegretto</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <CurrencyInput label="Flat Cost" value={flatCosts.flatAllegretto} small
                  onChange={(v) => setFlatCosts((f) => ({ ...f, flatAllegretto: v }))} />
              </div>
            </div>

            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12, padding: 0, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                background: COLORS.sectionBg, padding: "12px 20px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
              }}>
                <div style={{
                  fontSize: 13, color: COLORS.text, textTransform: "uppercase",
                  letterSpacing: "0.1em", fontFamily: FONT.heading, fontWeight: 700,
                }}>General Operations</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <CurrencyInput label="Flat Cost" value={flatCosts.flatOps} small
                  onChange={(v) => setFlatCosts((f) => ({ ...f, flatOps: v }))} />
              </div>
            </div>
          </div>
        </section>

        {/* Scenario Columns */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 14, textTransform: "uppercase", letterSpacing: "0.15em",
            color: FERRARI_RED, fontFamily: FONT.heading, fontWeight: 700,
            marginBottom: 20, paddingBottom: 10,
            borderBottom: `2px solid ${FERRARI_RED}`,
          }}>
            Scenarios
          </h2>
          <div style={{ display: "flex", gap: 20 }}>
            {scenarios.map((s, i) => (
              <ScenarioColumn key={i} index={i} scenario={s}
                onUpdate={(val) => updateScenario(i, val)}
                prices={prices} costs={costs} flatCosts={flatCosts} />
            ))}
          </div>
        </section>

        {/* Comparison Summary */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 14, textTransform: "uppercase", letterSpacing: "0.15em",
            color: FERRARI_RED, fontFamily: FONT.heading, fontWeight: 700,
            marginBottom: 20, paddingBottom: 10,
            borderBottom: `2px solid ${FERRARI_RED}`,
          }}>
            Comparison
          </h2>
          <div style={{
            background: COLORS.headerBg, borderRadius: 12,
            padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase",
                letterSpacing: "0.12em", fontFamily: FONT.heading, marginBottom: 6, fontWeight: 600,
              }}>Highest Gross</div>
              <div style={{
                fontSize: 24, fontFamily: FONT.mono,
                color: "#4ade80", fontWeight: 700,
              }}>{fmt(results[maxGrossIdx].gross)}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: FONT.body, marginTop: 4, fontWeight: 400 }}>
                Scenario {String.fromCharCode(65 + maxGrossIdx)} ({scenarios[maxGrossIdx].total} reg.)
              </div>
            </div>

            {hasCosts && (
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase",
                  letterSpacing: "0.12em", fontFamily: FONT.heading, marginBottom: 6, fontWeight: 600,
                }}>Highest Net</div>
                <div style={{
                  fontSize: 24, fontFamily: FONT.mono,
                  color: results[maxNetIdx].net > 0 ? "#4ade80" : FERRARI_RED, fontWeight: 700,
                }}>{fmt(results[maxNetIdx].net)}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: FONT.body, marginTop: 4, fontWeight: 400 }}>
                  Scenario {String.fromCharCode(65 + maxNetIdx)} ({scenarios[maxNetIdx].total} reg.)
                </div>
              </div>
            )}

            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase",
                letterSpacing: "0.12em", fontFamily: FONT.heading, marginBottom: 6, fontWeight: 600,
              }}>Revenue Range</div>
              <div style={{
                fontSize: 24, fontFamily: FONT.mono,
                color: "#ffffff", fontWeight: 700,
              }}>{fmt(grossRange)}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: FONT.body, marginTop: 4, fontWeight: 400 }}>
                {fmt(Math.min(...results.map((r) => r.gross)))} &ndash; {fmt(Math.max(...results.map((r) => r.gross)))}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase",
                letterSpacing: "0.12em", fontFamily: FONT.heading, marginBottom: 6, fontWeight: 600,
              }}>vs. 2025 Baseline</div>
              <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
                {results.map((r, i) => {
                  const delta = r.gross - BASELINE_REVENUE;
                  return (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{
                        fontSize: 16,
                        fontFamily: FONT.mono,
                        color: delta >= 0 ? "#4ade80" : FERRARI_RED, fontWeight: 700,
                      }}>{fmtDelta(delta)}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: FONT.body, fontWeight: 500, marginTop: 2 }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        background: COLORS.footerBg, padding: "20px 40px",
        borderTop: `3px solid ${FERRARI_RED}`,
      }}>
        <div style={{
          maxWidth: 1260, margin: "0 auto",
          fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: FONT.body,
          textAlign: "center", fontWeight: 400,
        }}>
          FOG Rally 2026 &middot; Internal pricing model &middot; 2025 baseline: 26 registrations, {fmt(BASELINE_REVENUE)} gross revenue
        </div>
      </footer>
    </div>
  );
}
