import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
    const navigation = useNavigation();

    useEffect(() => {
        // Redirect to Welcome screen after 2.5 seconds
        const timer = setTimeout(() => {
        navigation.navigate('Welcome' as never);
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#5B9BA4" />
        
        <View style={styles.logoContainer}>
            {/* Logo Image */}
            <Image 
                source={require('../../assets/images/logo-white-two.png')} 
                style={styles.logoImage}
                resizeMode="contain"
            />
        </View>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3b9796',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        // Added for responsive design
        width: '60%',
        height: undefined,
        aspectRatio: 1,
    },
    });

