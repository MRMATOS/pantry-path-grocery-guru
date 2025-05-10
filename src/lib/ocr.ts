
// Type declaration for Tesseract from CDN
declare const Tesseract: any;

export async function extractTextFromImage(imageFile: File): Promise<string | null> {
  try {
    const result = await Tesseract.recognize(
      imageFile,
      'por',
      { logger: progress => console.log(progress) }
    );
    return result.data.text;
  } catch (error) {
    console.error("Erro no OCR:", error);
    return null;
  }
}

// Normalize text by removing accents, converting to lowercase
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Process the OCR text into an array of potential product names
export function processOcrText(text: string): string[] {
  if (!text) return [];
  
  // Split by common delimiters in receipts
  const words = text
    .split(/[\n\r\t,;]/g)
    .map(word => word.trim())
    .filter(word => word.length > 2) // Filter out very short words
    .filter(word => {
      // Filter out common receipt terms
      const lowercaseWord = word.toLowerCase();
      const irrelevantTerms = [
        "total", "subtotal", "r$", "rs", "reais", "centavos", 
        "quantidade", "qtd", "valor", "preço", "preco", "data", 
        "hora", "nf", "nota", "fiscal", "cnpj", "cpf", "estabelecimento",
        "loja", "mercado", "supermercado", "caixa"
      ];
      
      // Filter out numeric values and dates
      const isNumeric = /^\d+([,.]\d+)?$/.test(lowercaseWord);
      const isDate = /^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(lowercaseWord);
      
      return !irrelevantTerms.some(term => lowercaseWord.includes(term)) && 
             !isNumeric && 
             !isDate;
    });
    
  return [...new Set(words)]; // Remove duplicates
}
