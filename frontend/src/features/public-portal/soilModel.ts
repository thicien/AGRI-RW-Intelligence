export type SoilSource = 'observations' | 'summaries';
export interface SoilScope { district:string;province:string;source:SoilSource;indicator:string;category:string;protocol:string }
export interface SoilObservation {
  id:string;district:string;province:string;season_code:string|null;year:number|null;
  indicator:string;indicator_name:string;value:number|null;category:string|null;unit:string|null;
  depth:number|null;method:string|null;site_key:string|null;observed_at:string|null;geographic_resolution:string;
  source_name?:string|null;dataset_name?:string|null;dataset_version?:string|null;
}
export interface SoilSummary { id:string;district:string;province:string;season_code:string;year:number;cultivated:number|null;properties:Record<string,number|string|null>;practices:Record<string,number|null>;sources:string[]|null }
export interface SoilProduction { district:string;province:string;season_code:string;year:number;crop:string;production:number|null;area:number|null;harvested:number|null }
export interface SoilPayload { observations:SoilObservation[];summaries:SoilSummary[];production:SoilProduction[];methodology:Record<string,string> }
export interface SoilIndicator { code:string;name:string;unit:string;kind:'numeric'|'category';documentedUnit:boolean }
export const SUMMARY_INDICATORS:SoilIndicator[]=[
  {code:'SOIL_PH',name:'Soil pH',unit:'pH',kind:'numeric',documentedUnit:true},
  {code:'ORGANIC_CARBON',name:'Soil organic carbon',unit:'%',kind:'numeric',documentedUnit:true},
  {code:'CEC_UNSPECIFIED',name:'Cation exchange capacity (basis undocumented)',unit:'meq (basis unspecified)',kind:'numeric',documentedUnit:false},
  {code:'SOIL_TEXTURE',name:'Recorded soil texture',unit:'category',kind:'category',documentedUnit:true},
  {code:'ACIDITY_STATUS',name:'Stored acidity classification',unit:'category',kind:'category',documentedUnit:true},
  {code:'NITROGEN_RATING',name:'Recorded nitrogen rating',unit:'category',kind:'category',documentedUnit:true},
  {code:'PHOSPHORUS_RATING',name:'Recorded phosphorus rating',unit:'category',kind:'category',documentedUnit:true},
  {code:'POTASSIUM_RATING',name:'Recorded potassium rating',unit:'category',kind:'category',documentedUnit:true},
  {code:'EROSION_MODEL_INDEX',name:'Modelled erosion susceptibility index',unit:'index / 100',kind:'numeric',documentedUnit:true},
];
export const PRACTICES:Record<string,{name:string;unit:string}>={
  erosion_control_ha:{name:'Reported erosion-control area',unit:'ha'},agroforestry_ha:{name:'Reported agroforestry area',unit:'ha'},
  organic_fertilizer_ha:{name:'Reported organic fertilizer area',unit:'ha'},inorganic_fertilizer_ha:{name:'Reported inorganic fertilizer area',unit:'ha'},
  organic_farmer_pct:{name:'Farmers reporting organic fertilizer',unit:'% of farmers'},inorganic_farmer_pct:{name:'Farmers reporting inorganic fertilizer',unit:'% of farmers'},
  fert_npk_pct:{name:'Stored NPK-use percentage',unit:'% (denominator undocumented)'},fert_urea_pct:{name:'Stored urea-use percentage',unit:'% (denominator undocumented)'},
  fert_dap_pct:{name:'Stored DAP-use percentage',unit:'% (denominator undocumented)'},fert_lime_pct:{name:'Stored lime-use percentage',unit:'% (denominator undocumented)'},
};
export function soilNumber(value:unknown):number|null { if(value===null||value===undefined||typeof value==='boolean'||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&n>=0?n:null; }
export function soilGeography(r:{district:string;province:string},s:Pick<SoilScope,'district'|'province'>){return(s.district==='ALL'||s.district===r.district)&&(s.province==='ALL'||s.province===r.province);}
export function soilProtocol(r:SoilObservation):string|null {return r.method?.trim()&&r.unit?.trim()&&r.depth!==null?JSON.stringify([r.method.trim().toLowerCase(),r.unit.trim().toLowerCase(),r.depth]):null;}
export function soilCatalog(data:SoilPayload,source:SoilSource):SoilIndicator[]{
  if(source==='summaries')return SUMMARY_INDICATORS.filter(i=>data.summaries.some(r=>r.properties[i.code]!==null&&r.properties[i.code]!==undefined&&r.properties[i.code]!==''));
  const groups=new Map<string,SoilObservation[]>();data.observations.forEach(r=>{const bucket=groups.get(r.indicator)||[];bucket.push(r);groups.set(r.indicator,bucket);});
  return [...groups].map(([code,rows])=>{const units=[...new Set(rows.map(r=>r.unit).filter(Boolean))];return{code,name:rows[0].indicator_name,unit:units.length===1?units[0]!:'mixed / undocumented units',kind:rows.some(r=>r.value!==null)?'numeric':'category',documentedUnit:units.length===1&&rows.every(r=>!!r.unit)};});
}
export function selectedSoilObservations(data:SoilPayload,scope:SoilScope,season:string){return data.observations.filter(r=>r.season_code===season&&soilGeography(r,scope)&&r.indicator===scope.indicator&&(scope.protocol==='ALL'||soilProtocol(r)===scope.protocol)&&(scope.category==='ALL'||r.category===scope.category));}
export function selectedSoilSummaries(data:SoilPayload,scope:SoilScope,season:string){return data.summaries.filter(r=>r.season_code===season&&soilGeography(r,scope)&&(scope.category==='ALL'||r.properties[scope.indicator]===scope.category));}
export function soilMedian(values:number[]):number|null {if(!values.length)return null;const s=values.slice().sort((a,b)=>a-b);const mid=Math.floor(s.length/2);return s.length%2?s[mid]:(s[mid-1]+s[mid])/2;}
export interface SoilDistrictResult {name:string;province:string;value:number|null;category:string|null;count:number|null;dates:string[];protocols:string[];source:string;records:SoilObservation[] }
export function soilDistrictResults(data:SoilPayload,scope:SoilScope,season:string):SoilDistrictResult[]{
  if(scope.source==='summaries')return selectedSoilSummaries(data,scope,season).map(r=>{const indicator=SUMMARY_INDICATORS.find(i=>i.code===scope.indicator),raw=r.properties[scope.indicator];return{name:r.district,province:r.province,value:indicator?.kind==='numeric'?soilNumber(raw):null,category:indicator?.kind==='category'&&typeof raw==='string'?raw:null,count:null,dates:[],protocols:[],source:scope.indicator==='EROSION_MODEL_INDEX'?'MODELLED':'DISTRICT_SUMMARY_UNVERIFIED',records:[]};});
  const groups=new Map<string,SoilObservation[]>();selectedSoilObservations(data,scope,season).forEach(r=>{const bucket=groups.get(r.district)||[];bucket.push(r);groups.set(r.district,bucket);});
  return [...groups].map(([name,records])=>{
    const protocols=[...new Set(records.map(soilProtocol).filter((v):v is string=>v!==null))];
    const compatible=protocols.length===1&&records.every(r=>soilProtocol(r)!==null);
    const categories=[...new Set(records.map(r=>r.category).filter(Boolean))];
    return{name,province:records[0].province,value:compatible?soilMedian(records.map(r=>r.value).filter((v):v is number=>v!==null)):null,category:categories.length===1?categories[0]!:null,count:records.length,dates:[...new Set(records.map(r=>r.observed_at).filter((v):v is string=>!!v))],protocols,source:'RECORDED_OBSERVATIONS',records};
  });
}
export function canOrderSoil(data:SoilPayload,scope:SoilScope,season:string):boolean{
  if(scope.source!=='observations')return false;const rows=selectedSoilObservations(data,scope,season).filter(r=>r.value!==null);
  return rows.length>0&&rows.every(r=>soilProtocol(r)!==null)&&new Set(rows.map(soilProtocol)).size===1;
}
export interface SoilChangeResult { change:number|null;matched:number;reason:string;pairs:{site:string;current:number;previous:number}[] }
export function soilChange(current:SoilDistrictResult|undefined,previous:SoilDistrictResult|undefined):SoilChangeResult {
  const unavailable=(reason:string):SoilChangeResult=>({change:null,matched:0,reason,pairs:[]});
  if(!current||!previous||current.name!==previous.name||current.source!=='RECORDED_OBSERVATIONS'||previous.source!=='RECORDED_OBSERVATIONS')return unavailable('Summary rows or missing observations cannot establish a sampled change.');
  const currentRows=current.records.filter(r=>r.value!==null),previousRows=previous.records.filter(r=>r.value!==null);
  if(!currentRows.length||!previousRows.length)return unavailable('Both periods need numeric observations.');
  const all=[...currentRows,...previousRows];if(all.some(r=>!r.site_key||!r.observed_at||soilProtocol(r)===null))return unavailable('Comparable site, date, method, depth or unit metadata is missing.');
  const pairs:SoilChangeResult['pairs']=[];const key=(r:SoilObservation)=>JSON.stringify([r.site_key,r.indicator,soilProtocol(r)]);
  const groups=new Map<string,{a:SoilObservation[];b:SoilObservation[]}>();currentRows.forEach(r=>{const group=groups.get(key(r))||{a:[],b:[]};group.a.push(r);groups.set(key(r),group);});previousRows.forEach(r=>{const group=groups.get(key(r));if(group)group.b.push(r);});
  for(const group of groups.values()){
    if(group.a.length!==1||group.b.length!==1)continue;
    const a=group.a[0],b=group.b[0];if(a.observed_at===b.observed_at)continue;
    pairs.push({site:a.site_key!,current:a.value!,previous:b.value!});
  }
  return pairs.length?{change:soilMedian(pairs.map(p=>p.current-p.previous)),matched:pairs.length,reason:'Median paired-site difference; not a district-wide change estimate.',pairs}:unavailable('No unique sites with matching protocols and distinct dates overlap the periods.');
}
