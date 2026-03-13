import { create } from 'zustand';

export interface ImageAnnotation {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  data: ArrayBuffer;
}

interface PdfState {
  pdfFile: File | null;
  pdfData: Uint8Array | null;
  currentPage: number;
  totalPages: number;
  originalTotalPages: number; // Оригинальное количество страниц в PDF
  zoom: number;
  images: ImageAnnotation[];
  isLoading: boolean;
  error: string | null;
  showThumbnails: boolean;
  deletedPages: Set<number>; // Индексы удаленных страниц (0-based)
  mergedPdfs: Uint8Array[]; // Данные добавленных PDF файлов

  // Actions
  setPdfFile: (file: File, data: Uint8Array) => void;
  clearPdf: () => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setZoom: (zoom: number) => void;
  addImage: (image: ImageAnnotation) => void;
  updateImage: (id: string, updates: Partial<ImageAnnotation>) => void;
  removeImage: (id: string) => void;
  getImagesForPage: (pageIndex: number) => ImageAnnotation[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Управление страницами
  deletePage: (pageIndex: number) => void;
  restorePage: (pageIndex: number) => void;
  setShowThumbnails: (show: boolean) => void;
  isPageDeleted: (pageIndex: number) => boolean;
  getVisiblePageCount: () => number;
  
  // Объединение PDF
  mergePdf: (pdfData: Uint8Array) => Promise<void>;
  getMergedPdfs: () => Uint8Array[];
  setTotalPagesDynamic: (pages: number) => void;
}

export const usePdfStore = create<PdfState>((set, get) => ({
  pdfFile: null,
  pdfData: null,
  currentPage: 1,
  totalPages: 0,
  originalTotalPages: 0,
  zoom: 1,
  images: [],
  isLoading: false,
  error: null,
  showThumbnails: false,
  deletedPages: new Set(),
  mergedPdfs: [],

  setPdfFile: (file, data) => set({ 
    pdfFile: file, 
    pdfData: data, 
    currentPage: 1, 
    totalPages: 1,
    originalTotalPages: 1,
    error: null,
    deletedPages: new Set(),
    mergedPdfs: []
  }),

  clearPdf: () => set({
    pdfFile: null,
    pdfData: null,
    currentPage: 1,
    totalPages: 0,
    originalTotalPages: 0,
    images: [],
    error: null,
    showThumbnails: false,
    deletedPages: new Set(),
    mergedPdfs: []
  }),

  setCurrentPage: (page) => set({ currentPage: page }),

  setTotalPages: (pages) => set({ totalPages: pages, originalTotalPages: pages }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),

  addImage: (image) => set((state) => ({
    images: [...state.images, image]
  })),

  updateImage: (id, updates) => set((state) => ({
    images: state.images.map(img =>
      img.id === id ? { ...img, ...updates } : img
    )
  })),

  removeImage: (id) => set((state) => ({
    images: state.images.filter(img => img.id !== id)
  })),

  getImagesForPage: (pageIndex) => {
    return get().images.filter(img => img.pageIndex === pageIndex);
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
  
  // Удалить страницу (виртуально - помечаем как удаленную)
  deletePage: (pageIndex) => {
    const state = get();
    if (state.totalPages <= 1) return;
    
    const newDeletedPages = new Set(state.deletedPages);
    newDeletedPages.add(pageIndex);
    
    // Удаляем изображения с этой страницы
    const updatedImages = state.images.filter(img => img.pageIndex !== pageIndex);
    
    // Если удалили текущую страницу, переключаемся на следующую доступную
    let newCurrentPage = state.currentPage;
    if (state.currentPage - 1 === pageIndex) {
      // Найти следующую не удаленную страницу
      for (let i = pageIndex + 1; i < state.totalPages; i++) {
        if (!newDeletedPages.has(i)) {
          newCurrentPage = i + 1;
          break;
        }
      }
      // Если нет следующей, найти предыдущую
      if (newCurrentPage - 1 === pageIndex) {
        for (let i = pageIndex - 1; i >= 0; i--) {
          if (!newDeletedPages.has(i)) {
            newCurrentPage = i + 1;
            break;
          }
        }
      }
    } else if (state.currentPage - 1 > pageIndex) {
      newCurrentPage = state.currentPage - 1;
    }
    
    set({
      deletedPages: newDeletedPages,
      images: updatedImages,
      currentPage: newCurrentPage
    });
  },
  
  // Восстановить страницу
  restorePage: (pageIndex) => {
    const state = get();
    const newDeletedPages = new Set(state.deletedPages);
    newDeletedPages.delete(pageIndex);
    set({ deletedPages: newDeletedPages });
  },
  
  setShowThumbnails: (show) => set({ showThumbnails: show }),
  
  // Проверка, удалена ли страница
  isPageDeleted: (pageIndex) => {
    return get().deletedPages.has(pageIndex);
  },
  
  // Получить количество видимых страниц
  getVisiblePageCount: () => {
    const state = get();
    // Если есть добавленные PDF, то общее количество страниц вычисляется динамически
    // В этом случае используем totalPages из состояния
    return state.totalPages - state.deletedPages.size;
  },
  
  // Установить общее количество страниц (вызывается из PdfViewer)
  setTotalPagesDynamic: (pages: number) => {
    set({ totalPages: pages });
  },
  
  // Объединить с другим PDF
  mergePdf: async (newPdfData) => {
    const state = get();

    try {
      const { PDFDocument } = await import('pdf-lib');

      // Загружаем новый PDF для получения количества страниц
      const newPdfDoc = await PDFDocument.load(newPdfData);
      const newPagesCount = newPdfDoc.getPageCount();
      
      console.log('Объединение PDF:', {
        текущееКоличествоСтраниц: state.totalPages,
        добавляемоеКоличествоСтраниц: newPagesCount,
        новоеКоличествоСтраниц: state.totalPages + newPagesCount
      });

      // Добавляем данные PDF в массив
      const newMergedPdfs = [...state.mergedPdfs, newPdfData];

      // Вычисляем новую текущую страницу (первая страница добавленного PDF)
      const newCurrentPage = state.totalPages + 1;

      // Обновляем общее количество страниц
      set({
        totalPages: state.totalPages + newPagesCount,
        mergedPdfs: newMergedPdfs,
        currentPage: newCurrentPage
      });

    } catch (err) {
      console.error('Ошибка при объединении PDF:', err);
      throw err;
    }
  },
  
  // Получить все добавленные PDF
  getMergedPdfs: () => {
    return get().mergedPdfs;
  },
}));
