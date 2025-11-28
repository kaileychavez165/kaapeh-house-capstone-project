import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCart } from '../../context/CartContext';
import { 
  fetchMenuItemById, 
  fetchCustomizationItems, 
  MenuItem as DbMenuItem 
} from '../../services/menuService';

// Define the route params interface
type RootStackParamList = {
  DrinkDetail: {
    item: {
      id: string;
      name: string;
      description: string;
      price: number;
      rating?: number;
      category: string;
      image?: any;
      image_url?: string;
      available: boolean;
      // Optional database fields
      served_hot?: boolean;
      served_cold?: boolean;
      allow_customizations?: string[];
      sizes?: Record<string, number>;
    };
  };
};

type DrinkDetailRouteProp = RouteProp<RootStackParamList, 'DrinkDetail'>;

interface DrinkDetailScreenProps {}

export default function DrinkDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<DrinkDetailRouteProp>();
  const { item: initialItem } = route.params;
  const { addItem } = useCart();
  
  // State for full menu item from database
  const [menuItem, setMenuItem] = useState<DbMenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Customization state
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedTemperature, setSelectedTemperature] = useState<string | null>(null);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string>>({}); // subCategory -> itemId
  const [customizationOptions, setCustomizationOptions] = useState<Record<string, DbMenuItem[]>>({}); // subCategory -> items
  
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Fetch full menu item details from database
  useEffect(() => {
    const loadMenuItem = async () => {
      try {
        setLoading(true);
        const fullItem = await fetchMenuItemById(initialItem.id);
        
        if (fullItem) {
          setMenuItem(fullItem);
          
          // Initialize selected size to smallest available size
          if (fullItem.sizes && Object.keys(fullItem.sizes).length > 0) {
            const sizeOrder = ['2 oz', '6 oz', '12 oz', '16 oz', '20 oz'];
            const availableSizes = Object.keys(fullItem.sizes);
            for (const size of sizeOrder) {
              if (availableSizes.includes(size)) {
                setSelectedSize(size);
                break;
              }
            }
          }
          
          // Initialize temperature if both options are available
          if (fullItem.served_hot && fullItem.served_cold) {
            setSelectedTemperature('Hot');
          } else if (fullItem.served_hot) {
            setSelectedTemperature('Hot');
          } else if (fullItem.served_cold) {
            setSelectedTemperature('Iced');
          }
          
          // Fetch customization options if allow_customizations is set
          if (fullItem.allow_customizations && fullItem.allow_customizations.length > 0) {
            const customizationPromises = fullItem.allow_customizations.map(async (subCategory) => {
              const items = await fetchCustomizationItems(subCategory as 'Milk' | 'Syrup' | 'Flavor' | 'Extras', true);
              return { subCategory, items };
            });
            
            const results = await Promise.all(customizationPromises);
            const optionsMap: Record<string, DbMenuItem[]> = {};
            const initialSelections: Record<string, string> = {};
            
            results.forEach(({ subCategory, items }) => {
              // Sort items: $0 price first, then by name
              // Also make sure "No Milk" or "No Syrup" items are first in the list
              const sortedItems = [...items].sort((a, b) => {
                const aIsNo = a.name.toLowerCase().includes('no ');
                const bIsNo = b.name.toLowerCase().includes('no ');
                if (aIsNo && !bIsNo) return -1;
                if (!aIsNo && bIsNo) return 1;
                
                const aPrice = a.price || 0;
                const bPrice = b.price || 0;
                if (aPrice === 0 && bPrice !== 0) return -1;
                if (aPrice !== 0 && bPrice === 0) return 1;
                
                return a.name.localeCompare(b.name);
              });
              
              optionsMap[subCategory] = sortedItems;
              
              // For Milk and Syrup, initialize with first available item (prefer $0 price items)
              if (sortedItems.length > 0 && (subCategory === 'Milk' || subCategory === 'Syrup')) {
                const firstAvailable = sortedItems.find(item => item.available) || sortedItems[0];
                if (firstAvailable) {
                  initialSelections[subCategory] = firstAvailable.id;
                }
              }
            });
            
            setCustomizationOptions(optionsMap);
            setSelectedCustomizations(prev => ({ ...prev, ...initialSelections }));
          }
        }
      } catch (error) {
        console.error('Error loading menu item:', error);
        Alert.alert('Error', 'Failed to load menu item details');
      } finally {
        setLoading(false);
      }
    };
    
    loadMenuItem();
  }, [initialItem.id]);

  // Calculate price based on selected size and customizations
  const calculatePrice = (): number => {
    if (!menuItem) return initialItem.price;
    
    let basePrice = initialItem.price;
    
    // Use size price if sizes are available and a size is selected
    if (menuItem.sizes && selectedSize && menuItem.sizes[selectedSize]) {
      basePrice = menuItem.sizes[selectedSize];
    }
    
    // Add prices of selected customizations
    let customizationTotal = 0;
    Object.values(selectedCustomizations).forEach((itemId) => {
      const customizationItem = Object.values(customizationOptions)
        .flat()
        .find(item => item.id === itemId);
      if (customizationItem) {
        customizationTotal += customizationItem.price;
      }
    });
    
    return basePrice + customizationTotal;
  };

  // Format price for display
  const getPrice = () => {
    return calculatePrice().toFixed(2);
  };

  // Get available sizes from menuItem
  const getAvailableSizes = () => {
    if (!menuItem || !menuItem.sizes) return [];
    return Object.keys(menuItem.sizes).sort((a, b) => {
      const sizeOrder = ['2 oz', '6 oz', '12 oz', '16 oz', '20 oz'];
      return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
    });
  };

  // Get available temperatures
  const getAvailableTemperatures = () => {
    if (!menuItem) return [];
    const temps: string[] = [];
    if (menuItem.served_hot) temps.push('Hot');
    if (menuItem.served_cold) temps.push('Iced');
    return temps;
  };

  // Handle customization selection
  const handleCustomizationSelect = (subCategory: string, itemId: string) => {
    // Check if the item is available
    const item = customizationOptions[subCategory]?.find(opt => opt.id === itemId);
    if (item && !item.available) {
      // Don't allow selection of unavailable items
      return;
    }
    
    setSelectedCustomizations(prev => {
      // For Milk, Syrup, and Flavor, selection is required, so you can't deselect
      if (subCategory === 'Milk' || subCategory === 'Syrup' || subCategory === 'Flavor') {
        return { ...prev, [subCategory]: itemId };
      }
      
      // For other categories (Extras), allow toggling
      if (prev[subCategory] === itemId) {
        const newState = { ...prev };
        delete newState[subCategory];
        return newState;
      }
      // Otherwise, select the new item
      return { ...prev, [subCategory]: itemId };
    });
  };
  
  // Check if required customizations are selected
  const areRequiredCustomizationsSelected = () => {
    if (!menuItem?.allow_customizations) return true;
  
    if (menuItem.allow_customizations.includes('Milk')) {
      if (!selectedCustomizations['Milk']) return false;
    }

    if (menuItem.allow_customizations.includes('Syrup')) {
      if (!selectedCustomizations['Syrup']) return false;
    }

    if (menuItem.allow_customizations.includes('Flavor')) {
      if (!selectedCustomizations['Flavor']) return false;
    }
    
    return true;
  };

  // Truncate description for initial display
  const description = menuItem?.description || initialItem.description || '';
  const truncatedDescription = description.length > 100 
    ? description.substring(0, 100) + '...'
    : description;
  
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || url.trim() === '') return false;
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      // If URL parsing fails, it's not a valid URL
      return false;
    }
  };
  
  const getImageSource = () => {
    // Check menuItem image_url first (from database)
    const imageUrl = menuItem?.image_url || initialItem.image_url;
    if (isValidImageUrl(imageUrl)) {
      return { uri: imageUrl! };
    }
    
    // Fallback to initialItem.image if it exists
    if (initialItem.image) {
      return initialItem.image;
    }
    
    // Use placeholder image if no valid image is found
    return require('../../assets/images/no-image-available.jpg');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#acc18a" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F1E8" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#2B2B2B" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Detail</Text>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image source={getImageSource()} style={styles.productImage} resizeMode="cover" />
          </View>

          {/* Product Information */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{menuItem?.name || initialItem.name}</Text>
            
            {/* Rating - Optional */}
            {initialItem.rating && (
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{initialItem.rating}</Text>
                <Text style={styles.reviewCount}>(230)</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {showFullDescription ? description : truncatedDescription}
            </Text>
            {description.length > 100 && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.readMoreText}>
                  {showFullDescription ? 'Read Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
        </View>

        {/* Temperature Selection - Only show if menuItem has temperature options */}
        {getAvailableTemperatures().length > 0 && (
          <View style={styles.temperatureSelectionContainer}>
            <Text style={styles.sectionTitle}>Temperature</Text>
            <View style={styles.temperatureButtonsContainer}>
              {getAvailableTemperatures().map((temperature) => (
                <TouchableOpacity
                  key={temperature}
                  style={[
                    styles.temperatureButton,
                    selectedTemperature === temperature && styles.selectedTemperatureButton
                  ]}
                  onPress={() => setSelectedTemperature(temperature)}
                >
                  <Text style={[
                    styles.temperatureButtonText,
                    selectedTemperature === temperature && styles.selectedTemperatureButtonText
                  ]}>
                    {temperature}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Size Selection - Only show if menuItem has sizes */}
        {getAvailableSizes().length > 0 && (
          <View style={styles.sizeContainer}>
            <Text style={styles.sectionTitle}>Size</Text>
            <View style={styles.sizeButtonsContainer}>
              {getAvailableSizes().map((size) => {
                const sizePrice = menuItem?.sizes?.[size];
                return (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      selectedSize === size && styles.selectedSizeButton
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[
                      styles.sizeButtonText,
                      selectedSize === size && styles.selectedSizeButtonText
                    ]}>
                      {size}
                    </Text>
                    {sizePrice !== undefined && (
                      <Text style={[
                        styles.sizePriceText,
                        selectedSize === size && styles.selectedSizePriceText
                      ]}>
                        ${sizePrice.toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Customization Sections - Show sections based on allow_customizations */}
        {menuItem?.allow_customizations && menuItem.allow_customizations.length > 0 && (
          <>
            {menuItem.allow_customizations.map((subCategory) => {
              const options = customizationOptions[subCategory] || [];
              const isRequired = subCategory === 'Milk' || subCategory === 'Syrup';
              
              if (options.length === 0) return null;
              
              return (
                <View key={subCategory} style={styles.customizationContainer}>
                  <View style={styles.customizationHeader}>
                    <Text style={styles.sectionTitle}>{subCategory}</Text>
                    {!isRequired && (
                      <Text style={styles.optionalText}>(Optional)</Text>
                    )}
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.customizationScroll}
                    contentContainerStyle={styles.customizationContent}
                  >
                    {options.map((option) => {
                      const isSelected = selectedCustomizations[subCategory] === option.id;
                      const isUnavailable = !option.available;
                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.customizationOption,
                            isSelected && styles.customizationOptionSelected,
                            isUnavailable && styles.customizationOptionUnavailable
                          ]}
                          onPress={() => handleCustomizationSelect(subCategory, option.id)}
                          disabled={isUnavailable}
                        >
                          <Text style={[
                            styles.customizationOptionText,
                            isSelected && styles.customizationOptionTextSelected,
                            isUnavailable && styles.customizationOptionTextUnavailable
                          ]}>
                            {option.name}
                          </Text>
                          {isUnavailable ? (
                            <Text style={styles.customizationUnavailableText}>
                              SOLD OUT
                            </Text>
                          ) : option.price > 0 ? (
                            <Text style={[
                              styles.customizationPriceText,
                              isSelected && styles.customizationPriceTextSelected
                            ]}>
                              +${option.price.toFixed(2)}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}
          </>
        )}
        </ScrollView>

        {/* Price and Buy Button - Fixed at bottom */}
        <View style={styles.priceContainer}>
          <View style={styles.priceSection}>
            <Text style={styles.sectionTitle}>Price</Text>
            <Text style={styles.priceText}>${getPrice()}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.buyButton, (!(menuItem?.available ?? initialItem.available) || !areRequiredCustomizationsSelected()) && styles.disabledBuyButton]}
            disabled={!(menuItem?.available ?? initialItem.available) || !areRequiredCustomizationsSelected()}
            onPress={() => {
              // Validate required customizations
              if (!areRequiredCustomizationsSelected()) {
                Alert.alert(
                  'Selection Required',
                  'Please select a Milk and/or Syrup option before adding to cart.',
                  [{ text: 'OK', style: 'default' }]
                );
                return;
              }
              
              // Build customization details
              const customizations: Record<string, string> = {};
              Object.entries(selectedCustomizations).forEach(([subCategory, itemId]) => {
                const item = customizationOptions[subCategory]?.find(opt => opt.id === itemId);
                if (item) {
                  customizations[subCategory] = item.name;
                }
              });
              
              // Calculate final price including size and customizations
              const finalPrice = calculatePrice();
              
              addItem({
                ...initialItem,
                price: finalPrice, // Use calculated price instead of base price
                ...(menuItem && {
                  served_hot: menuItem.served_hot,
                  served_cold: menuItem.served_cold,
                  allow_customizations: menuItem.allow_customizations,
                  sizes: menuItem.sizes,
                  image_url: menuItem.image_url || initialItem.image_url,
                }),
                size: selectedSize || undefined,
                temperature: selectedTemperature || undefined,
                customizations: Object.keys(customizations).length > 0 ? customizations : undefined,
                quantity: 1
              } as any);
              Alert.alert(
                'Success',
                'Item has been added to cart.',
                [{ text: 'OK', style: 'default' }]
              );
            }}
          >
            <Text style={styles.buyButtonText}>
              {(menuItem?.available ?? initialItem.available) ? 'Buy Now' : 'Sold Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F1E8',
    position: 'relative',
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B2B2B',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  productImage: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  temperatureText: {
    fontSize: 14,
    color: '#666666',
  },
  iconsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  temperatureSelectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  temperatureButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  temperatureButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTemperatureButton: {
    backgroundColor: 'rgba(172, 193, 138, 0.2)',
    borderColor: '#acc18a',
  },
  temperatureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  selectedTemperatureButtonText: {
    color: '#acc18a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  readMoreText: {
    fontSize: 14,
    color: '#acc18a',
    marginTop: 4,
  },
  sizeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sizeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sizeButton: {
    flex: 1,
    minHeight: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedSizeButton: {
    backgroundColor: 'rgba(172, 193, 138, 0.2)',
    borderColor: '#acc18a',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  selectedSizeButtonText: {
    color: '#acc18a',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F5F1E8',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  priceSection: {
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#acc18a',
    marginTop: 4,
  },
  buyButton: {
    backgroundColor: '#acc18a',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 16,
    minWidth: 150,
  },
  disabledBuyButton: {
    backgroundColor: '#CCCCCC',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  sizePriceText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  selectedSizePriceText: {
    color: '#acc18a',
  },
  customizationContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  customizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  customizationScroll: {
    maxHeight: 100,
  },
  customizationContent: {
    paddingRight: 10,
  },
  customizationOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  customizationOptionSelected: {
    backgroundColor: 'rgba(172, 193, 138, 0.2)',
    borderColor: '#acc18a',
  },
  customizationOptionUnavailable: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
    borderColor: '#CCCCCC',
  },
  customizationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  customizationOptionTextSelected: {
    color: '#acc18a',
  },
  customizationOptionTextUnavailable: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  customizationPriceText: {
    fontSize: 12,
    color: '#666666',
  },
  customizationPriceTextSelected: {
    color: '#acc18a',
  },
  customizationUnavailableText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '600',
    marginTop: 2,
  },
});
