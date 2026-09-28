import { create } from 'zustand';
import { toast } from 'sonner';

export type ToolType = 'select' | 'move' | 'delete' | 'duplicate' | 'paint';
export type ViewMode = 'technical' | 'realistic';

export interface MotifElement {
  id: string;
  type: 'lidi' | 'block';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  originalColor: string;
  src: string; // Keep for fallback/reference
  vectorItems?: any[]; // For Konva.Node.create(item)
  crop?: { x: number; y: number; width: number; height: number };
  lidiType?: string;
  lidiNumber?: string; // Logical ID from urutanLidi
  unitCount?: number; // 11 for library, 15 for generated
  zPadding?: number;
  isLocked?: boolean;
  opacity?: number;
  customScale?: number;
}

interface EditorState {
  // UI State
  activeTool: ToolType;
  viewMode: ViewMode;
  canvasColor: string;
  zoom: number;
  comparisonMode: boolean;
  selectedIds: string[];
  
  // Data State
  currentMotifId: number | null;
  motifElements: MotifElement[];
  originalElements: MotifElement[]; // For co-creative comparison
  stageSize: { width: number; height: number };

  // Metrics for Research
  metricStartTime: number | null;
  editCount: number;

  // Lidi Library State
  availableMotifs: any[];
  threadColors: { code: string; hex: string }[];
  loadAvailableMotifs: (jenis?: string) => Promise<void>;
  loadThreadColors: () => Promise<void>;

  // UI/UX Actions
  setActiveTool: (tool: ToolType) => void;
  setViewMode: (mode: ViewMode) => void;
  setCanvasColor: (color: string) => void;
  setZoom: (zoom: number) => void;
  toggleComparisonMode: () => void;
  
  // Object Manipulation (Granular)
  selectElement: (id: string, multi?: boolean) => void;
  updateElement: (id: string, updates: Partial<MotifElement>) => void;
  moveElement: (id: string, x: number, y: number) => void;
  addMotifElement: (element: Partial<MotifElement>) => void;
  appendMotifFromLibrary: (motifId: string, x: number, y: number, fallbackSrc: string) => Promise<void>;
  deleteElements: (ids: string[]) => void;
  duplicateElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  recolorElements: (ids: string[], color: string, colorCode?: string) => void;
  recolorElement: (id: string, color: string, colorCode?: string) => void;
  swapSelectedMotifs: (newSrc: string) => void;
  assignLidiIndices: (elements: MotifElement[]) => MotifElement[];

  // History State
  history: { past: MotifElement[][]; future: MotifElement[][] };
  undo: () => void;
  redo: () => void;

  // Backend Actions
  loadMotif: (id: string) => Promise<void>;
  saveMotif: () => Promise<void>;
  finalizeMotif: () => Promise<void>;
  downloadPDF: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'select',
  viewMode: 'technical',
  canvasColor: '#ffffff',
  zoom: 2.0,
  comparisonMode: false,
  selectedIds: [],
  
  currentMotifId: null,
  motifElements: [],
  originalElements: [],
  stageSize: { width: 800, height: 600 }, // Default stage size
  availableMotifs: [],
  threadColors: [],
  
  metricStartTime: null,
  editCount: 0,

  history: { past: [], future: [] },

  undo: () => {
    const { history, motifElements } = get();
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    set({
      motifElements: previous,
      history: {
        past: newPast,
        future: [motifElements, ...history.future],
      },
      editCount: get().editCount + 1
    });
  },

