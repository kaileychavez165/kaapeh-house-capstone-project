import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from "../../../utils/supabase";

type RootStackParamList = {
  Auth: undefined;
  ForgotPassword: undefined;
  ResetPassword: { access_token?: string; refresh_token?: string; type?: string; token_hash?: string };
  Home: undefined;
  AdminHome: undefined;
  Account: undefined;
  ChatBot: undefined;
  Welcome: undefined;
  Splash: undefined;
};

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>['route'];

interface ResetPasswordScreenProps {
  onPasswordResetComplete?: () => void;
}

export default function ResetPasswordScreen({ onPasswordResetComplete }: ResetPasswordScreenProps) {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we have the necessary parameters from the deep link
    const { access_token, refresh_token, type, token_hash } = route.params || {};
    
    if (type === 'recovery') {
      if (access_token && refresh_token) {
        // Store tokens for later use when user submits new password
        console.log('🔗 Reset password link with tokens received');
      } else if (token_hash) {
        // Store token_hash for later use when user submits new password
        console.log('🔗 Reset password link with token_hash received');
      } else {
        Alert.alert("Error", "Invalid reset link. Please request a new password reset.");
        navigation.navigate('Auth');
      }
    } else {
      Alert.alert("Error", "Invalid reset link. Please request a new password reset.");
      navigation.navigate('Auth');
    }
  }, [route.params, navigation]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const { access_token, refresh_token, token_hash } = route.params || {};
      
      // First, authenticate using the tokens from the email link
      if (access_token && refresh_token) {
        // Set the session with the tokens from the email link
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        
        if (sessionError) {
          Alert.alert("Error", "Invalid or expired reset link. Please request a new one.");
          navigation.navigate('Auth');
          return;
        }
      } else if (token_hash) {
        // Verify the token_hash
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery'
        });
        
        if (verifyError) {
          Alert.alert("Error", "Invalid or expired reset link. Please request a new one.");
          navigation.navigate('Auth');
          return;
        }
      } else {
        Alert.alert("Error", "Invalid reset link. Please request a new password reset.");
        navigation.navigate('Auth');
        return;
      }

      // Now update the password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Success",
          "Your password has been updated successfully! You are now signed in.",
          [
            {
              text: "OK",
              onPress: () => {
                // Clear the reset password screen flag and let navigation handle routing
                // The user is now authenticated, so the Navigation component will handle routing
                console.log('🔄 Password reset completed, user is now authenticated');
                onPasswordResetComplete?.();
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2B2B2B" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Image 
          source={require('../../assets/images/logo-white-one.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.subtitle}>
          Enter your new password below.
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password"
              placeholderTextColor="#BFBFBF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoFocus
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={24}
                color="#999"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              placeholderTextColor="#BFBFBF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <MaterialCommunityIcons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={24}
                color="#999"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Updating..." : "Update Password"}
          </Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Auth')}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#5B8FD9" />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2B2B2B",
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoImage: {
    width: 200,
    height: 200,
    alignSelf: 'flex-start',
    marginLeft: -20, 
    marginTop: -80,
    marginBottom: -60,
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F1E8",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fffcf5",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#fffcf5",
    marginBottom: 0,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#292929",
    marginBottom: 8,
    fontWeight: "500",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#2B2B2B",
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  submitButton: {
    backgroundColor: "#acc18a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6B8A68",
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  submitButtonDisabled: {
    backgroundColor: "#A8A8A8",
    borderColor: "#888888",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#5B8FD9",
    fontWeight: "500",
    marginLeft: 8,
  },
});
