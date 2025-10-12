import { supabase } from '../../utils/supabase';

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
