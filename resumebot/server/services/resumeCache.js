import fs from 'fs';
import crypto from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create cache directory
const CACHE_DIR = join(__dirname, '..', 'cache');
const RESUME_CACHE_DIR = join(CACHE_DIR, 'resumes');
const CHUNK_CACHE_DIR = join(CACHE_DIR, 'chunks');

// Ensure cache directories exist
[CACHE_DIR, RESUME_CACHE_DIR, CHUNK_CACHE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Generate a hash for file content to use as cache key
 * @param {Buffer} buffer - File buffer
 * @param {string} targetRole - Target role for optimization
 * @returns {string} Hash key
 */
function generateCacheKey(buffer, targetRole) {
  const hasher = crypto.createHash('sha256');
  hasher.update(buffer);
  hasher.update(targetRole);
  return hasher.digest('hex');
}

/**
 * Cache parsed resume text
 * @param {string} cacheKey - Unique cache key
 * @param {string} text - Parsed text content
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<void>}
 */
export async function cacheResumeText(cacheKey, text, metadata = {}) {
  try {
    const cacheData = {
      text,
      metadata: {
        ...metadata,
        cachedAt: new Date().toISOString(),
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
        charCount: text.length
      }
    };

    const cachePath = join(RESUME_CACHE_DIR, `${cacheKey}.json`);
    await fs.promises.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
    
    console.log(` Cached resume text: ${cacheKey} (${cacheData.metadata.charCount} chars)`);
  } catch (error) {
    console.error('Failed to cache resume text:', error.message);
    // Don't throw - caching is not critical
  }
}

/**
 * Retrieve cached resume text
 * @param {string} cacheKey - Cache key
 * @returns {Promise<Object|null>} Cached data or null if not found
 */
export async function getCachedResumeText(cacheKey) {
  try {
    const cachePath = join(RESUME_CACHE_DIR, `${cacheKey}.json`);
    
    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const cacheData = JSON.parse(await fs.promises.readFile(cachePath, 'utf8'));
    console.log(` Retrieved cached resume: ${cacheKey}`);
    
    return cacheData;
  } catch (error) {
    console.error('Failed to retrieve cached resume:', error.message);
    return null;
  }
}

/**
 * Chunk text into smaller, semantically meaningful pieces
 * @param {string} text - Full text to chunk
 * @param {Object} options - Chunking options
 * @returns {Array<Object>} Array of text chunks with metadata
 */
export function chunkResumeText(text, options = {}) {
  const {
    maxChunkSize = 800, // Characters per chunk
    overlap = 100,      // Character overlap between chunks
    preserveSections = true
  } = options;

  const chunks = [];
  
  if (preserveSections) {
    // Split by common resume sections first
    const sectionPatterns = [
      /(?:^|\n)(?:PROFESSIONAL\s+SUMMARY|SUMMARY|OBJECTIVE)/i,
      /(?:^|\n)(?:EXPERIENCE|WORK\s+EXPERIENCE|PROFESSIONAL\s+EXPERIENCE)/i,
      /(?:^|\n)(?:EDUCATION|ACADEMIC\s+BACKGROUND)/i,
      /(?:^|\n)(?:SKILLS|TECHNICAL\s+SKILLS|CORE\s+COMPETENCIES)/i,
      /(?:^|\n)(?:PROJECTS|KEY\s+PROJECTS|NOTABLE\s+PROJECTS)/i,
      /(?:^|\n)(?:CERTIFICATIONS|LICENSES|AWARDS)/i,
      /(?:^|\n)(?:CONTACT|CONTACT\s+INFORMATION)/i
    ];

    let remainingText = text;
    let currentPosition = 0;

    // Find section boundaries
    const sections = [];
    const sectionMatches = [];

    sectionPatterns.forEach(pattern => {
      const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
      matches.forEach(match => {
        sectionMatches.push({
          index: match.index,
          text: match[0],
          pattern
        });
      });
    });

    // Sort by position
    sectionMatches.sort((a, b) => a.index - b.index);

    // Create sections
    for (let i = 0; i < sectionMatches.length; i++) {
      const start = i === 0 ? 0 : sectionMatches[i].index;
      const end = i < sectionMatches.length - 1 ? sectionMatches[i + 1].index : text.length;
      
      const sectionText = text.slice(start, end).trim();
      if (sectionText.length > 0) {
        sections.push({
          text: sectionText,
          type: 'section',
          sectionHeader: sectionMatches[i]?.text.trim() || 'header',
          startIndex: start,
          endIndex: end
        });
      }
    }

    // If no sections found, treat as single section
    if (sections.length === 0) {
      sections.push({
        text: text.trim(),
        type: 'content',
        sectionHeader: 'resume',
        startIndex: 0,
        endIndex: text.length
      });
    }

    // Chunk each section if too large
    sections.forEach((section, sectionIndex) => {
      if (section.text.length <= maxChunkSize) {
        chunks.push({
          id: `section_${sectionIndex}`,
          text: section.text,
          type: section.type,
          section: section.sectionHeader,
          wordCount: section.text.split(/\s+/).filter(w => w.length > 0).length,
          charCount: section.text.length,
          chunkIndex: chunks.length
        });
      } else {
        // Split large sections into smaller chunks
        const sectionChunks = createOverlappingChunks(section.text, maxChunkSize, overlap);
        sectionChunks.forEach((chunkText, chunkIndex) => {
          chunks.push({
            id: `section_${sectionIndex}_chunk_${chunkIndex}`,
            text: chunkText,
            type: 'section_chunk',
            section: section.sectionHeader,
            wordCount: chunkText.split(/\s+/).filter(w => w.length > 0).length,
            charCount: chunkText.length,
            chunkIndex: chunks.length,
            parentSection: sectionIndex
          });
        });
      }
    });
  } else {
    // Simple chunking without section awareness
    const simpleChunks = createOverlappingChunks(text, maxChunkSize, overlap);
    simpleChunks.forEach((chunkText, index) => {
      chunks.push({
        id: `chunk_${index}`,
        text: chunkText,
        type: 'simple_chunk',
        section: 'content',
        wordCount: chunkText.split(/\s+/).filter(w => w.length > 0).length,
        charCount: chunkText.length,
        chunkIndex: index
      });
    });
  }

  console.log(` Created ${chunks.length} chunks from ${text.length} characters`);
  return chunks;
}

/**
 * Create overlapping chunks from text
 * @param {string} text - Text to chunk
 * @param {number} maxSize - Maximum chunk size
 * @param {number} overlap - Overlap size
 * @returns {Array<string>} Array of chunk texts
 */
function createOverlappingChunks(text, maxSize, overlap) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxSize, text.length);
    
    // Try to end at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const lastSpace = text.lastIndexOf(' ', end);
      
      const bestEnd = Math.max(lastPeriod, lastNewline, lastSpace);
      if (bestEnd > start + maxSize * 0.5) { // Don't make chunks too small
        end = bestEnd + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    
    // Move start forward, accounting for overlap
    start = Math.max(start + maxSize - overlap, end);
    
    if (start >= text.length) break;
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Cache resume chunks
 * @param {string} cacheKey - Cache key
 * @param {Array} chunks - Resume chunks
 * @returns {Promise<void>}
 */
export async function cacheResumeChunks(cacheKey, chunks) {
  try {
    const chunkData = {
      chunks,
      metadata: {
        cachedAt: new Date().toISOString(),
        chunkCount: chunks.length,
        totalChars: chunks.reduce((sum, chunk) => sum + chunk.charCount, 0),
        totalWords: chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0)
      }
    };

    const cachePath = join(CHUNK_CACHE_DIR, `${cacheKey}_chunks.json`);
    await fs.promises.writeFile(cachePath, JSON.stringify(chunkData, null, 2));
    
    console.log(` Cached ${chunks.length} resume chunks: ${cacheKey}`);
  } catch (error) {
    console.error('Failed to cache resume chunks:', error.message);
  }
}

