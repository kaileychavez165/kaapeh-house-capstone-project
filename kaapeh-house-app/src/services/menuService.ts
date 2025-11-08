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
    served_hot?: boolean;
    served_cold?: boolean;
    allow_customizations?: string[];
    sizes?: Record<string, number>; // JSONB: size -> price mapping
    sub_category?: 'Milk' | 'Syrup' | 'Flavor' | 'Extras';
}

export interface MenuCategory {
    category: string;
}

// Fetch all menu items (including unavailable ones)
// excludeAdminCategories: if true, excludes admin-only categories like 'Customizations'
export const fetchMenuItems = async (excludeAdminCategories: boolean = false): Promise<MenuItem[]> => {
    try {
        let query = supabase
            .from('menu_items')
            .select('*');

        // Exclude admin-only categories if requested
        if (excludeAdminCategories) {
            query = query.neq('category', 'Customizations');
        }

        const { data, error } = await query
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
// excludeAdminCategories: if true, prevents fetching admin-only categories like 'Customizations'
export const fetchMenuItemsByCategory = async (category: string, excludeAdminCategories: boolean = false): Promise<MenuItem[]> => {
    try {
        // If excluding admin categories and category is 'Customizations', return empty array
        if (excludeAdminCategories && category === 'Customizations') {
            return [];
        }

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
// forAdmin: if true, includes admin-only categories like 'Customizations'
export const fetchMenuCategories = async (forAdmin: boolean = false): Promise<string[]> => {
    try {
        // Base categories visible to all users
        const baseCategories = [
            'All Items',
            'Coffee',
            'Tea & Other Drinks', 
            'Pastries',
            'Savory Items',
            'Seasonal Items'
        ];
        
        // Add admin-only categories if requested
        if (forAdmin) {
            return [...baseCategories, 'Customizations'];
        }
        
        return baseCategories;
    } catch (error) {
        console.error('Error in fetchMenuCategories:', error);
        throw error;
    }
};

// Search menu items (including unavailable ones)
// excludeAdminCategories: if true, excludes admin-only categories like 'Customizations'
export const searchMenuItems = async (query: string, excludeAdminCategories: boolean = false): Promise<MenuItem[]> => {
    try {
        let searchQuery = supabase
            .from('menu_items')
            .select('*')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

        // Exclude admin-only categories if requested
        if (excludeAdminCategories) {
            searchQuery = searchQuery.neq('category', 'Customizations');
        }

        const { data, error } = await searchQuery.order('created_at', { ascending: false });

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
        sizes?: Record<string, number>;
    }
): Promise<MenuItem> => {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .update({
                ...updates,
                sizes: updates.sizes && Object.keys(updates.sizes).length > 0 ? updates.sizes : null,
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

// Add a new menu item
export const addMenuItem = async (
    item: {
        name: string;
        description?: string;
        price: number;
        category: string;
        image_url: string;
        available: boolean;
        served_hot?: boolean;
        served_cold?: boolean;
        allow_customizations?: string[];
        sizes?: Record<string, number>; // size -> price mapping
        sub_category?: 'Milk' | 'Syrup' | 'Flavor' | 'Extras';
    }
): Promise<MenuItem> => {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .insert({
                name: item.name,
                description: item.description || '',
                price: item.price,
                category: item.category,
                image_url: item.image_url,
                available: item.available,
                served_hot: item.served_hot ?? null,
                served_cold: item.served_cold ?? null,
                allow_customizations: item.allow_customizations && item.allow_customizations.length > 0 ? item.allow_customizations : null,
                sizes: item.sizes && Object.keys(item.sizes).length > 0 ? item.sizes : null,
                sub_category: item.sub_category || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding menu item:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in addMenuItem:', error);
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
