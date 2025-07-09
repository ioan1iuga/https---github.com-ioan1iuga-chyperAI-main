import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Settings,
  Monitor,
  Moon,
  Sun,
  Save,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Trash2
} from 'lucide-react';

const UISettingsPanel: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  const [fontSize, setFontSize] = useState('sm');
  const [editorFontFamily, setEditorFontFamily] = useState('Monaco');
  const [editorFontSize, setEditorFontSize] = useState('14');
  const [codeEditorTheme, setCodeEditorTheme] = useState(isDark ? 'vs-dark' : 'vs-light');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [tabSize, setTabSize] = useState('2');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'general': true,
    'editor': true,
    'terminal': false,
    'preview': false
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden ${
      isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-blue-900' : 'bg-blue-100'
          }`}>
            <Settings size={16} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold">UI Settings</h2>
            <p className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Customize appearance and editor preferences
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* General UI Settings */}
          <div className={`rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div 
              className={`p-4 border-b flex items-center justify-between cursor-pointer ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              onClick={() => toggleSection('general')}
            >
              <h3 className="text-sm font-medium">General Appearance</h3>
              {expandedSections['general'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {expandedSections['general'] && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2">Theme</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTheme()}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        !isDark ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      <Sun size={14} />
                      <span className="text-xs">Light</span>
                    </button>
                    
                    <button
                      onClick={() => toggleTheme()}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        isDark ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Moon size={14} />
                      <span className="text-xs">Dark</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-2">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs ${
                      isDark 
                        ? 'bg-gray-700 border border-gray-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="xs">Extra Small</option>
                    <option value="sm">Small</option>
                    <option value="base">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium">Interface Density</label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button className={`p-2 rounded text-xs border text-center ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}>
                      Compact
                    </button>
                    <button className={`p-2 rounded text-xs border text-center ${
                      isDark 
                        ? 'border-blue-500 bg-blue-600 text-white' 
                        : 'border-blue-500 bg-blue-100 text-blue-800'
                    }`}>
                      <Check size={12} className="inline mr-1" />
                      Comfortable
                    </button>
                    <button className={`p-2 rounded text-xs border text-center ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}>
                      Spacious
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Code Editor Settings */}
          <div className={`rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div 
              className={`p-4 border-b flex items-center justify-between cursor-pointer ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              onClick={() => toggleSection('editor')}
            >
              <h3 className="text-sm font-medium">Code Editor</h3>
              {expandedSections['editor'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {expandedSections['editor'] && (
              <div className="p-4 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-2">Font Family</label>
                    <select
                      value={editorFontFamily}
                      onChange={(e) => setEditorFontFamily(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-xs ${
                        isDark 
                          ? 'bg-gray-700 border border-gray-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Monaco">Monaco</option>
                      <option value="Menlo">Menlo</option>
                      <option value="Consolas">Consolas</option>
                      <option value="Courier New">Courier New</option>
                      <option value="monospace">monospace</option>
                    </select>
                  </div>
                  
                  <div className="w-24">
                    <label className="block text-xs font-medium mb-2">Font Size</label>
                    <select
                      value={editorFontSize}
                      onChange={(e) => setEditorFontSize(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-xs ${
                        isDark 
                          ? 'bg-gray-700 border border-gray-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="12">12px</option>
                      <option value="14">14px</option>
                      <option value="16">16px</option>
                      <option value="18">18px</option>
                    </select>
                  </div>
                  
                  <div className="w-24">
                    <label className="block text-xs font-medium mb-2">Tab Size</label>
                    <select
                      value={tabSize}
                      onChange={(e) => setTabSize(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-xs ${
                        isDark 
                          ? 'bg-gray-700 border border-gray-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="2">2</option>
                      <option value="4">4</option>
                      <option value="8">8</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-2">Editor Theme</label>
                  <select
                    value={codeEditorTheme}
                    onChange={(e) => setCodeEditorTheme(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs ${
                      isDark 
                        ? 'bg-gray-700 border border-gray-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="vs-dark">Dark (VS Code)</option>
                    <option value="vs-light">Light (VS Code)</option>
                    <option value="github-dark">GitHub Dark</option>
                    <option value="github-light">GitHub Light</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showLineNumbers}
                      onChange={(e) => setShowLineNumbers(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs">Show line numbers</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={wordWrap}
                      onChange={(e) => setWordWrap(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs">Word wrap</span>
                  </label>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className="text-xs font-medium mb-2">Preview</div>
                  <div className={`rounded font-mono text-xs p-2 ${
                    codeEditorTheme.includes('dark')
                      ? 'bg-gray-900 text-gray-300'
                      : 'bg-white text-gray-800 border border-gray-300'
                  }`} style={{ 
                    fontFamily: editorFontFamily, 
                    fontSize: `${editorFontSize}px` 
                  }}>
                    <div className={showLineNumbers ? 'pl-7 relative' : ''}>
                      {showLineNumbers && <span className="absolute left-1 text-gray-500">1</span>}
                      <span className="text-blue-400">function</span> <span className="text-yellow-400">example</span>() {'{'}
                    </div>
                    <div className={showLineNumbers ? 'pl-7 relative' : ''}>
                      {showLineNumbers && <span className="absolute left-1 text-gray-500">2</span>}
                      {'  '}<span className="text-purple-400">const</span> x = <span className="text-green-400">10</span>;
                    </div>
                    <div className={showLineNumbers ? 'pl-7 relative' : ''}>
                      {showLineNumbers && <span className="absolute left-1 text-gray-500">3</span>}
                      {'  '}<span className="text-purple-400">return</span> x;
                    </div>
                    <div className={showLineNumbers ? 'pl-7 relative' : ''}>
                      {showLineNumbers && <span className="absolute left-1 text-gray-500">4</span>}
                      {'}'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Terminal Settings */}
          <div className={`rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div 
              className={`p-4 border-b flex items-center justify-between cursor-pointer ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              onClick={() => toggleSection('terminal')}
            >
              <h3 className="text-sm font-medium">Terminal</h3>
              {expandedSections['terminal'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {expandedSections['terminal'] && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2">Shell</label>
                  <select
                    className={`w-full px-3 py-2 rounded-lg text-xs ${
                      isDark 
                        ? 'bg-gray-700 border border-gray-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                    defaultValue="bash"
                  >
                    <option value="bash">Bash</option>
                    <option value="zsh">Zsh</option>
                    <option value="powershell">PowerShell</option>
                    <option value="cmd">Command Prompt</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-2">Font Size</label>
                  <select
                    className={`w-full px-3 py-2 rounded-lg text-xs ${
                      isDark 
                        ? 'bg-gray-700 border border-gray-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                    defaultValue="14"
                  >
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={true}
                      className="rounded"
                    />
                    <span className="text-xs">Cursor blinking</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={true}
                      className="rounded"
                    />
                    <span className="text-xs">Audible bell</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Preview Settings */}
          <div className={`rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div 
              className={`p-4 border-b flex items-center justify-between cursor-pointer ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              onClick={() => toggleSection('preview')}
            >
              <h3 className="text-sm font-medium">Preview</h3>
              {expandedSections['preview'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {expandedSections['preview'] && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2">Default Preview Mode</label>
                  <select
                    className={`w-full px-3 py-2 rounded-lg text-xs ${
                      isDark 
                        ? 'bg-gray-700 border border-gray-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                    defaultValue="desktop"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-2">Auto-refresh</label>
                  <select
                    className={`w-full px-3 py-2 rounded-lg text-xs ${
                      isDark 
                        ? 'bg-gray-700 border border-gray-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                    defaultValue="livereload"
                  >
                    <option value="livereload">Live Reload</option>
                    <option value="manual">Manual</option>
                    <option value="interval">Every 5 seconds</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={true}
                      className="rounded"
                    />
                    <span className="text-xs">Show browser frame</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Keyboard Shortcuts */}
          <div className={`rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-medium">Keyboard Shortcuts</h3>
            </div>
            
            <div className="p-4">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-700">
                  <tr className="py-2">
                    <td className="py-2 pr-4">Open Command Palette</td>
                    <td className="py-2">
                      <div className="flex gap-1 justify-end">
                        <span className={`px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>Ctrl</span>
                        <span className={`px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>Shift</span>
                        <span className={`px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>P</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Quick File Open</td>
                    <td className="py-2">
                      <div className="flex gap-1 justify-end">
                        <span className={`px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>Ctrl</span>
                        <span className={`px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>P</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Save File</td>
                    <td className="py-2">
                      <div className="flex gap-1 justify-end">
                        <span className={`px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>Ctrl</span>
                        <span className={`px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>S</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Toggle Terminal</td>
                    <td className="py-2">
                      <div className="flex gap-1 justify-end">
                        <span className={`px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>Ctrl</span>
                        <span className={`px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>`</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t flex items-center justify-between ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          className={`px-4 py-2 rounded-lg transition-colors ${
            isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          <RotateCcw size={14} className="inline mr-2" />
          <span className="text-xs">Reset Defaults</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <span className="text-xs">Cancel</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Save size={14} className="inline mr-2" />
            <span className="text-xs">Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UISettingsPanel;