/**
 * Get cached resume chunks
 * @param {string} cacheKey - Cache key
 * @returns {Promise<Array|null>} Cached chunks or null
 */
export async function getCachedResumeChunks(cacheKey) {
  try {
    const cachePath = join(CHUNK_CACHE_DIR, `${cacheKey}_chunks.json`);
    
    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const chunkData = JSON.parse(await fs.promises.readFile(cachePath, 'utf8'));
    console.log(` Retrieved ${chunkData.chunks.length} cached chunks: ${cacheKey}`);
    
    return chunkData.chunks;
  } catch (error) {
    console.error('Failed to retrieve cached chunks:', error.message);
    return null;
  }
}

/**
 * Select relevant chunks based on target role
 * @param {Array} chunks - All resume chunks
 * @param {string} targetRole - Target role
 * @param {Object} options - Selection options
 * @returns {Array} Relevant chunks
 */
export function selectRelevantChunks(chunks, targetRole, options = {}) {
  const {
    maxChunks = 5,
    minRelevanceScore = 0.1,
    prioritizeSections = ['experience', 'skills', 'projects', 'summary']
  } = options;

  // Get role-specific keywords for scoring
  const roleKeywords = getRoleKeywords(targetRole);
  
  // Score each chunk
  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const text = chunk.text.toLowerCase();
    
    // Keyword matching score
    const keywordMatches = roleKeywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).length;
    score += keywordMatches * 0.3;
    
    // Section priority score
    const sectionName = chunk.section.toLowerCase();
    const sectionPriority = prioritizeSections.findIndex(priority => 
      sectionName.includes(priority)
    );
    if (sectionPriority !== -1) {
      score += (prioritizeSections.length - sectionPriority) * 0.2;
    }
    
    // Length normalization (prefer substantial chunks)
    if (chunk.wordCount > 20) {
      score += 0.1;
    }
    if (chunk.wordCount > 50) {
      score += 0.1;
    }
    
    return {
      ...chunk,
      relevanceScore: score
    };
  });

  // Sort by relevance and return top chunks
  const selectedChunks = scoredChunks
    .filter(chunk => chunk.relevanceScore >= minRelevanceScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxChunks);

  console.log(` Selected ${selectedChunks.length} relevant chunks for ${targetRole}`);
  console.log(' Chunk scores:', selectedChunks.map(c => ({
    section: c.section,
    score: c.relevanceScore.toFixed(2),
    words: c.wordCount
  })));

  return selectedChunks;
}

