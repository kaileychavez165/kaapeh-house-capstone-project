import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Auth' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5B9BA4" />
      
      {/* Coffee Image Section */}
      <View style={styles.imageSection}>
        <Image
          source={require('../../assets/images/get-started.jpg')}
          style={styles.coffeeImage}
          resizeMode="cover"
        />
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', '#F5F1E8']}
          locations={[0.25, 1]}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>
          Good Vibes,
        </Text>
        <Text style={styles.title}>
          Great Espresso
        </Text>
        
        <Text style={styles.subtitle}>
          We're ready to serve, and you'll be ready to enjoy!
        </Text>

        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1E8",
  },
  imageSection: {
    flex: 0.7,
    position: 'relative',
  },
  coffeeImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentSection: {
    flex: 0.25,
    backgroundColor: '#F5F1E8',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 5,
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
    marginTop: 20,
    marginBottom: 40,
    lineHeight: 22,
    textAlign: 'center',
  },
  getStartedButton: {
    backgroundColor: "#acc18a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6B8A68",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});