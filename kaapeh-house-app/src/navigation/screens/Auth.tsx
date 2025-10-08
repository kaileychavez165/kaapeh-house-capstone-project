import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
  AppState,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../utils/supabase";
export type UserRole = 'Customer' | 'Admin';

export default function AuthScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Fields for both login and signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Signup-specific fields
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("customer");
  const [rolePassword, setRolePassword] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showRolePassword, setShowRolePassword] = useState(false);

  // Set up auto-refresh for Supabase auth
  useEffect(() => {
    const handleAppStateChange = (state: string) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert("Login Error", error.message);
      } else {
        Alert.alert("Success", "Logged in successfully!");
        // Navigation will be handled by auth state change
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const validateRolePassword = (): boolean => {
    // No password is required for Customer
    if (selectedRole === "customer") {
      return true;
    }
    
    // If the role is Admin, check the password
    const expectedPassword = process.env.EXPO_PUBLIC_ADMIN_PASSWORD;
    
    if (rolePassword !== expectedPassword) {
      Alert.alert(
        "Invalid Role Password",
        `The ${selectedRole.toLowerCase()} password is incorrect. Please contact your administrator.`
      );
      return false;
    }
    
    return true;
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Validate role password before proceeding
    if (!validateRolePassword()) {
      return;
    }

    setLoading(true);
    try {

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert("Signup Error", error.message);
        return;
      }

      if (data.user) {
        // Create user profile
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName.trim(),
          role: selectedRole.toLowerCase(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        console.log("📝 Creating profile with data:", profileData);
        console.log("👤 User ID from auth:", data.user.id);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          
          Alert.alert("Profile Error", "Account created but profile setup failed. Please contact support.");
        } else {
          Alert.alert("Success", "Account created successfully!");
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (activeTab === "login") {
      handleLogin();
    } else {
      handleSignUp();
    }
  };

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setSelectedRole("customer");
    setRolePassword("");
    setRememberMe(false);
    setShowPassword(false);
    setShowRolePassword(false);
    setShowRoleDropdown(false);
    setLoading(false);
  };

  const handleTabSwitch = (tab: "login" | "signup") => {
    setActiveTab(tab);
    clearForm(); // Clear form when switching tabs
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2B2B2B" />

      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo-white-one.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Get started now</Text>
        <Text style={styles.subtitle}>
          Log in or sign up to explore our app.
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "login" && styles.activeTab]}
            onPress={() => handleTabSwitch("login")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "login" && styles.activeTabText,
              ]}
            >
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "signup" && styles.activeTab]}
            onPress={() => handleTabSwitch("signup")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "signup" && styles.activeTabText,
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView 
          style={styles.form}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Signup-specific fields */}
          {activeTab === "signup" && (
            <>
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Maria Hernandez"
                  placeholderTextColor="#BFBFBF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>


              {/* Role Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Role</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                  </Text>
                  <MaterialCommunityIcons
                    name={showRoleDropdown ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#292929"
                  />
                </TouchableOpacity>
                
                {showRoleDropdown && (
                  <View style={styles.dropdownMenu}>
                    {[
                      { value: "Customer", label: "Customer" },
                      { value: "Admin", label: "Admin" }
                    ].map((role, index, array) => (
                      <TouchableOpacity
                        key={role.value}
                        style={[
                          styles.dropdownItem,
                          selectedRole === role.value.toLowerCase() && styles.selectedDropdownItem,
                          index === array.length - 1 && styles.lastDropdownItem,
                        ]}
                        onPress={() => {
                          setSelectedRole(role.value.toLowerCase());
                          setShowRoleDropdown(false);
                          setRolePassword(""); // Clear role password when changing roles
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedRole === role.value.toLowerCase() && styles.selectedDropdownItemText,
                          ]}
                        >
                          {role.label}
                        </Text>
                        {selectedRole === role.value.toLowerCase() && (
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color="#8CA989"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Role Password for Employee */}
              {selectedRole === "admin" && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Password
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder={`Enter ${selectedRole.toLowerCase()} password`}
                      placeholderTextColor="#BFBFBF"
                      value={rolePassword}
                      onChangeText={setRolePassword}
                      secureTextEntry={!showRolePassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowRolePassword(!showRolePassword)}
                    >
                      <MaterialCommunityIcons
                        name={showRolePassword ? "eye-outline" : "eye-off-outline"}
                        size={24}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.rolePasswordHint}>
                    Contact your administrator for the {selectedRole.toLowerCase()} password.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Email Input - Common for both */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Mariahernandez@gmail.com"
              placeholderTextColor="#BFBFBF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input - Common for both */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="*******"
                placeholderTextColor="#BFBFBF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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

          {/* Options Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={styles.checkbox}>
                {rememberMe && (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color="#8CA989"
                  />
                )}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            {/* Show Forgot Password only for login */}
            {activeTab === "login" && (
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading 
                ? "Loading..." 
                : activeTab === "login" ? "Log In" : "Sign Up"
              }
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
  logoImage: {
    width: 200, // width and height make the logo bigger
    height: 200,
    alignSelf: 'flex-start',
    marginLeft: -20, 
    marginTop: -80, //margin top and bottom make space around the png smaller
    marginBottom: -60,
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F1E8",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 32,
    paddingHorizontal: 24,
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#F5F1E8",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  activeTabText: {
    color: "#2B2B2B",
  },
  form: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D0D0D0",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  rememberMeText: {
    fontSize: 14,
    color: "#292929",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#5B8FD9",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#acc18a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6B8A68",
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
  dropdownButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#2B2B2B",
    fontWeight: "400",
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginTop: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  selectedDropdownItem: {
    backgroundColor: "#F8F6F0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#2B2B2B",
    fontWeight: "400",
  },
  selectedDropdownItemText: {
    fontWeight: "500",
    color: "#2B2B2B",
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  rolePasswordHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
});
