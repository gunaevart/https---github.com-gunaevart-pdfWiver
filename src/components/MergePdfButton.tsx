import { useState, useRef } from 'react';
import { FilePlus, X, Loader2 } from 'lucide-react';
import { usePdfStore } from '../store/pdfStore';

export function MergePdfButton() {
  const { pdfData, mergePdf, setError } = usePdfStore();
  const [isMerging, setIsMerging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewPages, setPreviewPages] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Пожалуйста, выберите PDF файл');
      return;
    }

    setSelectedFile(file);

    // Предпросмотр - получаем количество страниц через pdfjs
    try {
      const { default: pdfjs } = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument(new Uint8Array(arrayBuffer));
      const pdf = await loadingTask.promise;
      setPreviewPages(pdf.numPages);
    } catch (err) {
      console.error('Ошибка при чтении PDF:', err);
      setError('Ошибка при чтении PDF файла');
      setSelectedFile(null);
    }
  };

  const handleMerge = async () => {
    if (!selectedFile || !pdfData) return;

    setIsMerging(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      await mergePdf(uint8Array);

      // Сброс
      setSelectedFile(null);
      setPreviewPages(0);
      setShowModal(false);
    } catch (err) {
      console.error('Ошибка при объединении:', err);
      setError('Ошибка при объединении PDF: ' + (err as Error).message);
    } finally {
      setIsMerging(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setSelectedFile(null);
    setPreviewPages(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        disabled={!pdfData}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
      >
        <FilePlus className="w-5 h-5" />
        <span className="hidden sm:inline">Добавить PDF</span>
      </button>

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Добавить PDF документ
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Описание */}
            <p className="text-gray-600 text-sm mb-4">
              Выберите PDF файл для добавления страниц в конец текущего документа
            </p>

            {/* Область загрузки */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-all duration-200
                ${selectedFile 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <FilePlus className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800 truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {previewPages} стр. • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <FilePlus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-700 font-medium mb-1">
                    Нажмите для выбора файла
                  </p>
                  <p className="text-gray-500 text-sm">
                    или перетащите PDF сюда
                  </p>
                </div>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleMerge}
                disabled={!selectedFile || isMerging}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Объединение...</span>
                  </>
                ) : (
                  <span>Добавить</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
