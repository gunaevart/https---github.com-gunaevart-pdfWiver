import { useState, useRef } from 'react';
import { Image, Plus, Trash2, Minus, Plus as PlusIcon } from 'lucide-react';
import { usePdfStore, ImageAnnotation } from '../store/pdfStore';

export function ImageUploader() {
  const { addImage, currentPage, images, removeImage, updateImage } = usePdfStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение (PNG или JPG)');
      return;
    }

    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Создаем изображение для получения размеров
      const blob = new Blob([arrayBuffer], { type: file.type });
      const img = await createImageBitmap(blob);

      // Базовый размер для добавления (150px по ширине)
      const baseWidth = 150;
      const scaleFactor = baseWidth / img.width;
      const baseHeight = img.height * scaleFactor;

      // Добавляем изображение в состояние
      addImage({
        id: crypto.randomUUID(),
        pageIndex: currentPage - 1, // 0-based index
        x: 50,
        y: 50,
        width: baseWidth,
        height: baseHeight,
        data: arrayBuffer,
      });
    } catch (err) {
      console.error('Ошибка при загрузке изображения:', err);
      alert('Ошибка при загрузке изображения');
    } finally {
      setIsProcessing(false);
    }

    // Сбрасываем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentImages = images.filter(img => img.pageIndex === currentPage - 1);

  const handleScale = (image: ImageAnnotation, delta: number) => {
    const scaleFactor = 1 + delta;
    const newWidth = Math.max(50, image.width * scaleFactor);
    const newHeight = Math.max(50, image.height * scaleFactor);
    updateImage(image.id, { width: newWidth, height: newHeight });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Image className="w-5 h-5" />
          Изображения на странице
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleImageUpload}
        className="hidden"
      />

      {currentImages.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          Нет изображений на этой странице
        </p>
      ) : (
        <ul className="space-y-3">
          {currentImages.map((img, index) => (
            <li
              key={img.id}
              className="p-3 bg-gray-50 rounded-md border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  Изображение #{index + 1}
                </span>
                <button
                  onClick={() => removeImage(img.id)}
                  className="p-1 hover:bg-red-100 rounded transition-colors ml-2"
                  title="Удалить изображение"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              
              {/* Контролы размера */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleScale(img, -0.1)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Уменьшить"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                
                <div className="flex-1 text-center text-xs text-gray-500">
                  {Math.round(img.width)} × {Math.round(img.height)} px
                </div>
                
                <button
                  onClick={() => handleScale(img, 0.1)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Увеличить"
                >
                  <PlusIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              
              {/* Прогресс бар размера */}
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(100, (img.width / 400) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
