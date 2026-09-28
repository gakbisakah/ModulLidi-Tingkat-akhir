"use client";

import React, { useState } from 'react';
import { Settings2, Layers, Search, CheckCircle2, Save, Trash2, Copy, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

const BASIC_COLORS = [
  '#000000', '#A62323', '#2563EB', '#059669', '#D97706', '#7C3AED',
  '#FFFFFF', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#4B5563'
];

export default function ToolbarRight() {
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    selectedIds, motifElements, updateElement, recolorElement, recolorElements,
    deleteElements, duplicateElements, saveMotif, finalizeMotif,
    comparisonMode, toggleComparisonMode, currentMotifId, editCount,
    availableMotifs, loadAvailableMotifs, swapSelectedMotifs,
    threadColors, loadThreadColors
  } = useEditorStore();

  const selectedElement = motifElements.find(el => el.id === selectedIds[0]);

  // Load Library on Mount
  React.useEffect(() => {
    loadAvailableMotifs('all');
    loadThreadColors();
  }, [loadAvailableMotifs, loadThreadColors]);

  const excludedKeywords = ['harungguan', 'puca', 'sadum', 'geometric', 'pro geometric'];
  
  const filteredMotifs = availableMotifs.filter((motif: any) => {
    // Basic search filtering
    const searchMatch = motif.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       motif.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!searchMatch) return false;

    // Filter out excluded motifs
    const isExcluded = excludedKeywords.some(keyword => 
      motif.id.toLowerCase().includes(keyword.toLowerCase()) ||
      motif.category?.toLowerCase().includes(keyword.toLowerCase())
    );

    return !isExcluded;
  });

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] w-[450px]">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all
            ${activeTab === 'properties' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}
          `}
        >
           <Settings2 size={14} /> Properti
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all
            ${activeTab === 'layers' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}
          `}
        >
           <Layers size={14} /> Struktur Lidi
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {activeTab === 'properties' ? (
          <>


            {/* Ganti Motif (Library) */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Library Motif</h4>
                  <span className="text-[9px] font-mono bg-slate-100 text-slate-400 px-2 rounded-full">{availableMotifs.length} Unit</span>
               </div>
               


                <div className="grid grid-cols-1 gap-4 max-h-[650px] overflow-y-auto custom-scrollbar pr-2 p-2">
                {filteredMotifs.map((motif: any) => {
                    const isGenerated = motif.category === 'Hasil Lidi';
                    const fullSrc = motif.src.startsWith('http') 
                        ? motif.src 
                        : `http://localhost:8000${motif.src.startsWith('/') ? '' : '/'}${motif.src}`;
                    return (
                        <div 
                             key={motif.id + motif.category} 
                             onClick={() => {
                                 swapSelectedMotifs(motif.src);
                             }}
                             draggable
                             onDragStart={(e) => {
                                 e.dataTransfer.setData('text/plain', JSON.stringify({
                                     type: 'new-motif',
                                     src: fullSrc,
                                     id: motif.id
                                 }));
                             }}
                             className={`
                                width-full aspect-[4/1.2] bg-white border rounded-xl transition-all duration-300 group relative flex flex-col items-center justify-center overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-grab active:cursor-grabbing
                                ${isGenerated ? 'border-green-200 hover:border-green-500' : 'border-slate-200 hover:border-blue-500'}
                             `}
                             title={`${motif.id} (${motif.category})`}
                        >
                            <div className="w-full h-full p-0 flex items-center justify-center bg-white group-hover:bg-slate-50/50 transition-colors">
                                {/* Visual 15-Unit Preview for Library */}
                                <div 
                                    className="w-full h-1/2 transition-all duration-500 group-hover:scale-105"
                                    style={{ 
                                        backgroundImage: `url(${fullSrc})`,
                                        backgroundSize: `auto 100%`,
                                        backgroundRepeat: 'repeat-x',
                                        backgroundPosition: 'left center',
                                        imageRendering: 'pixelated',
                                        filter: 'contrast(1.1) brightness(1.05)'
                                    }}
                                />
                            </div>
                            


                            <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-slate-100">
                                <p className="text-[8px] font-bold text-slate-800 truncate text-center uppercase tracking-tighter">
                                    {isGenerated ? `Motif #${motif.id}` : motif.id}
                                </p>
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Object Selection Properties */}
            {selectedElement ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border-2 border-blue-500 flex items-center justify-center bg-blue-50">
                            <Layers size={18} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Objekt Terpilih</p>
                            <p className="text-sm font-black text-slate-900 truncate w-32">
                                {selectedIds.length > 1 ? `${selectedIds.length} Lidi Terpilih` : (selectedElement.lidiNumber || selectedElement.id)}
                            </p>
                        </div>
                    </div>

                    {/* Shift Horizontal Slider */}
                    {selectedIds.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Geser Motif (Sejajarkan)
                                </h4>
                            </div>
                            <div className="px-1">
                                <div className="flex items-center gap-2">
                                    <button 
                                        className="p-1 hover:bg-slate-100 rounded text-slate-500 active:scale-95"
                                        onClick={() => {
                                            const currentX = selectedElement?.crop?.x || 0;
                                            const newX = currentX - 10; // Geser kiri 10px
                                            selectedIds.forEach(id => {
                                                const el = motifElements.find(m => m.id === id);
                                                if (el) {
                                                    updateElement(id, {
                                                        crop: { ...(el.crop || { y: 0, width: 100, height: 100 }), x: newX }
                                                    });
                                                }
                                            });
                                        }}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    
                                    <input
                                        type="range"
                                        key={`slider-${selectedIds.join('-')}`}
                                        min="-2000"
                                        max="2000"
                                        value={selectedElement?.crop?.x || 0}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        onChange={(e) => {
                                            const newX = parseFloat(e.target.value);
                                            selectedIds.forEach(id => {
                                                const el = motifElements.find(m => m.id === id);
                                                if (el) {
                                                    updateElement(id, {
                                                        crop: { ...(el.crop || { y: 0, width: 100, height: 100 }), x: newX }
                                                    });
                                                }
                                            });
                                        }}
                                    />

                                    <button 
                                        className="p-1 hover:bg-slate-100 rounded text-slate-500 active:scale-95"
                                        onClick={() => {
                                            const currentX = selectedElement?.crop?.x || 0;
                                            const newX = currentX + 10; // Geser kanan 10px
                                            selectedIds.forEach(id => {
                                                const el = motifElements.find(m => m.id === id);
                                                if (el) {
                                                    updateElement(id, {
                                                        crop: { ...(el.crop || { y: 0, width: 100, height: 100 }), x: newX }
                                                    });
                                                }
                                            });
                                        }}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-mono">
                                    <span>Geser Kiri</span>
                                    <span>Geser Kanan</span>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-relaxed mt-2">
                                    Gunakan <b>titik penggeser</b> ini jika kolom motif yang baru Anda tambahkan posisinya bergeser (tidak lurus/sejajar) dengan baris asli di atas atau bawahnya.  
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Skala Horizontal (Ukuran Motif)
                                </h4>
                            </div>
                            <div className="px-1">
                                <input
                                    type="range"
                                    key={`scale-${selectedIds.join('-')}`}
                                    min="0.5"
                                    max="2.0"
                                    step="0.005"
                                    defaultValue={selectedElement?.customScale || 1.0}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                    onChange={(e) => {
                                        const newS = parseFloat(e.target.value);
                                        selectedIds.forEach(id => {
                                            const el = motifElements.find(m => m.id === id);
                                            if (el) {
                                                updateElement(id, { customScale: newS });
                                            }
                                        });
                                    }}
                                />
                                <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-mono">
                                    <span>Lebih Rapat</span>
                                    <span>Lebih Lebar</span>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-relaxed mt-2">
                                    Gunakan <b>titik penggeser</b> ini jika ukuran gambar motif ini terlihat lebih KECIL atau lebih BESAR dari baris lainnya.
                                </p>
                            </div>
                        </div>
                    )}



                </div>
            ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Palette size={24} className="text-slate-300 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">Pilih elemen di kanvas untuk mulai mengedit</p>
                </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Urutan Lidi Produksi</p>
            {motifElements.map((el, i) => (
              <div 
                key={el.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedIds.includes(el.id) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/20' : 'bg-white border-slate-100'}`}
                onClick={() => useEditorStore.getState().selectElement(el.id, false)}
              >
                <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm ring-2 ring-white">{i + 1}</div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter truncate">
                            {el.lidiNumber || 'TIDAK ADA KODE'}
                        </p>
                        <span className="text-[8px] font-mono text-slate-400">#{i+1}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-4 h-2 rounded-full border border-black/5" style={{ backgroundColor: el.color }} />
                        <span className="text-[9px] text-slate-400 font-mono uppercase truncate">{el.color}</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
}
