import React from 'react';

function TrendSparkline({ trend }) {
  if (!trend?.length) return null;
  const max = Math.max(...trend.map((t) => t.cases), 1);
  const points = trend
    .map((t, i) => {
      const x = (i / (trend.length - 1)) * 100;
      const y = 100 - (t.cases / max) * 90;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points={points} className="trend-line" />
      {trend.map((t, i) => {
        const x = (i / (trend.length - 1)) * 100;
        const y = 100 - (t.cases / max) * 90;
        return <circle key={t.day} cx={x} cy={y} r="1.6" className="trend-dot" />;
      })}
    </svg>
  );
}

export default function Analytics({ analytics }) {
  if (!analytics) return null;
  const { byCategory, trend, hotspots, relatedCases } = analytics;
  const maxCat = Math.max(...Object.values(byCategory), 1);

  return (
    <div className="card analytics-card">
      <h2>Analytics &amp; Hotspot Detection</h2>

      <div className="analytics-grid">
        <div className="analytics-block">
          <h3>Cases Over Time</h3>
          <TrendSparkline trend={trend} />
        </div>

        <div className="analytics-block">
          <h3>Harassment Type Distribution</h3>
          <div className="bar-chart">
            {Object.entries(byCategory).map(([cat, count]) => (
              <div className="bar-row" key={cat}>
                <span className="bar-label">{cat}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(count / maxCat) * 100}%` }} />
                </div>
                <span className="bar-value">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-block">
          <h3>Emerging Hotspots</h3>
          <ul className="hotspot-list">
            {hotspots.map((h) => (
              <li key={h.zone}>
                <span className="hotspot-zone">{h.zone}</span>
                <span className="hotspot-change">{h.change}</span>
                <span className="hotspot-note">{h.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="analytics-block">
          <h3>Related-Case Pattern Matching</h3>
          {relatedCases.length === 0 && <p className="muted">No AI-flagged clusters right now.</p>}
          <ul className="related-list">
            {relatedCases.map((r) => (
              <li key={r.category}>
                <strong>{r.category}</strong> — {r.tokens.length} linked critical cases
                <div className="related-tokens">{r.tokens.join(', ')}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
