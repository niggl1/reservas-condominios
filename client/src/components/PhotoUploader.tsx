import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, ImagePlus, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
  className?: string;
}

const MAX_FILE_SIZE_MB = 100; // Limite máximo de 100MB por arquivo
const TARGET_SIZE_KB = 500; // Tamanho alvo após compressão

export function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 10,
  maxSizeMB = MAX_FILE_SIZE_MB,
  className,
}: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Redimensionar se muito grande
          const MAX_DIMENSION = 1920;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_DIMENSION;
              width = MAX_DIMENSION;
            } else {
              width = (width / height) * MAX_DIMENSION;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Não foi possível criar contexto do canvas"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Comprimir com qualidade progressiva
          let quality = 0.9;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);

          // Reduzir qualidade até atingir tamanho alvo
          while (dataUrl.length > TARGET_SIZE_KB * 1024 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Erro ao carregar imagem"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Verificar limite de fotos
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Limite máximo de ${maxPhotos} fotos atingido`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.warning(`Apenas ${remainingSlots} foto(s) serão adicionadas`);
    }

    setIsUploading(true);
    setUploadProgress(0);

    const newPhotos: string[] = [];
    let processed = 0;

    for (const file of filesToProcess) {
      // Verificar tamanho do arquivo
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        toast.error(`Arquivo ${file.name} excede o limite de ${maxSizeMB}MB`);
        continue;
      }

      // Verificar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast.error(`Arquivo ${file.name} não é uma imagem válida`);
        continue;
      }

      try {
        const compressedImage = await compressImage(file);
        newPhotos.push(compressedImage);
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        toast.error(`Erro ao processar ${file.name}`);
      }

      processed++;
      setUploadProgress((processed / filesToProcess.length) * 100);
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
      toast.success(`${newPhotos.length} foto(s) adicionada(s)`);
    }

    setIsUploading(false);
    setUploadProgress(0);

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
    toast.success("Foto removida");
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= photos.length) return;
    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    onChange(newPhotos);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50 hover:bg-muted/50",
          isUploading && "pointer-events-none opacity-70"
        )}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <div className="p-8 text-center">
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Processando imagens...
                </p>
                <Progress value={uploadProgress} className="h-2 max-w-xs mx-auto" />
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Clique para adicionar fotos
              </p>
              <p className="text-xs text-muted-foreground">
                ou arraste e solte aqui
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Máximo {maxPhotos} fotos • Até {maxSizeMB}MB cada
              </p>
            </>
          )}
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {/* Move left */}
                {index > 0 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      movePhoto(index, index - 1);
                    }}
                  >
                    ←
                  </Button>
                )}

                {/* Remove */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Move right */}
                {index < photos.length - 1 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      movePhoto(index, index + 1);
                    }}
                  >
                    →
                  </Button>
                )}
              </div>

              {/* Photo number badge */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {index + 1}
              </div>

              {/* Main photo indicator */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  Principal
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          {photos.length < maxPhotos && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Adicionar</span>
            </button>
          )}
        </div>
      )}

      {/* Info message */}
      {photos.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p>A primeira foto será usada como imagem principal da área.</p>
            <p>Arraste as fotos para reordenar ou use os botões de seta.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoUploader;
