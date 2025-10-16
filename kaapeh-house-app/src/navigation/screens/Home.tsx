import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import { Session } from '@supabase/supabase-js';
import { fetchMenuItems, fetchMenuItemsByCategory, fetchMenuCategories, searchMenuItems, MenuItem } from '../../services/menuService';
import { fetchUserProfile, UserProfile } from '../../services/userService';


const { width } = Dimensions.get('window');

// MenuItem interface for rendering (includes Rating, which is not available in the DB)
interface MenuItemDisplay {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: string;
  image: any;
  available: boolean;
}

interface HomeScreenProps {
  session: Session | null;
}

export default function HomeScreen({ session }: HomeScreenProps) {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItemDisplay[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Extract first name from user profile
  const getFirstName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name.split(' ')[0];
    }
    else if (userProfile?.email) {
      return userProfile.email.split('@')[0];
    }
    return 'User';
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load menu items when category changes
  useEffect(() => {
    loadMenuItems();
  }, [selectedCategory]);

  // Search when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      loadMenuItems();
    }
  }, [searchQuery]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading initial data...');
      
      // Fetch categories and menu items in parallel
      const [categoriesData, menuItemsData] = await Promise.all([
        fetchMenuCategories(),
        fetchMenuItems()
      ]);
      
      // Fetch user profile separately if session exists
      let profileData: UserProfile | null = null;
      if (session?.user?.id) {
        try {
          profileData = await fetchUserProfile(session.user.id);
        } catch (error) {
          console.error('❌ Error fetching user profile:', error);
          // Don't throw error for profile fetch failure, just continue
        }
      }
      
      console.log('📊 Categories loaded:', categoriesData);
      console.log('🍽️ Menu items loaded:', menuItemsData.length, 'items');
      console.log('👤 User profile loaded:', profileData ? 'Yes' : 'No');
      
      setCategories(categoriesData);
      setMenuItems(convertToMenuItemDisplay(menuItemsData));
      setUserProfile(profileData);
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load menu data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading menu items for category:', selectedCategory);
      
      let data: MenuItem[];
      
      if (selectedCategory === 'All Items') {
        data = await fetchMenuItems();
      } else {
        data = await fetchMenuItemsByCategory(selectedCategory);
      }
      
      console.log('🍽️ Menu items loaded for category:', data.length, 'items');
      setMenuItems(convertToMenuItemDisplay(data));
    } catch (error) {
      console.error('❌ Error loading menu items:', error);
      Alert.alert('Error', 'Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      const data = await searchMenuItems(searchQuery);
      setMenuItems(convertToMenuItemDisplay(data));
    } catch (error) {
      console.error('Error searching menu items:', error);
      Alert.alert('Error', 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert MenuItem from database to MenuItemDisplay format for rendering
  const convertToMenuItemDisplay = (items: MenuItem[]): MenuItemDisplay[] => {
    return items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      rating: 4.8, // Placeholder rating (not sure how we can calculate this and store in DB)
      category: item.category,
      image: require('../../assets/images/react-logo.png'), // Placeholder image
      available: item.available, // Available or Sold Out
    }));
  };


  const renderMenuItemCard = (item: MenuItemDisplay) => (
    <View key={item.id} style={[styles.drinkCard, !item.available && styles.unavailableCard]}>
      <View style={styles.drinkImageContainer}>
        <Image source={item.image} style={[styles.drinkImage, !item.available && styles.unavailableImage]} resizeMode="cover" />
        {!item.available && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
      <Text style={[styles.drinkName, !item.available && styles.unavailableText]}>{item.name}</Text>
      <Text style={[styles.drinkDescription, !item.available && styles.unavailableText]}>{item.description}</Text>
      <View style={styles.drinkFooter}>
        <Text style={[styles.drinkPrice, !item.available && styles.unavailableText]}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity 
          style={[styles.addButton, !item.available && styles.disabledButton]} 
          disabled={!item.available}
        >
          <MaterialCommunityIcons 
            name={item.available ? "plus" : "close"} 
            size={20} 
            color={item.available ? "#FFFFFF" : "#999999"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2B2B2B" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome back, {getFirstName()}!</Text>
          <Text style={styles.subtitleText}>Choose your coffee for the day!</Text>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <MaterialCommunityIcons name="tune" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Coffee Banner - Positioned to overlap both sections */}
      <View style={styles.promoBanner}>
        <Image 
          source={require('../../assets/images/coffee-banner.jpg')} 
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay}>
          {/* can add text for icons here later */}
        </View>
      </View>

      {/* Static Categories Row */}
      <View style={styles.categoriesSection}>
        <View style={styles.categoriesWrapper}>
          {/* Left gradient fade */}
          <LinearGradient
            colors={['#F5F1E8', 'rgba(245, 241, 232, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.leftGradient}
          />
          
          <ScrollView 
            horizontal 
            style={styles.categoriesContainer}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.selectedCategoryText
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Right gradient fade */}
          <LinearGradient
            colors={['rgba(245, 241, 232, 0)', '#F5F1E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rightGradient}
          />
        </View>
      </View>

      {/* Scrollable Menu Items Section */}
      <ScrollView 
        style={styles.menuScrollContainer} 
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        contentContainerStyle={styles.menuScrollContent}
      >
        <View style={styles.menuGrid}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading menu items...</Text>
            </View>
          ) : menuItems.length > 0 ? (
            menuItems.map((item) => renderMenuItemCard(item))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Items</Text>
            </View>
          )}
        </View>

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar currentScreen="Home" />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('ChatBot' as never)}
      >
        <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  header: {
    backgroundColor: '#2B2B2B',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingBottom: 70,
  },
  welcomeText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 20,
  },
  subtitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2B2B2B',
  },
  filterButton: {
    backgroundColor: '#acc18a',
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  categoriesSection: {
    backgroundColor: '#F5F1E8',
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoriesWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 30,
    zIndex: 2,
  },
  rightGradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 54,
    zIndex: 2,
  },
  menuScrollContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  menuScrollContent: {
    paddingBottom: 20,
  },
  promoBanner: {
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: -40, // Negative margin to overlap with header
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 10, // Ensure it appears above other content
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    height: 160, // Set a fixed height for the banner
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay for better text readability
    padding: 20,
    justifyContent: 'space-between',
  },
  promoTag: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  promoTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  underline: {
    textDecorationLine: 'underline',
    color: '#000000',
  },
  promoIcons: {
    position: 'absolute',
    right: 20,
    top: 20,
    flexDirection: 'row',
    gap: 8,
  },
  categoriesContainer: {
    flex: 1,
    paddingHorizontal: 20, // Add padding to account for gradient overlays
  },
  categoriesContent: {
    paddingHorizontal: 4,
    paddingRight: 50, // Add extra padding on the right to ensure last button has space
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
  },
  selectedCategoryButton: {
    backgroundColor: '#acc18a',
  },
  categoryText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  drinkCard: {
    width: (width - 72) / 2, // Accounting for padding and gap
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  drinkImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  drinkImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F0F0F0', // Placeholder background
  },
  ratingContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#2B2B2B',
    fontWeight: '600',
  },
  drinkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  drinkDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  drinkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drinkPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
  },
  addButton: {
    backgroundColor: '#acc18a',
    borderRadius: 8,
    padding: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    backgroundColor: '#acc18a',
    borderRadius: 12,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  // Styles for unavailable items
  unavailableCard: {
    opacity: 0.7,
  },
  unavailableImage: {
    opacity: 0.5,
  },
  unavailableText: {
    color: '#999999',
  },
  soldOutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});
