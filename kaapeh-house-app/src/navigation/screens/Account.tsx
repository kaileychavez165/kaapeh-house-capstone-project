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
    BackHandler,
    Image,
    ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../utils/supabase";
import { Session } from "@supabase/supabase-js";
import BottomNavigationBar from "../../components/BottomNavigationBar";
import { uploadAvatarToStorage } from "../../services/userService";

interface AccountProps {
    session: Session;
}

export default function AccountScreen({ session }: AccountProps) {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (session) getProfile();
    }, [session]);

    // Handle Android hardware back button
    useEffect(() => {
        const backAction = () => {
            // Prevent going back to Auth screen
            return true; // This prevents the default back action
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    async function getProfile() {
    try {
        setLoading(true);
        if (!session?.user) throw new Error("No user on the session!");

        console.log("🔍 Loading profile for user ID:", session.user.id);
        
        const { data, error, status } = await supabase
        .from("profiles")
        .select(`full_name, avatar_url`)
        .eq("id", session?.user.id)
        .single();

        if (error && status !== 406) {
            throw error;
        }

        if (data) {
            console.log("👤 Profile data loaded:", data);
            setFullName(data.full_name || "");
            setAvatarUrl(data.avatar_url || "");
        }
    } catch (error) {
        if (error instanceof Error) {
        Alert.alert("Error loading profile", error.message);
        }
    } finally {
        setLoading(false);
    }
    }

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            Alert.alert("Permission required", "Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImageUri(result.assets[0].uri);
        }
    };

    async function updateProfile({
        full_name,
        avatar_url,
    }: {
        full_name: string;
        avatar_url: string;
    }) {
    try {
        setLoading(true);
        if (!session?.user) throw new Error("No user on the session!");

        let finalAvatarUrl = avatar_url;

        // Upload avatar image if a new one was selected
        if (selectedImageUri) {
            setIsUploading(true);
            try {
                finalAvatarUrl = await uploadAvatarToStorage(selectedImageUri, session.user.id);
                setAvatarUrl(finalAvatarUrl);
                setSelectedImageUri(null); // Clear selected image after successful upload
            } catch (error) {
                console.error("Error uploading avatar:", error);
                Alert.alert("Upload Error", "Failed to upload avatar image. Please try again.");
                setIsUploading(false);
                setLoading(false);
                return;
            }
            setIsUploading(false);
        }

        const updates = {
            full_name,
            avatar_url: finalAvatarUrl,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", session.user.id);

            if (error) {
                console.error("Supabase error:", error);
                throw error;
        }

        Alert.alert("Success!", "Profile updated successfully");
    } catch (error) {
        if (error instanceof Error) {
        console.error("Error details:", error);
        Alert.alert("Error updating profile", error.message);
        }
    } finally {
        setLoading(false);
    }
    }

    const handleSignOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
        Alert.alert("Error signing out", error.message);
        } else {
        // Navigation will be handled automatically by auth state change
        // The Navigation component will reset to Welcome screen when session becomes null
        }
    } catch (error) {
        Alert.alert("Error", "An unexpected error occurred while signing out");
    }
    };

    return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2B2B2B" />

        {/* Header */}
        <View style={styles.header}>
        <Text style={styles.logoText}>Account Profile</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
        <Text style={styles.title}>Profile Information</Text>
        <Text style={styles.subtitle}>
            Manage your account details and preferences.
        </Text>

        <ScrollView
            style={styles.form}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Profile Picture Section */}
            <View style={styles.avatarContainer}>
                <Text style={styles.label}>Profile Picture</Text>
                <View style={styles.avatarWrapper}>
                    {avatarUrl || selectedImageUri ? (
                        <Image
                            source={{ uri: selectedImageUri || avatarUrl }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <MaterialCommunityIcons
                                name="account"
                                size={60}
                                color="#BFBFBF"
                            />
                        </View>
                    )}
                    {isUploading && (
                        <View style={styles.uploadingOverlay}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.changeAvatarButton}
                    onPress={handlePickImage}
                    disabled={isUploading || loading}
                >
                    <MaterialCommunityIcons
                        name="camera"
                        size={18}
                        color="#FFFFFF"
                        style={styles.buttonIcon}
                    />
                    <Text style={styles.changeAvatarButtonText}>
                        {selectedImageUri ? "Change Picture" : "Upload Picture"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Email Input - Read Only */}
            <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
                style={[styles.input, styles.disabledInput]}
                value={session?.user?.email || ""}
                editable={false}
                placeholder="No email available"
                placeholderTextColor="#BFBFBF"
            />
            </View>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#BFBFBF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
            />
            </View>

            {/* Update Button */}
            <TouchableOpacity
            style={[styles.updateButton, (loading || isUploading) && styles.buttonDisabled]}
            onPress={() =>
                updateProfile({
                full_name: fullName,
                avatar_url: avatarUrl,
                })
            }
            disabled={loading || isUploading}
            >
            <MaterialCommunityIcons
                name="account-edit"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
            />
            <Text style={styles.updateButtonText}>
                {isUploading ? "Uploading..." : loading ? "Updating..." : "Update Profile"}
            </Text>
            </TouchableOpacity>

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

            {/* Bottom spacing for navigation */}
            <View style={styles.bottomSpacing} />
        </ScrollView>
        </View>

        {/* Bottom Navigation Bar */}
        <BottomNavigationBar currentScreen="Account" />
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
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#2B2B2B",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#292929",
        marginBottom: 32,
        lineHeight: 20,
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
    disabledInput: {
        backgroundColor: "#F8F8F8",
        color: "#666666",
    },
    updateButton: {
        backgroundColor: "#acc18a",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#6B8A68",
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 16,
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
    buttonDisabled: {
        backgroundColor: "#A8A8A8",
        borderColor: "#888888",
    },
    buttonIcon: {
        marginRight: 8,
    },
    updateButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    signOutButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    bottomSpacing: {
        height: 100,
    },
    avatarContainer: {
        alignItems: "center",
        marginBottom: 32,
    },
    avatarWrapper: {
        position: "relative",
        marginBottom: 16,
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: "#acc18a",
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#E5E5E5",
        borderWidth: 3,
        borderColor: "#acc18a",
        justifyContent: "center",
        alignItems: "center",
    },
    uploadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 60,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    changeAvatarButton: {
        backgroundColor: "#acc18a",
        borderColor: "#6B8A68",
        borderWidth: 1.5,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    changeAvatarButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
});
