import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { usePdfStore } from '../store/pdfStore';

interface PdfUploadProps {
  onFileLoaded: () => void;
}

export function PdfUpload({ onFileLoaded }: PdfUploadProps) {
  const { setPdfFile, setLoading, setError, pdfFile, clearPdf } = usePdfStore();
  const [isDragging, setIsDragging] = useState(false);

  const processPdfFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Пожалуйста, загрузите PDF файл');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Читаем файл через FileReader для создания независимой копии
      const reader = new FileReader();
      const uint8Array = await new Promise<Uint8Array>((resolve, reject) => {
        reader.onload = () => {
          const buffer = reader.result as ArrayBuffer;
          // Создаем НОВЫЙ Uint8Array с копированием данных
          const source = new Uint8Array(buffer);
          const copy = new Uint8Array(source.length);
          copy.set(source);
          resolve(copy);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
      setPdfFile(file, uint8Array);
      onFileLoaded();
    } catch (err) {
      setError('Ошибка при чтении файла: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setPdfFile, setLoading, setError, onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processPdfFile(file);
    }
  }, [processPdfFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPdfFile(file);
    }
  }, [processPdfFile]);

  if (pdfFile) {
    return (
      <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <FileText className="w-8 h-8 text-red-500" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate">{pdfFile.name}</p>
          <p className="text-sm text-gray-500">
            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button
          onClick={clearPdf}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Закрыть файл"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center
        transition-all duration-200 cursor-pointer
        ${isDragging 
          ? 'border-blue-500 bg-blue-50 scale-105' 
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }
      `}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden"
        id="pdf-upload"
      />
      <label htmlFor="pdf-upload" className="cursor-pointer">
        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Перетащите PDF файл сюда
        </p>
        <p className="text-gray-500 mb-4">или нажмите для выбора файла</p>
        <p className="text-sm text-gray-400">
          Поддерживаются только файлы формата PDF
        </p>
      </label>
    </div>
  );
}
