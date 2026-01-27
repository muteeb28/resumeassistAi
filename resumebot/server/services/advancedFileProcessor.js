import fs from 'fs';
import mammoth from 'mammoth';
import path from 'path';
import { 
  chunkResumeText, 
  cacheResumeText, 
  generateResumeKey,
  selectRelevantChunks 
} from './resumeCache.js';

// Load PDF.js once at module level for better performance
let pdfjsLib = null;
const loadPDFLib = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log(' PDF.js library loaded and cached');
  }
  return pdfjsLib;
};

// Enhanced configuration
const ADVANCED_CONFIG = {
  PDF: {
    MAX_PAGES: 30,        // Reduced from 50 for better token economy
    MAX_CHARS: 50000,     // Reduced from 100k for token economy
    TIMEOUT_MS: 20000     // Reduced timeout
  },
  TEXT_DETECTION: {
    PRINTABLE_RATIO: 0.70, // Lowered for UTF-8 content
    SAMPLE_SIZE: 2048
  },
  VALIDATION: {
    MIN_WORD_COUNT: 10,    // Very lenient for students
    MAX_WORD_COUNT: 8000,  // Token-conscious limit
    MIN_CHAR_COUNT: 50,
    MAX_TOKEN_ESTIMATE: 6000 // ~24k chars max before aggressive chunking
  },
  CHUNKING: {
    AGGRESSIVE_THRESHOLD: 4000, // Characters after which we chunk aggressively
    MAX_CHUNK_SIZE: 600,        // Smaller chunks for better token economy
    OVERLAP: 80,
    MAX_CHUNKS_TO_LLM: 4        // Limit chunks sent to LLM
  }
};

/**
 * Advanced file processor with immediate chunking and token economy focus
 * @param {string} filePath - Path to file
 * @param {string} mimeType - File mime type
 * @param {string} targetRole - Target role for optimization
 * @param {Buffer} originalBuffer - Original file buffer
 * @param {AbortController} abortController - Abort controller
 * @returns {Promise<Object>} Processed result with optimized chunks
 */
