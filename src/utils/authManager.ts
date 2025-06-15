
import { supabase } from "@/integrations/supabase/client";
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  keepLoggedIn?: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export const login = async ({ email, password, keepLoggedIn }: LoginCredentials) => {
  try {
    console.log('Attempting login for:', email);
    
    // First, try to get the user from profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('is_active', true);
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return { user: null, error: 'Database error occurred' };
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No user found with email:', email);
      return { user: null, error: 'Invalid email or password' };
    }
    
    const profile = profiles[0];
    console.log('Found profile:', { id: profile.id, email: profile.email, role: profile.role });
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, profile.password_hash);
    if (!passwordMatch) {
      console.log('Password mismatch for user:', email);
      return { user: null, error: 'Invalid email or password' };
    }
    
    const user: User = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
    };
    
    // Handle session persistence
    if (keepLoggedIn) {
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
      
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });
      
      if (!sessionError) {
        localStorage.setItem('session_token', sessionToken);
      }
    }
    
    // Store user in localStorage
    localStorage.setItem('current_user', JSON.stringify(user));
    
    console.log('Login successful for user:', user.email);
    return { user, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
};

export const logout = async () => {
  try {
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      // Remove session from database
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken);
    }
    
    // Clear local storage
    localStorage.removeItem('current_user');
    localStorage.removeItem('session_token');
    
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage even if database operation fails
    localStorage.removeItem('current_user');
    localStorage.removeItem('session_token');
  }
};

export const checkSession = async (): Promise<User | null> => {
  try {
    // First check if user is stored in localStorage
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      console.log('Found stored user:', user.email);
      return user;
    }
    
    // Check for session token
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      console.log('No session token found');
      return null;
    }
    
    // Validate session token
    const { data: sessions, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('session_token', sessionToken)
      .single();
    
    if (sessionError || !sessions) {
      console.log('Invalid session token');
      localStorage.removeItem('session_token');
      return null;
    }
    
    // Check if session is expired
    if (new Date(sessions.expires_at) < new Date()) {
      console.log('Session expired');
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken);
      localStorage.removeItem('session_token');
      return null;
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessions.user_id)
      .eq('is_active', true)
      .single();
    
    if (profileError || !profile) {
      console.log('User profile not found or inactive');
      return null;
    }
    
    const user: User = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
    };
    
    // Store user in localStorage for faster access
    localStorage.setItem('current_user', JSON.stringify(user));
    
    console.log('Session valid for user:', user.email);
    return user;
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_active, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
    }));
  } catch (error) {
    console.error('Get users error:', error);
    return [];
  }
};

export const createUser = async (userData: CreateUserData): Promise<{ user: User | null; error: string | null }> => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Create user error:', error);
      if (error.code === '23505') {
        return { user: null, error: 'Email already exists' };
      }
      return { user: null, error: 'Failed to create user' };
    }
    
    const user: User = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
    };
    
    return { user, error: null };
  } catch (error) {
    console.error('Create user error:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
};

export const updateUser = async (userId: string, updates: Partial<{ email: string; role: 'admin' | 'user'; is_active: boolean }>): Promise<{ user: User | null; error: string | null }> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Update user error:', error);
      return { user: null, error: 'Failed to update user' };
    }
    
    const user: User = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
    };
    
    return { user, error: null };
  } catch (error) {
    console.error('Update user error:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
};

export const updateUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const { error } = await supabase
      .from('profiles')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);
    
    if (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'Failed to update password' };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

export const deleteUser = async (userId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Delete user error:', error);
      return { success: false, error: 'Failed to delete user' };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

const generateSessionToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
