"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import {
  Save,
  Trash2,
  Layers,
  SlidersHorizontal,
  Pipette,
  Undo2,

  Redo2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Footer from "../editor/Footer";

export interface ThreadColor {
  code: string;
  hex: string;
}

export interface ColorReplacement {
  targetRGB: { r: number; g: number; b: number };
  replaceRGB: { r: number; g: number; b: number };
  replaceCode?: string;
}

interface UlosPaletteEditorProps {
  imageUrl: string;
  threadColors: ThreadColor[];
  canvasWidth?: number;
  canvasHeight?: number;
  motifId?: string;
  originalColors?: string[];
  onSave?: (
    data: string | Blob,
    replacements: Record<string, string>,
  ) => Promise<boolean>;

}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const MultiColorShift = function (this: any, imageData: ImageData) {
  const data = imageData.data;
  const replacements: ColorReplacement[] =
    (this as any).getAttr("colorReplacements") || [];

  if (!replacements.length) return;
  const tolerance = 40;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    for (let j = 0; j < replacements.length; j++) {
      const { targetRGB, replaceRGB } = replacements[j];

      if (
        Math.abs(r - targetRGB.r) < tolerance &&
        Math.abs(g - targetRGB.g) < tolerance &&
        Math.abs(b - targetRGB.b) < tolerance
      ) {
        const currentLum = 0.299 * r + 0.587 * g + 0.114 * b;
        const targetLum =
          0.299 * targetRGB.r + 0.587 * targetRGB.g + 0.114 * targetRGB.b || 1;
        const ratio = currentLum / targetLum;

        data[i] = Math.min(255, replaceRGB.r * ratio);
        data[i + 1] = Math.min(255, replaceRGB.g * ratio);
        data[i + 2] = Math.min(255, replaceRGB.b * ratio);
        break;
      }
    }
  }
};

if (typeof window !== "undefined") {
  (Konva.Filters as any).MultiColorShift = MultiColorShift;
}

