import { useEffect, useRef, useCallback, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { usePdfStore } from '../store/pdfStore';
import { ImageOverlay } from './ImageOverlay';

// Устанавливаем worker для pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PdfViewerProps {
  onError: (error: string) => void;
}

interface RenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

interface LoadedPdf {
  pdf: pdfjs.PDFDocumentProxy;
  startPage: number; // Глобальный номер первой страницы этого PDF
  endPage: number;   // Глобальный номер последней страницы
}

export function PdfViewer({ onError }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { pdfData, currentPage, zoom, mergedPdfs, setTotalPagesDynamic } = usePdfStore();
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [currentCanvas, setCurrentCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loadedPdfs, setLoadedPdfs] = useState<LoadedPdf[]>([]);

  // Загружаем все PDF документы
  useEffect(() => {
    if (!pdfData) return;

    const loadAllPdfs = async () => {
      try {
        const pdfs: LoadedPdf[] = [];
        let globalPageNum = 1;

        // Загружаем основной PDF
        const pdfDataCopy = new Uint8Array(pdfData.length);
        pdfDataCopy.set(pdfData);
        const loadingTask = pdfjs.getDocument(pdfDataCopy);
        const mainPdf = await loadingTask.promise;
        
        pdfs.push({
          pdf: mainPdf,
          startPage: globalPageNum,
          endPage: globalPageNum + mainPdf.numPages - 1,
        });
        globalPageNum += mainPdf.numPages;

        // Загружаем добавленные PDF
        for (const mergedPdfData of mergedPdfs) {
          const mergedPdfCopy = new Uint8Array(mergedPdfData.length);
          mergedPdfCopy.set(mergedPdfData);
          const mergedLoadingTask = pdfjs.getDocument(mergedPdfCopy);
          const mergedPdf = await mergedLoadingTask.promise;

          pdfs.push({
            pdf: mergedPdf,
            startPage: globalPageNum,
            endPage: globalPageNum + mergedPdf.numPages - 1,
          });
          globalPageNum += mergedPdf.numPages;
        }

        setLoadedPdfs(pdfs);
        
        // Устанавливаем общее количество страниц
        const totalPages = pdfs.reduce((sum, info) => sum + info.pdf.numPages, 0);
        setTotalPagesDynamic(totalPages);
      } catch (err) {
        console.error('Ошибка при загрузке PDF:', err);
        onError('Ошибка при загрузке PDF: ' + (err as Error).message);
      }
    };

    loadAllPdfs();
  }, [pdfData, mergedPdfs.length]); // Перезагружаем при изменении mergedPdfs

  // Рендерим страницу
  const renderPage = useCallback(async (pageNum: number) => {
    // Находим, в каком PDF находится нужная страница
    const pdfInfo = loadedPdfs.find(
      info => pageNum >= info.startPage && pageNum <= info.endPage
    );

    if (!pdfInfo) {
      onError('Страница не найдена');
      return;
    }

    // Вычисляем локальный номер страницы в PDF
    const localPageNum = pageNum - pdfInfo.startPage + 1;

    try {
      const page = await pdfInfo.pdf.getPage(localPageNum);
      const viewport = page.getViewport({ scale: 1.5 * zoom });

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Отменяем предыдущую задачу рендеринга
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvas: canvas,
        canvasContext: canvas.getContext('2d')!,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext) as unknown as RenderTask;
      await renderTaskRef.current.promise;

      setCurrentCanvas(canvas);
    } catch (err) {
      const error = err as Error;
      if (error.name !== 'RenderingCancelled' && !error.message.includes('Rendering cancelled')) {
        onError('Ошибка при рендеринге страницы: ' + error.message);
      }
    }
  }, [loadedPdfs, zoom, onError]);

  // Рендерим при изменении currentPage
  useEffect(() => {
    if (loadedPdfs.length === 0) return;

    // Вычисляем общее количество страниц
    const totalPages = loadedPdfs.reduce((sum, info) => sum + info.pdf.numPages, 0);
    const safePageNum = Math.max(1, Math.min(currentPage, totalPages));
    
    renderPage(safePageNum);

    // Очистка при размонтировании
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [currentPage, loadedPdfs, renderPage]);

  return (
    <div
      ref={containerRef}
      className="relative bg-white rounded-lg shadow-lg overflow-hidden"
      style={{
        maxWidth: '100%',
        display: 'inline-block'
      }}
    >
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto"
        style={{ display: 'block' }}
      />
      <ImageOverlay canvasElement={currentCanvas} />
    </div>
  );
}
