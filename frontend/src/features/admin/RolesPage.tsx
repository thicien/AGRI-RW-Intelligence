import React, { useState } from 'react';
import { 
  ShieldAlert, Shield, ShieldCheck, Key, Lock, Users, 
  Database, MapPin, Search, Filter, Settings, CheckCircle2, 
  XCircle, Eye, EyeOff
} from 'lucide-react';

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState('roles');
  
  // The 8 Official Roles
  const roles = [
    { id: 1, name: 'System Administrator', scope: 'Rwanda / System-wide', purpose: 'Controls the entire platform and configures permissions', icon: ShieldAlert, color: 'text-danger' },
    { id: 2, name: 'Data Manager', scope: 'Rwanda / Assigned Domains', purpose: 'Manages datasets, imports, validation, and data quality', icon: Database, color: 'text-warning' },
    { id: 3, name: 'National Agricultural Planner', scope: 'Rwanda', purpose: 'Uses national agricultural intelligence for planning', icon: ShieldCheck, color: 'text-success' },
    { id: 4, name: 'District Agricultural Officer', scope: 'Assigned District', purpose: 'Analyzes and manages intelligence for a specific district', icon: MapPin, color: 'text-primary' },
    { id: 5, name: 'Sector Agricultural Officer', scope: 'Assigned Sector', purpose: 'Uses agricultural intelligence at the sector level', icon: MapPin, color: 'text-primary-light' },
    { id: 6, name: 'Researcher / Agricultural Analyst', scope: 'Authorized Geography', purpose: 'Performs research, comparisons, and deeper analysis', icon: Search, color: 'text-purple-500' },
    { id: 7, name: 'Development Partner', scope: 'Assigned Program', purpose: 'Uses intelligence to plan/monitor development programs', icon: Users, color: 'text-pink-500' },
    { id: 8, name: 'Viewer / Public Analyst', scope: 'Limited / Read-only', purpose: 'Views approved agricultural information', icon: Eye, color: 'text-muted' }
  ];

  // Permission Matrix
  const matrix = [
    { page: 'Farmers', admin: 'full', manager: 'full', planner: 'full', district: 'scoped', sector: 'scoped', researcher: 'full', partner: 'full', viewer: 'read' },
    { page: 'Farms', admin: 'full', manager: 'full', planner: 'full', district: 'scoped', sector: 'scoped', researcher: 'full', partner: 'full', viewer: 'read' },
    { page: 'Crops & Seasons', admin: 'full', manager: 'full', planner: 'full', district: 'scoped', sector: 'scoped', researcher: 'full', partner: 'full', viewer: 'read' },
    { page: 'Agricultural Data', admin: 'full', manager: 'full', planner: 'full', district: 'scoped', sector: 'scoped', researcher: 'full', partner: 'limited', viewer: 'read' },
    { page: 'Data Quality / Imports', admin: 'full', manager: 'full', planner: 'no', district: 'no', sector: 'no', researcher: 'no', partner: 'no', viewer: 'no' },
    { page: 'Analytics & Map', admin: 'full', manager: 'full', planner: 'full', district: 'scoped', sector: 'scoped', researcher: 'scoped', partner: 'scoped', viewer: 'limited' },
    { page: 'AI & Priority Zones', admin: 'full', manager: 'limited', planner: 'full', district: 'scoped', sector: 'scoped', researcher: 'full', partner: 'scoped', viewer: 'limited' },
    { page: 'Interventions', admin: 'full', manager: 'limited', planner: 'full', district: 'scoped', sector: 'scoped', researcher: 'scoped', partner: 'scoped', viewer: 'read' },
  ];

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'full': return <CheckCircle2 className="w-4 h-4 text-success mx-auto" />;
      case 'scoped': return <MapPin className="w-4 h-4 text-primary mx-auto" title="Geographically Scoped" />;
      case 'read': return <Eye className="w-4 h-4 text-muted mx-auto" />;
      case 'limited': return <Shield className="w-4 h-4 text-warning mx-auto" />;
      case 'no': return <XCircle className="w-4 h-4 text-danger/50 mx-auto" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" /> 
            Roles & Permissions
          </h1>
          <p className="text-sm text-muted mt-1">
            Configure system authorization, role assignments, and geographic scopes.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface border border-border-main text-text-main text-sm font-semibold rounded-md shadow-sm hover:bg-background transition-colors flex items-center gap-2">
            <Key className="w-4 h-4" /> View JWT Config
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-lg border border-border-main w-max">
        <button 
          className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${activeTab === 'roles' ? 'bg-background text-text-main shadow-sm border border-border-main' : 'text-muted hover:text-text-main'}`}
          onClick={() => setActiveTab('roles')}
        >
          <Users className="w-4 h-4" /> Official Roles
        </button>
        <button 
          className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${activeTab === 'matrix' ? 'bg-background text-text-main shadow-sm border border-border-main' : 'text-muted hover:text-text-main'}`}
          onClick={() => setActiveTab('matrix')}
        >
          <Lock className="w-4 h-4" /> Access Matrix
        </button>
        <button 
          className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${activeTab === 'model' ? 'bg-background text-text-main shadow-sm border border-border-main' : 'text-muted hover:text-text-main'}`}
          onClick={() => setActiveTab('model')}
        >
          <Settings className="w-4 h-4" /> Auth Model
        </button>
      </div>

      {/* Tab Content: Roles */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-surface rounded-xl border border-border-main p-6 shadow-sm hover:border-primary/30 transition-colors flex gap-4">
              <div className={`p-3 rounded-lg bg-background border border-border-main h-max ${role.color}`}>
                <role.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-text-main mb-1">{role.name}</h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-3">
                  <MapPin className="w-3 h-3" /> {role.scope}
                </div>
                <p className="text-sm text-muted">{role.purpose}</p>
                <div className="mt-4 flex gap-2">
                  <button className="text-xs font-bold text-text-main bg-background border border-border-main px-3 py-1.5 rounded hover:bg-border-main transition-colors">
                    View Assigned Users
                  </button>
                  <button className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded hover:bg-primary/20 transition-colors">
                    Edit Permissions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-surface rounded-xl border border-border-main overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border-main flex justify-between items-center bg-surface">
            <div>
              <h3 className="font-bold text-sm text-text-main uppercase tracking-wider">Module Access Matrix</h3>
              <p className="text-xs text-muted">Page and module authorization by Role</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-muted">
              <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success"/> Full</div>
              <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary"/> Scoped</div>
              <div className="flex items-center gap-1"><Eye className="w-3 h-3 text-muted"/> Read</div>
              <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-warning"/> Limited</div>
              <div className="flex items-center gap-1"><XCircle className="w-3 h-3 text-danger/50"/> None</div>
            </div>
          </div>
          <div className="overflow-x-auto flex-1 p-4">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-background/50 text-muted text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3 border-b border-border-main">Module / Page</th>
                  <th className="px-2 py-3 text-center border-b border-border-main">Admin</th>
                  <th className="px-2 py-3 text-center border-b border-border-main">Data Mgr</th>
                  <th className="px-2 py-3 text-center border-b border-border-main">Planner</th>
                  <th className="px-2 py-3 text-center border-b border-border-main">District</th>
                  <th className="px-2 py-3 text-center border-b border-border-main">Sector</th>
                  <th className="px-2 py-3 text-center border-b border-border-main">Researcher</th>
                  <th className="px-2 py-3 text-center border-b border-border-main">Partner</th>
                  <th className="px-2 py-3 text-center border-b border-border-main">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {matrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-background transition-colors">
                    <td className="px-4 py-4 font-semibold text-text-main">{row.page}</td>
                    <td className="px-2 py-4">{getStatusIcon(row.admin)}</td>
                    <td className="px-2 py-4">{getStatusIcon(row.manager)}</td>
                    <td className="px-2 py-4">{getStatusIcon(row.planner)}</td>
                    <td className="px-2 py-4 bg-primary/5">{getStatusIcon(row.district)}</td>
                    <td className="px-2 py-4 bg-primary/5">{getStatusIcon(row.sector)}</td>
                    <td className="px-2 py-4">{getStatusIcon(row.researcher)}</td>
                    <td className="px-2 py-4 bg-primary/5">{getStatusIcon(row.partner)}</td>
                    <td className="px-2 py-4">{getStatusIcon(row.viewer)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Auth Model */}
      {activeTab === 'model' && (
        <div className="bg-surface rounded-xl border border-border-main p-8 shadow-sm text-center">
          <h3 className="font-bold text-lg text-text-main mb-6">Geographic & Domain Authorization Flow</h3>
          <div className="flex flex-col items-center max-w-2xl mx-auto space-y-4">
            
            <div className="w-full flex justify-center items-center gap-4">
              <div className="bg-background border border-border-main p-4 rounded-lg w-48 shadow-sm">
                <Key className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-bold text-sm">JWT</div>
              </div>
            </div>
            
            <div className="w-1 h-6 bg-border-main"></div>
            
            <div className="w-full flex justify-center items-center gap-4">
              <div className="bg-background border border-border-main p-4 rounded-lg w-48 shadow-sm">
                <Users className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="font-bold text-sm">USER</div>
              </div>
            </div>
            
            <div className="w-1 h-6 bg-border-main"></div>

            <div className="w-full flex justify-center items-center gap-4">
              <div className="bg-background border border-border-main p-4 rounded-lg w-48 shadow-sm border-l-4 border-l-danger">
                <ShieldAlert className="w-6 h-6 text-danger mx-auto mb-2" />
                <div className="font-bold text-sm">ROLE</div>
                <div className="text-xs text-muted mt-1">e.g., District Officer</div>
              </div>
            </div>

            <div className="w-1 h-6 bg-border-main"></div>

            <div className="w-full flex justify-center items-center gap-4">
              <div className="bg-background border border-border-main p-4 rounded-lg w-48 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-warning mx-auto mb-2" />
                <div className="font-bold text-sm">PERMISSIONS</div>
                <div className="text-xs text-muted mt-1">VIEW_AGRICULTURAL_DATA</div>
              </div>
            </div>

            <div className="w-1 h-6 bg-border-main"></div>

            <div className="w-full flex justify-center items-center gap-4">
              <div className="bg-background border border-border-main p-4 rounded-lg w-48 shadow-sm border-l-4 border-l-primary">
                <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-bold text-sm">GEOGRAPHIC SCOPE</div>
                <div className="text-xs text-muted mt-1">District X</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
