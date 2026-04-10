import React, { useState, useEffect } from 'react';
import './index.css';
import { fetchLatestConfig, uploadConfig, rollbackConfig, fetchSchemas } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [config, setConfig] = useState(null);
  const [schemas, setSchemas] = useState([]);
  
  // Editor States
  const [editorSchemaVersion, setEditorSchemaVersion] = useState('v1');
  const [editorJSON, setEditorJSON] = useState('{\n  \n}');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [confData, schemaData] = await Promise.all([
        fetchLatestConfig().catch(e => null), // Catch if no config exists yet
        fetchSchemas()
      ]);
      
      if (confData) setConfig(confData);
      if (schemaData) setSchemas(schemaData);
      
      // Auto-set editor version to latest schema
      if (schemaData && schemaData.length > 0) {
        setEditorSchemaVersion(schemaData[schemaData.length - 1].version);
      }
    } catch (err) {
      setError('Failed to load initial data. Ensure backend is running.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpload = async () => {
    setError(null);
    setSuccess(null);
    
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(editorJSON);
    } catch (e) {
      setError('Invalid JSON format.');
      return;
    }

    setLoading(true);
    try {
      const result = await uploadConfig(editorSchemaVersion, parsedConfig);
      setSuccess(`Configuration successfully uploaded! Version: v${result.version}`);
      await loadDashboardData();
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRollback = async () => {
    if (!window.confirm('Are you sure you want to rollback to the previous version?')) return;
    
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await rollbackConfig();
      setSuccess('Rollback successful!');
      await loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="layout-container fade-in">
      {/* Sidebar Panel */}
      <div className="glass-panel" style={{ alignSelf: 'start' }}>
        <h2>Config Nexus</h2>
        <p className="label-title" style={{ marginBottom: '24px' }}>System Control</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ textAlign: 'left', display: 'block', width: '100%' }}
          >
            Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
            style={{ textAlign: 'left', display: 'block', width: '100%' }}
          >
            New Configuration
          </button>
          <button 
            className={`tab ${activeTab === 'schemas' ? 'active' : ''}`}
            onClick={() => setActiveTab('schemas')}
            style={{ textAlign: 'left', display: 'block', width: '100%' }}
          >
            Schema Registry
          </button>
        </div>

        <div className="mt-4" style={{ marginTop: 'auto', paddingTop: '40px' }}>
          <button className="danger" style={{ width: '100%' }} onClick={handleRollback} disabled={loading}>
            ⚠ Emergency Rollback
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass-panel" style={{ minHeight: '600px' }}>
        {error && <div className="alert error fade-in">✖ {error}</div>}
        {success && <div className="alert success fade-in">✔ {success}</div>}
        {loading && <div style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>Processing requested operation...</div>}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="fade-in">
            <div className="flex-between mb-4">
              <h1>Current Configuration</h1>
              {config && <span className="badge">Version: v{config.version}</span>}
            </div>

            {config ? (
              <>
                <div className="grid-cols-2">
                  <div className="glass-panel" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.4)' }}>
                    <span className="label-title">Schema Used</span>
                    <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{config.schemaVersion}</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.4)' }}>
                    <span className="label-title">Last Updated</span>
                    <p>{config.createdAt ? new Date(config.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="label-title">Configuration Payload</span>
                  <div className="code-block mt-4">
                    {JSON.stringify(config.config, null, 2)}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                <h3>No active configuration found.</h3>
                <p>Upload a new config to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* EDITOR TAB */}
        {activeTab === 'editor' && (
          <div className="fade-in">
            <h1>Deploy Configuration</h1>
            <p className="label-title mb-4">Target Schema Version</p>
            <select 
              value={editorSchemaVersion} 
              onChange={(e) => setEditorSchemaVersion(e.target.value)}
              className="mb-4"
            >
              {schemas.map(s => (
                <option key={s.version} value={s.version}>{s.version}</option>
              ))}
              {schemas.length === 0 && <option value="v1">v1 (Default)</option>}
            </select>

            <p className="label-title mb-4">Configuration JSON</p>
            <textarea 
              value={editorJSON}
              onChange={(e) => setEditorJSON(e.target.value)}
              rows={15}
              style={{ fontFamily: 'monospace' }}
              placeholder="Enter JSON here..."
            />
            
            <div className="mt-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleUpload} disabled={loading}>
                Deploy Configuration
              </button>
            </div>
          </div>
        )}

        {/* SCHEMAS TAB */}
        {activeTab === 'schemas' && (
          <div className="fade-in">
            <h1>Schema Registry</h1>
            
            {schemas.length === 0 ? (
              <p>No schemas found in registry.</p>
            ) : (
              <div className="flex-col gap-4">
                {schemas.map(s => (
                  <div key={s.version} className="glass-panel" style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.4)' }}>
                    <div className="flex-between mb-4">
                      <h3>Version: {s.version}</h3>
                      {s.migrationKey && <span className="badge">Migration: {s.migrationKey}</span>}
                    </div>
                    <span className="label-title">JSON Schema</span>
                    <div className="code-block mt-4" style={{ maxHeight: '200px' }}>
                      {JSON.stringify(s.jsonSchema, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
