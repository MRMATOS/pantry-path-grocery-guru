
import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractTextFromImage, processOcrText } from '@/lib/ocr';
import { toast } from 'sonner';

interface CameraUploadProps {
  onTextExtracted: (products: string[]) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

const CameraUpload: React.FC<CameraUploadProps> = ({ 
  onTextExtracted, 
  isProcessing, 
  setIsProcessing 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessImage = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast.error("Por favor, selecione uma imagem primeiro");
      return;
    }

    setIsProcessing(true);
    
    try {
      const file = fileInputRef.current.files[0];
      toast.info("Processando cupom fiscal...");
      
      const extractedText = await extractTextFromImage(file);
      if (!extractedText) {
        toast.error("Não foi possível extrair texto da imagem");
        return;
      }
      
      console.log("Texto extraído do cupom:", extractedText);
      
      const processedWords = processOcrText(extractedText);
      if (processedWords.length === 0) {
        toast.error("Nenhum produto encontrado no cupom");
        return;
      }
      
      console.log("Produtos identificados:", processedWords);
      onTextExtracted(processedWords);
      toast.success(`Extraídos ${processedWords.length} possíveis produtos`);
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      toast.error("Erro ao processar imagem do cupom");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col items-center">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            id="camera-upload"
          />
          
          {selectedImage ? (
            <div className="w-full">
              <div className="relative mb-4 rounded-lg overflow-hidden">
                <img 
                  src={selectedImage} 
                  alt="Cupom selecionado" 
                  className="w-full h-56 object-contain bg-gray-100" 
                />
                <button 
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full"
                >
                  <span className="sr-only">Remover imagem</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <Button 
                onClick={handleProcessImage} 
                className="w-full" 
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Processar Cupom"}
              </Button>
            </div>
          ) : (
            <label 
              htmlFor="camera-upload"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Camera size={48} className="text-gray-400 mb-2" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Clique para tirar uma foto</span> ou enviar uma imagem
                </p>
                <p className="text-xs text-gray-500">
                  Capture seu cupom fiscal para extrair produtos
                </p>
              </div>
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraUpload;
