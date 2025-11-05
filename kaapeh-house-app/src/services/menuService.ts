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

// Update a menu item
export const updateMenuItem = async (
    id: string,
    updates: {
        name?: string;
        description?: string;
        price?: number;
        image_url?: string;
        available?: boolean;
    }
): Promise<MenuItem> => {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating menu item:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in updateMenuItem:', error);
        throw error;
    }
};

// Create a new menu item
export const createMenuItem = async (
    item: {
        name: string;
        description?: string;
        price: number;
        category: string;
        image_url: string;
        available: boolean;
    }
): Promise<MenuItem> => {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .insert({
                ...item,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating menu item:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in createMenuItem:', error);
        throw error;
    }
};

// Delete a menu item
export const deleteMenuItem = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting menu item:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in deleteMenuItem:', error);
        throw error;
    }
};

// Upload image to Supabase storage
export const uploadImageToStorage = async (
    imageUri: string,
    fileName: string
): Promise<string> => {
    try {
        let fileBody: Uint8Array;
        const fileExt = fileName.split('.').pop()?.split('?')[0] || 'jpg';
        const contentType = `image/${fileExt === 'jpg' || fileExt === 'jpeg' ? 'jpeg' : fileExt}`;
        const filePath = `menu-items/${fileName}`;

        // Check if it's a local file URI (React Native)
        if (imageUri.startsWith('file://') || imageUri.startsWith('ph://') || imageUri.startsWith('assets-library://')) {
            // Read file as base64 using legacy FileSystem API
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            
            // Convert base64 string to Uint8Array
            // React Native has atob available globally
            const binaryString = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
            const rawLength = binaryString.length;
            fileBody = new Uint8Array(rawLength);
            for (let i = 0; i < rawLength; i++) {
                fileBody[i] = binaryString.charCodeAt(i);
            }
        } else {
            // It's already a URL, fetch it
            const response = await fetch(imageUri);
            const arrayBuffer = await response.arrayBuffer();
            fileBody = new Uint8Array(arrayBuffer);
        }

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
            .from('menu-images')
            .upload(filePath, fileBody, {
                contentType: contentType,
                upsert: true, // Replace file if it exists
            });

        if (error) {
            console.error('Error uploading image:', error);
            // If bucket doesn't exist or permission issue, return original URI as fallback
            if (error.message?.includes('Bucket not found') || 
                error.message?.includes('permission') || 
                error.message?.includes('not found')) {
                console.warn('Storage bucket not configured. Using original URI.');
                return imageUri;
            }
            throw error;
        }

        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
            .from('menu-images')
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    } catch (error) {
        console.error('Error in uploadImageToStorage:', error);
        // Return original URI as fallback if upload fails
        console.warn('Image upload failed. Using original URI as fallback.');
        return imageUri;
    }
};
