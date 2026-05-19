import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from '../supabaseClient';

const isNative = () => Capacitor.isNativePlatform();

const MAX_DIMENSION = 900; // px — good quality on any mobile screen
const JPEG_QUALITY = 0.75; // 75% — sharp enough, ~100–250 KB typical

export interface PhotoResult {
  dataUrl: string;
  blob: Blob;
}

/** Pick and compress a photo from camera or gallery. Returns null if user cancels. */
export async function pickPhoto(source: 'camera' | 'gallery' = 'gallery'): Promise<PhotoResult | null> {
  let rawDataUrl: string | null = null;

  if (isNative()) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        quality: 90, // Capacitor pre-compress; we compress further below
        width: 1600,
      });
      rawDataUrl = photo.dataUrl ?? null;
    } catch {
      return null; // user cancelled
    }
  } else {
    rawDataUrl = await new Promise<string | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (source === 'camera') input.capture = 'environment';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        resolve(await fileToDataUrl(file));
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  if (!rawDataUrl) return null;
  return compressDataUrl(rawDataUrl);
}

/** Compress a data URL to MAX_DIMENSION × JPEG_QUALITY. */
async function compressDataUrl(dataUrl: string): Promise<PhotoResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      let w = width;
      let h = height;

      // Scale down to fit within MAX_DIMENSION
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas compression failed')); return; }
          const compressedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          resolve({ dataUrl: compressedDataUrl, blob });
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/** Upload blob to Supabase Storage. Returns the public URL. */
export async function uploadMomentPhoto(userId: string, blob: Blob): Promise<{ url?: string; error?: string }> {
  const path = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from('moment-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) {
    const msg = error.message.toLowerCase().includes('bucket')
      ? 'Storage not configured — create the "moment-photos" bucket in Supabase Dashboard → Storage.'
      : error.message;
    return { error: msg };
  }

  const { data } = supabase.storage.from('moment-photos').getPublicUrl(path);
  return { url: data.publicUrl };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
