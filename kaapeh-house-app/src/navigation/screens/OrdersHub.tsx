import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Svg, Circle, Path } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  fetchAdminPendingOrders,
  fetchAdminPastOrders,
  acceptAdminOrder,
  declineAdminOrder,
  updateAdminOrderStatus,
  AdminOrder,
  OrderItem,
} from '../../services/orderService';

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
  const [newOrders, setNewOrders] = useState<AdminOrder[]>([]);
  const [pastOrders, setPastOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date());

  // Filter orders by selected date
  const filteredPastOrders = useMemo(() => {
    if (!selectedDate) return pastOrders;
    
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return pastOrders.filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === selectedDateStr;
    });
  }, [pastOrders, selectedDate]);

  const orders = useMemo(
    () => {
      if (activeTab === 'new') {
        return newOrders;
      } else {
        return filteredPastOrders;
      }
    },
    [activeTab, newOrders, filteredPastOrders],
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      if (activeTab === 'new') {
        const pending = await fetchAdminPendingOrders();
        setNewOrders(pending);
      } else {
        const past = await fetchAdminPastOrders();
        setPastOrders(past);
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [activeTab]),
  );

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getAvatarInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#4A9B8E', '#E57373', '#64B5F6', '#FFB74D', '#9575CD'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Check if the order was placed today
    const isToday = date.toDateString() === now.toDateString();

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24 && isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    if (diffDays < 7) {
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  };

  const formatCustomizations = (customizations?: Record<string, any>): string => {
    if (!customizations || Object.keys(customizations).length === 0) {
      return '';
    }
    
    // Exclude size and temperature as they're displayed separately
    const filtered = Object.entries(customizations).filter(
      ([key]) => key !== 'size' && key !== 'temperature'
    );
    
    if (filtered.length === 0) return '';
    
    return filtered.map(([category, value]) => `${category}: ${value}`).join(', ');
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptAdminOrder(orderId);
      Alert.alert('Success', 'Order accepted successfully.');
      await loadOrders();
    } catch (error: any) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order. Please try again.');
    }
  };

  const handleDeclineOrder = async (orderId: string) => {
    Alert.alert(
      'Decline Order',
      'Are you sure you want to decline this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineAdminOrder(orderId);
              Alert.alert('Order Declined', 'The order has been removed from the queue.');
              await loadOrders();
            } catch (error: any) {
              console.error('Error declining order:', error);
              Alert.alert('Error', 'Failed to decline order. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleUpdateStatus = async (orderId: string, newStatus: 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    try {
      setUpdatingStatus(true);
      await updateAdminOrderStatus(orderId, newStatus);
      setShowStatusModal(false);
      Alert.alert('Success', `Order status updated to ${newStatus}.`);
      await loadOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleNavigation = (destination: 'dashboard' | 'customers' | 'menu' | 'orders') => {
    if (destination === 'dashboard') {
      (navigation as any).navigate('AdminHome');
    } else if (destination === 'customers') {
      (navigation as any).navigate('CustomerPortal');
    } else if (destination === 'menu') {
      (navigation as any).navigate('Menu');
    }
  };

  const handleDateSelect = () => {
    setSelectedDate(tempSelectedDate);
    setShowDatePicker(false);
  };

  const handleClearDateFilter = () => {
    setSelectedDate(null);
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return 'All Orders';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
      case 'preparing':
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
      case 'ready':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'completed':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'cancelled':
        return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151' };
    }
  };

  const getCustomerStatusText = (status?: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'on_the_way':
        return 'On the Way';
      case 'arrived':
        return 'Arrived';
      default:
        return 'Unknown';
    }
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#20B2AA" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'past' && (
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => {
                    setTempSelectedDate(selectedDate || new Date());
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.filterButtonText}>
                    📅 {formatDateForDisplay(selectedDate)}
                  </Text>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M6 9l6 6 6-6"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
                {selectedDate && (
                  <TouchableOpacity
                    style={styles.clearFilterButton}
                    onPress={handleClearDateFilter}
                  >
                    <Text style={styles.clearFilterButtonText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={styles.orderCountText}>
              {orders.length}{' '}
              {activeTab === 'new' ? 'pending' : 'past'}{' '}
              {orders.length === 1 ? 'order' : 'orders'}
            </Text>

            {orders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No {activeTab === 'new' ? 'pending' : 'past'} orders
                </Text>
              </View>
            ) : (
              orders.map((order) => {
                const customerName = order.customer?.full_name || 'Unknown Customer';
                const customerEmail = order.customer?.email || '';
                const avatarInitials = getAvatarInitials(customerName);
                const statusBadge = getStatusBadgeStyle(order.status);

                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.customerRow}>
                      <View style={styles.customerInfo}>
                        <View
                          style={[
                            styles.avatar,
                            { backgroundColor: getAvatarColor(customerName) },
                          ]}
                        >
                          <Text style={styles.avatarText}>{avatarInitials}</Text>
                        </View>
                        <View>
                          <Text style={styles.customerName}>{customerName}</Text>
                          <Text style={styles.customerEmail}>{customerEmail}</Text>
                        </View>
                      </View>
                      <View style={styles.orderSummary}>
                        <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                        <Text style={styles.orderTime}>{formatTimeAgo(order.created_at)}</Text>
                        <Text style={styles.orderIdText}>Order {order.order_number}</Text>
                      </View>
                    </View>

                    <View style={styles.itemsContainer}>
                      {order.order_items?.map((item, index) => {
                        const itemName = item.menu_item?.name || 'Unknown Item';
                        const customizations = formatCustomizations(item.customizations);
                        return (
                          <View key={`${order.id}-${item.id}-${index}`} style={styles.itemRow}>
                            <Text style={styles.itemText}>
                              {item.quantity}x {itemName}
                            </Text>
                            {(item.size || item.temperature) && (
                              <Text style={styles.itemDetails}>
                                {[item.temperature, item.size].filter(Boolean).join(' • ')}
                              </Text>
                            )}
                            {customizations && (
                              <Text style={styles.itemCustomizations}>{customizations}</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {order.special_instructions && (
                      <View style={styles.specialInstructionsContainer}>
                        <Text style={styles.specialInstructionsLabel}>Special Instructions</Text>
                        <Text style={styles.specialInstructionsText}>
                          {order.special_instructions}
                        </Text>
                      </View>
                    )}

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
                    ) : ['accepted', 'preparing', 'ready'].includes(order.status) ? (
                      <View>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
                            <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Text>
                          </View>
                          <View style={styles.customerStatusContainer}>
                            <Text style={styles.customerStatusLabel}>Customer Status:</Text>
                            <Text style={styles.customerStatusText}>
                              {getCustomerStatusText(order.customer_status)}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.updateStatusButton]}
                          onPress={() => {
                            setSelectedOrder(order);
                            setShowStatusModal(true);
                          }}
                        >
                          <Text style={styles.updateStatusButtonText}>Update Status</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.completedRow}>
                        <View style={[styles.statusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
                          <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            <View style={styles.bottomSpacing} />
          </ScrollView>
        )}
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerBody}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Year</Text>
                <ScrollView style={styles.yearScrollView}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.yearOption,
                          tempSelectedDate.getFullYear() === year && styles.selectedYearOption,
                        ]}
                        onPress={() => {
                          const newDate = new Date(tempSelectedDate);
                          newDate.setFullYear(year);
                          setTempSelectedDate(newDate);
                        }}
                      >
                        <Text
                          style={[
                            styles.yearOptionText,
                            tempSelectedDate.getFullYear() === year && styles.selectedYearOptionText,
                          ]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Month</Text>
                <ScrollView style={styles.monthScrollView}>
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December',
                  ].map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthOption,
                        tempSelectedDate.getMonth() === index && styles.selectedMonthOption,
                      ]}
                      onPress={() => {
                        const newDate = new Date(tempSelectedDate);
                        newDate.setMonth(index);
                        setTempSelectedDate(newDate);
                      }}
                    >
                      <Text
                        style={[
                          styles.monthOptionText,
                          tempSelectedDate.getMonth() === index && styles.selectedMonthOptionText,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Day</Text>
                <ScrollView style={styles.dayScrollView}>
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const daysInMonth = new Date(
                      tempSelectedDate.getFullYear(),
                      tempSelectedDate.getMonth() + 1,
                      0,
                    ).getDate();
                    if (day > daysInMonth) return null;
                    
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayOption,
                          tempSelectedDate.getDate() === day && styles.selectedDayOption,
                        ]}
                        onPress={() => {
                          const newDate = new Date(tempSelectedDate);
                          newDate.setDate(day);
                          setTempSelectedDate(newDate);
                        }}
                      >
                        <Text
                          style={[
                            styles.dayOptionText,
                            tempSelectedDate.getDate() === day && styles.selectedDayOptionText,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.cancelDateButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelDateButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDateButton}
                onPress={handleDateSelect}
              >
                <Text style={styles.confirmDateButtonText}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal for Accepted Orders */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowStatusModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity
                onPress={() => setShowStatusModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={styles.statusOptionsContainer}>
                <TouchableOpacity
                  style={styles.statusOption}
                  onPress={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                  disabled={updatingStatus}
                >
                  <Text style={styles.statusOptionText}>Preparing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statusOption}
                  onPress={() => handleUpdateStatus(selectedOrder.id, 'ready')}
                  disabled={updatingStatus}
                >
                  <Text style={styles.statusOptionText}>Ready</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statusOption}
                  onPress={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                  disabled={updatingStatus}
                >
                  <Text style={styles.statusOptionText}>Completed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusOption, styles.cancelOption]}
                  onPress={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                  disabled={updatingStatus}
                >
                  <Text style={[styles.statusOptionText, styles.cancelOptionText]}>Cancel Order</Text>
                </TouchableOpacity>
                {updatingStatus && (
                  <View style={styles.updatingContainer}>
                    <ActivityIndicator size="small" color="#20B2AA" />
                    <Text style={styles.updatingText}>Updating status...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#687280',
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#687280',
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
    flex: 1,
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
    fontSize: 16,
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
  orderIdText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
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
    fontWeight: '500',
  },
  itemDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemCustomizations: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  specialInstructionsContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  specialInstructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  specialInstructionsText: {
    fontSize: 13,
    color: '#78350F',
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
  updateStatusButton: {
    backgroundColor: '#20B2AA',
    marginTop: 12,
  },
  updateStatusButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerStatusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  customerStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  // Filter styles
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    flex: 1,
  },
  clearFilterButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#EEF2F6',
  },
  clearFilterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '80%',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  // Date picker styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  datePickerBody: {
    flexDirection: 'row',
    padding: 20,
    maxHeight: 400,
  },
  dateInputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  yearScrollView: {
    maxHeight: 200,
  },
  monthScrollView: {
    maxHeight: 200,
  },
  dayScrollView: {
    maxHeight: 200,
  },
  yearOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#F3F4F6',
  },
  selectedYearOption: {
    backgroundColor: '#20B2AA',
  },
  yearOptionText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  selectedYearOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  monthOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#F3F4F6',
  },
  selectedMonthOption: {
    backgroundColor: '#20B2AA',
  },
  monthOptionText: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
  },
  selectedMonthOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#F3F4F6',
  },
  selectedDayOption: {
    backgroundColor: '#20B2AA',
  },
  dayOptionText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  selectedDayOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  datePickerActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  cancelDateButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
  },
  cancelDateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmDateButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#20B2AA',
    alignItems: 'center',
  },
  confirmDateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  statusOptionsContainer: {
    padding: 20,
  },
  statusOption: {
    backgroundColor: '#20B2AA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statusOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelOption: {
    backgroundColor: '#FEE2E2',
  },
  cancelOptionText: {
    color: '#991B1B',
  },
  updatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  updatingText: {
    fontSize: 14,
    color: '#6B7280',
  },
});