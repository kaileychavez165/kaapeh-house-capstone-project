import { supabase } from "../../utils/supabase";
import { File } from 'expo-file-system';

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

// Fetch user profile by user ID
export const fetchUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    throw error;
  }
};

// Upload avatar image to Supabase storage
export const uploadAvatarToStorage = async (
  imageUri: string,
  userId: string
): Promise<string> => {
  try {
    // Create a File instance from the image URI using the new File API
    const file = new File(imageUri);
    
    // Read file as bytes (returns Uint8Array)
    const bytes = await file.bytes();
    
    // Convert Uint8Array to ArrayBuffer
    const arrayBuffer = bytes.buffer;

    // Generate a unique filename using userId and timestamp
    // Store in user-specific folder for easier RLS policy management
    const fileExt = 'jpg';
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase storage avatars bucket
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true, // Replace file if it exists
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }

    // Get public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadAvatarToStorage:', error);
    throw error;
  }
};
