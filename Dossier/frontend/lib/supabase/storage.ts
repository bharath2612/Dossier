import { createClient } from './client';
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'slide-images';

export interface UploadResult {
  url: string;
  storagePath: string;
}

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

const defaultCompressionOptions: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

// Check if bucket exists and is accessible
export async function checkBucketAccess(): Promise<{ exists: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Try to list files in the bucket (this will fail if bucket doesn't exist or no access)
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });

    if (error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return {
          exists: false,
          error: `Storage bucket "${BUCKET_NAME}" does not exist. Please create it in the Supabase dashboard under Storage.`
        };
      }
      if (error.message.includes('permission') || error.message.includes('policy')) {
        return {
          exists: true,
          error: `Storage bucket "${BUCKET_NAME}" exists but you don't have permission. Please configure RLS policies.`
        };
      }
      return { exists: false, error: error.message };
    }

    return { exists: true };
  } catch (err) {
    return { exists: false, error: 'Failed to check bucket access' };
  }
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const mergedOptions = { ...defaultCompressionOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, mergedOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

export async function uploadSlideImage(
  file: File,
  presentationId: string,
  slideIndex: number,
  compress: boolean = true
): Promise<UploadResult> {
  const supabase = createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be signed in to upload images. Please sign in and try again.');
  }

  // Compress image if requested
  const fileToUpload = compress ? await compressImage(file) : file;

  // Generate unique filename with user ID for RLS
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${user.id}/${presentationId}/slide-${slideIndex}-${timestamp}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    // Provide more specific error messages
    if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
      throw new Error(
        `Storage bucket "${BUCKET_NAME}" does not exist. Please create it in Supabase Dashboard > Storage > New Bucket. Make the bucket public for image display.`
      );
    }
    if (error.message.includes('row-level security') || error.message.includes('security policy')) {
      throw new Error(
        `Storage policy error. Please add RLS policies in Supabase Dashboard > Storage > ${BUCKET_NAME} > Policies. Add INSERT policy for authenticated users.`
      );
    }
    if (error.message.includes('policy') || error.message.includes('permission') || error.message.includes('403') || error.message.includes('Unauthorized')) {
      throw new Error(
        `No permission to upload. Please add storage policies in Supabase Dashboard > Storage > ${BUCKET_NAME} > Policies. Add a policy allowing authenticated users to INSERT.`
      );
    }
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    storagePath: data.path,
  };
}

export async function deleteSlideImage(storagePath: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

export async function replaceSlideImage(
  newFile: File,
  oldStoragePath: string | undefined,
  presentationId: string,
  slideIndex: number,
  compress: boolean = true
): Promise<UploadResult> {
  // Delete old image if it exists
  if (oldStoragePath) {
    try {
      await deleteSlideImage(oldStoragePath);
    } catch (error) {
      console.warn('Failed to delete old image:', error);
      // Continue with upload even if delete fails
    }
  }

  // Upload new image
  return uploadSlideImage(newFile, presentationId, slideIndex, compress);
}

export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

export function getFileSizeInMB(file: File): number {
  return file.size / (1024 * 1024);
}

export const MAX_FILE_SIZE_MB = 10;
