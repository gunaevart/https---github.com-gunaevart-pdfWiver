import { useState } from 'react';
import { Download } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { usePdfStore } from '../store/pdfStore';

export function SaveButton() {
  const { pdfData, images, deletedPages, mergedPdfs } = usePdfStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!pdfData) return;

    setIsSaving(true);

    try {
      // Базовый масштаб рендеринга pdfjs (как в PdfViewer)
      const PDFJS_SCALE = 1.5;

      // Создаем новый PDF документ
      const newPdfDoc = await PDFDocument.create();

      // Загружаем все PDF документы
      const allPdfDocs: { doc: PDFDocument; pages: number; startGlobalIndex: number }[] = [];
      let globalPageIndex = 0;

      // Основной PDF
      const mainPdfDoc = await PDFDocument.load(pdfData);
      
      allPdfDocs.push({
        doc: mainPdfDoc,
        pages: mainPdfDoc.getPageCount(),
        startGlobalIndex: 0,
      });
      globalPageIndex += mainPdfDoc.getPageCount();

      // Добавленные PDF
      for (const mergedPdfData of mergedPdfs) {
        const mergedPdfDoc = await PDFDocument.load(mergedPdfData);
        allPdfDocs.push({
          doc: mergedPdfDoc,
          pages: mergedPdfDoc.getPageCount(),
          startGlobalIndex: globalPageIndex,
        });
        globalPageIndex += mergedPdfDoc.getPageCount();
      }

      // Собираем страницы для копирования (пропуская удаленные)
      const pagesToCopy: { docIndex: number; pageIndex: number }[] = [];
      
      for (let pdfIndex = 0; pdfIndex < allPdfDocs.length; pdfIndex++) {
        const pdfInfo = allPdfDocs[pdfIndex];
        
        for (let localPageIndex = 0; localPageIndex < pdfInfo.pages; localPageIndex++) {
          const globalPageIndex = pdfInfo.startGlobalIndex + localPageIndex;
          
          // Пропускаем удаленные страницы
          if (deletedPages.has(globalPageIndex)) continue;
          
          pagesToCopy.push({
            docIndex: pdfIndex,
            pageIndex: localPageIndex,
          });
        }
      }

      // Копируем страницы пачками из каждого документа
      let currentDocIndex = -1;
      let pagesFromCurrentDoc: number[] = [];

      for (const pageToCopy of pagesToCopy) {
        if (pageToCopy.docIndex !== currentDocIndex && currentDocIndex !== -1) {
          // Копируем накопленные страницы из предыдущего документа
          const currentPdf = allPdfDocs[currentDocIndex].doc;
          const copiedPages = await newPdfDoc.copyPages(currentPdf, pagesFromCurrentDoc);
          for (const page of copiedPages) {
            newPdfDoc.addPage(page);
          }
          pagesFromCurrentDoc = [];
        }

        currentDocIndex = pageToCopy.docIndex;
        pagesFromCurrentDoc.push(pageToCopy.pageIndex);
      }

      // Копируем последние страницы
      if (currentDocIndex !== -1 && pagesFromCurrentDoc.length > 0) {
        const currentPdf = allPdfDocs[currentDocIndex].doc;
        const copiedPages = await newPdfDoc.copyPages(currentPdf, pagesFromCurrentDoc);
        for (const page of copiedPages) {
          newPdfDoc.addPage(page);
        }
      }

      // Внедряем изображения на страницы
      const newPdfPages = newPdfDoc.getPages();
      let newPageIndex = 0;

      // Проходим по всем PDF документам
      for (let pdfIndex = 0; pdfIndex < allPdfDocs.length; pdfIndex++) {
        const pdfInfo = allPdfDocs[pdfIndex];
        
        // Проходим по всем страницам этого PDF
        for (let localPageIndex = 0; localPageIndex < pdfInfo.pages; localPageIndex++) {
          const globalPageIndex = pdfInfo.startGlobalIndex + localPageIndex;
          
          // Пропускаем удаленные страницы
          if (deletedPages.has(globalPageIndex)) continue;

          const newPage = newPdfPages[newPageIndex];
          
          // Получаем изображения для этой страницы
          const pageImages = images.filter(img => img.pageIndex === globalPageIndex);
          
          // Получаем размер страницы для правильного позиционирования
          const sourcePage = pdfInfo.doc.getPage(localPageIndex);
          const { height: pageHeight } = sourcePage.getSize();

          // Внедряем каждое изображение
          for (const img of pageImages) {
            let embeddedImage;
            const imgBlob = new Blob([img.data], { type: 'application/octet-stream' });

            try {
              const pngBytes = await imgBlob.arrayBuffer();
              embeddedImage = await newPdfDoc.embedPng(pngBytes);
            } catch {
              const jpgBytes = await imgBlob.arrayBuffer();
              embeddedImage = await newPdfDoc.embedJpg(jpgBytes);
            }

            // Конвертируем координаты canvas -> PDF
            const pdfX = img.x / PDFJS_SCALE;
            const pdfY = pageHeight - (img.y / PDFJS_SCALE) - (img.height / PDFJS_SCALE);
            const pdfWidth = img.width / PDFJS_SCALE;
            const pdfHeight = img.height / PDFJS_SCALE;

            newPage.drawImage(embeddedImage, {
              x: pdfX,
              y: pdfY,
              width: pdfWidth,
              height: pdfHeight,
            });
          }

          newPageIndex++;
        }
      }

      // Сохраняем PDF
      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка при сохранении PDF:', err);
      alert('Ошибка при сохранении PDF: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={!pdfData || isSaving}
      className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
    >
      <Download className="w-5 h-5" />
      {isSaving ? 'Сохранение...' : 'Скачать PDF'}
    </button>
  );
}
