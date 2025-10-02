import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SplashScreen() {
    const navigation = useNavigation();

    useEffect(() => {
        // Redirect to Home screen after 2.5 seconds
        const timer = setTimeout(() => {
        navigation.navigate('Welcome' as never);
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#5B9BA4" />
        
        <View style={styles.logoContainer}>
            {/* Coffee Steam Icon */}
            <View style={styles.steamContainer}>
            <MaterialCommunityIcons 
                name="coffee" 
                size={40} 
                color="#FFFFFF" 
                style={styles.coffeeIcon}
            />
            </View> 
            
            {/* Logo Text */}
            <Text style={styles.logoText}>Kaapeh</Text>
            <Text style={styles.logoText}>House</Text>
        </View>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#5B9BA4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    steamContainer: {
        marginBottom: 8,
    },
    coffeeIcon: {
        marginBottom: -10,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
        fontFamily: 'System',
    },
    });

