import * as DocumentPicker from 'expo-document-picker';
import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Opens the native file picker for PDFs, then uploads to
 * Supabase Storage under resumes/{userId}/resume.pdf
 */
export const pickAndUploadResume = async (
  userId: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> => {
  // 1. Pick the file
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) {
    throw new Error('No file selected');
  }

  const asset = result.assets[0];

  if (!asset.uri) throw new Error('File URI is missing');
  if (asset.size && asset.size > 10 * 1024 * 1024) {
    throw new Error('File exceeds 10 MB limit');
  }

  onProgress?.(10);

  // 2. Fetch the file as a Blob (works on both native and web)
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  onProgress?.(40);

  // 3. Upload to Supabase Storage
  const storagePath = `${userId}/resume.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(storagePath, blob, {
      contentType: 'application/pdf',
      upsert: true, // overwrite if re-uploading
    });

  if (uploadError) throw uploadError;

  onProgress?.(80);

  // 4. Get a signed URL valid for 1 year (private bucket)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('resumes')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (signedError) throw signedError;

  onProgress?.(100);

  return {
    url: signedData.signedUrl,
    path: storagePath,
  };
};

/**
 * Get a fresh signed URL for an existing resume (7-day expiry).
 */
export const getResumeSignedUrl = async (storagePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

  if (error) throw error;
  return data.signedUrl;
};
