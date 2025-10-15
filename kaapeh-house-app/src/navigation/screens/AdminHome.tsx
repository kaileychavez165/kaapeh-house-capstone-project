import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icons as SVG components
const TransactionIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="10" r="8" stroke="#999" strokeWidth="1.5" />
    <Path d="M10 6v8M6 10h8" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const CustomersIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Circle cx="7" cy="7" r="3" stroke="#999" strokeWidth="1.5" />
    <Circle cx="14" cy="7" r="3" stroke="#999" strokeWidth="1.5" />
    <Path d="M3 17c0-2.5 2-4 4-4s4 1.5 4 4M11 17c0-2.5 2-4 4-4s4 1.5 4 4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const MenuItemsIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="7" r="3" stroke="#999" strokeWidth="1.5" />
    <Path d="M5 17c1-3 2-5 5-5s4 2 5 5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const CategoriesIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" stroke="#999" strokeWidth="1.5" />
  </Svg>
);

const InventoryIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M3 3h14v14H3z" stroke="#999" strokeWidth="1.5" />
    <Path d="M7 3v14M13 3v14M3 10h14" stroke="#999" strokeWidth="1.5" />
  </Svg>
);

const PricingIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="10" r="7" stroke="#999" strokeWidth="1.5" />
    <Path d="M10 6v8M7 8h6M7 12h6" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const OffersIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M3 7l7-4 7 4v6l-7 4-7-4V7z" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 10l-7-4M10 10v8M10 10l7-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const AdminHome = () => {
  const [selectedMenu, setSelectedMenu] = useState('Transactions');
  const [paymentsExpanded, setPaymentsExpanded] = useState(true);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // State for each menu dropdown
  const [coffeeExpanded, setCoffeeExpanded] = useState(false);
  const [teaExpanded, setTeaExpanded] = useState(false);
  const [seasonalExpanded, setSeasonalExpanded] = useState(false);
  const [foodExpanded, setFoodExpanded] = useState(false);
  const [extrasExpanded, setExtrasExpanded] = useState(false);

  // Animated value for sidebar width
  const sidebarWidth = useRef(new Animated.Value(240)).current;
  const SIDEBAR_WIDTH = 240;
  const MINIMIZED_WIDTH = 0;

  // Toggle sidebar function
  const toggleSidebar = () => {
    const toValue = sidebarVisible ? MINIMIZED_WIDTH : SIDEBAR_WIDTH;
    Animated.timing(sidebarWidth, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setSidebarVisible(!sidebarVisible);
  };

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Detect horizontal swipe with minimum distance
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Swipe right to show sidebar
        if (gestureState.dx > 50 && !sidebarVisible) {
          toggleSidebar();
        }
        // Swipe left to hide sidebar
        else if (gestureState.dx < -50 && sidebarVisible) {
          toggleSidebar();
        }
      },
    })
  ).current;

  const weeklyData = [
    { label: 'Mar 1 - 7', value: 50000 },
    { label: 'Mar 8 - 14', value: 120000 },
    { label: 'Mar 15 - 21', value: 130000 },
    { label: 'Mar 22 - 28', value: 140000 },
    { label: 'Final wk', value: 180000 },
  ];

  const maxValue = Math.max(...weeklyData.map(d => d.value));

  const errorData = [
    { label: 'Customer errors', value: 1, color: '#FDB022' },
    { label: 'Fraud blocks', value: 5, color: '#E5A13E' },
    { label: 'Bank errors', value: 3, color: '#F07167' },
    { label: 'System errors', value: 10, color: '#69DFD3' },
  ];

  const paymentMenuItems = [
    { name: 'Transactions', icon: TransactionIcon },
    { name: 'Customers', icon: CustomersIcon },
  ];

  const menuMenuItems = [
    { name: 'Coffee', expanded: coffeeExpanded, setExpanded: setCoffeeExpanded },
    { name: 'Tea and Other Drinks', expanded: teaExpanded, setExpanded: setTeaExpanded },
    { name: 'Seasonal Items', expanded: seasonalExpanded, setExpanded: setSeasonalExpanded },
    { name: 'Food', expanded: foodExpanded, setExpanded: setFoodExpanded },
    { name: 'Extras', expanded: extrasExpanded, setExpanded: setExtrasExpanded },
  ];

  return (
    <View style={styles.mainContainer} {...panResponder.panHandlers}>
      {/* Hamburger Menu Toggle Button */}
      <TouchableOpacity 
        style={styles.hamburgerButton}
        onPress={toggleSidebar}
      >
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
      </TouchableOpacity>

      {/* Side Menu */}
      <Animated.View style={[styles.sideMenu, { width: sidebarWidth }]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Kaapeh House</Text>
        </View>

        {/* Payments Section */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setPaymentsExpanded(!paymentsExpanded)}
          >
            <Text style={styles.sectionTitle}>Payments</Text>
            <Text style={styles.sectionArrow}>{paymentsExpanded ? '△' : '▽'}</Text>
          </TouchableOpacity>
          {paymentsExpanded && (
            <View style={styles.menuItems}>
              {paymentMenuItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.menuItem,
                    selectedMenu === item.name && styles.menuItemActive,
                  ]}
                  onPress={() => setSelectedMenu(item.name)}
                >
                  <item.icon />
                  <Text style={styles.menuItemText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setMenuExpanded(!menuExpanded)}
          >
            <Text style={styles.sectionTitle}>Menu</Text>
            <Text style={styles.sectionArrow}>{menuExpanded ? '△' : '▽'}</Text>
          </TouchableOpacity>
          {menuExpanded && (
            <View style={styles.menuItems}>
              {menuMenuItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.menuItem,
                    selectedMenu === item.name && styles.menuItemActive,
                  ]}
                  onPress={() => item.setExpanded(!item.expanded)}
                >
                  <Text style={styles.menuItemText}>{item.name}</Text>
                  <Text style={styles.menuItemArrow}>{item.expanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>👋 Hey Admin!</Text>
          <Text style={styles.earnings}>Here are the reports.</Text>
          <View style={styles.filterContainer}>
            <Text style={styles.filterText}>Last 30 days</Text>
            <Text style={styles.filterArrow}>▼</Text>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            {weeklyData.map((item, index) => {
              const height = (item.value / maxValue) * 200;
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <LinearGradient
                      colors={['#E5D4FF', '#D4BBFF']}
                      style={[styles.bar, { height }]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Statistics */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
  },
  hamburgerButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 1000,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hamburgerLine: {
    width: 24,
    height: 3,
    backgroundColor: '#333',
    marginVertical: 2,
    borderRadius: 2,
  },
  sideMenu: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    paddingTop: 20,
    overflow: 'hidden',
  },
  logo: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  menuSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionArrow: {
    fontSize: 10,
    color: '#999',
  },
  menuItems: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 3,
    borderLeftColor: '#9C27B0',
  },
  menuItemText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  menuItemArrow: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 20,
    color: '#333',
    marginBottom: 8,
  },
  earnings: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  filterArrow: {
    fontSize: 12,
    color: '#9C27B0',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 250,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 30,
  },
  barLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'column',
    gap: 16,
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  statDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  errorBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 16,
  },
  errorBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  errorBarWrapper: {
    width: '70%',
    alignItems: 'center',
  },
  errorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  errorBar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 20,
  },
  totalErrors: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  errorCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
  },
  errorLegend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AdminHome;