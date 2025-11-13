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
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCart, CartItem } from '../../context/CartContext';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import { createOrder, CreateOrderItem } from '../../services/orderService';
import { supabase } from '../../../utils/supabase';

// Define the route params interface (optional, for backward compatibility)
type RootStackParamList = {
  OrderDetail: {
    cartItems?: CartItem[];
  };
};

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

interface OrderDetailScreenProps {}

// Helper function to create unique key for items with same ID but different size/temperature/customizations
const getItemKey = (item: CartItem) => {
  const customizationsKey = item.customizations 
    ? Object.entries(item.customizations).sort().map(([k, v]) => `${k}:${v}`).join(',')
    : '';
  return `${item.id}-${item.size || ''}-${item.temperature || ''}-${customizationsKey}`;
};

// Helper function to format customizations for display
const formatCustomizations = (customizations?: Record<string, string>): string => {
  if (!customizations || Object.keys(customizations).length === 0) {
    return '';
  }
  
  // Format: "Milk: 2% Milk, Syrup: Vanilla"
  return Object.entries(customizations)
    .map(([category, name]) => `${category}: ${name}`)
    .join(', ');
};

// Helper function to get image source (similar to DrinkDetail)
const getImageSource = (item: CartItem) => {
  // Check if image_url is valid
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || url.trim() === '') return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };
  
  // Check image_url first (from database)
  if (isValidImageUrl(item.image_url)) {
    return { uri: item.image_url! };
  }
  
  // Fallback to image if it exists
  if (item.image) {
    return item.image;
  }
  
  // Use placeholder image if no valid image is found
  return require('../../assets/images/no-image-available.jpg');
};

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<OrderDetailRouteProp>();
  const { items: cartItemsFromContext, setQuantity, removeItem, clear } = useCart();
  // Use cart items from context, fallback to route params if provided
  const cartItems = route.params?.cartItems || cartItemsFromContext;
  
  const [quantities, setQuantities] = useState<{[key: string]: number}>(
    cartItems.reduce((acc, item) => ({ ...acc, [getItemKey(item)]: item.quantity || 1 }), {})
  );
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('5 minutes');
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Sync quantities when cartItems change
  React.useEffect(() => {
    const newQuantities = cartItems.reduce((acc, item) => ({ ...acc, [getItemKey(item)]: item.quantity || 1 }), {});
    setQuantities(newQuantities);
  }, [cartItems]);

  const deliveryTimes = ['5 minutes', '10 minutes', '15 minutes', '20 minutes'];

  // Calculate totals
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemKey = getItemKey(item);
      return total + (item.price * quantities[itemKey]);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const discountDeliveryFee = 1.0;
  const total = subtotal + discountDeliveryFee;

  const updateQuantity = (item: CartItem, change: number) => {
    const itemKey = getItemKey(item);
    const currentQuantity = quantities[itemKey] || item.quantity || 1;
    const newQuantity = currentQuantity + change;
    
    // If decreasing and quantity would be 0 or less, remove the item
    if (change < 0 && currentQuantity <= 1) {
      // Remove from cart context
      removeItem(item.id, { size: item.size, temperature: item.temperature });
      // Remove from local quantities state
      setQuantities(prev => {
        const updated = { ...prev };
        delete updated[itemKey];
        return updated;
      });
      return;
    }
    
    // Otherwise, update the quantity (minimum 1)
    const updatedQuantity = Math.max(1, newQuantity);
    
    setQuantities(prev => ({
      ...prev,
      [itemKey]: updatedQuantity
    }));
    
    // Update cart context
    setQuantity(item.id, updatedQuantity, { size: item.size, temperature: item.temperature });
  };

  const handlePlaceOrder = async () => {
    // Check if cart is empty
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      Alert.alert('Authentication Error', 'Please log in to place an order.');
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Transform cart items to CreateOrderItem format
      const orderItems: CreateOrderItem[] = cartItems.map((item) => {
        const itemKey = getItemKey(item);
        const quantity = quantities[itemKey] || item.quantity || 1;
        
        // Combine size, temperature, and customizations into a single customizations object
        const customizations: any = {};
        if (item.size) customizations.size = item.size;
        if (item.temperature) customizations.temperature = item.temperature;
        if (item.customizations) {
          Object.assign(customizations, item.customizations);
        }

        return {
          menu_item_id: item.id,
          quantity: quantity,
          price_at_time: item.price,
          customizations: Object.keys(customizations).length > 0 ? customizations : undefined,
        };
      });

      // Create the order
      const order = await createOrder({
        customer_id: session.user.id,
        cart_items: orderItems,
        total_amount: total,
        special_instructions: specialInstructions || undefined,
      });

      // Clear the cart
      clear();

      // Show success message
      Alert.alert(
        'Order Placed!',
        `Your order has been placed successfully. Your order ID is: #${order.order_number}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to orders screen or home
              navigation.navigate('MyOrder' as never);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        error?.message || 'Failed to place order. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2B2B2B" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Order Checkout</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Pick Up Details Section */}
        <View style={styles.pickupSection}>
          <View style={styles.pickupMethodContainer}>
            <View style={[styles.pickupMethodButton, styles.selectedPickupButton]}>
              <Text style={styles.selectedPickupText}>
                Pick Up Time
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.pickupMethodButton}
              onPress={() => setShowDeliveryDropdown(!showDeliveryDropdown)}
            >
              <Text style={styles.pickupMethodText}>
                {selectedDeliveryTime}
              </Text>
              <MaterialCommunityIcons 
                name={showDeliveryDropdown ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#666666" 
              />
            </TouchableOpacity>
          </View>

          {/* Delivery Time Dropdown */}
          {showDeliveryDropdown && (
            <View style={styles.dropdownContainer}>
              {deliveryTimes.map((time, index) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.dropdownItem,
                    selectedDeliveryTime === time && styles.selectedDropdownItem,
                    index === deliveryTimes.length - 1 && styles.lastDropdownItem
                  ]}
                  onPress={() => {
                    setSelectedDeliveryTime(time);
                    setShowDeliveryDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedDeliveryTime === time && styles.selectedDropdownItemText
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.pickupAddressSection}>
            <Text style={styles.pickupAddressTitle}>Pick Up Address</Text>
            <Text style={styles.pickupAddressName}>Kaapeh House</Text>
            <Text style={styles.pickupAddressDetails}>309 America Drive Suite G, Brownsville, TX 78526</Text>
            
            <TouchableOpacity 
              style={styles.addNoteButton}
              onPress={() => setShowNoteInput(!showNoteInput)}
            >
              <MaterialCommunityIcons name="note-text-outline" size={20} color="#666666" />
              <Text style={styles.addNoteText}>
                {specialInstructions ? 'Edit Note' : 'Add Note'}
              </Text>
            </TouchableOpacity>
            {showNoteInput && (
              <View style={styles.noteInputContainer}>
                <Text style={styles.noteInputLabel}>Special Instructions</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add any special instructions..."
                  placeholderTextColor="#999999"
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.saveNoteButton}
                  onPress={() => setShowNoteInput(false)}
                >
                  <Text style={styles.saveNoteButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
            {specialInstructions && !showNoteInput && (
              <View style={styles.noteDisplayContainer}>
                <Text style={styles.noteDisplayText}>{specialInstructions}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Items Section */}
        <View style={styles.itemsSection}>
          {cartItems.length > 0 ? (
            cartItems.map((item) => {
              const itemKey = getItemKey(item);
              return (
                <View key={itemKey} style={styles.itemCard}>
                  <Image source={getImageSource(item)} style={styles.itemImage} resizeMode="cover" />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemDescriptionContainer}>
                      {/* Temperature and Size */}
                      {(item.temperature || item.size) && (
                        <Text style={styles.itemDescription}>
                          {[item.temperature, item.size].filter(Boolean).join(' • ')}
                        </Text>
                      )}
                      {/* Customizations */}
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <Text style={styles.itemCustomizations}>
                          {formatCustomizations(item.customizations)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.quantityAndPriceContainer}>
                    <View style={styles.quantitySelector}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item, -1)}
                      >
                        <MaterialCommunityIcons name="minus" size={16} color="#666666" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{quantities[itemKey] || item.quantity || 1}</Text>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item, 1)}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color="#666666" />
                      </TouchableOpacity>
                    </View>
                    {/* Item Price */}
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCartContainer}>
              <MaterialCommunityIcons name="cart-outline" size={48} color="#999999" />
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <Text style={styles.emptyCartSubtext}>Add some items to get started</Text>
              <TouchableOpacity 
                style={styles.shopNowButton}
                onPress={() => navigation.navigate('Home' as never)}
              >
                <Text style={styles.shopNowButtonText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Rewards Section */}
        <View style={styles.rewardsSection}>
          <TouchableOpacity style={styles.rewardsButton}>
            <MaterialCommunityIcons name="tag" size={20} color="#acc18a" />
            <Text style={styles.rewardsText}>3 Reward is Applied</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Payment Summary Section */}
        <View style={styles.paymentSummarySection}>
          <Text style={styles.paymentSummaryTitle}>Payment Summary</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Price</Text>
            <Text style={styles.paymentValue}>${subtotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.paymentMethodSection}>
          <TouchableOpacity style={styles.paymentMethodButton}>
            <MaterialCommunityIcons name="wallet" size={20} color="#acc18a" />
            <View style={styles.paymentMethodDetails}>
              <Text style={styles.paymentMethodTitle}>Cash/Wallet</Text>
              <Text style={styles.paymentMethodAmount}>$ {total.toFixed(2)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Order Button */}
        <View style={styles.orderButtonContainer}>
          <TouchableOpacity 
            style={[styles.orderButton, isPlacingOrder && styles.orderButtonDisabled]}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder || cartItems.length === 0}
          >
            {isPlacingOrder ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                <Text style={styles.orderButtonText}>Placing Order...</Text>
              </View>
            ) : (
              <Text style={styles.orderButtonText}>Order</Text>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar currentScreen="Shopping" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B2B2B',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 24,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F1E8',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pickupSection: {
    paddingVertical: 20,
  },
  pickupMethodContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  pickupMethodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectedPickupButton: {
    backgroundColor: '#acc18a',
  },
  pickupMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  selectedPickupText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    top: 60,
    right: 28,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  selectedDropdownItem: {
    backgroundColor: 'rgba(172, 193, 138, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#2B2B2B',
  },
  selectedDropdownItemText: {
    color: '#acc18a',
    fontWeight: '600',
  },
  pickupAddressSection: {
    marginTop: 16,
  },
  pickupAddressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  pickupAddressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  pickupAddressDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addNoteText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  itemsSection: {
    paddingVertical: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  itemDescriptionContainer: {
    marginTop: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  itemCustomizations: {
    fontSize: 13,
    color: '#666666',
  },
  quantityAndPriceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#acc18a',
    marginTop: 8,
    textAlign: 'center',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2B2B',
    marginHorizontal: 16,
  },
  rewardsSection: {
    paddingVertical: 20,
  },
  rewardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  rewardsText: {
    flex: 1,
    fontSize: 14,
    color: '#2B2B2B',
    marginLeft: 12,
  },
  paymentSummarySection: {
    paddingVertical: 20,
  },
  paymentSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  deliveryFeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strikethroughText: {
    fontSize: 14,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  paymentMethodSection: {
    paddingVertical: 20,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  paymentMethodDetails: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  paymentMethodAmount: {
    fontSize: 14,
    color: '#2B2B2B',
  },
  orderButtonContainer: {
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  orderButton: {
    backgroundColor: '#acc18a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyCartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#acc18a',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shopNowButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noteInputContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noteInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2B2B2B',
    backgroundColor: '#F9F9F9',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveNoteButton: {
    backgroundColor: '#acc18a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  saveNoteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noteDisplayContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noteDisplayText: {
    fontSize: 14,
    color: '#2B2B2B',
    lineHeight: 20,
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
