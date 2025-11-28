import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  BackHandler,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import { Session } from '@supabase/supabase-js';
import { MenuItem } from '../../services/menuService';
import { useMenuCategories, useMenuItems, useMenuItemsByCategory, useSearchMenuItems } from '../../hooks/useMenuQueries';
import { useUserProfile } from '../../hooks/useUserQueries';


const { width } = Dimensions.get('window');

// MenuItem interface for rendering (includes Rating, which is not available in the DB)
interface MenuItemDisplay {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: string;
  image_url: string;
  available: boolean;
}

interface HomeScreenProps {
  session: Session | null;
}

export default function HomeScreen({ session }: HomeScreenProps) {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tooltip messages array
  const tooltipMessages = [
    "Hi! Need help? Tap me!",
    "Hey! I'm Kaapi, here to help ☕️ ",
    "Looking for something? I can help! 🔍",
  ];
  
  // Tooltip animation state
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTranslateX = useRef(new Animated.Value(10)).current;
  const tooltipIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasClickedButtonRef = useRef(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [hasClickedButton, setHasClickedButton] = useState(false);

  // React Query hooks
  const { data: categories = [], isLoading: categoriesLoading } = useMenuCategories();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile(session?.user?.id);
  
  // Menu items query - depends on category and search
  const shouldSearch = searchQuery.trim().length > 0;
  const { data: searchResults, isLoading: searchLoading } = useSearchMenuItems(
    searchQuery,
    true // exclude admin categories
  );
  
  const { data: allMenuItems, isLoading: allItemsLoading } = useMenuItems(true);
  const { data: categoryMenuItems, isLoading: categoryLoading } = useMenuItemsByCategory(
    selectedCategory,
    true
  );

  // Determine which data to use and loading state
  const menuItemsData = useMemo(() => {
    if (shouldSearch) {
      return searchResults || [];
    }
    if (selectedCategory === 'All Items') {
      return allMenuItems || [];
    }
    return categoryMenuItems || [];
  }, [shouldSearch, searchResults, selectedCategory, allMenuItems, categoryMenuItems]);

  const loading = categoriesLoading || 
    (shouldSearch ? searchLoading : (selectedCategory === 'All Items' ? allItemsLoading : categoryLoading));

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

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      // Prevent going back to Auth screen
      return true; // This prevents the default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  // Tooltip animation function
  const showTooltip = () => {
    // Don't show if button has been clicked
    if (hasClickedButtonRef.current) {
      return;
    }

    // Reset and show tooltip (animate from right to left)
    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipTranslateX, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Hide tooltip after 3 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(tooltipOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(tooltipTranslateX, {
            toValue: 10,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Move to next message (cycle through)
          setCurrentMessageIndex((prev) => (prev + 1) % tooltipMessages.length);
        });
      }, 3000);
    });
  };

  // Set up interval to show tooltip every 8 seconds
  useEffect(() => {
    // Don't set up tooltips if button has been clicked
    if (hasClickedButton) {
      // Clear any existing intervals
      if (tooltipIntervalRef.current) {
        clearInterval(tooltipIntervalRef.current);
        tooltipIntervalRef.current = null;
      }
      return;
    }

    // Show tooltip after initial 3 second delay
    const initialTimeout = setTimeout(() => {
      if (!hasClickedButtonRef.current) {
        showTooltip();
      }
    }, 3000);

    // Then show it every 8 seconds
    tooltipIntervalRef.current = setInterval(() => {
      if (!hasClickedButtonRef.current) {
        showTooltip();
      } else {
        // Clear interval if button was clicked
        if (tooltipIntervalRef.current) {
          clearInterval(tooltipIntervalRef.current);
          tooltipIntervalRef.current = null;
        }
      }
    }, 8000);

    return () => {
      clearTimeout(initialTimeout);
      if (tooltipIntervalRef.current) {
        clearInterval(tooltipIntervalRef.current);
        tooltipIntervalRef.current = null;
      }
    };
  }, [hasClickedButton]);

  // Helper function to validate if a string is a valid URL
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || url.trim() === '') return false;
    
    try {
      // Check if it's a valid URL format
      const urlObj = new URL(url);
      // Check if it's http or https
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      // If URL parsing fails, it's not a valid URL
      return false;
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
      image_url: item.image_url || '', // Use actual image URL from database
      available: item.available, // Available or Sold Out
    }));
  };


  const renderMenuItemCard = (item: MenuItemDisplay) => (
    <View key={item.id} style={[styles.drinkCard, !item.available && styles.unavailableCard]}>
      <View style={styles.drinkImageContainer}>
        <Image 
          source={
            isValidImageUrl(item.image_url)
              ? { uri: item.image_url }
              : require('../../assets/images/no-image-available.jpg')
          } 
          style={[styles.drinkImage, !item.available && styles.unavailableImage]} 
          resizeMode="cover" 
        />
        {!item.available && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}
      </View>
      <Text style={[styles.drinkName, !item.available && styles.unavailableText]}>{item.name}</Text>
      <View style={styles.drinkFooter}>
        <Text style={[styles.drinkPrice, !item.available && styles.unavailableText]}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity 
          style={[styles.addButton, !item.available && styles.disabledButton]} 
          disabled={!item.available}
          onPress={() => (navigation as any).navigate('DrinkDetail', { item })}
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
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
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
            colors={['#fffcf5', 'rgba(255, 252, 245, 0)']}
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
            {categories.map((category: string) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setSearchQuery(''); // Clear search when category is selected
                }}
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
            colors={['rgba(255, 252, 245, 0)', '#fffcf5']}
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
          ) : menuItemsData.length > 0 ? (
            convertToMenuItemDisplay(menuItemsData).map((item) => renderMenuItemCard(item))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Items</Text>
            </View>
          )}
        </View>

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar currentScreen="Home" />

      {/* Floating Action Button with Tooltip */}
      <View style={styles.floatingButtonContainer}>
        {/* Animated Tooltip */}
        <Animated.View
          style={[
            styles.tooltipContainer,
            {
              opacity: tooltipOpacity,
              transform: [{ translateX: tooltipTranslateX }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.tooltipText}>{tooltipMessages[currentMessageIndex]}</Text>
          <View style={styles.tooltipArrow}>
            <View style={styles.tooltipArrowTriangle} />
          </View>
        </Animated.View>

        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => {
            // Stop showing tooltips
            hasClickedButtonRef.current = true;
            setHasClickedButton(true);
            // Clear any running intervals
            if (tooltipIntervalRef.current) {
              clearInterval(tooltipIntervalRef.current);
              tooltipIntervalRef.current = null;
            }
            // Hide tooltip immediately
            Animated.parallel([
              Animated.timing(tooltipOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(tooltipTranslateX, {
                toValue: 10,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start();
            // Navigate to chatbot
            navigation.navigate('ChatBot' as never);
          }}
        >
          <MaterialCommunityIcons name="robot-happy-outline" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B2B2B',
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
  clearButton: {
    padding: 4,
  },
  filterButton: {
    backgroundColor: '#acc18a',
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
    backgroundColor: '#fffcf5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 32,
  },
  categoriesSection: {
    backgroundColor: '#fffcf5',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 24,
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
    backgroundColor: '#fffcf5',
  },
  menuScrollContent: {
    paddingBottom: 20,
  },
  promoBanner: {
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: -80, // Negative margin to overlap with header
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 10, // Ensure it appears above other content
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    height: 120, // Set a fixed height for the banner
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
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipContainer: {
    position: 'absolute',
    right: 70,
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    minWidth: 120,
    maxWidth: 300,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    alignSelf: 'flex-end',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  tooltipArrow: {
    position: 'absolute',
    right: -8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tooltipArrowTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#2B2B2B',
  },
  floatingButton: {
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
