import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Layers, MapPin, Sprout, Droplets, Mountain, Warehouse, ShieldCheck, 
  Info, CheckCircle2, ChevronRight, RefreshCw 
} from 'lucide-react';

const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'Musanze': [29.635, -1.502],
  'Nyagatare': [30.328, -1.298],
  'Bugesera': [30.150, -2.150],
  'Gicumbi': [30.060, -1.610],
  'Huye': [29.740, -2.597],
  'Rubavu': [29.255, -1.676],
  'Burera': [29.830, -1.450],
  'Gakenke': [29.780, -1.700],
  'Rulindo': [29.980, -1.740],
  'Gatsibo': [30.450, -1.600],
  'Kayonza': [30.550, -1.900],
  'Kirehe': [30.650, -2.250],
  'Ngoma': [30.500, -2.170],
  'Rwamagana': [30.430, -1.950],
  'Gisagara': [29.850, -2.620],
  'Nyanza': [29.750, -2.350],
  'Ruhango': [29.780, -2.220],
  'Muhanga': [29.750, -2.080],
  'Kamonyi': [29.900, -2.000],
  'Nyamagabe': [29.500, -2.470],
  'Nyaruguru': [29.550, -2.720],
  'Nyabihu': [29.500, -1.650],
  'Rutsiro': [29.330, -1.930],
  'Karongi': [29.350, -2.150],
  'Ngororero': [29.600, -1.860],
  'Rusizi': [28.900, -2.480],
  'Nyamasheke': [29.150, -2.350],
  'Gasabo': [30.120, -1.900],
  'Kicukiro': [30.100, -1.990],
  'Nyarugenge': [30.040, -1.960]
};

export default function DistrictMapPage() {
  const { districtName, seasonCode } = useOutletContext<{ districtName: string; seasonCode: string }>();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [activeLayer, setActiveLayer] = useState<'PRODUCTIVITY' | 'IRRIGATION' | 'SOIL' | 'FACILITIES'>('PRODUCTIVITY');
  const [selectedPin, setSelectedPin] = useState<any | null>(null);

  const centerCoords = DISTRICT_COORDINATES[districtName] || [29.635, -1.502];

  useEffect(() => {
    if (!mapContainer.current) return;

    if (map.current) {
      map.current.flyTo({ center: centerCoords, zoom: 11 });
      return;
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: centerCoords,
      zoom: 11,
      pitch: 35
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add District Feature Points (Sectors, Irrigation, Facilities)
      const features = Array.from({ length: 15 }).map((_, i) => ({
        type: 'Feature' as const,
        properties: {
          id: i,
          name: `${districtName} Sector ${i + 1}`,
          crop: ['Irish Potato', 'Maize', 'Beans', 'Wheat'][i % 4],
          yield: (3.8 + (i % 5) * 0.7).toFixed(1),
          irrigation: (12 + (i * 6) % 30).toFixed(0),
          ph: (5.4 + (i * 0.15)).toFixed(1),
          facility: ['Warehouse', 'Cold Storage', 'Drying Floor', 'Processing Unit'][i % 4]
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [
            centerCoords[0] + (Math.sin(i) * 0.08),
            centerCoords[1] + (Math.cos(i) * 0.08)
          ]
        }
      }));

      map.current.addSource('district-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });

      // Layer styling
      map.current.addLayer({
        id: 'district-points',
        type: 'circle',
        source: 'district-data',
        paint: {
          'circle-radius': 9,
          'circle-color': '#059669',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.current.on('click', 'district-points', (e) => {
        if (e.features && e.features[0]) {
          setSelectedPin(e.features[0].properties);
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [districtName]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Geographic Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">Restricted to {districtName} Boundaries</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            District GIS Exploration & Sector Layers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Spatial exploration of sector productivity, irrigation schemes, soil conditions, and agro-facilities in {districtName}.
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-bold">
          {(['PRODUCTIVITY', 'IRRIGATION', 'SOIL', 'FACILITIES'] as const).map(layer => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeLayer === layer ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              {layer.charAt(0) + layer.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Map & Inspector Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-3 h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
          <div ref={mapContainer} className="w-full h-full" />

          {/* District Boundary Tag Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="font-bold text-slate-900">{districtName} District Authority Scope</span>
          </div>
        </div>

        {/* Selected Sector / Site Inspector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase mb-1">Sector Inspector</div>
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              {selectedPin ? selectedPin.name : `${districtName} Sector Marker`}
            </h3>

            {selectedPin ? (
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Primary Crop:</span>
                  <span className="font-bold text-slate-800">{selectedPin.crop}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Crop Yield:</span>
                  <span className="font-bold text-emerald-700">{selectedPin.yield} t/ha</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Irrigation Coverage:</span>
                  <span className="font-bold text-slate-800">{selectedPin.irrigation}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Soil pH:</span>
                  <span className="font-bold text-slate-800">{selectedPin.ph}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Verified Facility:</span>
                  <span className="font-semibold text-slate-800">{selectedPin.facility}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                Click any sector marker on the map to inspect localized agricultural metrics.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Cross-district boundaries restricted by Section 4.2 RBAC Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
