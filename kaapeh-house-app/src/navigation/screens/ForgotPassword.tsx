import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Get the current Expo development server URL
      // Used for deep linking to our app in Expo Go
      const expoUrl = "exp://192.168.1.82:8081/--/reset-password";
      
      // Set the reset password email to the email address user entered (only sends if email is associated to an account)
      // Deep link (just means the link will open the app and navigate to the Reset Password page) is sent in the email
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: expoUrl,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Check your email",
          "If an account exists with this email address, we've sent you a password reset link. Please check your email and follow the instructions.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
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
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email address, and we'll send you a link to reset your password.
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            placeholderTextColor="#BFBFBF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
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
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#292929",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#2B2B2B",
    borderWidth: 1,
    borderColor: "#E5E5E5",
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
