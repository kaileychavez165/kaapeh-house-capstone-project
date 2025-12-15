import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Svg, Circle, Path, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EditMode, DeleteConfirmationModal, MenuItem, AddItemMode } from './MenuFeature';
import { 
  updateMenuItem,
  deleteMenuItem,
  addMenuItem,
  MenuItem as DbMenuItem 
} from '../../services/menuService';
import { 
  useMenuCategories, 
  useMenuItems, 
  useMenuItemsByCategory,
  useInvalidateMenu 
} from '../../hooks/useMenuQueries';

// Navigation Icons
const ChartIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M3 3v18h18" stroke={active ? "#20B2AA" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.4 6.6L13 12l-4-4-6 6" stroke={active ? "#20B2AA" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UsersIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={active ? "#20B2AA" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={active ? "#20B2AA" : "#999"} strokeWidth="2" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={active ? "#20B2AA" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EditIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={active ? "#20B2AA" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={active ? "#20B2AA" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TruckIcon = ({ active = false }) => (
  <MaterialCommunityIcons name="truck-check" size={28} color={active ? "#20B2AA" : "#999"} />
);

const TrashIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 11v6" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const Menu = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All Subcategories');
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);

  // Animation for dropdown
  const dropdownOpacity = useState(new Animated.Value(0))[0];
  const dropdownScale = useState(new Animated.Value(0.8))[0];

  const subCategoryOptions = ['All Subcategories', 'Milk', 'Syrup', 'Flavor', 'Extras'];

  // React Query hooks for caching
  const { data: categories = [], isLoading: categoriesLoading } = useMenuCategories(true); // Include admin categories
  const { data: allMenuItems = [], isLoading: allItemsLoading } = useMenuItems(false); // Don't exclude admin categories for admin view
  const { data: categoryMenuItems = [], isLoading: categoryLoading } = useMenuItemsByCategory(
    selectedCategory,
    false // Don't exclude admin categories for admin view
  );

  // Invalidate cache hook
  const { invalidateLists } = useInvalidateMenu();

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategory !== 'Customizations') {
      setSelectedSubCategory('All Subcategories');
    }
  }, [selectedCategory]);

  // Convert database MenuItem to display MenuItem
  const convertDbToDisplay = (dbItem: DbMenuItem): MenuItem => {
    return {
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      price: dbItem.price,
      available: dbItem.available,
      image_url: dbItem.image_url || '',
      description: dbItem.description,
      sub_category: dbItem.sub_category,
      sizes: dbItem.sizes,
    };
  };

  // Determine which data to use and loading state
  const menuItemsData = useMemo(() => {
    if (selectedCategory === 'All Items') {
      return allMenuItems || [];
    }
    return categoryMenuItems || [];
  }, [selectedCategory, allMenuItems, categoryMenuItems]);

  const loading = categoriesLoading || (selectedCategory === 'All Items' ? allItemsLoading : categoryLoading);

  const handleEdit = async (updatedItem: MenuItem) => {
    try {
      // Update in database
      await updateMenuItem(updatedItem.id, {
        name: updatedItem.name,
        description: updatedItem.description,
        price: updatedItem.price,
        image_url: updatedItem.image_url,
        available: updatedItem.available,
        sizes: updatedItem.sizes,
      });

      // Invalidate cache to refetch latest data
      invalidateLists();
      setEditingId(null);
      Alert.alert('Success', 'Menu item updated successfully');
    } catch (error) {
      console.error('Error updating menu item:', error);
      Alert.alert('Error', 'Failed to update menu item. Please try again.');
    }
  };

  const handleAddItem = async (newItem: Omit<MenuItem, 'id'>) => {
    try {
      // Save to database
      const dbItem = await addMenuItem({
        name: newItem.name,
        description: newItem.description,
        price: newItem.price,
        category: newItem.category,
        image_url: newItem.image_url,
        available: newItem.available,
        served_hot: newItem.served_hot,
        served_cold: newItem.served_cold,
        allow_customizations: newItem.allow_customizations,
        sizes: newItem.sizes,
        sub_category: newItem.sub_category,
      });

      // Invalidate cache to refetch latest data
      invalidateLists();
      setAddingItem(false);
      Alert.alert('Success', 'Menu item added successfully');
    } catch (error) {
      console.error('Error adding menu item:', error);
      Alert.alert('Error', 'Failed to add menu item. Please try again.');
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete !== null) {
      try {
        await deleteMenuItem(itemToDelete);
        // Invalidate cache to refetch latest data
        invalidateLists();
        setDeleteModalVisible(false);
        setItemToDelete(null);
        Alert.alert('Success', 'Menu item deleted successfully');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        Alert.alert('Error', 'Failed to delete menu item. Please try again.');
        setDeleteModalVisible(false);
        setItemToDelete(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const toggleSubCategoryDropdown = () => {
    if (showSubCategoryDropdown) {
      // Close dropdown
      Animated.parallel([
        Animated.timing(dropdownOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(dropdownScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSubCategoryDropdown(false);
      });
    } else {
      // Open dropdown
      setShowSubCategoryDropdown(true);
      Animated.parallel([
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(dropdownScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleSubCategorySelection = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
    Animated.parallel([
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSubCategoryDropdown(false);
    });
  };

  // Filter menu items by category and subcategory
  const filteredMenuItems = useMemo(() => {
    const convertedItems = menuItemsData.map(convertDbToDisplay);
    // menuItemsData is already filtered by category from the query, so we don't need to filter again
    let filtered = convertedItems;
    
    // Apply subcategory filter if Customizations category is selected
    if (selectedCategory === 'Customizations' && selectedSubCategory !== 'All Subcategories') {
      filtered = filtered.filter(item => item.sub_category === selectedSubCategory);
    }
    
    return filtered;
  }, [menuItemsData, selectedCategory, selectedSubCategory]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#20B2AA" />
      
      {/* Top Status Bar with Logo */}
      <View style={styles.statusBar}>
        <Image 
          source={require('../../assets/images/logo-white-one.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Menu</Text>
          <Text style={styles.headerSubtitle}>View and manage the menu</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setAddingItem(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.length > 0 ? categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.selectedCategoryButtonText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        )) : null}
      </ScrollView>

      {/* Subcategory Filter - Only show for Customizations category */}
      {selectedCategory === 'Customizations' && (
        <View style={styles.subCategoryFilterContainer}>
          <View style={styles.subCategoryFilterContent}>
            <Text style={styles.subCategoryLabel}>Filter by Subcategory:</Text>
            <View style={styles.sortContainer}>
              <TouchableOpacity 
                style={styles.sortButton}
                onPress={toggleSubCategoryDropdown}
              >
                <Text style={styles.sortText}>{selectedSubCategory}</Text>
                <Text style={styles.sortArrow}>{showSubCategoryDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showSubCategoryDropdown && (
                <Animated.View 
                  style={[
                    styles.dropdown,
                    {
                      opacity: dropdownOpacity,
                      transform: [{ scale: dropdownScale }],
                    }
                  ]}
                >
                  {subCategoryOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownItem,
                        selectedSubCategory === option && styles.selectedDropdownItem
                      ]}
                      onPress={() => handleSubCategorySelection(option)}
                    >
                      <Text style={[
                        styles.dropdownText,
                        selectedSubCategory === option && styles.selectedDropdownText
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}
            </View>
          </View>
          
          {/* Backdrop overlay to close dropdown when tapping outside */}
          {showSubCategoryDropdown && (
            <View
              style={styles.dropdownBackdrop}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => {
                Animated.parallel([
                  Animated.timing(dropdownOpacity, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                  Animated.timing(dropdownScale, {
                    toValue: 0.8,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  setShowSubCategoryDropdown(false);
                });
              }}
            />
          )}
        </View>
      )}

      {/* Menu Item List */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {addingItem && (
          <AddItemMode
            categories={categories}
            onSave={handleAddItem}
            onCancel={() => setAddingItem(false)}
          />
        )}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#20B2AA" />
            <Text style={styles.loadingText}>Loading menu items...</Text>
          </View>
        ) : filteredMenuItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        ) : (
          filteredMenuItems.map((item) => (
            <React.Fragment key={item.id}>
              {editingId === item.id ? (
                <EditMode
                  item={item}
                  onSave={handleEdit}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <View style={styles.menuItemCard}>
                  <View style={styles.menuItemImage}>
                    {item.image_url && (item.image_url.startsWith('http') || item.image_url.startsWith('https')) ? (
                      <Image source={{ uri: item.image_url }} style={styles.menuItemImageLoaded} />
                    ) : (
                      <Text style={styles.menuItemEmoji}>🍽️</Text>
                    )}
                  </View>
                  <View style={styles.menuItemDetails}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemCategory}>{item.category}</Text>
                    <View style={[
                      styles.statusTag,
                      item.available ? styles.availableTag : styles.unavailableTag,
                    ]}>
                      <Text style={[
                        styles.statusTagText,
                        item.available ? styles.availableTagText : styles.unavailableTagText,
                      ]}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.menuItemActions}>
                    <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                    <View style={styles.actionIcons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setEditingId(item.id)}
                      >
                        <EditIcon active={false} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteClick(item.id)}
                      >
                        <TrashIcon />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </React.Fragment>
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminHome' as never)}
        >
          <ChartIcon active={false} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('CustomerPortal' as never)}
        >
          <UsersIcon active={false} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <EditIcon active={true} />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('OrdersHub' as never)}
        >
          <TruckIcon active={false} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: '#20B2AA',
    marginBottom: -42,
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  header: {
    backgroundColor: '#20B2AA',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 28,
    color: '#20B2AA',
    fontWeight: '600',
  },
  categoryFilter: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    maxHeight: 56,
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
    marginRight: 10,
    height: 32,
    justifyContent: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#20B2AA',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  menuItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItemImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemEmoji: {
    fontSize: 28,
  },
  menuItemImageLoaded: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  menuItemDetails: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuItemCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  availableTag: {
    backgroundColor: '#D1FAE5',
  },
  unavailableTag: {
    backgroundColor: '#FEE2E2',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availableTagText: {
    color: '#065F46',
  },
  unavailableTagText: {
    color: '#991B1B',
  },
  menuItemActions: {
    alignItems: 'flex-end',
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    position: 'relative',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#20B2AA',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  subCategoryFilterContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  subCategoryFilterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subCategoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  sortContainer: {
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sortText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  sortArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    minWidth: 160,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedDropdownItem: {
    backgroundColor: '#F0FDF4',
  },
  dropdownText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedDropdownText: {
    color: '#20B2AA',
    fontWeight: '600',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 900,
  },
});

export default Menu;