/**
 * Get role-specific keywords for scoring
 * @param {string} targetRole - Target role
 * @returns {Array<string>} Array of keywords
 */
function getRoleKeywords(targetRole) {
  const roleKeywords = {
    'software-engineer': [
      'javascript', 'python', 'react', 'node', 'api', 'database', 'git', 'agile', 
      'programming', 'development', 'software', 'web', 'frontend', 'backend'
    ],
    'data-scientist': [
      'python', 'r', 'sql', 'machine learning', 'statistics', 'pandas', 'numpy',
      'tensorflow', 'data analysis', 'modeling', 'visualization', 'research'
    ],
    'product-manager': [
      'product', 'strategy', 'roadmap', 'stakeholder', 'user', 'market', 'agile',
      'scrum', 'requirements', 'analytics', 'metrics', 'launch', 'growth'
    ],
    'marketing-manager': [
      'marketing', 'campaign', 'brand', 'digital', 'social media', 'analytics',
      'seo', 'content', 'advertising', 'lead generation', 'conversion', 'roi'
    ]
  };

  return roleKeywords[targetRole] || roleKeywords['software-engineer'];
}

/**
 * Generate cache key from file buffer and target role
 * @param {Buffer} fileBuffer - File content buffer
 * @param {string} targetRole - Target role
 * @returns {string} Cache key
 */
export function generateResumeKey(fileBuffer, targetRole) {
  return generateCacheKey(fileBuffer, targetRole);
}

/**
 * Clean old cache files (older than specified days)
 * @param {number} maxAgeDays - Maximum age in days
 * @returns {Promise<void>}
 */
export async function cleanOldCache(maxAgeDays = 7) {
  try {
    const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    
    for (const cacheDir of [RESUME_CACHE_DIR, CHUNK_CACHE_DIR]) {
      const files = await fs.promises.readdir(cacheDir);
      
      for (const file of files) {
        const filePath = join(cacheDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.promises.unlink(filePath);
          console.log(` Cleaned old cache file: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to clean cache:', error.message);
  }
}
