import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import { Session } from '@supabase/supabase-js';


const { width } = Dimensions.get('window');

interface Drink {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: string;
  image: any;
}

interface HomeScreenProps {
  session: Session | null;
}

export default function HomeScreen({ session }: HomeScreenProps) {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All Coffee');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract first name from session
  const getFirstName = () => {
    if (session?.user?.user_metadata?.full_name) {
      return session.user.user_metadata.full_name.split(' ')[0];
    }
    if (session?.user?.email) {
      return session.user.email.split('@')[0];
    }
    return 'User';
  };

  // Template drink data - will be replaced with database data later
  const templateDrinks: Drink[] = [
    {
      id: '1',
      name: 'Caffe Mocha',
      description: 'Deep Foam',
      price: 4.53,
      rating: 4.8,
      category: 'Mocha',
      image: require('../../assets/images/react-logo.png'), // Placeholder image
    },
    {
      id: '2',
      name: 'Flat White',
      description: 'Espresso',
      price: 3.53,
      rating: 4.8,
      category: 'Latte',
      image: require('../../assets/images/react-logo.png'), // Placeholder image
    },
  ];

  // we can later change this to fetch from the database
  const categories = ['All Coffee', 'Machiato', 'Latte', 'Americano', 'Cappuccino'];

  // we can later change this to fetch from the database
  const renderDrinkCard = (drink: Drink) => (
    <View key={drink.id} style={styles.drinkCard}>
      <View style={styles.drinkImageContainer}>
        <Image source={drink.image} style={styles.drinkImage} resizeMode="cover" />
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{drink.rating}</Text>
        </View>
      </View>
      <Text style={styles.drinkName}>{drink.name}</Text>
      <Text style={styles.drinkDescription}>{drink.description}</Text>
      <View style={styles.drinkFooter}>
        <Text style={styles.drinkPrice}>$ {drink.price.toFixed(2)}</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
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
                placeholder="Search coffee"
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

      {/* Promo Banner - Positioned to overlap both sections */}
      <View style={styles.promoBanner}>
        <View style={styles.promoTag}>
          <Text style={styles.promoTagText}>Promo</Text>
        </View>
        <Text style={styles.promoTitle}>
          Buy one <Text style={styles.underline}>get</Text> one <Text style={styles.underline}>FREE</Text>
        </Text>
        <View style={styles.promoIcons}>
          <MaterialCommunityIcons name="coffee" size={30} color="#FFFFFF" />
          <MaterialCommunityIcons name="heart" size={25} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Categories */}
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

        {/* Drink Grid */}
        <View style={styles.drinksGrid}>
          {templateDrinks.map((drink) => renderDrinkCard(drink))}
        </View>

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar currentScreen="Home" />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.floatingButton}>
        <MaterialCommunityIcons name="star-outline" size={24} color="#FFFFFF" />
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
  promoBanner: {
    backgroundColor: '#D2691E',
    borderRadius: 20,
    padding: 20,
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
    marginTop: 40, // Add space to account for overlapping promo banner
    marginBottom: 24,
  },
  categoriesContent: {
    paddingRight: 24,
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
  drinksGrid: {
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
});
