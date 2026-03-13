import { useRef, useState, useCallback, useEffect } from 'react';
import { ImageAnnotation, usePdfStore } from '../store/pdfStore';

interface DraggableImageProps {
  image: ImageAnnotation;
  getScale: () => number;
}

export function DraggableImage({ image, getScale }: DraggableImageProps) {
  const { updateImage } = usePdfStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; imgX: number; imgY: number } | null>(null);
  const resizeStartRef = useRef<{ clientX: number; clientY: number; width: number; height: number; imgX: number; imgY: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Обработчик для глобальных событий мыши
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const scale = getScale();
    
    if (isDragging && dragStartRef.current) {
      // Конвертируем координаты мыши в координаты канваса
      const dx = (e.clientX - dragStartRef.current.clientX) / scale;
      const dy = (e.clientY - dragStartRef.current.clientY) / scale;

      updateImage(image.id, {
        x: dragStartRef.current.imgX + dx,
        y: dragStartRef.current.imgY + dy,
      });
    }

    if (isResizing && resizeStartRef.current) {
      const dx = (e.clientX - resizeStartRef.current.clientX) / scale;
      const dy = (e.clientY - resizeStartRef.current.clientY) / scale;

      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;
      let newX = resizeStartRef.current.imgX;
      let newY = resizeStartRef.current.imgY;

      if (isResizing === 'se') {
        newWidth = Math.max(50, resizeStartRef.current.width + dx);
        newHeight = Math.max(50, resizeStartRef.current.height + dy);
      } else if (isResizing === 'sw') {
        const widthChange = Math.min(dx, resizeStartRef.current.width - 50);
        newWidth = resizeStartRef.current.width - widthChange;
        newX = resizeStartRef.current.imgX + widthChange;
        newHeight = Math.max(50, resizeStartRef.current.height + dy);
      } else if (isResizing === 'ne') {
        newWidth = Math.max(50, resizeStartRef.current.width + dx);
        const heightChange = Math.min(dy, resizeStartRef.current.height - 50);
        newHeight = resizeStartRef.current.height - heightChange;
        newY = resizeStartRef.current.imgY + heightChange;
      } else if (isResizing === 'nw') {
        const widthChange = Math.min(dx, resizeStartRef.current.width - 50);
        const heightChange = Math.min(dy, resizeStartRef.current.height - 50);
        newWidth = resizeStartRef.current.width - widthChange;
        newHeight = resizeStartRef.current.height - heightChange;
        newX = resizeStartRef.current.imgX + widthChange;
        newY = resizeStartRef.current.imgY + heightChange;
      }

      updateImage(image.id, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }
  }, [isDragging, isResizing, image.id, getScale, updateImage]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
    dragStartRef.current = null;
    resizeStartRef.current = null;
  }, []);

  // Добавляем глобальные слушатели при перетаскивании или изменении размера
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, isResizing, handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      imgX: image.x,
      imgY: image.y,
    };
  }, [image.x, image.y]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(corner);
    resizeStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      width: image.width,
      height: image.height,
      imgX: image.x,
      imgY: image.y,
    };
  }, [image.width, image.height, image.x, image.y]);

  return (
    <div
      ref={elementRef}
      className={`absolute cursor-move ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        left: image.x,
        top: image.y,
        width: image.width,
        height: image.height,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={URL.createObjectURL(new Blob([image.data]))}
        alt="Annotation"
        className="w-full h-full object-contain pointer-events-none select-none"
        draggable={false}
        style={{ pointerEvents: 'none' }}
      />

      {/* Рамка и resize handles */}
      <div className={`absolute inset-0 border-2 border-blue-500 ${isDragging || isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-100'} transition-opacity pointer-events-none`}>
        {/* Corner handles */}
        <div
          className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-nw-resize pointer-events-auto shadow-sm z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          title="Изменить размер (северо-запад)"
        />
        <div
          className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-ne-resize pointer-events-auto shadow-sm z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          title="Изменить размер (северо-восток)"
        />
        <div
          className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-sw-resize pointer-events-auto shadow-sm z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          title="Изменить размер (юго-запад)"
        />
        <div
          className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-se-resize pointer-events-auto shadow-sm z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          title="Изменить размер (юго-восток)"
        />
      </div>
    </div>
  );
}