export async function processFileWithTokenEconomy(filePath, mimeType, targetRole = 'general', originalBuffer = null, abortController = null) {
  const startTime = Date.now();
  const sanitizedName = path.basename(filePath).replace(/[\\x00-\\x1f\\x80-\\x9f]/g, '').substring(0, 50);
  
  try {
    console.log(` Advanced processing: ${sanitizedName} (${mimeType}) for ${targetRole}`);
    
    // Read file with size check
    const fileBuffer = await fs.promises.readFile(filePath);
    const maxSizeMB = 15; // Reduced from 25MB
    if (fileBuffer.length > maxSizeMB * 1024 * 1024) {
      throw new Error(`File too large (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB). Maximum size is ${maxSizeMB}MB.`);
    }
    
    // Extract text with token economy focus
    let extractedText;
    switch (mimeType) {
      case 'application/pdf':
        extractedText = await extractPDFWithTokenLimit(fileBuffer, abortController);
        break;
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        extractedText = await extractWordWithFormatting(fileBuffer);
        break;
      case 'text/plain':
        extractedText = fileBuffer.toString('utf8');
        break;
      default:
        if (isAdvancedTextFile(fileBuffer)) {
          extractedText = fileBuffer.toString('utf8');
        } else {
          throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, Word, or text file.`);
        }
    }
    
    // Clean and validate
    const cleanedText = cleanExtractedText(extractedText);
    const validation = validateWithTokenAwareness(cleanedText);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Estimate token count
    const estimatedTokens = Math.ceil(cleanedText.length / 4);
    console.log(` Extracted: ${cleanedText.length} chars (~${estimatedTokens} tokens)`);
    
    // Generate cache key and cache full text
    let cacheKey = null;
    if (originalBuffer) {
      cacheKey = generateResumeKey(originalBuffer, targetRole);
      await cacheResumeText(cacheKey, cleanedText, {
        targetRole,
        validation,
        processingMetrics: {
          originalLength: extractedText.length,
          cleanedLength: cleanedText.length,
          estimatedTokens,
          processingTime: Date.now() - startTime
        }
      });
    }
    
    // CRITICAL: Chunk immediately and select only relevant parts
    const allChunks = chunkResumeText(cleanedText, {
      maxChunkSize: estimatedTokens > ADVANCED_CONFIG.VALIDATION.MAX_TOKEN_ESTIMATE ? 
                   ADVANCED_CONFIG.CHUNKING.MAX_CHUNK_SIZE : 800,
      overlap: ADVANCED_CONFIG.CHUNKING.OVERLAP,
      preserveSections: true
    });
    
    // Select only the most relevant chunks for LLM processing
    const relevantChunks = selectRelevantChunks(allChunks, targetRole, {
      maxChunks: ADVANCED_CONFIG.CHUNKING.MAX_CHUNKS_TO_LLM,
      minRelevanceScore: 0.2,
      prioritizeSections: ['experience', 'skills', 'projects', 'summary', 'education']
    });
    
    const optimizedContent = relevantChunks.map(chunk => chunk.text).join('\n\n');
    const tokenReduction = ((1 - optimizedContent.length / cleanedText.length) * 100).toFixed(1);
    
    console.log(` Token economy result: ${relevantChunks.length}/${allChunks.length} chunks selected`);
    console.log(` Token reduction: ${tokenReduction}% (${optimizedContent.length}/${cleanedText.length} chars)`);
    
    return {
      success: true,
      data: {
        originalText: extractedText,
        cleanedText: cleanedText,
        optimizedContent: optimizedContent, // This goes to LLM
        allChunks: allChunks,
        relevantChunks: relevantChunks,
        validation: validation,
        cacheKey: cacheKey,
        metrics: {
          originalLength: extractedText.length,
          cleanedLength: cleanedText.length,
          optimizedLength: optimizedContent.length,
          estimatedTokens: estimatedTokens,
          optimizedTokens: Math.ceil(optimizedContent.length / 4),
          tokenReduction: parseFloat(tokenReduction),
          chunkCount: allChunks.length,
          selectedChunks: relevantChunks.length,
          processingTime: Date.now() - startTime
        }
      }
    };
    
  } catch (error) {
    console.error('Advanced file processing error:', {
      file: sanitizedName,
      error: error.message,
      duration: Date.now() - startTime
    });
    
    return {
      success: false,
      error: error.message,
      details: `Processing failed after ${Date.now() - startTime}ms`
    };
  }
}

/**
 * Extract PDF with strict token limits
 */
async function extractPDFWithTokenLimit(buffer, abortController = null) {
  const startTime = Date.now();
  const pdfjsLib = await loadPDFLib();
  const uint8Array = new Uint8Array(buffer);
  
  const pdf = await pdfjsLib.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
    disableWorker: true,
    verbosity: 0
  }).promise;
  
  let fullText = '';
  const maxPages = Math.min(pdf.numPages, ADVANCED_CONFIG.PDF.MAX_PAGES);
  
  console.log(` PDF processing: ${maxPages}/${pdf.numPages} pages (token economy mode)`);
  
  for (let i = 1; i <= maxPages; i++) {
    if (abortController?.signal.aborted) {
      throw new Error('PDF processing cancelled');
    }
    
    // Aggressive limits for token economy
    if (fullText.length >= ADVANCED_CONFIG.PDF.MAX_CHARS) {
      console.log(` Stopped at page ${i}: reached ${ADVANCED_CONFIG.PDF.MAX_CHARS} char limit`);
      break;
    }
    
    if (Date.now() - startTime > ADVANCED_CONFIG.PDF.TIMEOUT_MS) {
      console.log(` Stopped at page ${i}: ${ADVANCED_CONFIG.PDF.TIMEOUT_MS}ms timeout`);
      break;
    }
    
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    
    if (pageText.trim()) {
      fullText += pageText + '\n';
    }
  }
  
  if (!fullText.trim()) {
    throw new Error('No readable text found in PDF. This might be a scanned/image-based PDF.');
  }
  
  return fullText.trim();
}

/**
 * Extract Word with better formatting preservation
 */
async function extractWordWithFormatting(buffer) {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  
  try {
    // Try structured extraction first
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    
    // Convert HTML to structured text
    const structuredText = htmlResult.value
      .replace(/<h[1-6][^>]*>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '')
      .replace(/<li[^>]*>/gi, '\n ')
      .replace(/<\/li>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    if (structuredText.length > 10) {
      return structuredText;
    }
  } catch (htmlError) {
    console.log('Structured extraction failed, trying raw text');
  }
  
  // Fallback to raw text
  const rawResult = await mammoth.extractRawText({ arrayBuffer });
  
  if (!rawResult.value || rawResult.value.trim().length === 0) {
    throw new Error('No readable text found in Word document');
  }
  
  return rawResult.value;
}

/**
 * Enhanced text detection for UTF-8 content
 */
function isAdvancedTextFile(buffer) {
  if (!buffer || buffer.length === 0) return false;
  
  const sample = buffer.slice(0, Math.min(ADVANCED_CONFIG.TEXT_DETECTION.SAMPLE_SIZE, buffer.length));
  
  // Quick binary signature check
  const binarySignatures = [
    [0x25, 0x50, 0x44, 0x46], // PDF
    [0x50, 0x4B, 0x03, 0x04], // ZIP/DOCX
    [0xD0, 0xCF, 0x11, 0xE0], // DOC
  ];
  
  for (const sig of binarySignatures) {
    if (sample.length >= sig.length && sig.every((byte, i) => sample[i] === byte)) {
      return false;
    }
  }
  
  // Count printable characters (UTF-8 friendly)
  let printableCount = 0;
  let nullCount = 0;
  
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    if (byte === 0) {
      nullCount++;
    } else if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13 || (byte >= 128 && byte <= 255)) {
      printableCount++;
    }
  }
  
  if (nullCount > sample.length * 0.1) return false;
  
  const nonNullBytes = sample.length - nullCount;
  const ratio = nonNullBytes > 0 ? printableCount / nonNullBytes : 0;
  
  return ratio > ADVANCED_CONFIG.TEXT_DETECTION.PRINTABLE_RATIO;
}

/**
 * Token-aware validation
 */
function validateWithTokenAwareness(text) {
  const validation = {
    isValid: true,
    wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
    charCount: text.length,
    estimatedTokens: Math.ceil(text.length / 4),
    errors: [],
    warnings: []
  };
  
  // Basic length checks
  if (validation.wordCount < ADVANCED_CONFIG.VALIDATION.MIN_WORD_COUNT) {
    validation.isValid = false;
    validation.errors.push(`Resume too short: ${validation.wordCount} words (minimum ${ADVANCED_CONFIG.VALIDATION.MIN_WORD_COUNT})`);
  }
  
  if (validation.charCount < ADVANCED_CONFIG.VALIDATION.MIN_CHAR_COUNT) {
    validation.isValid = false;
    validation.errors.push('Resume content too minimal for processing');
  }
  
  // Token-aware warnings
  if (validation.estimatedTokens > ADVANCED_CONFIG.VALIDATION.MAX_TOKEN_ESTIMATE) {
    validation.warnings.push(`Large content: ~${validation.estimatedTokens} tokens. Will use aggressive chunking.`);
  }
  
  // Check for essential sections
  const sections = ['experience', 'education', 'skill'];
  const foundSections = sections.filter(section => 
    new RegExp(section, 'i').test(text)
  );
  
  if (foundSections.length < 2) {
    validation.warnings.push(`Missing key sections. Found: ${foundSections.join(', ')}`);
  }
  
  return validation;
}

/**
 * Clean extracted text
 */
function cleanExtractedText(text) {
  if (!text) return '';
  
  return text
    .replace(/\\n/g, '\n')  // Handle escaped newlines first
    .replace(/\\r/g, '\r')  // Handle escaped carriage returns
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')  // Only collapse horizontal whitespace, preserve newlines
    .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}
