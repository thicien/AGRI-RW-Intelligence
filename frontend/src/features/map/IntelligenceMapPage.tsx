import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Search, Layers, Map as MapIcon, Leaf, Sun, BrainCircuit, Target, 
  ChevronRight, MapPin, TrendingUp, ShieldAlert, Droplets, Zap, ChevronDown, CheckCircle2
} from 'lucide-react';

export default function IntelligenceMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  // UI States
  const [activeMode, setActiveMode] = useState('intelligence');
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const modes = [
    { id: 'agriculture', name: 'Agriculture', icon: Leaf },
    { id: 'environment', name: 'Environment', icon: Droplets },
    { id: 'energy', name: 'Energy', icon: Zap },
    { id: 'intelligence', name: 'Intelligence', icon: BrainCircuit },
    { id: 'intervention', name: 'Intervention', icon: Target },
  ];

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    // Initialize MapLibre with a minimal basemap
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors © CARTO'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [30.061, -1.944], // Center of Rwanda
      zoom: 8,
      pitch: 40,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // 1. Add Mock Agricultural GeoJSON Data (Farms in Eastern Province)
      map.current.addSource('farms-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: Array.from({ length: 150 }).map((_, i) => ({
            type: 'Feature',
            properties: {
              id: i,
              crop: ['Maize', 'Beans', 'Potatoes', 'Rice'][Math.floor(Math.random() * 4)],
              productivity: Math.floor(Math.random() * 100),
              risk: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)]
            },
            geometry: {
              type: 'Point',
              // Scatter around Kayonza / Eastern Province [30.5, -1.9]
              coordinates: [
                30.4 + Math.random() * 0.2,
                -1.95 + Math.random() * 0.2
              ]
            }
          }))
        }
      });

      // 2. Add Farm Points Layer
      map.current.addLayer({
        id: 'farms-layer',
        type: 'circle',
        source: 'farms-data',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            8, 2,
            12, 6,
            16, 12
          ],
          'circle-color': [
            'match',
            ['get', 'crop'],
            'Maize', '#2E7D32', // primary green
            'Beans', '#F57C00', // orange
            'Potatoes', '#FBC02D', // yellow
            'Rice', '#0288D1', // blue
            '#9E9E9E'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      });

      // 3. Add Priority Zones (Polygons)
      map.current.addSource('priority-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { risk: 'High', name: 'Drought Risk Zone A' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [30.45, -1.85], [30.55, -1.85], [30.52, -1.92], [30.42, -1.90], [30.45, -1.85]
                ]]
              }
            }
          ]
        }
      });

      map.current.addLayer({
        id: 'priority-zones-fill',
        type: 'fill',
        source: 'priority-zones',
        paint: {
          'fill-color': '#ef4444', // danger red
          'fill-opacity': 0.2
        }
      });

      map.current.addLayer({
        id: 'priority-zones-line',
        type: 'line',
        source: 'priority-zones',
        paint: {
          'line-color': '#ef4444',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });

      // Add a popup on click for farms
      map.current.on('click', 'farms-layer', (e) => {
        if (!e.features || e.features.length === 0 || !map.current) return;
        const feature = e.features[0];
        const coords = (feature.geometry as any).coordinates.slice();
        const { crop, productivity, risk } = feature.properties;

        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family: sans-serif; padding: 4px;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #2E7D32;">Farm Profile</div>
              <div style="font-size: 12px; margin-bottom: 2px;"><b>Crop:</b> ${crop}</div>
              <div style="font-size: 12px; margin-bottom: 2px;"><b>Productivity:</b> ${productivity}%</div>
              <div style="font-size: 12px;"><b>Risk:</b> <span style="color: ${risk === 'High' ? '#ef4444' : '#f59e0b'}">${risk}</span></div>
            </div>
          `)
          .addTo(map.current);
      });

      // Change cursor to pointer when hovering over farms
      map.current.on('mouseenter', 'farms-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'farms-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Simulate selecting a village
  const handleSelectMockVillage = () => {
    setSelectedRegion({
      level: 'Village',
      name: 'Mukarange Village',
      path: 'Eastern Province → Kayonza → Mukarange',
      stats: {
        farmers: 248,
        farms: 173,
        area: '412 ha',
        productivity: 78,
        irrigation: 41,
        risk: 'Moderate',
        isPriority: true
      },
      crops: [
        { name: 'Maize', share: 42, color: 'bg-primary' },
        { name: 'Beans', share: 28, color: 'bg-agriculture' },
        { name: 'Potatoes', share: 18, color: 'bg-warning' },
        { name: 'Other', share: 12, color: 'bg-muted' }
      ]
    });
    
    // Fly to location
    map.current?.flyTo({
      center: [30.5, -1.9],
      zoom: 13,
      pitch: 60,
      essential: true
    });
  };

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-background -m-4 md:-m-6 lg:-m-8">
      
      {/* Left Sidebar - Map Controls */}
      <div className={`w-80 flex-shrink-0 bg-surface border-r border-border-main flex flex-col transition-all z-10 shadow-lg`}>
        <div className="p-4 border-b border-border-main">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search province, district, village..." 
              className="w-full pl-9 pr-4 py-2 bg-background border border-border-main rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const query = e.currentTarget.value;
                  if (!query) return;
                  try {
                    // Restrict to Rwanda (countrycodes=rw)
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=rw`);
                    const data = await res.json();
                    if (data && data.length > 0) {
                      const item = data[0];
                      map.current?.flyTo({
                        center: [parseFloat(item.lon), parseFloat(item.lat)],
                        zoom: 12,
                        essential: true
                      });
                    }
                  } catch (err) {
                    console.error("Search failed", err);
                  }
                }
              }}
            />
          </div>

          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Map Modes</div>
          <div className="grid grid-cols-2 gap-2">
            {modes.map(mode => {
              const Icon = mode.icon;
              return (
                <button 
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`flex items-center gap-2 p-2 rounded text-xs font-semibold transition-colors border ${
                    activeMode === mode.id 
                      ? 'bg-primary/10 border-primary/30 text-primary' 
                      : 'bg-background border-border-main text-text-main hover:bg-black/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {mode.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
          
          {/* Layer Groups */}
          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-text-main mb-3">
              <MapIcon className="w-4 h-4 text-primary" /> Geography (Administrative)
            </div>
            <div className="space-y-2 pl-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" defaultChecked /> <span className="group-hover:text-primary transition-colors">Provinces</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" defaultChecked /> <span className="group-hover:text-primary transition-colors">Districts</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" defaultChecked /> <span className="group-hover:text-primary transition-colors">Sectors</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" /> <span className="group-hover:text-primary transition-colors">Cells</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" /> <span className="group-hover:text-primary transition-colors">Villages</span></label>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-text-main mb-3">
              <Leaf className="w-4 h-4 text-agriculture" /> Agriculture Layers
            </div>
            <div className="space-y-2 pl-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" defaultChecked /> <span className="group-hover:text-primary transition-colors">Farms</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" defaultChecked /> <span className="group-hover:text-primary transition-colors">Crop Distribution</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" /> <span className="group-hover:text-primary transition-colors">Productivity Index</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" /> <span className="group-hover:text-primary transition-colors">Irrigation Status</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" /> <span className="group-hover:text-primary transition-colors">Soil Suitability</span></label>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-text-main mb-3">
              <BrainCircuit className="w-4 h-4 text-primary" /> Intelligence & Risk
            </div>
            <div className="space-y-2 pl-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" defaultChecked={activeMode === 'intelligence'} /> <span className="group-hover:text-primary transition-colors">Agricultural Risk Zones</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" defaultChecked={activeMode === 'intelligence'} /> <span className="group-hover:text-primary transition-colors">AI Priority Areas</span></label>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-text-main mb-3">
              <Zap className="w-4 h-4 text-warning" /> Infrastructure
            </div>
            <div className="space-y-2 pl-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" /> <span className="group-hover:text-primary transition-colors">Energy Access</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" className="accent-primary" /> <span className="group-hover:text-primary transition-colors">Markets</span></label>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-border-main bg-background">
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Basemap</div>
          <select className="w-full bg-surface border border-border-main rounded text-sm px-3 py-2 outline-none focus:border-primary">
            <option>Minimal (Default)</option>
            <option>Satellite</option>
            <option>Streets</option>
            <option>Terrain</option>
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative flex flex-col min-w-0">
        <div ref={mapContainer} className="absolute inset-0 z-0 bg-[#E5E7EB]" style={{ width: '100%', height: '100%' }} />

        {/* Mock Floating Controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="bg-white/95 backdrop-blur shadow-sm border border-border-main rounded-md px-3 py-2 flex items-center gap-2 text-sm font-semibold text-text-main">
            Rwanda <ChevronRight className="w-4 h-4 text-muted" /> 
            <span className="text-primary cursor-pointer hover:underline">Eastern Province</span> <ChevronRight className="w-4 h-4 text-muted" /> 
            <span className="text-primary cursor-pointer hover:underline">Kayonza</span>
          </div>
          <button onClick={handleSelectMockVillage} className="bg-primary hover:bg-primary-light text-white shadow-sm border border-primary-light rounded-md px-4 py-2 text-sm font-bold transition-colors animate-pulse">
            Simulate Village Click
          </button>
        </div>

        {/* Bottom Profile Panel (Appears when a region is clicked) */}
        {selectedRegion && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-10 bg-white/95 backdrop-blur shadow-2xl border border-border-main rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center px-6 py-3 border-b border-border-main bg-background/50">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="font-bold text-lg text-text-main uppercase tracking-wide">{selectedRegion.name}</h2>
                  <div className="text-xs text-muted">{selectedRegion.path}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedRegion.stats.isPriority && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-danger/10 text-danger border border-danger/20 rounded font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5" /> Priority Area
                  </span>
                )}
                <button onClick={() => setSelectedRegion(null)} className="p-1 hover:bg-black/5 rounded transition-colors text-muted">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Stats Column */}
              <div className="space-y-4 border-r border-border-main pr-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Farmers</div>
                    <div className="text-2xl font-bold text-text-main">{selectedRegion.stats.farmers}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Farms</div>
                    <div className="text-2xl font-bold text-text-main">{selectedRegion.stats.farms}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Agr. Area</div>
                    <div className="text-xl font-bold text-text-main">{selectedRegion.stats.area}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Risk</div>
                    <div className="text-lg font-bold text-warning">{selectedRegion.stats.risk}</div>
                  </div>
                </div>
              </div>

              {/* Crops Column */}
              <div className="border-r border-border-main pr-6">
                <div className="text-xs text-muted uppercase font-bold tracking-wider mb-4">Dominant Crops</div>
                <div className="space-y-3">
                  {selectedRegion.crops.map((crop: any) => (
                    <div key={crop.name}>
                      <div className="flex justify-between text-sm font-semibold mb-1">
                        <span>{crop.name}</span>
                        <span className="text-muted">{crop.share}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div className={`h-full ${crop.color}`} style={{ width: `${crop.share}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Column */}
              <div>
                <div className="text-xs text-muted uppercase font-bold tracking-wider mb-4">Performance</div>
                
                <div className="mb-5">
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span>Average Productivity</span>
                    <span className="text-muted">{selectedRegion.stats.productivity}%</span>
                  </div>
                  <div className="w-full h-2 bg-background border border-border-main rounded-full overflow-hidden flex">
                    <div className="h-full bg-agriculture w-[78%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span>Irrigation Coverage</span>
                    <span className="text-muted">{selectedRegion.stats.irrigation}%</span>
                  </div>
                  <div className="w-full h-2 bg-background border border-border-main rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary w-[41%]"></div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button className="flex-1 py-1.5 bg-background border border-border-main rounded text-xs font-bold text-text-main hover:bg-black/5 transition-colors">Full Report</button>
                  <button className="flex-1 py-1.5 bg-primary text-white rounded text-xs font-bold hover:bg-primary-light transition-colors">Plan Action</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
