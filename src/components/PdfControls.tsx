import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Minimize, Trash2, Grid3X3 } from 'lucide-react';
import { usePdfStore } from '../store/pdfStore';

export function PdfControls() {
  const { currentPage, zoom, setCurrentPage, setZoom, deletePage, isPageDeleted, setShowThumbnails, getVisiblePageCount, pdfData } = usePdfStore();

  const handlePrevPage = () => {
    // Найти предыдущую не удаленную страницу
    for (let i = currentPage - 2; i >= 0; i--) {
      if (!isPageDeleted(i)) {
        setCurrentPage(i + 1);
        break;
      }
    }
  };

  const handleNextPage = () => {
    // Найти следующую не удаленную страницу
    // Общее количество страниц вычисляется в PdfViewer
    for (let i = currentPage; i < currentPage + 100; i++) {
      if (!isPageDeleted(i)) {
        setCurrentPage(i + 1);
        break;
      }
    }
  };

  const handleZoomIn = () => {
    setZoom(zoom + 0.25);
  };

  const handleZoomOut = () => {
    setZoom(zoom - 0.25);
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleRemovePage = () => {
    const pageIndex = currentPage - 1;
    if (isPageDeleted(pageIndex)) {
      alert('Эта страница уже удалена');
      return;
    }
    if (getVisiblePageCount() <= 1) {
      alert('Нельзя удалить единственную страницу');
      return;
    }
    if (confirm(`Вы уверены, что хотите удалить страницу ${currentPage}?`)) {
      deletePage(pageIndex);
    }
  };

  const visiblePageCount = getVisiblePageCount();

  return (
    <div className="bg-white px-4 py-3 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Навигация по страницам */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Предыдущая страница"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-4 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md min-w-[100px] text-center">
            {currentPage} / {visiblePageCount || '?'}
          </span>

          <button
            onClick={handleNextPage}
            disabled={visiblePageCount === 0 || currentPage >= visiblePageCount}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Следующая страница"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Просмотр всех страниц */}
          <button
            onClick={() => setShowThumbnails(true)}
            disabled={!pdfData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            title="Все страницы"
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Страницы</span>
          </button>
        </div>

        {/* Управление страницами */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRemovePage}
            disabled={isPageDeleted(currentPage - 1) || visiblePageCount <= 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            title="Удалить текущую страницу"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Удалить</span>
          </button>
        </div>

        {/* Зум */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Уменьшить"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 2}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Увеличить"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <button
            onClick={handleResetZoom}
            disabled={zoom === 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Сбросить зум"
          >
            <Minimize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
