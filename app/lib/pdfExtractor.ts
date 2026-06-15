/**
 * PDF Text Extractor
 *
 * Uses pdfjs-dist with worker loaded from CDN.
 * Includes fallback for cases where pdfjs-dist import fails (Metro issues).
 */
import { Platform } from 'react-native';

// Cache the loaded library
let cachedPdfjsLib: any = null;

/**
 * Load pdf.js — tries npm package first, falls back to CDN script injection.
 */
const getPdfJs = async (): Promise<any> => {
  if (cachedPdfjsLib) return cachedPdfjsLib;

  // Approach 1: Try importing the npm package
  try {
    console.log('[PDF] Attempting to import pdfjs-dist...');
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    cachedPdfjsLib = pdfjsLib;
    console.log('[PDF] pdfjs-dist loaded via npm');
    return cachedPdfjsLib;
  } catch (e) {
    console.warn('[PDF] npm import failed, trying CDN fallback:', e);
  }

  // Approach 2: Try the main entry point
  try {
    const pdfjsLib = require('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    cachedPdfjsLib = pdfjsLib;
    console.log('[PDF] pdfjs-dist loaded via main entry');
    return cachedPdfjsLib;
  } catch (e) {
    console.warn('[PDF] Main entry import failed, trying CDN:', e);
  }

  // Approach 3: CDN script injection
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    console.log('[PDF] Loading pdf.js from CDN...');

    // Check if already loaded
    if ((window as any).pdfjsLib) {
      cachedPdfjsLib = (window as any).pdfjsLib;
      return cachedPdfjsLib;
    }

    return new Promise<any>((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (!lib) {
          reject(new Error('pdf.js loaded but pdfjsLib not found on window'));
          return;
        }
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        cachedPdfjsLib = lib;
        console.log('[PDF] pdf.js loaded from CDN');
        resolve(lib);
      };
      script.onerror = () =>
        reject(new Error('Failed to load pdf.js from CDN'));
      document.head.appendChild(script);
    });
  }

  throw new Error('No PDF extraction method available');
};

/**
 * Extract all text from a PDF given its URI.
 */
export const extractTextFromPdf = async (fileUri: string): Promise<string> => {
  if (Platform.OS !== 'web') {
    throw new Error('PDF extraction is only available on web currently.');
  }

  console.log('[PDF] Starting text extraction from:', fileUri.substring(0, 60));

  const pdfjsLib = await getPdfJs();

  // Fetch the PDF as ArrayBuffer
  console.log('[PDF] Fetching file...');
  const response = await fetch(fileUri);
  const arrayBuffer = await response.arrayBuffer();
  console.log('[PDF] File loaded, size:', arrayBuffer.byteLength, 'bytes');

  if (arrayBuffer.byteLength < 100) {
    throw new Error('File appears to be empty or corrupted.');
  }

  // Load the PDF document
  console.log('[PDF] Parsing PDF document...');
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });
  const pdf = await loadingTask.promise;
  console.log('[PDF] Document loaded, pages:', pdf.numPages);

  let fullText = '';

  // Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => {
        const str = item.str || '';
        return item.hasEOL ? str + '\n' : str + ' ';
      })
      .join('');

    fullText += pageText + '\n';
    console.log(
      `[PDF] Page ${pageNum}/${pdf.numPages}: ${pageText.length} chars`
    );
  }

  const trimmed = fullText.trim();
  console.log('[PDF] Total extracted text:', trimmed.length, 'chars');

  // Return whatever we got, even if empty/short — let the caller decide
  // whether to fall back to vision-based extraction.
  return trimmed;
};

/**
 * Render the first N pages of a PDF as base64 JPEG images.
 * Uses pdfjs-dist canvas rendering (web only).
 * Returns array of base64 strings (without data URI prefix).
 */
export const renderPdfPagesToImages = async (
  fileUri: string,
  maxPages: number = 2
): Promise<string[]> => {
  console.log('[PDF] Starting page-to-image rendering from:', fileUri.substring(0, 60));

  const pdfjsLib = await getPdfJs();

  // Fetch PDF as ArrayBuffer
  const response = await fetch(fileUri);
  const arrayBuffer = await response.arrayBuffer();
  console.log('[PDF] File loaded for rendering, size:', arrayBuffer.byteLength, 'bytes');

  if (arrayBuffer.byteLength < 100) {
    throw new Error('File appears to be empty or corrupted.');
  }

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });
  const pdf = await loadingTask.promise;
  const pagesToRender = Math.min(pdf.numPages, maxPages);
  console.log(`[PDF] Rendering ${pagesToRender} of ${pdf.numPages} pages to images`);

  const results: string[] = [];

  for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    // Create an off-screen canvas (do NOT append to DOM)
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) {
      console.warn(`[PDF] Could not get 2D context for page ${pageNum}, skipping`);
      continue;
    }

    // Render the page onto the canvas
    await page.render({ canvasContext: context, viewport }).promise;

    // Convert canvas to base64 JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    results.push(base64);

    console.log(`[PDF] Page ${pageNum} rendered: ${base64.length} base64 chars`);

    // Clean up — remove canvas reference (it was never in the DOM)
    canvas.width = 0;
    canvas.height = 0;
  }

  console.log(`[PDF] Rendered ${results.length} page images`);
  return results;
};
