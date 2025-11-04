import { supabase } from '../../utils/supabase';
import { File } from 'expo-file-system';

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
        // Create a File instance from the image URI using the new File API
        const file = new File(imageUri);
        
        // Read file as bytes (returns Uint8Array)
        const bytes = await file.bytes();
        
        // Convert Uint8Array to ArrayBuffer
        const arrayBuffer = bytes.buffer;

        // Upload to Supabase storage
        // Supabase accepts ArrayBuffer, Blob, or File
        const fileExt = fileName.split('.').pop() || 'jpg';
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('menu-images')
            .upload(filePath, arrayBuffer, {
                contentType: `image/${fileExt}`,
                upsert: true, // Replace file if it exists
            });

        if (error) {
            console.error('Error uploading image:', error);
            throw error;
        }

        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
            .from('menu-images')
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    } catch (error) {
        console.error('Error in uploadImageToStorage:', error);
        throw error;
    }
};
