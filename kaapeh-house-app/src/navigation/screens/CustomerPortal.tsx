import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Svg, Circle, Path, Rect } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchCustomerSummaries } from '../../services/customerService';

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

const CustomerPortal = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Most Recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    orders: number;
    joinedDate: string; // "Month YYYY"
    createdAtMs: number;
    avatar: string; // initials for placeholder
    avatar_url: string | null;
    hasImage: boolean;
  }>>([]);
  const navigation = useNavigation();
  
  // Animation for dropdown
  const dropdownOpacity = useState(new Animated.Value(0))[0];
  const dropdownScale = useState(new Animated.Value(0.8))[0];

  // Fetch customers from backend
  React.useEffect(() => {
    const formatMonthYear = (isoDate: string) => {
      const d = new Date(isoDate);
      return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    };
    const getInitials = (fullName: string) => {
      const parts = fullName.trim().split(/\s+/);
      const first = parts[0]?.[0] || '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
      return (first + last).toUpperCase();
    };

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const summaries = await fetchCustomerSummaries();
        const mapped = summaries.map((s) => ({
          id: s.id,
          name: s.full_name,
          email: s.email,
          orders: s.ordersCount,
          joinedDate: formatMonthYear(s.created_at),
          createdAtMs: new Date(s.created_at).getTime(),
          avatar: getInitials(s.full_name),
          avatar_url: s.avatar_url,
          hasImage: !!(s.avatar_url && (s.avatar_url.startsWith('http') || s.avatar_url.startsWith('https'))),
        }));
        setCustomers(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Animation for customer cards
  const [cardAnimations, setCardAnimations] = useState<Array<{ opacity: Animated.Value; translateY: Animated.Value }>>([]);

  // Filter and sort derived lists (used by animations and render)
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const sortedCustomers = useMemo(() => {
    const arr = [...filteredCustomers];
    arr.sort((a, b) => {
      if (sortBy === 'Most Recent') {
        return b.createdAtMs - a.createdAtMs;
      } else if (sortBy === 'Least Recent') {
        return a.createdAtMs - b.createdAtMs;
      }
      return 0;
    });
    return arr;
  }, [filteredCustomers, sortBy]);

  // Build and run animations for the visible (filtered/sorted) list
  React.useEffect(() => {
    const newAnimations = sortedCustomers.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    }));
    setCardAnimations(newAnimations);

    const animateCards = () => {
      newAnimations.forEach((animation, index) => {
        Animated.parallel([
          Animated.timing(animation.opacity, {
            toValue: 1,
            duration: 300,
            delay: index * 50,
            useNativeDriver: true,
          }),
          Animated.timing(animation.translateY, {
            toValue: 0,
            duration: 300,
            delay: index * 50,
            useNativeDriver: true,
          }),
        ]).start();
      });
    };

    const t = setTimeout(animateCards, 50);
    return () => clearTimeout(t);
  }, [sortedCustomers.length]);

  // Sort customers based on selected option

  const sortOptions = ['Most Recent', 'Least Recent'];

  // Debug: Log the current sort and first few customers
  console.log('Current sort:', sortBy);
  console.log('First 3 customers:', sortedCustomers.slice(0, 3).map(c => ({ name: c.name, joinedDate: c.joinedDate })));

  // Animate customer cards on mount and when sort changes
  // Remove old effect that tried to re-run animations separately

  // Handle dropdown toggle with animation
  const toggleDropdown = () => {
    if (showSortDropdown) {
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
        setShowSortDropdown(false);
      });
    } else {
      // Open dropdown
      setShowSortDropdown(true);
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

  // Handle sort selection with animation
  const handleSortSelection = (option: string) => {
    setSortBy(option);
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
      setShowSortDropdown(false);
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#20B2AA" />
      
      {/* Top Status Bar */}
      <View style={styles.statusBar}>
        <Image 
          source={require('../../assets/images/logo-white-one.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.statusIcons}>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerSubtitle}>View all registered customers</Text>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Customer Summary and Sort */}
        <View style={styles.summaryContainer}>
          <Text style={styles.totalCustomers}>{filteredCustomers.length} total customers</Text>
          <View style={styles.sortContainer}>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={toggleDropdown}
            >
              <Text style={styles.sortText}>{sortBy}</Text>
              <Text style={styles.sortArrow}>{showSortDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {showSortDropdown && (
              <Animated.View 
                style={[
                  styles.dropdown,
                  {
                    opacity: dropdownOpacity,
                    transform: [{ scale: dropdownScale }],
                  }
                ]}
              >
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      sortBy === option && styles.selectedDropdownItem
                    ]}
                    onPress={() => handleSortSelection(option)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      sortBy === option && styles.selectedDropdownText
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
        {showSortDropdown && (
          <View
            style={styles.dropdownBackdrop}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => setShowSortDropdown(false)}
          />
        )}

        {/* Loading / Error */}
        {loading && (
          <Text style={{ textAlign: 'center', color: '#6B7280', marginBottom: 12 }}>Loading customers...</Text>
        )}
        {!!error && (
          <Text style={{ textAlign: 'center', color: '#DC2626', marginBottom: 12 }}>{error}</Text>
        )}

        {/* Customer List */}
        <View style={styles.customerList}>
          {cardAnimations.length === sortedCustomers.length && sortedCustomers.map((customer, index) => {
            const animation = cardAnimations[index];
            return (
              <Animated.View 
                key={customer.id} 
                style={[
                  styles.customerCard,
                  {
                    opacity: animation.opacity,
                    transform: [{ translateY: animation.translateY }],
                  }
                ]}
              >
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerEmail}>{customer.email}</Text>
                <View style={styles.customerDetails}>
                  <Text style={styles.orderCount}>{customer.orders} orders</Text>
                  <Text style={styles.joinedDate}>Joined {customer.joinedDate}</Text>
                </View>
              </View>
              <View style={styles.avatarContainer}>
                {customer.hasImage && customer.avatar_url ? (
                  <Image
                    source={{ uri: customer.avatar_url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarInitials}>
                    <Text style={styles.avatarText}>{customer.avatar}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminHome' as never)}
        >
          <ChartIcon active={false} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <UsersIcon active={true} />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Menu' as never)}
        >
          <EditIcon active={false} />
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
  statusIcons: {
    flexDirection: 'row',
    gap: 5,
  },
  statusIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    backgroundColor: '#20B2AA',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 15,
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
  content: {
    flex: 1,
    paddingHorizontal: 10,
  },
  searchContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchIcon: {
    fontSize: 16,
    color: '#9CA3AF',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalCustomers: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sortContainer: {
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    minWidth: 120,
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
  customerList: {
    gap: 12,
    paddingBottom: 100,
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
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  customerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  joinedDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  avatarContainer: {
    marginLeft: 12,
  },
  avatarInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#20B2AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
});

export default CustomerPortal;
