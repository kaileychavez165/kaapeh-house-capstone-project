import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCart } from '../../context/CartContext';

// Define the route params interface
type RootStackParamList = {
  DrinkDetail: {
    item: {
      id: string;
      name: string;
      description: string;
      price: number;
      rating: number;
      category: string;
      image: any;
      available: boolean;
    };
  };
};

type DrinkDetailRouteProp = RouteProp<RootStackParamList, 'DrinkDetail'>;

interface DrinkDetailScreenProps {}

export default function DrinkDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<DrinkDetailRouteProp>();
  const { item } = route.params;
  const { addItem } = useCart();
  
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedTemperature, setSelectedTemperature] = useState('Hot');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const isDrink = /coffee|tea|drink/i.test(item.category || '');

  // Calculate price based on size
  const getPrice = () => {
    const basePrice = item.price;
    switch (selectedSize) {
      case 'S':
        return (basePrice * 0.8).toFixed(2);
      case 'M':
        return basePrice.toFixed(2);
      case 'L':
        return (basePrice * 1.2).toFixed(2);
      default:
        return basePrice.toFixed(2);
    }
  };

  // Truncate description for initial display
  const truncatedDescription = item.description.length > 100 
    ? item.description.substring(0, 100) + '...'
    : item.description;

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
        
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => setIsFavorited(!isFavorited)}
        >
          <MaterialCommunityIcons 
            name={isFavorited ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorited ? "#FF6B6B" : "#2B2B2B"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image source={item.image} style={styles.productImage} resizeMode="cover" />
          </View>

          {/* Product Information */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Text style={styles.reviewCount}>(230)</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {showFullDescription ? item.description : truncatedDescription}
            </Text>
            {item.description.length > 100 && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.readMoreText}>
                  {showFullDescription ? 'Read Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
        </View>

        {/* Temperature Selection (only for drinks) */}
        {isDrink && (
          <View style={styles.temperatureSelectionContainer}>
            <Text style={styles.sectionTitle}>Temperature</Text>
            <View style={styles.temperatureButtonsContainer}>
              {['Iced', 'Hot'].map((temperature) => (
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

        {/* Size Selection */}
        <View style={styles.sizeContainer}>
            <Text style={styles.sectionTitle}>Size</Text>
            <View style={styles.sizeButtonsContainer}>
              {['S', 'M', 'L'].map((size) => (
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
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Price and Buy Button - Fixed at bottom */}
        <View style={styles.priceContainer}>
          <View style={styles.priceSection}>
            <Text style={styles.sectionTitle}>Price</Text>
            <Text style={styles.priceText}>$ {getPrice()}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.buyButton, !item.available && styles.disabledBuyButton]}
            disabled={!item.available}
            onPress={() => {
              addItem({
                ...item,
                size: selectedSize,
                temperature: isDrink ? selectedTemperature : 'Regular',
                quantity: 1
              } as any);
              (navigation as any).navigate('OrderDetail');
            }}
          >
            <Text style={styles.buyButtonText}>
              {item.available ? 'Buy Now' : 'Sold Out'}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F1E8',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B2B2B',
  },
  favoriteButton: {
    padding: 8,
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
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
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
});
