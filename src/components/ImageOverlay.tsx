import { useRef, useState, useEffect, useCallback } from 'react';
import { usePdfStore } from '../store/pdfStore';
import { DraggableImage } from './DraggableImage';

interface ImageOverlayProps {
  canvasElement: HTMLCanvasElement | null;
}

export function ImageOverlay({ canvasElement }: ImageOverlayProps) {
  const { images, currentPage } = usePdfStore();
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Обновляем размеры при изменении канваса
  useEffect(() => {
    if (canvasElement) {
      const updateSizes = () => {
        const rect = canvasElement.getBoundingClientRect();
        
        // Реальный размер канваса в пикселях (с учетом scale pdfjs)
        setCanvasSize({
          width: canvasElement.width,
          height: canvasElement.height,
        });
        
        // Визуальный размер на экране
        setDisplaySize({
          width: rect.width,
          height: rect.height,
        });

        // Устанавливаем размеры контейнера равными визуальному размеру
        if (containerRef.current) {
          containerRef.current.style.width = `${rect.width}px`;
          containerRef.current.style.height = `${rect.height}px`;
        }
      };

      updateSizes();

      // Наблюдаем за изменениями
      const resizeObserver = new ResizeObserver(updateSizes);
      resizeObserver.observe(canvasElement);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [canvasElement]);

  // Фильтруем изображения для текущей страницы
  const currentImages = images.filter(img => img.pageIndex === currentPage - 1);

  // Функция для получения текущего масштаба
  const getScale = useCallback(() => {
    if (!displaySize || !canvasSize) return 1;
    return displaySize.width / canvasSize.width;
  }, [displaySize, canvasSize]);

  if (!canvasElement || !canvasSize || !displaySize) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0"
    >
      {/* Внутренний контейнер с координатами в пикселях канваса, масштабированный до визуального размера */}
      <div
        style={{
          transform: `scale(${getScale()})`,
          transformOrigin: 'top left',
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      >
        {currentImages.map((image) => (
          <DraggableImage
            key={image.id}
            image={image}
            getScale={getScale}
          />
        ))}
      </div>
    </div>
  );
}
