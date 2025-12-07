import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  ZoomIn,
  Calendar,
  Camera,
  Image as ImageIcon,
  Maximize2,
  SlidersHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  photoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  photoType: string;
  serviceType?: string;
  takenAt?: string;
  createdAt?: string;
  beforePhotoUrl?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  loading?: boolean;
  emptyMessage?: string;
  showBeforeAfter?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  before: "Before",
  after: "After",
  transformation: "Transformation",
  result: "Result",
  inspiration: "Inspiration",
  progress: "Progress",
};

const PHOTO_TYPE_COLORS: Record<string, string> = {
  before: "bg-orange-100 text-orange-700",
  after: "bg-green-100 text-green-700",
  transformation: "bg-purple-100 text-purple-700",
  result: "bg-blue-100 text-blue-700",
  inspiration: "bg-pink-100 text-pink-700",
  progress: "bg-amber-100 text-amber-700",
};

export function PhotoGallery({
  photos,
  loading = false,
  emptyMessage = "No photos yet",
  showBeforeAfter = true,
  columns = 3,
  className,
}: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  const currentPhoto = photos[currentIndex];

  const handleOpenLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    setCompareMode(false);
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setCompareMode(false);
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setCompareMode(false);
  }, [photos.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setLightboxOpen(false);
    },
    [lightboxOpen, handlePrevious, handleNext]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (url: string, filename: string) => {
    setDownloadError(null);
    try {
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Download failed");
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename || "photo.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadError("Failed to download image");
      setTimeout(() => setDownloadError(null), 3000);
    }
  };

  const handleImageLoad = (id: string) => {
    setImageLoaded((prev) => ({ ...prev, [id]: true }));
  };

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  if (loading) {
    return (
      <div className={cn("grid gap-3", gridCols[columns], className)}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Camera className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
        <p className="text-gray-400 text-xs mt-1">
          Your transformation photos will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid gap-3", gridCols[columns], className)}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
            onClick={() => handleOpenLightbox(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleOpenLightbox(index)}
            aria-label={`View photo ${index + 1}: ${photo.caption || photo.photoType}`}
          >
            {!imageLoaded[photo.id] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-300 animate-pulse" />
              </div>
            )}
            <img
              src={photo.thumbnailUrl || photo.photoUrl}
              alt={photo.caption || `Beauty transformation ${index + 1}`}
              className={cn(
                "w-full h-full object-cover transition-all duration-500 group-hover:scale-110",
                imageLoaded[photo.id] ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              onLoad={() => handleImageLoad(photo.id)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <Badge
                className={cn(
                  "text-xs font-medium",
                  PHOTO_TYPE_COLORS[photo.photoType] || "bg-gray-100 text-gray-700"
                )}
              >
                {PHOTO_TYPE_LABELS[photo.photoType] || photo.photoType}
              </Badge>
              {photo.serviceType && (
                <p className="text-white text-xs mt-1 truncate">
                  {photo.serviceType}
                </p>
              )}
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Maximize2 className="w-4 h-4 text-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                <Badge
                  className={cn(
                    "text-xs",
                    currentPhoto &&
                      (PHOTO_TYPE_COLORS[currentPhoto.photoType] ||
                        "bg-gray-100 text-gray-700")
                  )}
                >
                  {currentPhoto &&
                    (PHOTO_TYPE_LABELS[currentPhoto.photoType] ||
                      currentPhoto.photoType)}
                </Badge>
                {currentPhoto?.takenAt && (
                  <span className="text-white/80 text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(currentPhoto.takenAt), "MMM d, yyyy")}
                  </span>
                )}
                <span className="text-white/60 text-sm">
                  {currentIndex + 1} / {photos.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {showBeforeAfter && currentPhoto?.beforePhotoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-white hover:bg-white/20",
                      compareMode && "bg-white/20"
                    )}
                    onClick={() => setCompareMode(!compareMode)}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Compare
                  </Button>
                )}
                {currentPhoto && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() =>
                      handleDownload(
                        currentPhoto.photoUrl,
                        `beauty-${currentPhoto.id}.jpg`
                      )
                    }
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setLightboxOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {downloadError && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 px-4 py-2 bg-red-500 text-white text-sm rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
                {downloadError}
              </div>
            )}

            <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-24">
              {compareMode && currentPhoto?.beforePhotoUrl ? (
                <div className="relative w-full max-w-3xl aspect-[4/3] overflow-hidden rounded-lg">
                  <img
                    src={currentPhoto.beforePhotoUrl}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${comparePosition}%` }}
                  >
                    <img
                      src={currentPhoto.photoUrl}
                      alt="After"
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ width: `${10000 / comparePosition}%` }}
                    />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                    style={{ left: `${comparePosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={comparePosition}
                    onChange={(e) => setComparePosition(Number(e.target.value))}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-48 accent-purple-600"
                    aria-label="Comparison slider"
                  />
                  <div className="absolute bottom-16 left-4 px-2 py-1 bg-black/60 rounded text-white text-xs">
                    Before
                  </div>
                  <div className="absolute bottom-16 right-4 px-2 py-1 bg-black/60 rounded text-white text-xs">
                    After
                  </div>
                </div>
              ) : (
                currentPhoto && (
                  <img
                    src={currentPhoto.photoUrl}
                    alt={currentPhoto.caption || "Beauty transformation"}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                )
              )}
            </div>

            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                  onClick={handlePrevious}
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                  onClick={handleNext}
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {currentPhoto?.caption && (
                <p className="text-white text-center mb-3">
                  {currentPhoto.caption}
                </p>
              )}
              {currentPhoto?.serviceType && (
                <p className="text-white/70 text-sm text-center">
                  Service: {currentPhoto.serviceType}
                </p>
              )}
              <ScrollArea className="w-full mt-3">
                <div className="flex gap-2 justify-center pb-2">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => {
                        setCurrentIndex(index);
                        setCompareMode(false);
                      }}
                      className={cn(
                        "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                        index === currentIndex
                          ? "border-purple-500 ring-2 ring-purple-500/50"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img
                        src={photo.thumbnailUrl || photo.photoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
