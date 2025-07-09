import React, { useState } from 'react';
import { Save, Download, Copy, Search, MoreHorizontal } from 'lucide-react';

interface CodeEditorProps {
  projectId?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = () => {
  const [code, setCode] = useState(`import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Hello World</h1>
        <p className="text-gray-600">Your project is ready to go!</p>
      </div>
    </div>
  );
}

export default App;`);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">App.tsx</span>
          <span className="text-xs text-gray-400">• Modified</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-gray-700 rounded transition-colors">
            <Save size={16} />
          </button>
          <button className="p-1 hover:bg-gray-700 rounded transition-colors">
            <Search size={16} />
          </button>
          <button className="p-1 hover:bg-gray-700 rounded transition-colors">
            <Copy size={16} />
          </button>
          <button className="p-1 hover:bg-gray-700 rounded transition-colors">
            <Download size={16} />
          </button>
          <button className="p-1 hover:bg-gray-700 rounded transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-900">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full p-4 bg-gray-900 text-white font-mono text-sm resize-none focus:outline-none"
          placeholder="Start coding..."
        />
      </div>
    </div>
  );
};