  redo: () => {
    const { history, motifElements } = get();
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    set({
      motifElements: next,
      history: {
        past: [...history.past, motifElements],
        future: newFuture,
      },
      editCount: get().editCount + 1
    });
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCanvasColor: (color) => set({ canvasColor: color }),
  setZoom: (zoom) => set({ zoom }),
  toggleComparisonMode: () => set((state) => ({ comparisonMode: !state.comparisonMode })),

  loadAvailableMotifs: async (jenis = 'all') => {
    try {
      // 1. Load static library motifs
      const resStatic = await fetch(`http://localhost:8000/get_motifs/?jenis_ulos=${jenis}`);
      if (!resStatic.ok) throw new Error('Failed to fetch static library');
      const staticData: any[] = await resStatic.json();

      // 2. Load generated motifs from database (always)
      const resGenerated = await fetch(`http://localhost:8000/get_motifs/?jenis_ulos=editor`);
      let generatedData: any[] = [];
      if (resGenerated.ok) {
        const editorData = await resGenerated.json();
        // 'editor' returns both static + db motifs; filter only db ones (category === 'Hasil Lidi')
        generatedData = editorData.filter((m: any) => m.category === 'Hasil Lidi');
      }

      // 3. Merge with deduplication by src path
      const seenSrcs = new Set<string>(staticData.map((m: any) => m.src));
      const uniqueGenerated = generatedData.filter((m: any) => {
        if (seenSrcs.has(m.src)) return false;
        seenSrcs.add(m.src);
        return true;
      });

      set({ availableMotifs: [...staticData, ...uniqueGenerated] });
    } catch (error) {
      console.error('Library load error:', error);
    }
  },

  loadThreadColors: async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/colors/`);
      if (!res.ok) throw new Error('Failed to fetch thread colors');
      const data = await res.json();
      set({ threadColors: data });
    } catch (error) {
      console.error('Thread colors load error:', error);
    }
  },

  assignLidiIndices: (elements: MotifElement[]): MotifElement[] => {
      const hashStr = (str: string) => {
          let h = 0;
          for (let i = 0; i < str.length; i++) {
              h = (h << 5) - h + str.charCodeAt(i);
              h |= 0;
          }
          return Math.abs(h);
      };

      // 1. Group by visual identity
      const visualGroups = new Map<string, MotifElement[]>();
      elements.forEach(el => {
          const cropKey = el.crop ? `${el.crop.x}-${el.crop.y}-${el.crop.width}-${el.crop.height}` : 'no-crop';
          const visualKey = `${el.src}|${cropKey}|${el.color}`;
          if (!visualGroups.has(visualKey)) visualGroups.set(visualKey, []);
          visualGroups.get(visualKey)?.push(el);
      });

      const visualToLidiMap = new Map<string, string>();
      const usedLidis = new Set<string>();

      // 2. Map each distinct visual to a deterministic, non-sequential ID (1-8)
      visualGroups.forEach((groupEls, visualKey) => {
          // If the group already has a dominant lidiNumber (e.g. from load), keep it
          const counts: Record<string, number> = {};
          groupEls.forEach(el => {
              if (el.lidiNumber && /^[1-8]$/.test(el.lidiNumber)) {
                  counts[el.lidiNumber] = (counts[el.lidiNumber] || 0) + 1;
              }
          });
          const preferredLidi = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0];

          if (preferredLidi && !usedLidis.has(preferredLidi)) {
              visualToLidiMap.set(visualKey, preferredLidi);
              usedLidis.add(preferredLidi);
          } else {
              // Generate a non-sequential ID based on the visual key
              const seed = hashStr(visualKey);
              // Use a large prime to scramble the sequence, max 8 lidi slots
              let lidi = (seed * 13) % 8 + 1;
              
              // Ensure uniqueness among the 8 slots if possible
              let attempts = 0;
              while (usedLidis.has(lidi.toString()) && attempts < 8) {
                  lidi = (lidi % 8) + 1;
                  attempts++;
              }
              
              const finalLidi = lidi.toString();
              visualToLidiMap.set(visualKey, finalLidi);
              usedLidis.add(finalLidi);
          }
      });

      return elements.map(el => {
          const cropKey = el.crop ? `${el.crop.x}-${el.crop.y}-${el.crop.width}-${el.crop.height}` : 'no-crop';
          const visualKey = `${el.src}|${cropKey}|${el.color}`;
          return { ...el, lidiNumber: visualToLidiMap.get(visualKey) || "1" };
      });
  },

  swapSelectedMotifs: (newSrc: string) => {
    const { selectedIds, motifElements, history } = get();
    if (selectedIds.length === 0) {
      toast.error('Pilih lidi di kanvas terlebih dahulu');
      return;
    }

    const fullSrc = newSrc.startsWith('http') ? newSrc : `http://localhost:8000${newSrc}`;
    
    // 1. Calculate Bounding Box of Selected Elements
    const selectedElements = motifElements.filter(el => selectedIds.includes(el.id));
    if (selectedElements.length === 0) return;

    const minX = Math.min(...selectedElements.map(el => el.x));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
    const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
    
    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;

    // Create a temporary image to get natural dimensions
    const img = new Image();
    img.src = fullSrc;
    img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        const updatedElements = motifElements.map((el) => {
            if (selectedIds.includes(el.id)) {
                // Calculate position relative to bounding box
                const relX = el.x - minX;
                const relY = el.y - minY;
                
                // Map to image coordinates with 15-unit precision
                const cropX = (relX / totalWidth) * naturalWidth;
                const cropY = (relY / totalHeight) * naturalHeight;
                const cropWidth = (el.width / totalWidth) * naturalWidth;
                const cropHeight = (el.height / totalHeight) * naturalHeight;

                // Indexing logic for lidi ID (max 8 slots, independent of 15-unit display)
                const sliceIdx = Math.min(8, Math.max(1, Math.floor((relY / totalHeight) * 8) + 1));

                return { 
                    ...el, 
                    src: fullSrc,
                    lidiNumber: sliceIdx.toString(),
                    unitCount: 11, // Library motifs have 11 natural cycles — formula needs this to render 15 reps
                    crop: {
                        x: cropX,
                        y: cropY,
                        width: cropWidth,
                        height: cropHeight
                    }
                };
            }
            return el;
        });

        // 3. RE-INDEX sequentially (1-8) based on new structure
        const finalElements = get().assignLidiIndices(updatedElements);

        set({
            motifElements: finalElements,
            history: {
                past: [...history.past, motifElements],
                future: []
            },
            editCount: get().editCount + 1
        });

			toast.success(`${selectedIds.length} lidi digabung menjadi 1 motif`);
		};

