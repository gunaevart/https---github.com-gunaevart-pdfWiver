import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { X, Trash2 } from 'lucide-react';
import { usePdfStore } from '../store/pdfStore';

pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface ThumbnailData {
  pageIndex: number; // Глобальный индекс (0-based)
  dataUrl: string;
  pdfIndex: number; // Индекс PDF в массиве (0 = основной, 1+ = добавленные)
  localPageIndex: number; // Локальный индекс страницы в PDF (0-based)
}

export function PageThumbnails() {
  const { pdfData, currentPage, setCurrentPage, setShowThumbnails, deletePage, isPageDeleted, getVisiblePageCount, mergedPdfs } = usePdfStore();
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false); // Показывать ли удаленные страницы
  const containerRef = useRef<HTMLDivElement>(null);

  // Генерация миниатюр из всех PDF
  useEffect(() => {
    if (!pdfData) return;

    const generateThumbnails = async () => {
      try {
        const allThumbnails: ThumbnailData[] = [];
        let globalPageIndex = 0;

        // Функция для генерации миниатюр одного PDF
        const generateForPdf = async (data: Uint8Array, pdfIndex: number) => {
          const pdfDataCopy = new Uint8Array(data.length);
          pdfDataCopy.set(data);
          
          const loadingTask = pdfjs.getDocument(pdfDataCopy);
          const pdf = await loadingTask.promise;
          
          for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const viewport = page.getViewport({ scale: 0.3 });

            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: canvas.getContext('2d')!,
              viewport: viewport,
            };

            await page.render(renderContext).promise;

            allThumbnails.push({
              pageIndex: globalPageIndex,
              dataUrl: canvas.toDataURL('image/jpeg', 0.7),
              pdfIndex,
              localPageIndex: i,
            });
            
            globalPageIndex++;
          }
        };

        // Генерируем для основного PDF
        await generateForPdf(pdfData, 0);

        // Генерируем для добавленных PDF
        for (let i = 0; i < mergedPdfs.length; i++) {
          await generateForPdf(mergedPdfs[i], i + 1);
        }

        setTotalPages(globalPageIndex);
        setThumbnails(allThumbnails);
      } catch (err) {
        console.error('Ошибка генерации миниатюр:', err);
      }
    };

    generateThumbnails();
  }, [pdfData, mergedPdfs.length]);

  const handlePageClick = (pageIndex: number) => {
    if (isPageDeleted(pageIndex)) return;
    setCurrentPage(pageIndex + 1);
    setShowThumbnails(false);
  };

  const handleDeletePage = (e: React.MouseEvent, pageIndex: number) => {
    e.stopPropagation();
    if (getVisiblePageCount() <= 1) {
      alert('Нельзя удалить единственную страницу');
      return;
    }
    if (confirm(`Вы уверены, что хотите удалить страницу ${pageIndex + 1}?`)) {
      deletePage(pageIndex);
    }
  };

  // Фильтруем удаленные страницы из отображения
  const visibleThumbnails = showDeleted 
    ? thumbnails 
    : thumbnails.filter(thumb => !isPageDeleted(thumb.pageIndex));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">
              Страницы ({visibleThumbnails.length} из {totalPages})
            </h2>
            {thumbnails.some(t => isPageDeleted(t.pageIndex)) && (
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  showDeleted 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {showDeleted ? 'Скрыть удаленные' : 'Показать удаленные'}
              </button>
            )}
          </div>
          <button
            onClick={() => setShowThumbnails(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Сетка миниатюр */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {visibleThumbnails.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              Нет страниц для отображения
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {visibleThumbnails.map((thumb) => {
                const pageNum = thumb.pageIndex + 1;
                const isCurrent = currentPage === pageNum;

                return (
                  <div
                    key={`${thumb.pdfIndex}-${thumb.localPageIndex}`}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isCurrent
                        ? 'border-blue-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={() => handlePageClick(thumb.pageIndex)}
                  >
                    {/* Миниатюра */}
                    <img
                      src={thumb.dataUrl}
                      alt={`Страница ${pageNum}`}
                      className="w-full h-auto"
                    />

                    {/* Номер страницы */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 text-center">
                      {pageNum}
                    </div>

                    {/* Индикатор источника PDF */}
                    {thumb.pdfIndex > 0 && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs rounded-full font-medium text-[10px]">
                        PDF #{thumb.pdfIndex}
                      </div>
                    )}

                    {/* Кнопка удаления */}
                    <button
                      onClick={(e) => handleDeletePage(e, thumb.pageIndex)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                      title="Удалить страницу"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Индикатор текущей страницы */}
                    {isCurrent && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                        Текущая
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Подвал */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-600">
          Нажмите на миниатюру для перехода к странице • Кнопка удаления появляется при наведении
        </div>
      </div>
    </div>
  );
}
