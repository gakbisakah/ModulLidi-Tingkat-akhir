'use client';

import dynamic from 'next/dynamic';
import EditorLayout from '@/components/editor/EditorLayout';
import ToolbarLeft from '@/components/editor/ToolbarLeft';
import ToolbarRight from '@/components/editor/ToolbarRight';
import { useEditorStore } from '@/store/useEditorStore';

const EditorCanvas = dynamic(() => import('@/components/editor/EditorCanvas'), {
  ssr: false,
});

export default function EditorPage() {
  const { activeTool, setActiveTool } = useEditorStore();

  return (
    <EditorLayout
      leftSidebar={
        <ToolbarLeft 
            activeTool={activeTool} 
            onToolChange={setActiveTool} 
        />
      }
      rightSidebar={<ToolbarRight />}
      canvas={<EditorCanvas />}
    />
  );
}
