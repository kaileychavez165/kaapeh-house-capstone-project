import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Platform,
    StatusBar,
    ScrollView,
    Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import BottomNavigationBar from "../../components/BottomNavigationBar";
import { cancelOrder, updateCustomerStatus, Order, OrderItem } from "../../services/orderService";
import { useActiveOrders, usePastOrders, useInvalidateOrders } from "../../hooks/useOrderQueries";

interface MyOrderProps {
    session: Session;
}

export default function MyOrderScreen({ session }: MyOrderProps) {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active'); 
    const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});
    
    // React Query hooks for orders
    const { data: activeOrders = [], isLoading: activeLoading, refetch } = useActiveOrders(session?.user?.id);
    const { data: pastOrders = [], isLoading: pastLoading } = usePastOrders(session?.user?.id);
    const { invalidateActive, invalidatePast } = useInvalidateOrders();
    
    const loading = activeTab === 'active' ? activeLoading : pastLoading;

    // Initialize selected statuses when active orders change
    useEffect(() => {
        if (activeOrders.length > 0) {
            const initialStatuses: Record<string, string> = {};
            activeOrders.forEach((order: Order) => {
                initialStatuses[order.id] = order.customer_status || "not_started";
            });
            setSelectedStatuses(initialStatuses);
        }
    }, [activeOrders]);

    // Dummy order data for testing
    const getDummyOrder = (): Order => {
        const eightMinutesAgo = new Date(Date.now() - 8 * 60000).toISOString();
        return {
            id: "dummy-order-3847",
            customer_id: session?.user?.id || "dummy-user",
            order_number: "#3847",
            status: "preparing",
            total: 7.75,
            estimated_time: "15-20 min",
            location: "Main Street Cafe",
            customer_status: "on_the_way",
            created_at: eightMinutesAgo,
            order_items: [
                {
                    id: "dummy-item-1",
                    order_id: "dummy-order-3847",
                    menu_item_id: "dummy-menu-1",
                    quantity: 1,
                    size: "M",
                    temperature: "hot",
                    price: 4.50,
                    menu_item: {
                        name: "Caramel Latte",
                        description: "Rich espresso with caramel and steamed milk",
                    },
                },
                {
                    id: "dummy-item-2",
                    order_id: "dummy-order-3847",
                    menu_item_id: "dummy-menu-2",
                    quantity: 1,
                    price: 3.25,
                    menu_item: {
                        name: "Blueberry Muffin",
                        description: "Fresh baked blueberry muffin",
                    },
                },
            ],
        };
    };

    // For now, add dummy order if no orders found (for testing)
    const ordersToShow = activeOrders.length > 0 ? activeOrders : [getDummyOrder()];

    const handleCancelOrder = async (orderId: string) => {
        Alert.alert(
            "Cancel Order",
            "Are you sure you want to cancel this order?",
            [
                {
                    text: "No",
                    style: "cancel",
                },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await cancelOrder(orderId);
                            // Invalidate queries to refetch orders
                            if (session?.user?.id) {
                                invalidateActive(session.user.id);
                                invalidatePast(session.user.id);
                            }
                            Alert.alert("Order Cancelled", "Your order has been cancelled successfully.");
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error?.message || "Failed to cancel order. Please try again."
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleStatusChange = async (orderId: string, status: "not_started" | "on_the_way" | "arrived") => {
        try {
            setSelectedStatuses((prev) => ({
                ...prev,
                [orderId]: status,
            }));

            // Skip API call for dummy orders
            if (orderId.startsWith("dummy-")) {
                return;
            }

            await updateCustomerStatus(orderId, status);
            
            // Invalidate and refetch orders after status update
            if (session?.user?.id) {
                invalidateActive(session.user.id);
            }
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert("Error updating status", error.message);
                // Revert on error by refetching
                refetch();
            }
        }
    };

    const formatTimeAgo = (createdAt: string) => {
        const now = new Date();
        const orderTime = new Date(createdAt);
        const diffMs = now.getTime() - orderTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "just now";
        if (diffMins === 1) return "1 min ago";
        return `${diffMins} min ago`;
    };

    const formatDateTime = (createdAt: string) => {
        const orderTime = new Date(createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const orderDate = new Date(orderTime.getFullYear(), orderTime.getMonth(), orderTime.getDate());
        
        // Check if the order was today
        const isToday = orderDate.getTime() === today.getTime();
        
        // Format time in 12-hour format
        let hours = orderTime.getHours();
        const minutes = orderTime.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
        const timeString = `${hours}:${minutesStr} ${ampm}`;
        
        if (isToday) {
            return `Placed today, ${timeString}`;
        }
        
        // Check if the order was yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = orderDate.getTime() === yesterday.getTime();
        
        if (isYesterday) {
            return `Placed yesterday, ${timeString}`;
        }
        
        // Format date
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[orderTime.getMonth()];
        const day = orderTime.getDate();
        const year = orderTime.getFullYear();
        
        // Check if it's the current year
        if (orderTime.getFullYear() === now.getFullYear()) {
            return `${month} ${day}, ${timeString}`;
        }
        
        return `Placed ${month} ${day}, ${year}, ${timeString}`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "preparing":
                return "#90EE90";
            case "ready":
                return "#87CEEB";
            case "pending":
                return "#FFD700";
            case "completed":
                return "#90EE90";
            case "cancelled":
                return "#FF6B6B";
            default:
                return "#90EE90";
        }
    };

    const getStatusDisplayName = (status: string) => {
        switch (status.toLowerCase()) {
            case "preparing":
                return "Preparing";
            case "ready":
                return "Ready";
            case "pending":
                return "Pending";
            case "completed":
                return "Completed";
            case "cancelled":
                return "Cancelled";
            default:
                return status;
        }
    };

    const orders = activeTab === 'active' ? activeOrders : pastOrders;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2B2B2B" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logoText}>My Orders</Text>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'active' && styles.activeTabButton]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text
                            style={[styles.tabButtonText, activeTab === 'active' && styles.activeTabButtonText]}
                        >
                            Active Orders
                        </Text>
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
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading orders...</Text>
                        </View>
                    ) : (activeTab === 'active' ? ordersToShow : pastOrders).length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="package-variant" size={64} color="#999999" />
                            <Text style={styles.emptyText}>
                                {activeTab === 'active' ? 'No Active Orders' : 'No Past Orders'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {activeTab === 'active'
                                    ? 'You do not have any active orders at the moment.'
                                    : 'You do not have any past orders.'}
                            </Text>
                        </View>
                    ) : (
                        <>
                            {(activeTab === 'active' ? ordersToShow : pastOrders).map((order: Order) => (
                                <View key={order.id} style={styles.orderCard}>
                                    {/* Order Header */}
                                    <View style={styles.orderHeader}>
                                        <Text style={styles.orderNumber}>{order.order_number}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                                            <MaterialCommunityIcons name="cube" size={14} color="#FFFFFF" />
                                            <Text style={styles.statusText}>{getStatusDisplayName(order.status)}</Text>
                                        </View>
                                    </View>

                                    {/* Time Placed */}
                                    <View style={styles.timeRow}>
                                        <MaterialCommunityIcons name="clock-outline" size={16} color="#666666" />
                                        <Text style={styles.timeText}>
                                            {activeTab === 'past' || order.status === 'completed' || order.status === 'cancelled'
                                                ? formatDateTime(order.created_at)
                                                : `Placed ${formatTimeAgo(order.created_at)}`}
                                        </Text>
                                    </View>

                                    {/* Order Items */}
                                    <View style={styles.itemsContainer}>
                                        {order.order_items?.map((item: OrderItem, index: number) => {
                                            // Format customizations for display (excluding size and temperature)
                                            const customizations = item.customizations || {};
                                            const otherCustomizations: Record<string, string> = {};
                                            
                                            Object.entries(customizations).forEach(([key, value]) => {
                                                if (key !== 'size' && key !== 'temperature' && value) {
                                                    // Convert value to string if it's not already
                                                    otherCustomizations[key] = typeof value === 'string' ? value : String(value);
                                                }
                                            });

                                            // Format other customizations: "Milk: 2% Milk, Syrup: Vanilla"
                                            const formatCustomizations = (customizations: Record<string, string>): string => {
                                                if (Object.keys(customizations).length === 0) {
                                                    return '';
                                                }
                                                return Object.entries(customizations)
                                                    .map(([category, name]) => `${category}: ${name}`)
                                                    .join(', ');
                                            };

                                            return (
                                                <View key={item.id || index} style={styles.itemRow}>
                                                    <View style={styles.itemDetails}>
                                                        <Text style={styles.itemName}>
                                                            {item.quantity}x {item.menu_item?.name || "Item"}
                                                        </Text>
                                                        <View style={styles.itemDescriptionContainer}>
                                                            {/* Temperature and Size */}
                                                            {(item.temperature || item.size) && (
                                                                <Text style={styles.itemDescription}>
                                                                    {[item.temperature, item.size].filter(Boolean).join(' • ')}
                                                                </Text>
                                                            )}
                                                            {/* Customizations */}
                                                            {Object.keys(otherCustomizations).length > 0 && (
                                                                <Text style={styles.itemCustomizations}>
                                                                    {formatCustomizations(otherCustomizations)}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                    <Text style={styles.itemPrice}>
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>

                                    {/* Total */}
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>Total</Text>
                                        <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                                    </View>

                                    {/* Estimated Time and Location */}
                                    <View style={styles.infoRow}>
                                        {/* <View style={styles.infoItem}>
                                            <MaterialCommunityIcons name="clock-outline" size={16} color="#2B2B2B" />
                                            <Text style={styles.infoText}>
                                                Estimated: {order.estimated_time || "15-20 min"}
                                            </Text>
                                        </View> */}
                                        <View style={styles.infoItem}>
                                            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#666666" />
                                            <View>
                                                <Text style={styles.locationName}>Kaapeh House, 309 America Drive Suite G, Brownsville, TX 78526</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Status Selection - Only show for active orders */}
                                    {activeTab === 'active' && (
                                        <View style={styles.statusSection}>
                                            <Text style={styles.statusPrompt}>LET US KNOW YOUR STATUS</Text>
                                            <View style={styles.statusButtonsContainer}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.statusButton,
                                                        selectedStatuses[order.id] === "not_started" && styles.statusButtonSelected,
                                                    ]}
                                                    onPress={() => handleStatusChange(order.id, "not_started")}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.statusButtonText,
                                                            selectedStatuses[order.id] === "not_started" && styles.statusButtonTextSelected,
                                                        ]}
                                                    >
                                                        I haven't left yet
                                                    </Text>
                                                    {selectedStatuses[order.id] === "not_started" && (
                                                        <MaterialCommunityIcons name="check" size={20} color="#acc18a" />
                                                    )}
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.statusButton,
                                                        selectedStatuses[order.id] === "on_the_way" && styles.statusButtonSelected,
                                                    ]}
                                                    onPress={() => handleStatusChange(order.id, "on_the_way")}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.statusButtonText,
                                                            selectedStatuses[order.id] === "on_the_way" && styles.statusButtonTextSelected,
                                                        ]}
                                                    >
                                                        I'm on my way
                                                    </Text>
                                                    {selectedStatuses[order.id] === "on_the_way" && (
                                                        <MaterialCommunityIcons name="check" size={20} color="#acc18a" />
                                                    )}
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.statusButton,
                                                        selectedStatuses[order.id] === "arrived" && styles.statusButtonSelected,
                                                    ]}
                                                    onPress={() => handleStatusChange(order.id, "arrived")}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.statusButtonText,
                                                            selectedStatuses[order.id] === "arrived" && styles.statusButtonTextSelected,
                                                        ]}
                                                    >
                                                        I'm at the store
                                                    </Text>
                                                    {selectedStatuses[order.id] === "arrived" && (
                                                        <MaterialCommunityIcons name="check" size={20} color="#acc18a" />
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}

                                    {/* Cancel Order Button - Only show for active orders that aren't completed/cancelled */}
                                    {activeTab === 'active' && order.status !== 'completed' && order.status !== 'cancelled' && (
                                        <View style={styles.cancelButtonContainer}>
                                            <TouchableOpacity
                                                style={styles.cancelButton}
                                                onPress={() => handleCancelOrder(order.id)}
                                            >
                                                <MaterialCommunityIcons name="close-circle-outline" size={20} color="#FF6B6B" />
                                                <Text style={styles.cancelButtonText}>Cancel Order</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </>
                    )}

                    {/* Bottom spacing for navigation */}
                    <View style={styles.bottomSpacing} />
                </ScrollView>
            </View>

            {/* Bottom Navigation Bar */}
            <BottomNavigationBar currentScreen="MyOrder" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2B2B2B",
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        paddingBottom: 24,
    },
    logoText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFFFFF",
        fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    },
    content: {
        flex: 1,
        backgroundColor: "#F5F1E8",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 32,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 20,
        borderRadius: 12,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    tabButton: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: 8,
    },
    activeTabButton: {
        backgroundColor: "#acc18a",
    },
    tabButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#687280",
    },
    activeTabButtonText: {
        color: "#FFFFFF",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2B2B2B",
        marginBottom: 20,
    },
    orderCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2B2B2B",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
        marginLeft: 4,
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    timeText: {
        fontSize: 14,
        color: "#666666",
        marginLeft: 6,
    },
    itemsContainer: {
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2B2B2B",
        marginBottom: 4,
    },
    itemDescriptionContainer: {
        marginTop: 4,
    },
    itemDescription: {
        fontSize: 14,
        color: "#666666",
        marginBottom: 4,
    },
    itemCustomizations: {
        fontSize: 13,
        color: "#666666",
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2B2B2B",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2B2B2B",
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#acc18a",
    },
    infoRow: {
        marginBottom: 20,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
        marginTop: 3,
    },
    infoText: {
        fontSize: 14,
        color: "#2B2B2B",
        marginLeft: 8,
    },
    locationName: {
        fontSize: 14,
        color: "#666666",
        marginTop: -2,
        marginLeft: 7,
        marginRight: 22,
        marginBottom: 0,
    },
    statusSection: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
    },
    statusPrompt: {
        fontSize: 12,
        fontWeight: "600",
        color: "#2B2B2B",
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    statusButtonsContainer: {
        // gap: 12, // React Native doesn't support gap, using marginBottom on buttons instead
    },
    statusButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        marginBottom: 12,
    },
    statusButtonSelected: {
        backgroundColor: "#eff6e7",
        borderColor: "#acc18a",
    },
    statusButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#2B2B2B",
    },
    statusButtonTextSelected: {
        color: "#2B2B2B",
    },
    cancelButtonContainer: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
    },
    cancelButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#FF6B6B",
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FF6B6B",
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: "#666666",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2B2B2B",
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#666666",
        textAlign: "center",
        paddingHorizontal: 40,
    },
    bottomSpacing: {
        height: 100,
    },
});

