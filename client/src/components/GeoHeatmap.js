import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// leaflet.heat's UMD bundle expects a global `L` rather than importing it —
// set that before pulling the plugin in so it can attach L.heatLayer.
window.L = L;
// eslint-disable-next-line import/first
import 'leaflet.heat';

// Default Leaflet marker icons reference image files that don't survive the
// CRA bundler; every marker on this map is a colored circle instead, so the
// broken default icon is never actually used — this just silences the 404.
delete L.Icon.Default.prototype._getIconUrl;

const SEVERITY_COLOR = { green: '#1e7e34', yellow: '#b8860b', orange: '#c96a12', red: '#a4161a' };

/**
 * Real, pannable/zoomable OpenStreetMap map (via Leaflet) with an actual
 * heat layer plus labeled zone markers — replaces the earlier fictional
 * city-grid mockup with genuine geography.
 */
export default function GeoHeatmap({ zones }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [21.5, 78.5],
      zoom: 4.5,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !zones) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Scatter synthetic points around each zone's real coordinates,
    // proportional to incident count, so the heat layer reads as a genuine
    // density cloud rather than a single dot.
    const heatPoints = [];
    zones.forEach((z) => {
      const count = Math.max(z.incidents, 1);
      for (let i = 0; i < count; i++) {
        const jitter = () => (Math.random() - 0.5) * 1.4;
        heatPoints.push([z.lat + jitter(), z.lng + jitter(), 0.6 + z.incidents * 0.08]);
      }

      const marker = L.circleMarker([z.lat, z.lng], {
        radius: 9 + z.incidents * 1.5,
        color: SEVERITY_COLOR[z.color] || '#555',
        weight: 2,
        fillColor: SEVERITY_COLOR[z.color] || '#555',
        fillOpacity: 0.35,
      }).addTo(map);
      marker.bindPopup(
        `<strong>${z.id} — ${z.city}</strong><br/>${z.label} threat level<br/>${z.incidents} incident${z.incidents === 1 ? '' : 's'}${z.recurring ? '<br/><em>Recurring cluster</em>' : ''}`
      );
      markersRef.current.push(marker);
    });

    if (heatPoints.length) {
      heatLayerRef.current = L.heatLayer(heatPoints, { radius: 35, blur: 25, maxZoom: 8 }).addTo(map);
    }
  }, [zones]);

  return (
    <div className="card geo-heatmap-card">
      <h2>Harassment Incident Heat Map</h2>
      <p className="muted">
        Live incident density plotted on an actual map, clustered by reporting zone. Zoom or pan to inspect a region;
        select a marker for zone details.
      </p>
      <div className="geo-map-container" ref={mapRef} role="img" aria-label="Map of India showing harassment incident density by zone" />
      <ul className="geo-legend">
        <li><span className="legend-dot" style={{ background: SEVERITY_COLOR.green }} /> Low</li>
        <li><span className="legend-dot" style={{ background: SEVERITY_COLOR.yellow }} /> Moderate</li>
        <li><span className="legend-dot" style={{ background: SEVERITY_COLOR.orange }} /> High</li>
        <li><span className="legend-dot" style={{ background: SEVERITY_COLOR.red }} /> Very High / Recurring</li>
      </ul>
    </div>
  );
}
