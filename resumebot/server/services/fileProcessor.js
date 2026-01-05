import fs from 'fs';
import mammoth from 'mammoth';
import { createRequire } from 'module';

// Use createRequire to import CommonJS module in ESM
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extract text content from uploaded resume files
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromFile(filePath, mimeType) {
  try {
    console.log(` Processing file: ${filePath} (${mimeType})`);
    const fileBuffer = fs.readFileSync(filePath);
    console.log(` File size: ${fileBuffer.length} bytes`);
    
    // Auto-detect if it's actually plain text despite the MIME type
    const isPlainText = isTextFile(fileBuffer);
    if (isPlainText && mimeType === 'application/pdf') {
      console.log(' File appears to be plain text despite PDF MIME type');
      return fileBuffer.toString('utf8');
    }
    
    switch (mimeType) {
      case 'application/pdf':
        try {
          return await extractTextFromPDF(fileBuffer);
        } catch (pdfError) {
          console.warn('PDF parsing failed, trying alternative approach:', pdfError.message);
          // Fallback: check if it's actually text content misidentified as PDF
          if (isPlainText) {
            console.log(' PDF parsing failed, but content appears to be text. Using as plain text.');
            return fileBuffer.toString('utf8');
          }
          // Re-throw the original error
          throw pdfError;
        }
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await extractTextFromWord(fileBuffer);
      
      case 'text/plain':
        return fileBuffer.toString('utf8');
      
      default:
        // Try to detect if it's actually text
        if (isPlainText) {
          console.log(` Treating ${mimeType} as plain text`);
          return fileBuffer.toString('utf8');
        }
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('File processing error:', error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}

/**
 * Check if a buffer contains plain text
 * @param {Buffer} buffer - File buffer
 * @returns {boolean} True if it appears to be plain text
 */
function isTextFile(buffer) {
  // Check first 512 bytes for binary content
  const sample = buffer.slice(0, Math.min(512, buffer.length));
  
  // Count printable ASCII characters
  let printableCount = 0;
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    // Printable ASCII (32-126) + common whitespace (9,10,13)
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      printableCount++;
    }
  }
  
  // If >80% of bytes are printable, consider it text
  const ratio = printableCount / sample.length;
  return ratio > 0.8;
}

/**
 * Extract text from PDF files using pdfjs-dist
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPDF(buffer) {
  try {
    console.log(' Starting PDF parsing...');
    
    // Import pdfjs-dist for Node.js environment
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Disable worker for Node.js environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = null;
    
    // Configure for Node.js environment (no canvas required)
    const pdf = await pdfjsLib.getDocument({
      data: buffer,
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0 // Suppress warnings
    }).promise;
    
    let fullText = '';
    console.log(` Processing PDF with ${pdf.numPages} pages`);
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Enhanced text extraction with structure preservation
      const lines = new Map();
      
      // Group text items by Y coordinate (line detection)
      textContent.items.forEach(item => {
        const y = Math.round(item.transform[5]); // Y coordinate
        if (!lines.has(y)) {
          lines.set(y, []);
        }
        lines.get(y).push({
          text: item.str,
          x: item.transform[4] // X coordinate for sorting
        });
      });
      
      // Sort lines by Y coordinate (top to bottom)
      const sortedYCoords = Array.from(lines.keys()).sort((a, b) => b - a);
      
      // Process each line with proper spacing
      sortedYCoords.forEach(y => {
        const lineItems = lines.get(y);
        // Sort items in line by X coordinate (left to right)
        lineItems.sort((a, b) => a.x - b.x);
        
        // Join text items in the line with appropriate spacing
        const lineText = lineItems
          .map(item => item.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (lineText) {
          fullText += lineText + '\n';
        }
      });
      
      // Add page break indicator for multi-page resumes
      if (i < pdf.numPages) {
        fullText += '\n--- PAGE BREAK ---\n\n';
      }
    }
    
    const result = fullText.trim();
    console.log(` Total extracted text: ${result.length} characters`);
    
    if (!result || result.length === 0) {
      throw new Error('No readable text found in PDF. The PDF might be image-based or corrupted.');
    }
    
    return result;
  } catch (error) {
    console.error(' PDF parsing error:', error.message);
    throw error;
  }
}

/**
 * Extract text from Word documents (.doc and .docx)
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromWord(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Word document parsing error:', error);
    throw new Error('Failed to parse Word document. Please ensure the document contains readable text.');
  }
}

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw extracted text
 * @returns {string} Cleaned text
 */
export function cleanExtractedText(text) {
  if (!text) return '';

  return text
    // Remove special characters that might interfere with processing
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove multiple consecutive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Clean up excessive spaces within lines but preserve line structure
    .replace(/[ \t]+/g, ' ')
    // Remove trailing spaces from each line
    .replace(/[ \t]+$/gm, '')
    // Trim whitespace
    .trim();
}

/**
 * Validate extracted resume text
 * @param {string} text - Extracted text
 * @returns {Object} Validation result
 */
export function validateResumeText(text) {
  const cleanedText = cleanExtractedText(text);
  
  const validation = {
    isValid: true,
    wordCount: 0,
    errors: [],
    warnings: []
  };

  // Only fail if truly empty or no content
  if (!cleanedText || cleanedText.trim().length === 0) {
    validation.isValid = false;
    validation.errors.push('No readable text found in the document');
    return validation;
  }

  // Count words
  validation.wordCount = cleanedText.split(/\s+/).filter(word => word.length > 0).length;

  // Only block extremely short content (less than 3 words is clearly not a resume)
  if (validation.wordCount < 3) {
    validation.isValid = false;
    validation.errors.push('Content is too short to be a valid resume');
    return validation;
  }

  // Only block extremely long content (over 10,000 words is likely corrupted)
  if (validation.wordCount > 10000) {
    validation.isValid = false;
    validation.errors.push('Content is too long. Please upload a concise resume with less than 10,000 words.');
    return validation;
  }

  // Everything below this point is WARNINGS, not blocking errors
  
  // Warn about short resumes but don't block them
  if (validation.wordCount < 50) {
    validation.warnings.push(`Resume appears short (${validation.wordCount} words). Consider adding more details for better optimization.`);
  }

  // Look for common resume indicators (more flexible patterns)
  const resumeIndicators = [
    /experience|work|job|position|role|employed|company/i,
    /education|degree|university|college|school|graduated/i,
    /skills|technical|programming|software|languages/i,
    /@|email|phone|contact|linkedin|github/i,
    /project|portfolio|achievement|award|certification/i
  ];

  const foundIndicators = resumeIndicators.filter(pattern => pattern.test(cleanedText)).length;
  
  // Warn but don't block if we don't find typical resume sections
  if (foundIndicators < 2) {
    validation.warnings.push('Resume may benefit from adding standard sections (experience, education, skills, contact info).');
  }

  // Log warnings for debugging but keep isValid = true
  if (validation.warnings.length > 0) {
    console.log(' Resume validation warnings:', validation.warnings.join('; '));
  }

  return validation;
}

export async function exportTextFromPdfInRedableFormat(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}
