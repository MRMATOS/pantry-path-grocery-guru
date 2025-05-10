
// Type declaration for Tesseract from CDN
declare const Tesseract: any;

/**
 * Applies preprocessing to an image before OCR to improve recognition quality
 */
async function preprocessImage(imageFile: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Apply increased contrast
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply contrast and grayscale
      const contrast = 150; // Increased contrast value
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Apply contrast to grayscale value
        const newValue = Math.round(factor * (gray - 128) + 128);
        
        // Set RGB to the same value for grayscale with contrast
        data[i] = newValue;
        data[i + 1] = newValue;
        data[i + 2] = newValue;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Enhanced version of text extraction that applies preprocessing
 */
export async function extractTextFromImage(imageFile: File): Promise<string | null> {
  try {
    // Preprocess image for better OCR
    const processedCanvas = await preprocessImage(imageFile);
    
    console.log('Starting OCR processing...');
    
    // Configure Tesseract with optimized settings
    const result = await Tesseract.recognize(
      processedCanvas,
      'por',
      { 
        logger: (progress: any) => console.log(progress),
        tesseract: {
          // PSM 6: Assume a single uniform block of text
          pageseg_mode: '6',
          // Whitelist alphanumeric chars + space
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ',
        }
      }
    );
    
    console.log('OCR processing completed');
    console.log('Extracted text:', result.data.text);
    
    return result.data.text;
  } catch (error) {
    console.error("Erro no OCR:", error);
    return null;
  }
}

// Extract the relevant section from receipt text
function extractRelevantSection(text: string): string {
  const lines = text.split('\n');
  
  // Markers to identify the product section in receipts
  const startMarker = /(Descricao|QrUn|Vir Tot|ITEM|CODIGO|DESCRIÇÃO|VALOR)/i;
  const endMarker = /(total de itens|Valor total|TOTAL|Sub-?Total)/i;
  
  let inSection = false;
  const relevantLines = lines.filter(line => {
    // Start collecting lines after a start marker
    if (startMarker.test(line)) {
      inSection = true;
      return false; // Skip the header line
    }
    
    // Stop when end marker is found
    if (endMarker.test(line)) {
      inSection = false;
    }
    
    return inSection;
  });
  
  const result = relevantLines.join('\n');
  console.log('Relevant section extracted:', result);
  return result;
}

// Dictionary for common product name corrections
const productCorrections: Record<string, string> = {
  'CAFE': 'Café',
  'MELTITA': 'Melitta',
  'TRADICION': 'Tradicional',
  'ACUCAR': 'Açúcar',
  'LEITE': 'Leite',
  'FARINHA': 'Farinha',
  'PAO': 'Pão',
  'FILTRO': 'Filtro',
  'PAPEL': 'Papel',
  'BOM JESU': 'Bom Jesus',
  'BISCOITO': 'Biscoito',
  'MACARRAO': 'Macarrão',
  'FEIJAO': 'Feijão',
  'ARROZ': 'Arroz'
};

// Normalize text by removing accents, converting to lowercase
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Enhanced product name normalization with corrections
function normalizeProductName(rawName: string): string {
  const words = rawName.toUpperCase().split(' ');
  
  const correctedWords = words.map(word => 
    productCorrections[word] || word.toLowerCase()
  );
  
  return correctedWords.join(' ');
}

// Enhanced product extraction from receipt text
export function processOcrText(text: string): string[] {
  if (!text) return [];
  
  console.log('Processing OCR text...');
  
  // First, extract the relevant section of the receipt
  const relevantText = extractRelevantSection(text);
  
  // Improved pattern to catch products with EAN codes
  const productPattern = /(?:\b\d{13}\b)(?:\s+)([A-Z][A-Z\s]+?)(?=\s{2,}\d|\s*UN|$)/g;
  // Fallback pattern for when EAN codes aren't detected
  const fallbackPattern = /^([A-Z][A-Z\s]{2,})(?:\s{2,}|\s+\d|\s+UN)/gm;
  
  const products = new Set<string>();
  
  // Try product pattern with EAN codes
  let match;
  while ((match = productPattern.exec(relevantText)) !== null) {
    const productName = normalizeProductName(match[1].trim());
    if (productName.length > 2) {
      products.add(productName);
      console.log('Found product with EAN:', productName);
    }
  }
  
  // If no matches found with EAN pattern, try fallback pattern
  if (products.size === 0) {
    console.log('No products found with EAN pattern, trying fallback...');
    const lines = relevantText.split('\n');
    
    lines.forEach(line => {
      const words = line.trim().split(/\s{2,}/);
      // First segment in a line with multiple segments is often the product name
      if (words.length >= 2 && words[0].length > 3) {
        const possibleProduct = normalizeProductName(words[0].trim());
        if (possibleProduct.length > 2 && !/^\d+$/.test(possibleProduct)) {
          products.add(possibleProduct);
          console.log('Found product with fallback pattern 1:', possibleProduct);
        }
      }
    });
    
    // Still no matches? Try more aggressive pattern
    if (products.size === 0) {
      console.log('No products found with fallback pattern 1, trying fallback pattern 2...');
      while ((match = fallbackPattern.exec(relevantText)) !== null) {
        const productName = normalizeProductName(match[1].trim());
        if (productName.length > 2) {
          products.add(productName);
          console.log('Found product with fallback pattern 2:', productName);
        }
      }
    }
  }
  
  // Filter out common receipt terms and return unique products
  const result = [...products]
    .filter(word => {
      // Filter out common receipt terms
      const lowercaseWord = word.toLowerCase();
      const irrelevantTerms = [
        "total", "subtotal", "r$", "rs", "reais", "centavos", 
        "quantidade", "qtd", "valor", "preço", "preco", "data", 
        "hora", "nf", "nota", "fiscal", "cnpj", "cpf", "estabelecimento",
        "loja", "mercado", "supermercado", "caixa", "item", "cod", "codigo",
        "descricao", "un", "unid", "unidade", "kg", "g", "mg", "l", "ml"
      ];
      
      // Filter out numeric values and dates
      const isNumeric = /^\d+([,.]\d+)?$/.test(lowercaseWord);
      const isDate = /^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(lowercaseWord);
      
      return lowercaseWord.length > 2 &&
        !irrelevantTerms.some(term => lowercaseWord.includes(term)) && 
        !isNumeric && 
        !isDate;
    });
  
  console.log('Final extracted products:', result);
  return result;
}
