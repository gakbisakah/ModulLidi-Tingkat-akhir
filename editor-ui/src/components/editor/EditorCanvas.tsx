"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Group, Text, Path, Transformer } from 'react-konva';
import useImage from 'use-image';
import { useEditorStore, MotifElement } from '@/store/useEditorStore';

// Individual Motif Element Component
const MotifObject = ({ 
  element, 
  isSelected, 
  onSelect, 
  onDragEnd, 
  activeTool 
}: { 
  element: MotifElement; 
  isSelected: boolean; 
  onSelect: (multi: boolean) => void;
  onDragEnd: (x: number, y: number) => void;
  activeTool: string;
}) => {
  const [img] = useImage(element.src);
  const groupRef = useRef<any>(null);

  return (
    <Group
      x={element.x}
      y={element.y}
      draggable={activeTool === 'select' || activeTool === 'move'}
      ref={groupRef}
      listening={element.isLocked ? false : true}
      onDragEnd={(e) => {
        onDragEnd(e.target.x(), e.target.y());
      }}
    >
      {/* CONTENT GROUP: This is what the Transformer will target */}
      <Group 
        id={element.id}
        onClick={(e) => {
          const evt = e.evt as MouseEvent;
          const isMulti = evt.shiftKey || evt.ctrlKey || evt.metaKey;
          onSelect(isMulti);
          e.cancelBubble = true;
        }}
        onTap={(e) => {
          const evt = e.evt as MouseEvent;
          const isMulti = evt.shiftKey || evt.ctrlKey || evt.metaKey;
          onSelect(isMulti);
          e.cancelBubble = true;
        }}
      >
        {/* Hit Area */}
        <Rect
          width={element.width}
          height={element.height}
          fill="rgba(0,0,0,0)"
          listening={true}
        />

        {/* Visual Content */}
        {element.vectorItems && element.vectorItems.length > 0 ? (
            element.vectorItems.map((item, idx) => {
                if (item.className === 'Path') {
                    const strokeColor = element.color !== 'transparent' ? element.color : (item.attrs.stroke || 'black');
                    return (
                        <Path
                            key={`${element.id}-v-${idx}`}
                            {...item.attrs}
                            stroke={strokeColor}
                            listening={false}
                        />
                    );
                }
                return null;
            })
        ) : (
            img && (
              <Rect
                fillPatternImage={img}
                width={element.width + 0.5} // Small epsilon to prevent microscopic white gaps at the edge
                height={element.height}
                fillPatternScale={{
                    // Scale so that 1 unit of the source image fills 1/15 of element.width
                    // All motifs (library + generated) now use 15-unit standard (unitCount=15)
                    x: ((element.width / 15) / ((element.crop?.width || img.width) / (element.unitCount || 15))) * (element.customScale || 1.0), 
                    y: element.height / (element.crop?.height || img.height)
                }}
                fillPatternOffset={{
                    x: element.crop?.x || 0,
                    y: element.crop?.y || 0
                }}
                fillPatternRepeat="repeat-x"
                imageSmoothingEnabled={false}
                perfectDrawEnabled={true}
                listening={false}
              />
            )
        )}

        {/* Recolor Overlay */}
        {(!element.vectorItems || element.vectorItems.length === 0) && element.color !== 'transparent' && (
          <Rect
              width={element.width}
              height={element.height}
              fill={element.color}
              globalCompositeOperation="multiply"
              listening={false}
          />
        )}
      </Group>

      {/* OVERLAY: Rendered outside the ID'ed group so Transformer ignores its dimensions */}
      {isSelected && (
        <Group x={-(element.id.length * 6 + 24)} y={element.height / 2 - 8} listening={false}>
            <Rect 
                width={element.id.length * 6 + 14} 
                height={16} 
                fill="#0f172a" 
                cornerRadius={4}
            />
            <Text
                text={element.id.toUpperCase()}
                fontSize={9}
                fill="#f8fafc"
                padding={4}
                fontFamily="JetBrains Mono, Menlo, monospace"
                fontStyle="bold"
            />
        </Group>
      )}
    </Group>
  );
};

