import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  photos: string[];
  className?: string;
  showThumbnails?: boolean;
  maxThumbnails?: number;
}

export function PhotoGallery({ 
  photos, 
  className,
  showThumbnails = true,
  maxThumbnails = 4
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  if (!photos || photos.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-lg h-48", className)}>
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sem fotos disponíveis</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Main Image */}
        <div 
          className="relative aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer group"
          onClick={() => openLightbox(currentIndex)}
        >
          <img
            src={photos[currentIndex]}
            alt={`Foto ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Zoom indicator */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Photo counter */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>

        {/* Thumbnails */}
        {showThumbnails && photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.slice(0, maxThumbnails).map((photo, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all",
                  currentIndex === index 
                    ? "ring-2 ring-primary ring-offset-2" 
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <img
                  src={photo}
                  alt={`Miniatura ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {photos.length > maxThumbnails && (
              <button
                onClick={() => openLightbox(maxThumbnails)}
                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <span className="text-lg font-semibold text-muted-foreground">
                  +{photos.length - maxThumbnails}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">Galeria de Fotos</DialogTitle>
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Main image */}
            <div className="relative flex items-center justify-center min-h-[60vh] max-h-[80vh]">
              <img
                src={photos[currentIndex]}
                alt={`Foto ${currentIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
              />

              {/* Navigation arrows */}
              {photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12"
                    onClick={goToNext}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnails in lightbox */}
            <div className="flex gap-2 justify-center p-4 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all",
                    currentIndex === index 
                      ? "ring-2 ring-white ring-offset-2 ring-offset-black" 
                      : "opacity-50 hover:opacity-100"
                  )}
                >
                  <img
                    src={photo}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Photo counter */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PhotoGallery;
