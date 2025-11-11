import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface BottomNavigationBarProps {
  currentScreen?: string;
}

export default function BottomNavigationBar({ currentScreen = 'Home' }: BottomNavigationBarProps) {
  const navigation = useNavigation();

  const navItems = [
    {
      id: 'Home',
      icon: 'home',
      iconOutline: 'home-outline',
      active: currentScreen === 'Home',
    },
    {
      id: 'Favorites',
      icon: 'receipt-text',
      iconOutline: 'receipt-text-outline',
      active: currentScreen === 'Favorites' || currentScreen === 'MyOrder',
    },
    {
      id: 'Shopping',
      icon: 'shopping',
      iconOutline: 'shopping-outline',
      active: currentScreen === 'Shopping',
    },
    {
      id: 'Account',
      icon: 'account-circle',
      iconOutline: 'account-circle-outline',
      active: currentScreen === 'Account',
    },
  ];

  const handleNavigation = (screenId: string) => {
    if (screenId === 'Home') {
      (navigation as any).navigate('Home');
    } else if (screenId === 'Account') {
      (navigation as any).navigate('Account');
    } else if (screenId === 'Shopping') {
      (navigation as any).navigate('OrderDetail');
    } else if (screenId === 'Favorites') {
      (navigation as any).navigate('MyOrder');
    }
    // Add more navigation cases as needed for other screens
  };

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.navItem}
          onPress={() => handleNavigation(item.id)}
        >
          <MaterialCommunityIcons
            name={item.active ? item.icon as any : item.iconOutline as any}
            size={24}
            color={item.active ? '#acc18a' : '#666666'}
          />
          {item.active && <View style={styles.navIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5F1E8',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    paddingTop: 16, // Added more top padding for better visual balance
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    borderTopLeftRadius: 20, // Rounded top-left corner
    borderTopRightRadius: 20, // Rounded top-right corner
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'relative',
    minWidth: 60, // Ensure consistent width for proper alignment
  },
  navIndicator: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center', // Use alignSelf to center horizontally
    width: 20,
    height: 3,
    backgroundColor: '#acc18a',
    borderRadius: 2,
  },
});