const LidiColoringEditor: React.FC<UlosPaletteEditorProps> = ({
  imageUrl,
  threadColors = [],
  onSave,
  originalColors = [],
  motifId,
}) => {
  const [image] = useImage(imageUrl, "anonymous");

  const [activeThread, setActiveThread] = useState<ThreadColor | null>(null);
  const [sourceColorIndex, setSourceColorIndex] = useState<number | null>(null);
  const [backgroundColorIndex, setBackgroundColorIndex] = useState<
    number | null
  >(null);

  const [history, setHistory] = useState<ColorReplacement[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<"properti" | "lapisan">(
    "properti",
  );
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentColorReplacements = history[historyStep] || [];

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (containerRef.current && image) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      setStagePos({
        x: (offsetWidth - image.width * zoom) / 2,
        y: Math.max(20, (offsetHeight - image.height * zoom) / 2),
      });
    }
  }, [image, zoom, stageSize]);

  useEffect(() => {
    if (!image || originalColors.length === 0) return;

    const detectBg = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scale = 0.1;
      canvas.width = Math.max(1, image.width * scale);
      canvas.height = Math.max(1, image.height * scale);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        const colorCounts: Record<string, number> = {};

        for (let i = 0; i < imageData.length; i += 4) {
          if (imageData[i + 3] < 128) continue;
          const r = Math.round(imageData[i] / 5) * 5;
          const g = Math.round(imageData[i + 1] / 5) * 5;
          const b = Math.round(imageData[i + 2] / 5) * 5;
          const rgb = `${r},${g},${b}`;
          colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
        }

        let maxCount = 0;
        let mostFrequentRGB = "";
        for (const rgb in colorCounts) {
          if (colorCounts[rgb] > maxCount) {
            maxCount = colorCounts[rgb];
            mostFrequentRGB = rgb;
          }
        }

        if (mostFrequentRGB) {
          const [r, g, b] = mostFrequentRGB.split(",").map(Number);
          let bestIndex = -1;
          let minDiff = 10000;

          originalColors.forEach((code, idx) => {
            const thread = threadColors.find(
              (t) => String(t.code) === String(code),
            );
            if (thread) {
              const target = hexToRgb(thread.hex);
              const diff = Math.sqrt(
                Math.pow(r - target.r, 2) +
                  Math.pow(g - target.g, 2) +
                  Math.pow(b - target.b, 2),
              );
              if (diff < minDiff) {
                minDiff = diff;
                bestIndex = idx;
              }
            }
          });
          setBackgroundColorIndex(bestIndex);
        }
      } catch (e) {
        console.error("BG Detection failed", e);
      }
    };

    detectBg();
  }, [image, originalColors, threadColors]);

  useEffect(() => {
    if (image && imageRef.current) {
      imageRef.current.cache();
      imageRef.current.setAttr("colorReplacements", currentColorReplacements);
      imageRef.current.filters([(Konva.Filters as any).MultiColorShift]);
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [image, currentColorReplacements]);

  const applyColorSwap = (origIndex: number, newThread: ThreadColor) => {
    const originalCode = originalColors[origIndex];
    const originalThread = threadColors.find(
      (t) => String(t.code) === String(originalCode),
    );
    if (!originalThread) return;

    const targetRGB = hexToRgb(originalThread.hex);
    const replaceRGB = hexToRgb(newThread.hex);

    const filtered = currentColorReplacements.filter(
      (p) =>
        Math.abs(p.targetRGB.r - targetRGB.r) > 5 ||
        Math.abs(p.targetRGB.g - targetRGB.g) > 5 ||
        Math.abs(p.targetRGB.b - targetRGB.b) > 5,
    );

    const newState = [
      ...filtered,
      {
        targetRGB,
        replaceRGB,
        replaceCode: newThread.code,
      },
    ];

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);

    toast.success(`Warna ${originalCode} diganti ke ${newThread.code}!`);
  };

  const handleImageClick = (e: any) => {
    if (!image) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const canvas = stage.toCanvas({ pixelRatio: 1 });
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    if (pixel[3] < 50) return;

    const clickedRGB = { r: pixel[0], g: pixel[1], b: pixel[2] };

    const foundIndex = originalColors.findIndex((code) => {
      const thread = threadColors.find((t) => String(t.code) === String(code));
      if (!thread) return false;
      const rgb = hexToRgb(thread.hex);
      return (
        Math.abs(rgb.r - clickedRGB.r) < 15 &&
        Math.abs(rgb.g - clickedRGB.g) < 15 &&
        Math.abs(rgb.b - clickedRGB.b) < 15
      );
    });

    if (foundIndex !== -1) {
      if (activeThread) {
        // Scenario B: Palette previously selected -> Replace Ulos color
        applyColorSwap(foundIndex, activeThread);
        setActiveThread(null);
      } else {
        // Scenario A: First step -> Select source color
        setSourceColorIndex(foundIndex);
        toast.info(`Warna terpilih: ${originalColors[foundIndex]}`);
      }
    }
  };

  const handleLeftPaletteClick = (index: number) => {
    if (activeThread) {
      applyColorSwap(index, activeThread);
      setActiveThread(null);
    } else {
      setSourceColorIndex(index === sourceColorIndex ? null : index);
    }
  };

  const handleRightPaletteClick = (thread: ThreadColor) => {
    if (sourceColorIndex !== null) {
      // Scenario A: Ulos color previously selected -> Replace with this thread
      applyColorSwap(sourceColorIndex, thread);
      setSourceColorIndex(null);
    } else {
      // Prepare Scenario B: Select this thread to apply to Ulos next
      setActiveThread(thread === activeThread ? null : thread);
      if (thread !== activeThread) {
        toast.info(`Benang terpilih: ${thread.code}`);
      }
    }
  };

  const getCurrentColorHex = (originalCode: string) => {
    const thread = threadColors.find(
      (t) => String(t.code) === String(originalCode),
    );
    if (!thread) return "#cccccc";

    const originalRGB = hexToRgb(thread.hex);
    const replacement = currentColorReplacements.find(
      (p) =>
        Math.abs(p.targetRGB.r - originalRGB.r) < 10 &&
        Math.abs(p.targetRGB.g - originalRGB.g) < 10 &&
        Math.abs(p.targetRGB.b - originalRGB.b) < 10,
    );

    if (replacement) {
      const { r, g, b } = replacement.replaceRGB;
      return `rgb(${r}, ${g}, ${b})`;
    }
    return thread.hex;
  };

  const handleUndo = () => {
    if (historyStep > 0) setHistoryStep(historyStep - 1);
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) setHistoryStep(historyStep + 1);
  };

  const handleResetColors = () => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    toast.success("Warna dikembalikan ke asli.");
  };

  const handleSaveInternal = async () => {
    if (isSaving || !onSave || !imageRef.current) return;
    setIsSaving(true);

    try {
      const imgNode = imageRef.current;

      // --- 1. SELECTIVE HD CACHE (Offscreen Process) ---
      // We explicitly increase resolution ONLY for export to 4x
      // This ensures results are Ultra-HD (Stitcher requirement)
      // while keeping the active editor at 1x for 60FPS performance.
      imgNode.cache({ pixelRatio: 4 });

      // --- 2. BLOB-BASED EXPORT (Memory Efficient) ---
      // Blob uses 33% less RAM than Base64 (DataURL)
      // and prevents browser 'Failed to Fetch' on large payloads.
      const blobPromise = new Promise<Blob | null>((resolve) => {
          imgNode.toBlob({
              pixelRatio: 4,
              callback: (blob: Blob | null) => resolve(blob),
              mimeType: "image/png",
              quality: 1,
          });
      });

      let blob = await blobPromise;

      if (!blob) {
          throw new Error("Gagal mengambil data canvas (Blob error)");
      }

      const replacementsMap: Record<string, string> = {};
      originalColors.forEach((code) => {
        const thread = threadColors.find(
          (t) => String(t.code) === String(code),
        );
        if (thread) {
          const originalRGB = hexToRgb(thread.hex);
          const found = currentColorReplacements.find(
            (p) =>
              Math.abs(p.targetRGB.r - originalRGB.r) < 10 &&
              Math.abs(p.targetRGB.g - originalRGB.g) < 10 &&
              Math.abs(p.targetRGB.b - originalRGB.b) < 10,
          );
          if (found) {
            replacementsMap[code] = found.replaceCode || "";
          }
        }
      });

      // --- 3. ATOMIC SAVE CALL ---
      const success = await onSave(blob, replacementsMap);
      
      if (success) {
          toast.success("Desain HD Berhasil Disimpan!");
      }

      // --- 4. GARBAGE COLLECTION & DISPOSAL ---
      // Return resolution to normal for editing performance
      imgNode.cache({ pixelRatio: 1 });
      
      // Clear large object reference manually to trigger GC
      blob = null;

    } catch (err: any) {
      toast.error("Gagal simpan HD: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };


  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    setZoom(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] select-none font-sans text-slate-800 overflow-x-hidden">
      {isGenerating && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center flex-col">
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-gray-800">
                Menyiapkan Lembar Kerja
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Sedang merender tekstur dan dokumen teknis...
              </p>
            </div>
          </div>
        </div>
      )}

      {isSaving && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center flex-col">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xl font-bold text-gray-800">
              Menyimpan Hasil...
            </div>
          </div>
        </div>
      )}

      {/* Premium Header - Synchronized with Motif Editor */}
      <header className="h-20 bg-[#002ba3] flex items-center justify-between px-8 text-white z-[100] flex-shrink-0 shadow-lg sticky top-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <img 
               src="/NewTitle.png" 
               alt="Logo" 
               width={48} 
               height={48} 
               className="object-contain" 
            />
            <div className="flex flex-col text-white">
                <span className="font-bold text-[1.45rem] leading-[0.9] tracking-tight">Modul</span>
                <span className="font-bold text-[1.45rem] leading-[1.1] tracking-tight">Lidi</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg ml-2 shadow-inner border border-white/10">
            <button
              onClick={handleUndo}
              disabled={historyStep === 0}
              className="p-2 hover:bg-white/20 rounded-md transition-all text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="Undo"
            >
              <Undo2 size={20} color="white" strokeWidth={2.5} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyStep === history.length - 1}
              className="p-2 hover:bg-white/20 rounded-md transition-all text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="Redo"
            >
              <Redo2 size={20} color="white" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSaveInternal}
            disabled={isSaving || isGenerating}
            className="flex items-center gap-2.5 px-4 py-2 text-sm font-bold text-white bg-transparent border-2 border-white hover:bg-white/10 rounded-md shadow-md transition-all active:scale-95"
          >
            <Save size={18} /> Simpan
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[60px] bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-3 z-50">
          <button
            title="Alat Pewarnaan"
            className={`p-3 rounded-lg transition-colors ${activeThread || sourceColorIndex !== null ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100" : "bg-gray-50 text-blue-600 border border-blue-100"}`}
            onClick={() => {
              setActiveThread(null);
              setSourceColorIndex(null);
            }}
          >
            <Pipette size={22} />
          </button>

          <button
            onClick={handleResetColors}
            className="p-3 mt-auto mb-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={22} />
          </button>
        </aside>

        <main
          ref={containerRef}
          className="flex-1 relative bg-[#f0f2f5] overflow-hidden h-[calc(100vh-80px)]"
        >
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            ref={stageRef}
            draggable
            onWheel={handleWheel}
            scaleX={zoom}
            scaleY={zoom}
            x={stagePos.x}
            y={stagePos.y}
            onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
          >
            <Layer>
              {image && (
                <KonvaImage
                  ref={imageRef}
                  image={image}
                  x={0}
                  y={0}
                  width={image.width}
                  height={image.height}
                  onClick={handleImageClick}
                  onTap={handleImageClick}
                />
              )}
            </Layer>
          </Stage>
        </main>

        <aside className="w-[350px] bg-white border-l border-gray-200 flex flex-col z-[40] h-[calc(100vh-80px)]">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("properti")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[13px] font-semibold transition-colors ${activeTab === "properti" ? "text-gray-800 border-b-2 border-[#3251c8] bg-gray-50/50" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <SlidersHorizontal size={16} /> Properti
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div>
              <h4 className="text-[13px] font-semibold text-gray-800 mb-1 text-center">
                Warna Yang Digunakan
              </h4>
              <p className="text-[10px] text-gray-400 text-center mb-4 leading-relaxed">
                Warna yang dihasilkan dari pewarnaan AI sebelumnya. Warna akan
                berubah sesuai dengan warna baru yang telah anda pilih.
              </p>

              <div className="flex justify-center flex-wrap gap-3 mt-4">
                {originalColors.map((code, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleLeftPaletteClick(i)}
                      className={`relative w-12 h-12 rounded-lg transition-all ${sourceColorIndex === i ? "ring-4 ring-blue-500" : "border border-gray-200"}`}
                      style={{
                        backgroundColor: getCurrentColorHex(String(code)),
                      }}
                    >
                      {backgroundColorIndex === i && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase">
                          Dasar
                        </div>
                      )}
                    </button>
                    <span className="text-[8px] font-mono text-gray-400">
                      {code}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h4 className="text-[13px] font-semibold text-gray-800 mb-4 text-center">
                Palet Benang
              </h4>
              <div className="grid grid-cols-6 gap-2">
                {threadColors.map((tc) => (
                  <button
                    key={tc.code}
                    onClick={() => handleRightPaletteClick(tc)}
                    className={`w-full aspect-square rounded transition-all ${activeThread?.code === tc.code ? "ring-2 ring-blue-500 scale-110 shadow-md" : "border border-gray-200 hover:scale-105"}`}
                    style={{ backgroundColor: tc.hex }}
                    title={tc.code}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-10 px-4">
              Pilih warna di atas, lalu klik benang/motif di kanvas untuk
              mengganti warnanya.
            </p>
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
};

export default LidiColoringEditor;
