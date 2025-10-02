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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../../utils/supabase";
import { Session } from "@supabase/supabase-js";

interface AccountProps {
    session: Session;
}

export default function AccountScreen({ session }: AccountProps) {
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [role, setRole] = useState("");

    useEffect(() => {
        if (session) getProfile();
    }, [session]);

    async function getProfile() {
    try {
        setLoading(true);
        if (!session?.user) throw new Error("No user on the session!");

        const { data, error, status } = await supabase
        .from("profiles")
        .select(`full_name, phone, avatar_url, role`)
        .eq("id", session?.user.id)
        .single();

        if (error && status !== 406) {
            throw error;
        }

        if (data) {
            console.log("👤 Profile data loaded:", data);
            setFullName(data.full_name || "");
            setPhone(data.phone || "");
            setAvatarUrl(data.avatar_url || "");
            setRole(data.role || "");
            console.log("🎭 Role set to:", data.role);
        }
    } catch (error) {
        if (error instanceof Error) {
        Alert.alert("Error loading profile", error.message);
        }
    } finally {
        setLoading(false);
    }
    }

    async function updateProfile({
        full_name,
        phone,
        avatar_url,
    }: {
        full_name: string;
        phone: string;
        avatar_url: string;
    }) {
    try {
        setLoading(true);
        if (!session?.user) throw new Error("No user on the session!");

        const updates = {
            full_name,
            phone: phone || null,
            avatar_url,
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

            {/* Phone Input */}
            <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
                style={styles.input}
                placeholder="(956) 123 - 4567"
                placeholderTextColor="#BFBFBF"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />
            </View>

            {/* Role Input - Read Only */}
            <View style={styles.inputContainer}>
            <Text style={styles.label}>Role</Text>
            <TextInput
                style={[styles.input, styles.disabledInput]}
                value={role ? role.charAt(0).toUpperCase() + role.slice(1) : ""}
                editable={false}
                placeholder="No role assigned"
                placeholderTextColor="#BFBFBF"
            />
            </View>

            {/* Update Button */}
            <TouchableOpacity
            style={[styles.updateButton, loading && styles.buttonDisabled]}
            onPress={() =>
                updateProfile({
                full_name: fullName,
                phone,
                avatar_url: avatarUrl,
                })
            }
            disabled={loading}
            >
            <MaterialCommunityIcons
                name="account-edit"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
            />
            <Text style={styles.updateButtonText}>
                {loading ? "Updating..." : "Update Profile"}
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
        backgroundColor: "#8CA989",
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
});
