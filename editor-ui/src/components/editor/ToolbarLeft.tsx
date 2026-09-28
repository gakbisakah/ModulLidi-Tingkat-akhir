'use client';

import React from 'react';
import { MousePointer2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useEditorStore, ToolType } from '@/store/useEditorStore';

interface Tool {
  id: ToolType;
  icon: React.ElementType;
  label: string;
  description: string;
  action?: boolean;
  danger?: boolean;
}

interface ToolbarLeftProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export default function ToolbarLeft({ activeTool, onToolChange }: ToolbarLeftProps) {
  const { duplicateElements, deleteElements, selectedIds } = useEditorStore();

  const tools: Tool[] = [
    { id: 'select', icon: MousePointer2, label: 'Pilih Objek', description: 'Pilih satu atau lebih elemen motif' },
  ];
  
  const handleToolClick = (toolId: ToolType) => {
    if (toolId === 'delete' && selectedIds.length > 0) {
      deleteElements(selectedIds);
      return;
    }
    onToolChange(toolId);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm z-30 w-[60px] lg:w-[72px] items-center py-6 gap-6">
      <div className="flex flex-col gap-3 w-full px-2">
        {tools.map((tool) => (
          <div key={tool.id} className="relative group flex justify-center">
              <button
                onClick={() => handleToolClick(tool.id)}
                className={clsx(
                  "w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-xl transition-all duration-200",
                  activeTool === tool.id && !tool.action
                    ? "bg-primary text-white shadow-lg shadow-primary/30 transform scale-105"
                    : (tool.danger ? "text-gray-400 hover:bg-red-50 hover:text-red-500" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")
                )}
              >
                <tool.icon className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 top-1/2 -translate-y-1/2">
                  <div className="font-semibold">{tool.label}</div>
                  {tool.description && (
                    <div className="text-[10px] text-gray-300 mt-0.5 opacity-90">{tool.description}</div>
                  )}
                  {/* Arrow */}
                  <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-gray-900"></div>
              </div>
          </div>
        ))}
      </div>
      
      <button
        title="Hapus"
        onClick={() => handleToolClick('delete')}
        className="p-3 mt-auto mb-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={22} />
      </button>

    </div>
  );
}
