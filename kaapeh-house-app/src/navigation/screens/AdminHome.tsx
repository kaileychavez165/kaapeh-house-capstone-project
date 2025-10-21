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
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Path } from 'react-native-svg';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../../utils/supabase";

const { width, height } = Dimensions.get('window');

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

const AdminHome = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Weekly sales data
  const weeklyData = [
    { day: 'Mon', sales: 550 },
    { day: 'Tue', sales: 650 },
    { day: 'Wed', sales: 220 },
    { day: 'Thur', sales: 580 },
    { day: 'Fri', sales: 480 },
    { day: 'Sat', sales: 600 },
    { day: 'Sun', sales: 700 },
  ];

  const maxSales = Math.max(...weeklyData.map(d => d.sales));

  // Top items data
  const topItems = [
    { name: 'Caffe Mocha', sold: 12, rank: 1 },
    { name: 'Flat White', sold: 10, rank: 2 },
    { name: 'Iced Latte', sold: 9, rank: 3 },
  ];

  const handleSignOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
        Alert.alert("Error signing out", error.message);
        }
    } catch (error) {
        Alert.alert("Error", "An unexpected error occurred while signing out");
    }
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
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>View the store's performance overview</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, styles.salesCard]}>
            <Text style={styles.metricLabel}>Today's Sales</Text>
            <Text style={styles.metricValue}>$147.47</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Orders Today</Text>
            <Text style={styles.metricValue}>47</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg. Per Order</Text>
            <Text style={styles.metricValue}>$14.03</Text>
          </View>
        </View>

        {/* Weekly Sales Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Weekly Sales</Text>
          <View style={styles.chartContainer}>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>$1000</Text>
              <Text style={styles.yAxisLabel}>$800</Text>
              <Text style={styles.yAxisLabel}>$600</Text>
              <Text style={styles.yAxisLabel}>$400</Text>
              <Text style={styles.yAxisLabel}>$200</Text>
              <Text style={styles.yAxisLabel}>$0</Text>
            </View>
            <View style={styles.chartArea}>
              {weeklyData.map((item, index) => {
                const barHeight = (item.sales / maxSales) * 120;
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <LinearGradient
                        colors={['#20B2AA', '#87CEEB']}
                        style={[styles.bar, { height: barHeight }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        
        {/* Top Items */}
        <View style={styles.topItemsSection}>
          <Text style={styles.sectionTitle}>Top Items Today</Text>
          <View style={styles.topItemsList}>
            {topItems.map((item, index) => (
              <View key={index} style={styles.topItemCard}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>{item.rank}</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSold}>{item.sold} sold</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sign Out Button */}
       <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          >
          <MaterialCommunityIcons
              name="logout"
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
          />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('dashboard')}
        >
          <ChartIcon active={activeTab === 'dashboard'} />
          {activeTab === 'dashboard' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('users')}
        >
          <UsersIcon active={activeTab === 'users'} />
          {activeTab === 'users' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('edit')}
        >
          <EditIcon active={activeTab === 'edit'} />
          {activeTab === 'edit' && <View style={styles.activeIndicator} />}
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
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 30,
    gap: 1,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  salesCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  chartSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  yAxis: {
    justifyContent: 'space-between',
    height: 140,
    marginRight: 10,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '70%',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  topItemsSection: {
    marginBottom: 100,
  },
  topItemsList: {
    gap: 12,
  },
  topItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#20B2AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemSold: {
    fontSize: 14,
    color: '#6B7280',
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
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#20B2AA',
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: "#D9534F",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C9302C",
    flexDirection: "row",
    justifyContent: "center",
  },
  signOutButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default AdminHome;