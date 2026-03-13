import { useState } from 'react';
import { PdfUpload } from './components/PdfUpload';
import { PdfViewer } from './components/PdfViewer';
import { PdfControls } from './components/PdfControls';
import { ErrorBanner } from './components/ErrorBanner';
import { ImageUploader } from './components/ImageUploader';
import { SaveButton } from './components/SaveButton';
import { PageThumbnails } from './components/PageThumbnails';
import { MergePdfButton } from './components/MergePdfButton';
import { usePdfStore } from './store/pdfStore';

function App() {
  const { pdfData, error, setError, showThumbnails } = usePdfStore();
  const [showViewer, setShowViewer] = useState(false);

  const handleFileLoaded = () => {
    setShowViewer(true);
  };

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Заголовок */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            PDF Image Injector
          </h1>
          <p className="text-gray-600">
            Добавьте изображения в ваш PDF файл прямо в браузере
          </p>
        </header>

        {/* Баннер ошибок */}
        {error && (
          <div className="mb-6">
            <ErrorBanner error={error} onDismiss={handleDismissError} />
          </div>
        )}

        {/* Верхняя панель: Загрузка + Сохранение + Добавить PDF */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex-1">
            <PdfUpload onFileLoaded={handleFileLoaded} />
          </div>
          {showViewer && pdfData && (
            <div className="flex gap-2">
              <MergePdfButton />
              <SaveButton />
            </div>
          )}
        </div>

        {/* Просмотрщик PDF */}
        {showViewer && pdfData && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Основная область: Контролы + Вьювер */}
            <div className="lg:col-span-3 space-y-4">
              {/* Контролы */}
              <PdfControls />
              
              {/* Вьювер */}
              <div className="flex justify-center bg-gray-200 rounded-lg p-8 overflow-auto min-h-[500px]">
                <PdfViewer onError={setError} />
              </div>
            </div>
            
            {/* Боковая панель: Изображения */}
            <div className="lg:col-span-1">
              <ImageUploader />
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно просмотра всех страниц */}
      {showViewer && showThumbnails && (
        <PageThumbnails />
      )}
    </div>
  );
}

export default App;
