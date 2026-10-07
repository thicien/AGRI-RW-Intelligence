import { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ShieldAlert, X, ChevronRight, CheckCircle2, TrendingDown, Droplets, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function IntelligenceMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedZone, setSelectedZone] = useState<boolean>(false);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors &copy; CARTO'
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
      center: [29.8739, -1.9403], // Rwanda center roughly
      zoom: 8
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left');

    // Simulate clicking on a priority zone after map loads
    map.current.on('load', () => {
      // Mock Priority Zone GeoJSON
      map.current?.addSource('priority-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                id: 1,
                name: 'Kayonza District Zone',
                level: 'HIGH',
                score: 81
              },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [30.4, -1.8],
                    [30.6, -1.8],
                    [30.6, -2.0],
                    [30.4, -2.0],
                    [30.4, -1.8]
                  ]
                ]
              }
            }
          ]
        }
      });

      map.current?.addLayer({
        id: 'priority-zones-fill',
        type: 'fill',
        source: 'priority-zones',
        paint: {
          'fill-color': '#C62828', // Danger red
          'fill-opacity': 0.4
        }
      });

      map.current?.addLayer({
        id: 'priority-zones-line',
        type: 'line',
        source: 'priority-zones',
        paint: {
          'line-color': '#C62828',
          'line-width': 2
        }
      });

      map.current?.on('click', 'priority-zones-fill', () => {
        setSelectedZone(true);
      });

      map.current?.on('mouseenter', 'priority-zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current?.on('mouseleave', 'priority-zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] -m-8">
      
      {/* Map Header / Filters */}
      <div className="bg-surface border-b border-border-main p-4 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-primary mr-4">Intelligence Map</h1>
          
          <select className="bg-background border border-border-main text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-primary">
            <option>All Districts</option>
            <option>Kayonza</option>
            <option>Nyagatare</option>
          </select>
          
          <select className="bg-background border border-border-main text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-primary">
            <option>All Crops</option>
            <option>Maize</option>
            <option>Beans</option>
          </select>

          <select className="bg-background border border-border-main text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-primary">
            <option>Layer: Priority Zones</option>
            <option>Layer: Productivity</option>
            <option>Layer: Irrigation</option>
          </select>
        </div>
      </div>

      {/* Map Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* MapLibre Container */}
        <div ref={mapContainer} className="flex-1 h-full w-full bg-background" />

        {/* Priority Zone Side Panel */}
        {selectedZone && (
          <div className="w-[400px] bg-surface border-l border-border-main shadow-2xl flex flex-col z-20 overflow-y-auto animate-in slide-in-from-right-8 duration-300">
            
            {/* Panel Header */}
            <div className="p-5 border-b border-border-main bg-danger/5 relative">
              <button 
                onClick={() => setSelectedZone(false)}
                className="absolute top-4 right-4 p-1 text-muted hover:text-text-main hover:bg-black/5 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2 py-0.5 bg-danger text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">
                  High Priority
                </div>
                <span className="text-sm font-medium text-muted">Kayonza District</span>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-main leading-tight">Low Productivity Risk</h2>
                  <p className="text-sm text-muted mt-1">Priority Score: <span className="font-bold text-text-main">81%</span></p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted">Confidence</div>
                  <div className="text-lg font-bold text-primary">87%</div>
                </div>
              </div>
            </div>

            {/* Why Here? Section */}
            <div className="p-5 border-b border-border-main">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Why is this area prioritized?</h3>
              
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 text-danger"><TrendingDown className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-text-main">Yield is below selected benchmark</p>
                    <p className="text-xs text-muted mt-1">Observed yield: 2.1 t/ha (District avg: 3.4 t/ha)</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 text-warning"><Droplets className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-text-main">Irrigation coverage is limited</p>
                    <p className="text-xs text-muted mt-1">42% irrigation gap detected</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 text-warning"><Leaf className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-text-main">Environmental risk is elevated</p>
                    <p className="text-xs text-muted mt-1">Soil moisture index dropping</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 p-3 bg-background border border-border-main rounded text-xs text-muted">
                <span className="font-semibold text-text-main">Model:</span> Productivity-Risk-v1.2
              </div>
            </div>

            {/* Recommendation Section */}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Recommended Action</h3>
              
              <div className="p-4 bg-primary-soft/50 border border-primary/20 rounded-lg mb-6">
                <p className="text-sm font-medium text-text-main mb-2">
                  Assess irrigation intervention and provide targeted agronomic support.
                </p>
                <div className="text-xs text-muted flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-agriculture" /> Expected outcome: Improved productivity resilience
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <Link to="/priority-zones/1" className="w-full py-2.5 px-4 bg-white border border-border-main shadow-sm rounded flex justify-center items-center text-sm font-semibold text-text-main hover:bg-background transition-colors">
                  View Full Evidence
                </Link>
                <Link to="/recommendations/new" className="w-full py-2.5 px-4 bg-primary text-white shadow-sm rounded flex justify-center items-center text-sm font-semibold hover:bg-primary-light transition-colors">
                  Take Action <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
