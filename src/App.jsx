import { useState, useCallback, useMemo } from "react";

const BASELINE_REVENUE = 159870;
const FERRARI_RED = "#C41E1E";
const GREEN = "#1a7a3a";

const DEFAULTS = {
  soloStandard: 5495,
  soloReturning: 4995,
  coStandard: 6995,
  coReturning: 6495,
  costSolo: 0,
  costCo: 0,
  scenarios: [
    { total: 25, returning: 15, soloPct: 23 },
    { total: 30, returning: 15, soloPct: 23 },
    { total: 35, returning: 15, soloPct: 23 },
  ],
};

const COLORS = {
  bg: "#f8f7f4",
  card: "#ffffff",
  cardBorder: "#e2e0db",
  sectionBorder: "#d6d3cc",
  rowBorder: "#f0eeea",
  text: "#1a1a1a",
  textMuted: "#6b6560",
  textFaint: "#9a958e",
  label: "#7a756e",
  inputBg: "#fafaf8",
  inputBorder: "#d6d3cc",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label style={{
          fontSize: 11,
          color: COLORS.label,
          fontFamily: "'Georgia', serif",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
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
          border: `1px solid ${COLORS.inputBorder}`,
          borderRadius: 3,
          color: COLORS.text,
          padding: "8px 10px",
          fontSize: small ? 14 : 16,
          fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
          width: small ? 100 : 120,
          outline: "none",
        }}
      />
    </div>
  );
}

function NumberInput({ value, onChange, label, min, max, small }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label style={{
          fontSize: 11,
          color: COLORS.label,
          fontFamily: "'Georgia', serif",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
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
          border: `1px solid ${COLORS.inputBorder}`,
          borderRadius: 3,
          color: COLORS.text,
          padding: "8px 10px",
          fontSize: small ? 14 : 16,
          fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
          width: small ? 60 : 80,
          outline: "none",
        }}
      />
    </div>
  );
}

function PctSlider({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{
        fontSize: 11, color: COLORS.label, fontFamily: "'Georgia', serif",
        textTransform: "uppercase", letterSpacing: "0.03em", minWidth: 32,
      }}>Solo</span>
      <input
        type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ flex: 1, accentColor: FERRARI_RED, cursor: "pointer" }}
      />
      <span style={{
        fontSize: 11, color: COLORS.label, fontFamily: "'Georgia', serif",
        textTransform: "uppercase", letterSpacing: "0.03em", minWidth: 52,
      }}>Co-Driver</span>
      <span style={{
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
        fontSize: 12, color: COLORS.textMuted, minWidth: 68, textAlign: "right",
      }}>
        {value}% / {100 - value}%
      </span>
    </div>
  );
}

function DataRow({ label, value, highlight, negative, mono, indent, bold }) {
  const color = negative ? FERRARI_RED : highlight ? GREEN : COLORS.text;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "5px 0", borderBottom: `1px solid ${COLORS.rowBorder}`,
      paddingLeft: indent ? 12 : 0,
    }}>
      <span style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: "'Georgia', serif" }}>
        {label}
      </span>
      <span style={{
        fontSize: bold ? 16 : 14, fontWeight: bold ? 700 : 500, color,
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
        letterSpacing: "-0.02em",
      }}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, color: COLORS.textFaint, textTransform: "uppercase",
      letterSpacing: "0.1em", fontFamily: "'Georgia', serif", marginBottom: 4,
      fontWeight: 600,
    }}>
      {children}
    </div>
  );
}

