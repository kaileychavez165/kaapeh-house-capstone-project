import { supabase } from "../../utils/supabase";

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

// Fetch user profile by user ID
export const fetchUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    throw error;
  }
};
