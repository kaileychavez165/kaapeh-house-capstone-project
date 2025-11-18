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
import { updateCustomerStatus, Order } from "../../services/orderService";
import { useActiveOrders, useInvalidateOrders } from "../../hooks/useOrderQueries";

interface MyOrderProps {
    session: Session;
}

export default function MyOrderScreen({ session }: MyOrderProps) {
    const navigation = useNavigation();
    const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});
    
    // React Query hook for orders
    const { data: activeOrders = [], isLoading: loading, refetch } = useActiveOrders(session?.user?.id);
    const { invalidateActive } = useInvalidateOrders();

    // Initialize selected statuses when orders change
    useEffect(() => {
        if (activeOrders.length > 0) {
            const initialStatuses: Record<string, string> = {};
            activeOrders.forEach((order) => {
                initialStatuses[order.id] = order.customer_status || "not_left";
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
            customer_status: "on_way",
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

    const handleStatusChange = async (orderId: string, status: "not_left" | "on_way" | "at_store") => {
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

        if (diffMins < 1) return "Just now";
        if (diffMins === 1) return "1 min ago";
        return `${diffMins} min ago`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "preparing":
                return "#90EE90";
            case "ready":
                return "#87CEEB";
            case "pending":
                return "#FFD700";
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
            default:
                return status;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2B2B2B" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logoText}>My Orders</Text>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading orders...</Text>
                        </View>
                    ) : ordersToShow.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="package-variant" size={64} color="#999999" />
                            <Text style={styles.emptyText}>No Active Orders</Text>
                            <Text style={styles.emptySubtext}>You don't have any active orders at the moment.</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>Active Orders</Text>
                            {ordersToShow.map((order) => (
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
                                        <Text style={styles.timeText}>Placed {formatTimeAgo(order.created_at)}</Text>
                                    </View>

                                    {/* Order Items */}
                                    <View style={styles.itemsContainer}>
                                        {order.order_items?.map((item, index) => (
                                            <View key={item.id || index} style={styles.itemRow}>
                                                <View style={styles.itemDetails}>
                                                    <Text style={styles.itemName}>
                                                        {item.quantity}x {item.menu_item?.name || "Item"}
                                                    </Text>
                                                    {item.size && (
                                                        <Text style={styles.itemSize}>Size: {item.size}</Text>
                                                    )}
                                                </View>
                                                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Total */}
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>Total</Text>
                                        <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                                    </View>

                                    {/* Estimated Time and Location */}
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoItem}>
                                            <MaterialCommunityIcons name="clock-outline" size={16} color="#2B2B2B" />
                                            <Text style={styles.infoText}>
                                                Estimated: {order.estimated_time || "15-20 min"}
                                            </Text>
                                        </View>
                                        <View style={styles.infoItem}>
                                            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#2B2B2B" />
                                            <Text style={styles.infoText}>{order.location || "Main Street Cafe"}</Text>
                                        </View>
                                    </View>

                                    {/* Status Selection */}
                                    <View style={styles.statusSection}>
                                        <Text style={styles.statusPrompt}>LET US KNOW YOUR STATUS</Text>
                                        <View style={styles.statusButtonsContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.statusButton,
                                                    selectedStatuses[order.id] === "not_left" && styles.statusButtonSelected,
                                                ]}
                                                onPress={() => handleStatusChange(order.id, "not_left")}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statusButtonText,
                                                        selectedStatuses[order.id] === "not_left" && styles.statusButtonTextSelected,
                                                    ]}
                                                >
                                                    I haven't left yet
                                                </Text>
                                                {selectedStatuses[order.id] === "not_left" && (
                                                    <MaterialCommunityIcons name="check" size={20} color="#acc18a" />
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[
                                                    styles.statusButton,
                                                    selectedStatuses[order.id] === "on_way" && styles.statusButtonSelected,
                                                ]}
                                                onPress={() => handleStatusChange(order.id, "on_way")}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statusButtonText,
                                                        selectedStatuses[order.id] === "on_way" && styles.statusButtonTextSelected,
                                                    ]}
                                                >
                                                    I'm on my way
                                                </Text>
                                                {selectedStatuses[order.id] === "on_way" && (
                                                    <MaterialCommunityIcons name="check" size={20} color="#acc18a" />
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[
                                                    styles.statusButton,
                                                    selectedStatuses[order.id] === "at_store" && styles.statusButtonSelected,
                                                ]}
                                                onPress={() => handleStatusChange(order.id, "at_store")}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statusButtonText,
                                                        selectedStatuses[order.id] === "at_store" && styles.statusButtonTextSelected,
                                                    ]}
                                                >
                                                    I'm at the store
                                                </Text>
                                                {selectedStatuses[order.id] === "at_store" && (
                                                    <MaterialCommunityIcons name="check" size={20} color="#acc18a" />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
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
        paddingHorizontal: 24,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
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
    itemSize: {
        fontSize: 14,
        color: "#666666",
        marginLeft: 16,
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
        alignItems: "center",
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: "#2B2B2B",
        marginLeft: 8,
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
        gap: 12,
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