export default function EditorCanvas() {
  const { 
    motifElements, selectedIds, selectElement, 
    moveElement, activeTool, canvasColor, 
    zoom, setZoom, comparisonMode, originalElements,
    stageSize
  } = useEditorStore();

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  // Handle Multi-selection Transfomer
  useEffect(() => {
    if (transformerRef.current) {
        const nodes = selectedIds
            .map(id => stageRef.current.findOne('#' + id))
            .filter(Boolean);
        transformerRef.current.nodes(nodes);
        transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedIds]);

  // Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (like search)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          useEditorStore.getState().deleteElements(selectedIds);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]);

  return (
    <div 
      className="flex-1 bg-[#F8FAFC] overflow-auto relative custom-scrollbar"
      onDragOver={(e) => {
          e.preventDefault(); // allow drop
      }}
      onDrop={(e) => {
          e.preventDefault();
          
          const dataText = e.dataTransfer.getData('text/plain');
          if (!dataText) return;

          try {
              const parsed = JSON.parse(dataText);
              if (parsed.type === 'new-motif') {
                  // Ensure the stage drop area triggers this by registering event correctly
                  if (stageRef.current) {
                      stageRef.current.setPointersPositions(e);
                  }
                  
                  // Use konva pointer position to place it exactly where mouse is
                  let pointerPos = stageRef.current?.getPointerPosition();
                  
                  // Fallback if Konva doesn't know pointer pos yet or if dropped outside stage
                  if (!pointerPos) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      pointerPos = {
                          x: (e.clientX - rect.left) / zoom,
                          y: (e.clientY - rect.top) / zoom
                      };
                  }

                  // Load the full motif structure from backend instead of just an image element
                  useEditorStore.getState().appendMotifFromLibrary(parsed.id, pointerPos.x, pointerPos.y, parsed.src);
              }
          } catch (err) {
              console.error("Invalid drop data", err);
          }
      }}
    >
      

      {/* Canvas Controls */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-full border border-slate-200 p-1.5 flex gap-1">
        <button onClick={() => setZoom(zoom - 0.1)} className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-700 hover:scale-110 active:scale-95">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <div className="px-5 py-2 text-[12px] font-black text-slate-800 flex items-center min-w-[70px] justify-center tracking-tighter">{Math.round(zoom * 100)}%</div>
        <button onClick={() => setZoom(zoom + 0.1)} className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-700 hover:scale-110 active:scale-95">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {/* Centering Wrapper */}
      <div className="min-h-full min-w-full flex items-center justify-center p-40">
        {/* Interactive Ko-Kreatif Canvas (Konva) */}
        <div 
            className="shadow-[0_60px_150px_rgba(0,0,0,0.2)] bg-white border border-slate-300 origin-center transition-all" 
            style={{ 
                transform: `scale(${zoom})`, 
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                width: stageSize.width,
                height: stageSize.height,
                imageRendering: 'pixelated', // Crucial for HD Geometric patterns
            }}
        >
            <Stage 
            width={stageSize.width} 
            height={stageSize.height} 
            ref={stageRef}
            pixelRatio={(window.devicePixelRatio || 1) * zoom} // Use native pixel ratio * zoom for crispness
            style={{ 
                backgroundColor: canvasColor,
                imageRendering: 'pixelated'
            }}
            onMouseDown={(e) => {
                // Deselect when clicking on empty stage
                if (e.target === e.target.getStage()) {
                selectElement('', false);
                }
            }}
            >
            <Layer>
                {/* Background / Fabric Layer */}
                <Rect width={stageSize.width} height={stageSize.height} fill={canvasColor} listening={false} />

                {/* Elements Layer */}
                {motifElements.map((el) => (
                <MotifObject
                    key={el.id}
                    element={el}
                    activeTool={activeTool}
                    isSelected={selectedIds.includes(el.id)}
                    onSelect={(multi) => selectElement(el.id, multi)}
                    onDragEnd={(x, y) => moveElement(el.id, x, y)}
                />
                ))}
            </Layer>

            <Layer>
                {/* Transformer Layer - Keep in regular Layer for better interaction logic */}
                <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                borderStroke="#3b82f6"
                borderStrokeWidth={2}
                anchorFill="#ffffff"
                anchorStroke="#3b82f6"
                anchorSize={8}
                anchorCornerRadius={2}
                boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) return oldBox;
                    return newBox;
                }}
                enabledAnchors={activeTool === 'select' ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : []}
                />
            </Layer>
            </Stage>
        </div>
      </div>

      {/* Human-in-the-Loop Comparison Overlay */}
      {comparisonMode && (
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 divide-x-4 divide-blue-500/50">
          <div className="bg-slate-900/10 flex flex-col items-center justify-center">
            <span className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase mb-4">AI Suggestion (Original)</span>
          </div>
          <div className="flex flex-col items-center justify-center">
             <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase mb-4">Your Decision (Edited)</span>
          </div>
        </div>
      )}
    </div>
  );
}
