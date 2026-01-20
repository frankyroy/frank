
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mihvepvuberkodmmzfec.supabase.co';
const supabaseKey = 'sb_publishable_oJBR9Cg4pE5XBL0M4kP_PA_JbmRgAWZ';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para subir imágenes a Storage
export const uploadRoomImage = async (roomId: string, base64Data: string) => {
  try {
    const fileName = `room-${roomId}-${Date.now()}.jpg`;
    const base64Str = base64Data.split(',')[1];
    const byteCharacters = atob(base64Str);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const { data, error } = await supabase.storage
      .from('room-images')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('room-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error('Error uploading image:', err);
    return null;
  }
};
