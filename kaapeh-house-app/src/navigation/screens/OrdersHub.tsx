import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Svg, Circle, Path } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const ChartIcon = ({ active = false }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3v18h18"
      stroke={active ? '#20B2AA' : '#999'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.4 6.6L13 12l-4-4-6 6"
      stroke={active ? '#20B2AA' : '#999'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UsersIcon = ({ active = false }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke={active ? '#20B2AA' : '#999'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="9"
      cy="7"
      r="4"
      stroke={active ? '#20B2AA' : '#999'}
      strokeWidth="2"
    />
    <Path
      d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      stroke={active ? '#20B2AA' : '#999'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ active = false }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={active ? '#20B2AA' : '#999'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={active ? '#20B2AA' : '#999'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TruckIcon = ({ active = false }: { active?: boolean }) => (
  <MaterialCommunityIcons name="truck-check" size={28} color={active ? "#20B2AA" : "#999"} />
);

const OrdersHubScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'new' | 'past'>('new');
  const [newOrders, setNewOrders] = useState<Order[]>(initialNewOrders);
  const [pastOrders, setPastOrders] = useState<Order[]>(initialPastOrders);

  const orders = useMemo(
    () => (activeTab === 'new' ? newOrders : pastOrders),
    [activeTab, newOrders, pastOrders],
  );

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getAvatarColor = (name: string) => {
    const colors = ['#4A9B8E', '#E57373', '#64B5F6', '#FFB74D', '#9575CD'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const moveOrderToPast = (order: Order) => {
    const completedOrder: Order = {
      ...order,
      status: 'completed',
      time: `Today, ${new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`,
    };

    setPastOrders((current) => [completedOrder, ...current]);
  };

  const handleAcceptOrder = (orderId: string) => {
    setNewOrders((current) => {
      const orderToAccept = current.find((order) => order.id === orderId);
      if (!orderToAccept) {
        return current;
      }

      moveOrderToPast(orderToAccept);
      return current.filter((order) => order.id !== orderId);
    });
  };

  const handleDeclineOrder = (orderId: string) => {
    setNewOrders((current) => current.filter((order) => order.id !== orderId));
    Alert.alert('Order declined', 'The order has been removed from the queue.');
  };

  const handleViewDetails = (orderId: string) => {
    // Placeholder until detailed order modal exists
    Alert.alert('Order details', `Detailed view for order #${orderId} coming soon.`);
  };

  const handleNavigation = (destination: 'dashboard' | 'customers' | 'menu' | 'orders') => {
    if (destination === 'dashboard') {
      (navigation as any).navigate('AdminHome');
    } else if (destination === 'customers') {
      (navigation as any).navigate('CustomerPortal');
    } else if (destination === 'menu') {
      (navigation as any).navigate('Menu');
    }
    // No navigation needed for 'orders' because we are already here
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#20B2AA" />

      <View style={styles.statusBar}>
        <Image
          source={require('../../assets/images/logo-white-one.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.statusIcons} />
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerSubtitle}>View and manage incoming orders.</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'new' && styles.activeTabButton]}
          onPress={() => setActiveTab('new')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'new' && styles.activeTabButtonText]}
          >
            New Orders
          </Text>
          {activeTab === 'new' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'past' && styles.activeTabButton]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'past' && styles.activeTabButtonText]}
          >
            Past Orders
          </Text>
          {activeTab === 'past' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.orderCountText}>
            {orders.length}{' '}
            {activeTab === 'new' ? 'pending' : 'completed'}{' '}
            {orders.length === 1 ? 'order' : 'orders'}
          </Text>

          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.customerRow}>
                <View style={styles.customerInfo}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: getAvatarColor(order.customerName) },
                    ]}
                  >
                    <Text style={styles.avatarText}>{order.avatar}</Text>
                  </View>
                  <View>
                    <Text style={styles.customerName}>{order.customerName}</Text>
                    <Text style={styles.customerEmail}>{order.customerEmail}</Text>
                  </View>
                </View>
                <View style={styles.orderSummary}>
                  <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                  <Text style={styles.orderTime}>{order.time}</Text>
                </View>
              </View>

              <View style={styles.itemsContainer}>
                {order.items.map((item, index) => (
                  <View key={`${order.id}-${item.name}-${index}`} style={styles.itemRow}>
                    <Text style={styles.itemText}>
                      {item.quantity}x {item.name}
                    </Text>
                  </View>
                ))}
              </View>

              {order.status === 'pending' ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptOrder(order.id)}
                  >
                    <Text style={styles.acceptButtonText}>Accept Order</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleDeclineOrder(order.id)}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.completedRow}>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Completed</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleViewDetails(order.id)}>
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleNavigation('dashboard')}
        >
          <ChartIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleNavigation('customers')}
        >
          <UsersIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleNavigation('menu')}
        >
          <EditIcon />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]} disabled>
          <TruckIcon active />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrdersHubScreen;

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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  activeTabButton: {},
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#687280',
  },
  activeTabButtonText: {
    color: '#20B2AA',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    left: '35%',
    right: '35%',
    borderRadius: 4,
    backgroundColor: '#20B2AA',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  orderCountText: {
    fontSize: 14,
    color: '#687280',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  orderSummary: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  orderTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  itemsContainer: {
    backgroundColor: '#F4F6F8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  itemRow: {
    paddingVertical: 6,
  },
  itemText: {
    fontSize: 14,
    color: '#374151',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#20B2AA',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  declineButton: {
    backgroundColor: '#EEF2F6',
  },
  declineButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButtonText: {
    color: '#20B2AA',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 80,
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