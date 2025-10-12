import { fetchMenuItems, fetchMenuCategories } from '../services/menuService';

// Simple test function to verify database connection
export const testDatabaseConnection = async () => {
    try {
        console.log('Testing database connection...');

        // Test fetching menu items
        const menuItems = await fetchMenuItems();
        console.log('✅ Menu items fetched successfully:', menuItems.length, 'items');

        // Test fetching categories
        const categories = await fetchMenuCategories();
        console.log('✅ Categories fetched successfully:', categories);

        return { success: true, menuItems, categories };
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return { success: false, error };
    }
};
