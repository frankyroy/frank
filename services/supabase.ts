
import { createClient } from '@supabase/supabase-js';

// Usamos process.env para compatibilidad con Vercel y GitHub Actions
// Asegúrate de configurar SUPABASE_URL y SUPABASE_ANON_KEY en el panel de Vercel
const supabaseUrl = process.env.SUPABASE_URL || 'https://mihvepvuberkodmmzfec.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_oJBR9Cg4pE5XBL0M4kP_PA_JbmRgAWZ';

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

    // Intentamos subir la imagen al bucket 'room-images'
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