function ScenarioColumn({ index, scenario, onUpdate, prices, costs }) {
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
  const totalCost = totalSolo * costs.costSolo + totalCo * costs.costCo;
  const hasCosts = costs.costSolo > 0 || costs.costCo > 0;
  const netRevenue = grossRevenue - totalCost;
  const vs2025 = grossRevenue - BASELINE_REVENUE;
  const avgGross = total > 0 ? grossRevenue / total : 0;
  const avgNet = total > 0 ? netRevenue / total : 0;

  const discountSolo = prices.soloStandard - prices.soloReturning;
  const discountCo = prices.coStandard - prices.coReturning;
  const totalDiscountCost = retSplit.solo * discountSolo + retSplit.co * discountCo;

  return (
    <div style={{
      flex: 1, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 4, padding: 20, display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ textAlign: "center", borderBottom: `2px solid ${FERRARI_RED}`, paddingBottom: 10 }}>
        <div style={{
          fontSize: 13, color: COLORS.textMuted, textTransform: "uppercase",
          letterSpacing: "0.12em", fontFamily: "'Georgia', serif", fontWeight: 600,
        }}>
          Scenario {String.fromCharCode(65 + index)}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <NumberInput label="Total Registrations" value={total} min={0} max={200} small
          onChange={(v) => onUpdate({ ...scenario, total: v })} />
        <NumberInput label="Returning Drivers" value={returning} min={0} max={total} small
          onChange={(v) => onUpdate({ ...scenario, returning: Math.min(v, total) })} />
        {effectiveReturning < returning && (
          <div style={{ fontSize: 11, color: FERRARI_RED }}>Capped to total registrations</div>
        )}
        <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: -4 }}>
          New drivers: {newDrivers}
        </div>
        <PctSlider value={soloPct} onChange={(v) => onUpdate({ ...scenario, soloPct: v })} />
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.rowBorder}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
        <SectionLabel>Registration Breakdown</SectionLabel>
        <DataRow label="Returning Solo" value={retSplit.solo} mono indent />
        <DataRow label="Returning Co-Driver" value={retSplit.co} mono indent />
        <DataRow label="New Solo" value={newSplit.solo} mono indent />
        <DataRow label="New Co-Driver" value={newSplit.co} mono indent />
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.rowBorder}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
        <SectionLabel>Revenue</SectionLabel>
        <DataRow label="Returning Revenue" value={fmt(revReturning)} mono indent />
        <DataRow label="New Revenue" value={fmt(revNew)} mono indent />
        <DataRow label="Total Gross Revenue" value={fmt(grossRevenue)} bold
          highlight={grossRevenue > BASELINE_REVENUE} negative={grossRevenue < BASELINE_REVENUE} />
        {hasCosts && (
          <>
            {costs.costSolo > 0 && <DataRow label={`Solo Cost (${totalSolo} × ${fmt(costs.costSolo)})`} value={"\u2212" + fmt(totalSolo * costs.costSolo)} mono indent />}
            {costs.costCo > 0 && <DataRow label={`Co-Driver Cost (${totalCo} × ${fmt(costs.costCo)})`} value={"\u2212" + fmt(totalCo * costs.costCo)} mono indent />}
            <DataRow label="Total Cost" value={"\u2212" + fmt(totalCost)} mono indent />
            <DataRow label="Total Net Revenue" value={fmt(netRevenue)} bold
              highlight={netRevenue > 0} negative={netRevenue < 0} />
          </>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.rowBorder}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
        <SectionLabel>Analysis</SectionLabel>
        <DataRow label="vs. 2025 Baseline" value={fmtDelta(vs2025)}
          highlight={vs2025 > 0} negative={vs2025 < 0} />
        <DataRow label="Avg Revenue / Reg" value={fmt(avgGross)} mono />
        {hasCosts && (
          <DataRow label="Avg Net / Reg" value={fmt(avgNet)}
            highlight={avgNet > 0} negative={avgNet < 0} />
        )}
        <DataRow label="Loyalty Discount Cost" value={fmt(totalDiscountCost)}
          negative={totalDiscountCost > 0} />
      </div>

      {netRevenue < 0 && hasCosts && (
        <div style={{
          background: "#fef2f2", border: `1px solid ${FERRARI_RED}`, borderRadius: 3,
          padding: "8px 12px", fontSize: 12, color: FERRARI_RED,
          fontFamily: "'Georgia', serif", textAlign: "center",
        }}>
          Net revenue is negative — cost per driver exceeds average revenue
        </div>
      )}
    </div>
  );
}

