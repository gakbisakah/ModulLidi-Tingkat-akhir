'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Save, Undo2, Redo2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

import Footer from './Footer';

interface EditorLayoutProps {
  leftSidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
  canvas: React.ReactNode;
}

function EditorLayoutContentImpl({
  leftSidebar,
  rightSidebar,
  canvas,
}: EditorLayoutProps) {
  const { undo, redo, history, saveMotif } = useEditorStore();
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const motifId = searchParams.get('id');
  const loadedIdRef = useRef<string | null>(null);

  // Mark client once
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load motif exactly once per id
  useEffect(() => {
    if (!motifId) return;
    if (loadedIdRef.current === motifId) return;
    loadedIdRef.current = motifId;
    useEditorStore.getState().loadMotif(motifId);
  }, [motifId]);
  
  if (!isClient) return null; // Prevent hydration mismatch

  // Safe guards: history in store is a simple array placeholder
  const canUndo = Array.isArray(history) ? history.length > 0 : Boolean((history as any)?.past?.length);
  const canRedo = Array.isArray(history) ? false : Boolean((history as any)?.future?.length);

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Premium Header adapted to match reference design */}
      <header className="h-20 bg-primary text-primary-foreground flex items-center px-8 shadow-lg shrink-0 z-50 justify-between sticky top-0">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
                {/* Logo from NewTitle.ico */}
                <div className="flex items-center justify-center">
                   <img 
                    src="/NewTitle.png" 
                    alt="Modul Lidi Logo" 
                    width={48} 
                    height={48}
                    className="object-contain"
                   />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-[1.45rem] leading-[0.9] tracking-tight">Modul</span>
                    <span className="font-bold text-[1.45rem] leading-[1.1] tracking-tight">Lidi</span>
                </div>
            </div>

            {/* Actions (Undo/Redo) - Positioned next to Title like in Coloring, bright and clear */}
            <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg ml-2 shadow-inner border border-white/10">
                 <button 
                    onClick={undo}
                    disabled={!canUndo}
                    className="p-2 hover:bg-white/20 rounded-md transition-all text-white disabled:opacity-30 disabled:hover:bg-transparent" 
                    title="Undo"
                 >
                    <Undo2 size={20} color="white" strokeWidth={2.5} />
                 </button>
                 <button 
                    onClick={redo}
                    disabled={!canRedo}
                    className="p-2 hover:bg-white/20 rounded-md transition-all text-white disabled:opacity-30 disabled:hover:bg-transparent" 
                    title="Redo"
                 >
                    <Redo2 size={20} color="white" strokeWidth={2.5} />
                 </button>
            </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
             <button 
                onClick={() => saveMotif()} 
                className="flex items-center gap-2.5 px-4 py-2 text-sm font-bold text-white bg-transparent border-2 border-white hover:bg-white/10 rounded-md shadow-md transition-all active:scale-95"
                title="Simpan"
             >
                <Save size={18} />
                Simpan
             </button>
        </div>
      </header>

      <main className="h-[calc(100vh-80px)] flex overflow-hidden shrink-0">
        <aside className="w-[60px] lg:w-[72px] bg-white border-r border-border shadow-sm flex flex-col z-30 shrink-0">
          {leftSidebar}
        </aside>
        <section className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col min-w-0">
          {canvas}
        </section>
        <aside className="w-[450px] bg-white border-l border-border shadow-sm flex flex-col z-20 shrink-0">
          {rightSidebar}
        </aside>
      </main>

      <Footer />
    </div>
  );
}

const EditorLayoutContent = dynamic(() => Promise.resolve(EditorLayoutContentImpl), {
  ssr: false,
});

export default function EditorLayout(props: EditorLayoutProps) {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading Editor...</div>}>
      <EditorLayoutContent {...props} />
    </Suspense>
  );
}
