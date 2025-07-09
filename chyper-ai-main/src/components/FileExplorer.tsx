import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, FileText, Plus, Search, MoreHorizontal, Folder } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface FileExplorerProps {
  projectId?: string;
}

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  expanded?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      expanded: true,
      children: [
        { 
          id: '2', 
          name: 'components', 
          type: 'folder', 
          expanded: false,
          children: [
            { id: '21', name: 'App.tsx', type: 'file' },
            { id: '22', name: 'Dashboard.tsx', type: 'file' },
            { id: '23', name: 'Sidebar.tsx', type: 'file' },
          ]
        },
        { id: '3', name: 'App.tsx', type: 'file' },
        { id: '4', name: 'index.css', type: 'file' },
        { id: '5', name: 'main.tsx', type: 'file' },
      ]
    },
    {
      id: '6',
      name: 'public',
      type: 'folder',
      expanded: false,
      children: [
        { id: '7', name: 'vite.svg', type: 'file' },
        { id: '8', name: 'favicon.ico', type: 'file' },
      ]
    },
    { id: '9', name: 'package.json', type: 'file' },
    { id: '10', name: 'tsconfig.json', type: 'file' },
    { id: '11', name: 'vite.config.ts', type: 'file' },
    { id: '12', name: 'README.md', type: 'file' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleFolder = (id: string) => {
    const toggleNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    setFiles(toggleNode(files));
  };

  const getFileIcon = (fileName: string, isFolder: boolean) => {
    if (isFolder) return FolderOpen;
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
        return () => <span className="text-blue-400 font-bold text-xs">TS</span>;
      case 'js':
      case 'jsx':
        return () => <span className="text-yellow-400 font-bold text-xs">JS</span>;
      case 'css':
        return () => <span className="text-pink-400 font-bold text-xs">CSS</span>;
      case 'json':
        return () => <span className="text-green-400 font-bold text-xs">JSON</span>;
      case 'md':
        return () => <span className="text-gray-400 font-bold text-xs">MD</span>;
      case 'svg':
        return () => <span className="text-purple-400 font-bold text-xs">SVG</span>;
      default:
        return FileText;
    }
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const IconComponent = getFileIcon(node.name, node.type === 'folder');
    
    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-1.5 px-2 hover:bg-gray-700 cursor-pointer group transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          } ${isMobile ? 'py-3 px-3' : ''}`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => node.type === 'folder' && toggleFolder(node.id)}
        >
          {node.type === 'folder' ? (
            <>
              {node.expanded ? <ChevronDown size={isMobile ? 16 : 14} /> : <ChevronRight size={isMobile ? 16 : 14} />}
              <Folder size={isMobile ? 16 : 14} className="text-blue-400" />
            </>
          ) : (
            <>
              <span className={isMobile ? "w-4" : "w-3.5"} />
              {typeof IconComponent === 'function' ? (
                <IconComponent />
              ) : (
                <IconComponent size={isMobile ? 16 : 14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              )}
            </>
          )}
          <span className={`${isMobile ? 'text-sm' : 'text-xs'} ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          } ${
            node.type === 'folder' ? 'font-medium' : ''
          }`}>
            {node.name}
          </span>
          
          {/* File actions */}
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <button className={`p-0.5 rounded transition-colors ${
              isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}>
              <MoreHorizontal size={isMobile ? 14 : 12} />
            </button>
          </div>
        </div>
        
        {node.type === 'folder' && node.expanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredFiles = searchTerm ? 
    files.filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : files;

  return (
    <div className={`h-full border-r flex flex-col ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className={`p-3 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Explorer</h3>
          <div className="flex items-center gap-1">
            <button className={`p-1.5 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`} title="New File">
              <Plus size={14} />
            </button>
            <button className={`p-1.5 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`} title="Collapse All">
              <Folder size={14} />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg ${isMobile ? 'text-sm' : 'text-xs'} transition-colors ${
              isDark 
                ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none`}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {filteredFiles.length === 0 ? (
          <div className={`p-4 text-center ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <Search size={isMobile ? 40 : 32} className="mx-auto mb-2 opacity-50" />
            <p className={isMobile ? 'text-sm' : 'text-xs'}>No files found</p>
          </div>
        ) : (
          filteredFiles.map(node => renderNode(node))
        )}
      </div>
      
      {/* Status Bar */}
      <div className={`px-3 py-2 border-t ${isMobile ? 'text-sm' : 'text-xs'} ${
        isDark 
          ? 'border-gray-700 bg-gray-900 text-gray-500' 
          : 'border-gray-200 bg-gray-50 text-gray-600'
      }`}>
        {filteredFiles.length} items
      </div>
    </div>
  );
};