import { supabase } from "@/integrations/supabase/client";
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

// Generate session token
const generateSessionToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Login function
export const login = async ({ email, password, keepLoggedIn }: LoginCredentials): Promise<{ user: User | null; error: string | null }> => {
  try {
    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return { user: null, error: 'Invalid email or password' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return { user: null, error: 'Invalid email or password' };
    }

    // Create session if keep logged in is selected
    if (keepLoggedIn) {
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      await supabase.from('user_sessions').insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      });

      localStorage.setItem('session_token', sessionToken);
    }

    // Store user in localStorage
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    localStorage.setItem('current_user', JSON.stringify(userWithoutPassword));
    
    return { user: userWithoutPassword, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, error: 'Login failed. Please try again.' };
  }
};

// Check session validity
export const checkSession = async (): Promise<User | null> => {
  try {
    const sessionToken = localStorage.getItem('session_token');
    const currentUserStr = localStorage.getItem('current_user');

    if (!sessionToken && !currentUserStr) {
      return null;
    }

    // If we have a session token, verify it
    if (sessionToken) {
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*, profiles(*)')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !session) {
        // Session expired or invalid, clear storage
        localStorage.removeItem('session_token');
        localStorage.removeItem('current_user');
        return null;
      }

      return {
        id: session.profiles.id,
        email: session.profiles.email,
        role: session.profiles.role,
        is_active: session.profiles.is_active,
        created_at: session.profiles.created_at,
        updated_at: session.profiles.updated_at
      };
    }

    // If no session token but have user data (temporary login)
    if (currentUserStr) {
      return JSON.parse(currentUserStr);
    }

    return null;
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
};

// Logout function
export const logout = async (): Promise<void> => {
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
    localStorage.removeItem('session_token');
    localStorage.removeItem('current_user');
  } catch (error) {
    console.error('Logout error:', error);
    // Always clear local storage even if server request fails
    localStorage.removeItem('session_token');
    localStorage.removeItem('current_user');
  }
};

// Admin functions
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const createUser = async (userData: CreateUserData): Promise<{ user: User | null; error: string | null }> => {
  try {
    const hashedPassword = await hashPassword(userData.password);

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      })
      .select('id, email, role, is_active, created_at, updated_at')
      .single();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { user: null, error: 'Failed to create user' };
  }
};

export const updateUser = async (id: string, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<{ user: User | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('id, email, role, is_active, created_at, updated_at')
      .single();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data, error: null };
  } catch (error) {
    console.error('Error updating user:', error);
    return { user: null, error: 'Failed to update user' };
  }
};

export const deleteUser = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
};

export const updateUserPassword = async (id: string, newPassword: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const hashedPassword = await hashPassword(newPassword);

    const { error } = await supabase
      .from('profiles')
      .update({ password_hash: hashedPassword })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, error: 'Failed to update password' };
  }
};