		img.onerror = () => {
			toast.error('Gagal memuat gambar motif');
		};
  },

  selectElement: (id, multi = false) => set((state) => {
    // Basic Selection Logic: SINGLE ID Only.
    // No automatic grouping by lidiType.
    if (!id) {
        return { selectedIds: [] };
    }

    if (multi) {
      // Toggle Mode for Manual Multi-Selection
      const isAlreadySelected = state.selectedIds.includes(id);

      if (isAlreadySelected) {
        // Deselect this specific element
        return { 
          selectedIds: state.selectedIds.filter(existingId => existingId !== id) 
        };
      } else {
        // Append this specific element
        return { selectedIds: [...state.selectedIds, id] };
      }
    }
    
    // Default: Single Select (Replace Selection)
    return { selectedIds: [id] };
  }),

  updateElement: (id, updates) => set((state) => ({
    history: { past: [...state.history.past, state.motifElements], future: [] },
    motifElements: state.motifElements.map(el => el.id === id ? { ...el, ...updates } : el),
    editCount: state.editCount + 1
  })),

  moveElement: (id, x, y) => set((state) => ({
    history: { past: [...state.history.past, state.motifElements], future: [] },
    motifElements: state.motifElements.map(el => el.id === id ? { ...el, x, y } : el),
    editCount: state.editCount + 1
  })),

  addMotifElement: (element) => set((state) => {
    const newElement: MotifElement = {
      id: `motif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'lidi',
      x: element.x || 0,
      y: element.y || 0,
      width: element.width || 100,
      height: element.height || 100,
      color: element.color || 'transparent',
      originalColor: element.originalColor || 'transparent',
      src: element.src || '',
      crop: element.crop,
      lidiNumber: element.lidiNumber,
      ...element
    };
    const reindexed = get().assignLidiIndices([...state.motifElements, newElement]);
    return {
      history: { past: [...state.history.past, state.motifElements], future: [] },
      motifElements: reindexed,
      selectedIds: [newElement.id],
      editCount: state.editCount + 1
    };
  }),

  appendMotifFromLibrary: async (motifId: string, startX: number, startY: number, fallbackSrc: string) => {
      // Helper function to find best placement (auto fill empty spaces perfectly without gaps)
      const getOptimalPlacement = (state: EditorState, sX: number, sY: number) => {
          let fX = sX;
          let targetGap: { start: number; end: number } | null = null;
          let canvasHeight = state.stageSize.height || 600;

          if (state.motifElements && state.motifElements.length > 0) {
              const refElement = state.motifElements[0];
              fX = refElement.x; // Align horizontally with existing motifs

              const intervals = state.motifElements
                  .map(m => ({ start: m.y, end: m.y + m.height }))
                  .sort((a, b) => a.start - b.start);

              const merged: {start: number; end: number}[] = [];
              if (intervals.length > 0) {
                  let current = { ...intervals[0] };
                  for (let i = 1; i < intervals.length; i++) {
                      if (intervals[i].start <= current.end + 0.5) { // 0.5px tolerance
                          current.end = Math.max(current.end, intervals[i].end);
                      } else {
                          merged.push(current);
                          current = { ...intervals[i] };
                      }
                  }
                  merged.push(current);
              }

              const gaps: {start: number; end: number}[] = [];
              let curY = 0;
              merged.forEach(interval => {
                  if (interval.start - curY > 1) { // gap larger than 1px
                      gaps.push({ start: curY, end: interval.start });
                  }
                  curY = Math.max(curY, interval.end);
              });
              if (canvasHeight - curY > 1) {
                  gaps.push({ start: curY, end: canvasHeight });
              }

              if (gaps.length > 0) {
                  targetGap = gaps.find(g => sY >= g.start && sY <= g.end) || null;
                  if (!targetGap) {
                      targetGap = gaps.reduce((prev, curr) => {
                          const distPrev = Math.min(Math.abs(sY - prev.start), Math.abs(sY - prev.end));
                          const distCurr = Math.min(Math.abs(sY - curr.start), Math.abs(sY - curr.end));
                          return distCurr < distPrev ? curr : prev;
                      });
                  }
              }
          } else {
              targetGap = { start: 0, end: canvasHeight };
          }
          return { finalX: fX, targetGap };
      };

      try {
          const res = await fetch(`http://localhost:8000/api/motif/${motifId}/load/`);
          if (!res.ok) throw new Error('Failed to load motif data');
          const data = await res.json();
          
          if (!data.motifs || data.motifs.length === 0) throw new Error('No motif data');

          // Find bounding box of the incoming motif to center it at target x,y
          const minX = Math.min(...data.motifs.map((m: any) => m.x));
          const minY = Math.min(...data.motifs.map((m: any) => m.y));
          const maxX = Math.max(...data.motifs.map((m: any) => m.x + (m.width || 0)));
          const maxY = Math.max(...data.motifs.map((m: any) => m.y + (m.height || 0)));
          
          const incomingWidth = maxX - minX;
          const incomingHeight = maxY - minY;

          const state = get();
          const { finalX, targetGap } = getOptimalPlacement(state, startX, startY);

          // Calculate scaling to perfectly fit the gap
          let fY = startY;
          let scaleY = 1;
          let scaleX = 1;

          if (state.motifElements && state.motifElements.length > 0) {
              scaleX = state.motifElements[0].width / (incomingWidth || 1);
          }

          if (targetGap) {
              fY = targetGap.start;
              scaleY = (targetGap.end - targetGap.start) / (incomingHeight || 1);
          }

          const newElements: MotifElement[] = data.motifs.map((m: any) => ({
              ...m,
              id: `${m.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              // Position and scale perfectly to fill the gap
              x: finalX + ((m.x - minX) * scaleX),
              y: fY + ((m.y - minY) * scaleY),
              width: (m.width || 0) * scaleX,
              height: (m.height || 0) * scaleY,
              src: (m.src && (m.src.startsWith('http') || m.src.startsWith('data:'))) 
                  ? m.src 
                  : (m.src ? `http://localhost:8000${m.src.startsWith('/') ? '' : '/'}${m.src}` : fallbackSrc),
          }));

          set((state) => ({
              history: { past: [...state.history.past, state.motifElements], future: [] },
              motifElements: [...state.motifElements, ...newElements],
              selectedIds: newElements.map(el => el.id),
              editCount: state.editCount + 1
          }));

          toast.success('Motif berhasil ditambahkan dan disesuaikan mengisi penuh area yang kosong');
      } catch (error) {
          console.warn('Backend load failed, falling back to auto-sliced static drop:', error);
          
          // Create an Image element to get natural Width/Height and auto-slice into lidis
          const img = new Image();
          img.onload = () => {
              const state = get();
              
              // 1. Match the dimensions of the existing canvas motifs
              let targetWidth = img.naturalWidth || 100;
              if (state.motifElements && state.motifElements.length > 0) {
                  targetWidth = state.motifElements[0].width;
              } else {
                  targetWidth = 150;
              }

              const { finalX, targetGap } = getOptimalPlacement(state, startX, startY);

              let finalY = startY;
              let targetHeight = (targetWidth / (img.naturalWidth || 1)) * (img.naturalHeight || 1);

              if (targetGap) {
                  finalY = targetGap.start;
                  targetHeight = targetGap.end - targetGap.start;
              }

              // 2. Auto-slice the library image into 15 structural lidi layers (15-Lidi Standard)
              const numSegments = 15;
              const segmentHeight = targetHeight / numSegments;
              const cropHeight = (img.naturalHeight || 100) / numSegments;
              const newElements: MotifElement[] = [];

              for (let i = 0; i < numSegments; i++) {
                  // Use precise calculations to prevent 1px gap visual glitches
                  const exactCropY = Math.floor(i * cropHeight);
                  const exactCropHeight = Math.floor((i + 1) * cropHeight) - exactCropY;
                  
                  newElements.push({
                      id: `motif-autoslice-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                      type: 'lidi',
                      src: fallbackSrc,
                      x: finalX,
                      y: Math.round(finalY + (i * segmentHeight)),
                      width: targetWidth,
                      height: segmentHeight,
                      crop: {
                          x: 0,
                          y: exactCropY,
                          width: img.naturalWidth || 100, // Full image width (11 natural cycles)
                          height: exactCropHeight
                      },
                      lidiNumber: `${motifId}_${i + 1}`,
                      // unitCount: 15 for generated (numeric ID), 11 for static library images
                      unitCount: /^\d+$/.test(motifId) ? 15 : 11,
                      color: 'transparent',
                      originalColor: 'transparent'
                  });
              }

              // Apply the new sliced elements to the state
              const currentState = get();
              const finalElements = get().assignLidiIndices([...currentState.motifElements, ...newElements]);
              set({
                  history: { past: [...currentState.history.past, currentState.motifElements], future: [] },
                  motifElements: finalElements,
                  selectedIds: newElements.map(el => el.id),
                  editCount: currentState.editCount + 1
              });
              
              toast.success('Motif berhasil otomatis mengisi bagian yang kosong');
          };
          img.onerror = () => {
              get().addMotifElement({
                  src: fallbackSrc,
                  x: startX,
                  y: startY,
                  width: 100,
                  height: 100,
                  lidiNumber: motifId
              });
              toast.success('Gambar ditambahkan ke kanvas (mode dasar)');
          };
          img.src = fallbackSrc;
      }
  },

  deleteElements: (ids: string[]) => set((state) => ({
    history: { past: [...state.history.past, state.motifElements], future: [] },
    motifElements: state.motifElements.filter(el => !ids.includes(el.id)),
    selectedIds: state.selectedIds.filter((id: string) => !ids.includes(id)),
    editCount: state.editCount + 1
  })),

  duplicateElements: (ids: string[]) => set((state) => {
    const newElements = ids.map((id: string) => {
      const el = state.motifElements.find(e => e.id === id);
      if (!el) return null;
      return { ...el, id: `${el.id}-copy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, y: el.y + el.height };
    }).filter(Boolean) as MotifElement[];

    if (newElements.length === 0) return state;

    const updatedElements = [...state.motifElements, ...newElements];
    const reindexed = get().assignLidiIndices(updatedElements);

    return {
      history: { past: [...state.history.past, state.motifElements], future: [] },
      motifElements: reindexed,
      selectedIds: newElements.map(el => el.id),
      editCount: state.editCount + 1
    };
  }),

  duplicateElement: (id) => get().duplicateElements([id]),

  recolorElements: (ids: string[], color: string) => set((state) => {
    const updated = state.motifElements.map(el => ids.includes(el.id) ? { ...el, color, lidiNumber: undefined } : el);
    const reindexed = get().assignLidiIndices(updated);
    return {
        history: { past: [...state.history.past, state.motifElements], future: [] },
        motifElements: reindexed,
        editCount: state.editCount + 1
    };
  }),

  recolorElement: (id, color) => get().recolorElements([id], color),

  loadMotif: async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/motif/${id}/load/`);
      if (!res.ok) throw new Error('Failed to load motif data');
      const data = await res.json();
      
      const elements: MotifElement[] = data.motifs.map((m: any) => ({
        ...m,
        src: (m.src.startsWith('http') || m.src.startsWith('data:')) 
             ? m.src 
             : `http://localhost:8000${m.src.startsWith('/') ? '' : '/'}${m.src}`,
        unitCount: m.unitCount || 15, // Preserve saved unitCount (11=library, 15=generated); default 15
      }));

      // Sync slots to ensure visual consistency but respect the loaded lidiNumbers
      const synced = get().assignLidiIndices(elements);

      set({ 
        currentMotifId: parseInt(id),
        motifElements: synced,
        originalElements: JSON.parse(JSON.stringify(synced)),
        stageSize: { 
          width: data.canvasWidth || elements[0]?.width || 800, 
          height: data.canvasHeight || elements[0]?.height || 600 
        },
        metricStartTime: Date.now(),
        editCount: 0,
        history: { past: [], future: [] },
        selectedIds: [] // Clear selection on load
      });
      
      toast.success('Gambar hasil generate berhasil dimuat sebagai lidi terpisah');
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Gagal mengambil gambar hasil generate');
    }
  },

  saveMotif: async () => {
    const state = get();
    try {
      const res = await fetch(`http://localhost:8000/api/motif/${state.currentMotifId}/save/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Force rounding of all coordinates and dimensions for pixel-perfect alignment
          motifs: state.motifElements.map(el => ({
            ...el,
            x: Math.round(el.x),
            y: Math.round(el.y),
            width: Math.round(el.width),
            height: Math.round(el.height)
          })),
          metrics: {
            duration: Date.now() - (state.metricStartTime || 0),
            edits: state.editCount
          }
        })
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      toast.success('Motif berhasil disimpan. Menyegarkan data...');
      
      // Use postMessage for cross-origin safe communication with parent (Django on port 8000)
      setTimeout(() => {
        if (window.self !== window.top) {
          window.parent.postMessage('REFRESH_PARENT', '*');
        } else {
          // Fallback for standalone mode
          window.location.href = `http://localhost:8000/motif/${state.currentMotifId}/`;
        }
      }, 1500);
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Gagal menyimpan hasil ko-kreasi');
    }
  },

  finalizeMotif: async () => {
    const state = get();
    toast.loading('Melakukan finalisasi lidi untuk produksi...');
    try {
      const res = await fetch(`http://localhost:8000/api/motif/${state.currentMotifId}/finalize/`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Finalization failed');
      toast.success('Motif siap ditenun! Unit lidi telah dikunci & diekspor.');
    } catch (error) {
      toast.error('Gagal melakukan finalisasi produksi');
    }
  },

  downloadPDF: () => {
    const state = get();
    if (!state.currentMotifId) {
      toast.error('Penyimpanan motif diperlukan sebelum mencetak.');
      return;
    }
    window.open(`http://localhost:8000/generate-pdf/?id=${state.currentMotifId}`, '_blank');
  }
}));
