import crypto from 'crypto';

interface TempImage {
  id: string;
  buffer: Buffer;
  mimeType: string;
  uploadedAt: number;
  expiresAt: number;
}

class TempImageStorage {
  private images: Map<string, TempImage> = new Map();
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour
  private readonly MAX_SIZE_MB = 10;
  private readonly MAX_SIZE_BYTES = this.MAX_SIZE_MB * 1024 * 1024;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.removeExpired();
    }, 5 * 60 * 1000); // Run cleanup every 5 minutes
  }

  private removeExpired() {
    const now = Date.now();
    let removedCount = 0;

    const entries = Array.from(this.images.entries());
    for (const [id, image] of entries) {
      if (now > image.expiresAt) {
        this.images.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`[TempImageStorage] Cleaned up ${removedCount} expired images. Remaining: ${this.images.size}`);
    }
  }

  uploadImage(buffer: Buffer, mimeType: string, baseUrl?: string): { publicUrl: string; imageId: string; expiresAt: number } {
    if (buffer.length > this.MAX_SIZE_BYTES) {
      throw new Error(`Image size exceeds maximum allowed size of ${this.MAX_SIZE_MB}MB`);
    }

    const id = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const expiresAt = now + this.TTL_MS;

    const image: TempImage = {
      id,
      buffer,
      mimeType,
      uploadedAt: now,
      expiresAt,
    };

    this.images.set(id, image);
    console.log(`[TempImageStorage] Uploaded image ${id}, size: ${(buffer.length / 1024).toFixed(2)}KB, expires in 1 hour. Total images: ${this.images.size}`);

    // Use provided baseUrl or fallback to REPLIT_DEV_DOMAIN or localhost
    const finalBaseUrl = baseUrl || (process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:5000');

    return {
      publicUrl: `${finalBaseUrl}/api/temp-images/${id}`,
      imageId: id,
      expiresAt,
    };
  }

  getImage(id: string): { buffer: Buffer; mimeType: string } | null {
    const image = this.images.get(id);
    
    if (!image) {
      return null;
    }

    const now = Date.now();
    if (now > image.expiresAt) {
      this.images.delete(id);
      console.log(`[TempImageStorage] Image ${id} expired, removed from cache`);
      return null;
    }

    return {
      buffer: image.buffer,
      mimeType: image.mimeType,
    };
  }

  deleteImage(id: string): boolean {
    return this.images.delete(id);
  }

  getStats() {
    return {
      totalImages: this.images.size,
      totalSizeKB: Array.from(this.images.values())
        .reduce((sum, img) => sum + img.buffer.length, 0) / 1024,
    };
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const tempImageStorage = new TempImageStorage();