function computeScenario(scenario, prices, costs) {
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
  const net = gross - (totalSolo * costs.costSolo + totalCo * costs.costCo);
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
  const [scenarios, setScenarios] = useState(DEFAULTS.scenarios.map((s) => ({ ...s })));

  const hasCosts = costs.costSolo > 0 || costs.costCo > 0;

  const resetAll = () => {
    setPrices({
      soloStandard: DEFAULTS.soloStandard, soloReturning: DEFAULTS.soloReturning,
      coStandard: DEFAULTS.coStandard, coReturning: DEFAULTS.coReturning,
    });
    setCosts({ costSolo: DEFAULTS.costSolo, costCo: DEFAULTS.costCo });
    setScenarios(DEFAULTS.scenarios.map((s) => ({ ...s })));
  };

  const updateScenario = useCallback((idx, val) => {
    setScenarios((prev) => { const next = [...prev]; next[idx] = val; return next; });
  }, []);

  const results = useMemo(
    () => scenarios.map((s) => computeScenario(s, prices, costs)),
    [scenarios, prices, costs]
  );

  const maxGrossIdx = results.reduce((best, r, i) => (r.gross > results[best].gross ? i : best), 0);
  const maxNetIdx = results.reduce((best, r, i) => (r.net > results[best].net ? i : best), 0);
  const grossRange = Math.max(...results.map((r) => r.gross)) - Math.min(...results.map((r) => r.gross));

  return (
    <div style={{
      background: COLORS.bg, minHeight: "100vh", color: COLORS.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: "32px 40px", maxWidth: 1200, margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 32, borderBottom: `1px solid ${COLORS.sectionBorder}`, paddingBottom: 16,
      }}>
        <div>
          <h1 style={{
            fontSize: 28, fontWeight: 400, fontFamily: "'Georgia', serif",
            margin: 0, letterSpacing: "-0.01em", color: COLORS.text,
          }}>
            FOG Rally 2026
          </h1>
          <div style={{
            fontSize: 13, color: COLORS.textMuted, marginTop: 4,
            fontFamily: "'Georgia', serif", fontStyle: "italic",
          }}>
            Registration Pricing Scenarios &mdash; 2025 Baseline: {fmt(BASELINE_REVENUE)} (26 registrations)
          </div>
        </div>
        <button
          onClick={resetAll}
          style={{
            background: "transparent", border: `1px solid ${COLORS.cardBorder}`,
            color: COLORS.textMuted, padding: "6px 16px", fontSize: 12,
            fontFamily: "'Georgia', serif", textTransform: "uppercase",
            letterSpacing: "0.06em", cursor: "pointer", borderRadius: 3,
          }}
        >
          Reset to Defaults
        </button>
      </div>

      {/* Price Configuration */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em",
          color: COLORS.textFaint, fontFamily: "'Georgia', serif", fontWeight: 600,
          marginBottom: 16, borderBottom: `1px solid ${COLORS.rowBorder}`, paddingBottom: 8,
        }}>
          Price Configuration
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "end" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4, padding: 16 }}>
            <div style={{
              fontSize: 12, color: COLORS.textMuted, textTransform: "uppercase",
              letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: 12, fontWeight: 600,
            }}>Solo Driver</div>
            <div style={{ display: "flex", gap: 16 }}>
              <CurrencyInput label="Standard (New)" value={prices.soloStandard} small
                onChange={(v) => setPrices((p) => ({ ...p, soloStandard: v }))} />
              <CurrencyInput label="Returning Driver" value={prices.soloReturning} small
                onChange={(v) => setPrices((p) => ({ ...p, soloReturning: v }))} />
            </div>
            {prices.soloStandard > prices.soloReturning && (
              <div style={{
                fontSize: 11, color: COLORS.textFaint, marginTop: 8,
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              }}>
                Loyalty discount: {fmt(prices.soloStandard - prices.soloReturning)}/driver
              </div>
            )}
          </div>

          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4, padding: 16 }}>
            <div style={{
              fontSize: 12, color: COLORS.textMuted, textTransform: "uppercase",
              letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: 12, fontWeight: 600,
            }}>Rally + Co-Driver</div>
            <div style={{ display: "flex", gap: 16 }}>
              <CurrencyInput label="Standard (New)" value={prices.coStandard} small
                onChange={(v) => setPrices((p) => ({ ...p, coStandard: v }))} />
              <CurrencyInput label="Returning Driver" value={prices.coReturning} small
                onChange={(v) => setPrices((p) => ({ ...p, coReturning: v }))} />
            </div>
            {prices.coStandard > prices.coReturning && (
              <div style={{
                fontSize: 11, color: COLORS.textFaint, marginTop: 8,
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              }}>
                Loyalty discount: {fmt(prices.coStandard - prices.coReturning)}/driver
              </div>
            )}
          </div>

          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4, padding: 16 }}>
            <div style={{
              fontSize: 12, color: COLORS.textMuted, textTransform: "uppercase",
              letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: 12, fontWeight: 600,
            }}>Event Cost</div>
            <div style={{ display: "flex", gap: 16 }}>
              <CurrencyInput label="Per Solo Driver" value={costs.costSolo} small
                onChange={(v) => setCosts((c) => ({ ...c, costSolo: v }))} />
              <CurrencyInput label="Per Co-Driver" value={costs.costCo} small
                onChange={(v) => setCosts((c) => ({ ...c, costCo: v }))} />
            </div>
          </div>
        </div>
      </section>

      {/* Scenario Columns */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em",
          color: COLORS.textFaint, fontFamily: "'Georgia', serif", fontWeight: 600,
          marginBottom: 16, borderBottom: `1px solid ${COLORS.rowBorder}`, paddingBottom: 8,
        }}>
          Scenarios
        </h2>
        <div style={{ display: "flex", gap: 16 }}>
          {scenarios.map((s, i) => (
            <ScenarioColumn key={i} index={i} scenario={s}
              onUpdate={(val) => updateScenario(i, val)}
              prices={prices} costs={costs} />
          ))}
        </div>
      </section>

      {/* Comparison Summary */}
      <section>
        <h2 style={{
          fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em",
          color: COLORS.textFaint, fontFamily: "'Georgia', serif", fontWeight: 600,
          marginBottom: 16, borderBottom: `1px solid ${COLORS.rowBorder}`, paddingBottom: 8,
        }}>
          Comparison
        </h2>
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 4,
          padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 10, color: COLORS.textFaint, textTransform: "uppercase",
              letterSpacing: "0.1em", fontFamily: "'Georgia', serif", marginBottom: 4, fontWeight: 600,
            }}>Highest Gross Revenue</div>
            <div style={{
              fontSize: 20, fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              color: GREEN, fontWeight: 700,
            }}>{fmt(results[maxGrossIdx].gross)}</div>
            <div style={{ fontSize: 11, color: COLORS.textFaint, fontFamily: "'Georgia', serif", marginTop: 2 }}>
              Scenario {String.fromCharCode(65 + maxGrossIdx)} ({scenarios[maxGrossIdx].total} reg.)
            </div>
          </div>

          {hasCosts && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 10, color: COLORS.textFaint, textTransform: "uppercase",
                letterSpacing: "0.1em", fontFamily: "'Georgia', serif", marginBottom: 4, fontWeight: 600,
              }}>Highest Net Revenue</div>
              <div style={{
                fontSize: 20, fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                color: results[maxNetIdx].net > 0 ? GREEN : FERRARI_RED, fontWeight: 700,
              }}>{fmt(results[maxNetIdx].net)}</div>
              <div style={{ fontSize: 11, color: COLORS.textFaint, fontFamily: "'Georgia', serif", marginTop: 2 }}>
                Scenario {String.fromCharCode(65 + maxNetIdx)} ({scenarios[maxNetIdx].total} reg.)
              </div>
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 10, color: COLORS.textFaint, textTransform: "uppercase",
              letterSpacing: "0.1em", fontFamily: "'Georgia', serif", marginBottom: 4, fontWeight: 600,
            }}>Revenue Range</div>
            <div style={{
              fontSize: 20, fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              color: COLORS.text, fontWeight: 700,
            }}>{fmt(grossRange)}</div>
            <div style={{ fontSize: 11, color: COLORS.textFaint, fontFamily: "'Georgia', serif", marginTop: 2 }}>
              {fmt(Math.min(...results.map((r) => r.gross)))} &ndash; {fmt(Math.max(...results.map((r) => r.gross)))}
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 10, color: COLORS.textFaint, textTransform: "uppercase",
              letterSpacing: "0.1em", fontFamily: "'Georgia', serif", marginBottom: 4, fontWeight: 600,
            }}>vs. 2025 Baseline</div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {results.map((r, i) => {
                const delta = r.gross - BASELINE_REVENUE;
                return (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: 14,
                      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                      color: delta >= 0 ? GREEN : FERRARI_RED, fontWeight: 600,
                    }}>{fmtDelta(delta)}</div>
                    <div style={{ fontSize: 10, color: COLORS.textFaint }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div style={{
        marginTop: 32, paddingTop: 12, borderTop: `1px solid ${COLORS.rowBorder}`,
        fontSize: 11, color: COLORS.textFaint, fontFamily: "'Georgia', serif",
        fontStyle: "italic", textAlign: "center",
      }}>
        FOG Rally 2026 &middot; Internal pricing model &middot; 2025 baseline: 26 registrations, {fmt(BASELINE_REVENUE)} gross revenue
      </div>
    </div>
  );
}