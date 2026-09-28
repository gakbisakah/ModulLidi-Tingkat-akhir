"use client";

import React, { useState, useEffect, Suspense } from 'react';
import LidiColoringEditor, { ThreadColor } from '@/components/coloring/LidiColoringEditor';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function PewarnaanPageContent() {
  const searchParams = useSearchParams();
  const motifId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [threadColors, setThreadColors] = useState<ThreadColor[]>([]);
  
  const [dimensions, setDimensions] = useState({ width: 500, height: 600 });
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  
  // STATE BARU: Menyimpan daftar kode warna asli dari hasil AI
  const [originalColors, setOriginalColors] = useState<string[]>([]);

  const fetchThreadColors = async () => {
    try {
      const hostname = window.location.hostname;
      const apiBase = `http://${hostname}:8000`;
      const response = await fetch(`${apiBase}/api/colors/`);
      if (response.ok) {
        const data = await response.json();
        setThreadColors(data);
      }
    } catch (err) {
      console.error("Failed to fetch thread colors:", err);
    }
  };

  const fetchMotifData = async () => {
    if (!motifId) return;
    
    setLoading(true);
    setErrorInfo(null);
    try {
      const hostname = window.location.hostname;
      const apiBase = `http://${hostname}:8000`;
      
      const response = await fetch(`${apiBase}/api/motif/${motifId}/load/`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'ERROR' && data.slices_assets && data.slices_assets.length > 0) {
        setCurrentImageUrl(data.slices_assets[0].src);
        setDimensions({ 
          width: data.canvasWidth || 500, 
          height: data.canvasHeight || 600 
        });
        
        // PERUBAHAN BARU: Ekstrak warna unik dari lidi_sequence (hasil AI Django)
        if (data.lidi_sequence) {
            const uniqueColors = Array.from(new Set(data.lidi_sequence)) as string[];
            setOriginalColors(uniqueColors);
        }

      } else {
        throw new Error("Sistem tidak dapat menarik data gambar motif.");
      }
    } catch (err: any) {
      setErrorInfo(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadColors();
    if (motifId) {
      fetchMotifData();
    }
  }, [motifId]);

  const handleSave = async (data: string | Blob, replacements: Record<string, string>): Promise<boolean> => {
    if (!motifId) {
        toast.error("Format data salah");
        return false;
    }

    setLoading(true);
    try {
        const hostname = window.location.hostname;
        const apiBase = `http://${hostname}:8000`;
        
        let response;
        if (data instanceof Blob) {
            // High-Performance FormData approach (Binary Stream)
            const formData = new FormData();
            formData.append('image_file', data, 'export.png');
            formData.append('replacements', JSON.stringify(replacements));
            
            response = await fetch(`${apiBase}/api/motif/${motifId}/save/`, {
                method: 'POST',
                body: formData
            });
        } else {
            // Traditional JSON Base64 approach
            const payload = {
                image_base64: data,
                replacements: replacements
            };

            response = await fetch(`${apiBase}/api/motif/${motifId}/save/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            toast.success("Berhasil disimpan!");
            // REDIR BACK TO DJANGO PEWARNAAN PAGE with Cache Busting
            setTimeout(() => {
                const timestamp = new Date().getTime();
                window.location.href = `http://${hostname}:8000/pewarnaan/?active_motif_id=${motifId}&t=${timestamp}`;
            }, 1000);
            return true;
        } else {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "Gagal menyimpan ke server");
        }

    } catch (err: any) {
        toast.error(`Simpan Gagal: ${err.message}`);
        return false;
    } finally {
        setLoading(false);
    }
  };

  if (loading && !currentImageUrl) {
      return (
          <div className="w-full h-screen flex flex-col items-center justify-center bg-[#dbdbdb]">
              <div className="w-12 h-12 border-4 border-slate-300 border-t-[#0c399b] rounded-full animate-spin mb-4"></div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Memuat Gambar Ulos...</p>
          </div>
      );
  }

  return (
    <div className="w-full h-screen bg-[#dbdbdb]">
        {currentImageUrl && (
          <LidiColoringEditor 
              imageUrl={currentImageUrl} 
              threadColors={threadColors}
              canvasWidth={dimensions.width}
              canvasHeight={dimensions.height}
              onSave={handleSave}
              motifId={motifId || ''}
              originalColors={originalColors} // <- PASSING DATA WARNA ASLI KE EDITOR
          />
        )}
    </div>
  );
}

export default function PewarnaanPage() {
  return (
    <Suspense fallback={null}>
      <PewarnaanPageContent />
    </Suspense>
  );
}