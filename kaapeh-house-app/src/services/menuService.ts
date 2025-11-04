import { supabase } from '../../utils/supabase';
import * as FileSystem from 'expo-file-system/legacy';

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image_url: string;
    available: boolean;
    created_at: string;
    updated_at: string;
}

export interface MenuCategory {
    category: string;
}

// Fetch all menu items (including unavailable ones)
export const fetchMenuItems = async (): Promise<MenuItem[]> => {
    try {
        const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching menu items:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchMenuItems:', error);
        throw error;
    }
};

// Fetch menu items by category for filtering
export const fetchMenuItemsByCategory = async (category: string): Promise<MenuItem[]> => {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching menu items by category:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchMenuItemsByCategory:', error);
        throw error;
    }
};

// Fetch all available categories
export const fetchMenuCategories = async (): Promise<string[]> => {
    try {
        // Return all categories, regardless of whether they have items
        const allCategories = [
            'All Items',
            'Coffee',
            'Tea & Other Drinks', 
            'Pastries',
            'Savory Items',
            'Seasonal Items'
        ];
        
        return allCategories;
    } catch (error) {
        console.error('Error in fetchMenuCategories:', error);
        throw error;
    }
};

// Search menu items (including unavailable ones)
export const searchMenuItems = async (query: string): Promise<MenuItem[]> => {
    try {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error searching menu items:', error);
        throw error;
    }

    return data || [];
    } catch (error) {
    console.error('Error in searchMenuItems:', error);
    throw error;
    }
};

// Upload image to Supabase Storage
export const uploadMenuImage = async (imageUri: string, itemName: string): Promise<string> => {
    try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.warn('⚠️ No active session. Upload may fail if bucket requires authentication.');
        }

        // Create a unique filename
        const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${itemName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
        const filePath = `menu-items/${fileName}`;
        
        console.log('📤 Starting image upload:', fileName);

        let fileBody: ArrayBuffer | Uint8Array;
        const contentType = `image/${fileExt === 'jpg' || fileExt === 'jpeg' ? 'jpeg' : fileExt}`;
        
        // Check if it's a local file URI (React Native)
        if (imageUri.startsWith('file://') || imageUri.startsWith('ph://') || imageUri.startsWith('assets-library://')) {
            // Read file as base64 using expo-file-system
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64',
            });
            
            // Convert base64 to ArrayBuffer (works better in React Native)
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            fileBody = new Uint8Array(byteNumbers);
        } else {
            // It's already a URL, fetch it normally
            const response = await fetch(imageUri);
            const arrayBuffer = await response.arrayBuffer();
            fileBody = new Uint8Array(arrayBuffer);
        }

        // Upload to Supabase Storage using ArrayBuffer/Uint8Array
        const { data, error } = await supabase.storage
            .from('menu-images')
            .upload(filePath, fileBody, {
                cacheControl: '3600',
                upsert: false,
                contentType: contentType
            });

        if (error) {
            console.error('Error uploading image:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            // If bucket doesn't exist or permission issue, return original URI as fallback
            if (error.message?.includes('Bucket not found') || 
                error.message?.includes('permission') || 
                error.message?.includes('not found') ||
                error.message?.includes('new row violates')) {
                console.warn('Storage bucket not configured. Using local URI.');
                return imageUri;
            }
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('menu-images')
            .getPublicUrl(filePath);

        console.log('✅ Image uploaded successfully:', publicUrl);
        return publicUrl;
    } catch (error: any) {
        console.error('Error in uploadMenuImage:', error);
        console.error('Error stack:', error?.stack);
        // Return original URI as fallback if upload fails
        console.warn('Image upload failed. Using original URI as fallback.');
        return imageUri;
    }
};
