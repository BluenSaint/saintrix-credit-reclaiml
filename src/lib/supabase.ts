/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Helper function to check if user is admin
export const isAdmin = (user: any) => {
  return user?.user_metadata?.role === 'admin'
}

// Helper function to check if user is client
export const isClient = (user: any) => {
  return user?.user_metadata?.role === 'client'
}

// Helper function to get user role
export const getUserRole = (user: any) => {
  return user?.user_metadata?.role
}

// Helper function to check if user is approved (for legacy clients)
export const isApproved = (user: any) => {
  return user?.user_metadata?.approved !== false
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string
          full_name: string
          dob: string
          address: string
          ssn_last4: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          dob: string
          address: string
          ssn_last4: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          dob?: string
          address?: string
          ssn_last4?: string
          created_at?: string
          updated_at?: string
        }
      }
      disputes: {
        Row: {
          id: string
          client_id: string
          bureau: 'Experian' | 'Equifax' | 'TransUnion'
          reason: string
          status: 'draft' | 'sent' | 'resolved'
          evidence_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          bureau: 'Experian' | 'Equifax' | 'TransUnion'
          reason: string
          status: 'draft' | 'sent' | 'resolved'
          evidence_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          bureau?: 'Experian' | 'Equifax' | 'TransUnion'
          reason?: string
          status?: 'draft' | 'sent' | 'resolved'
          evidence_url?: string | null
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          client_id: string
          type: string
          file_url: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          type: string
          file_url: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          type?: string
          file_url?: string
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          client_id: string
          referral_code: string
          referred_by: string | null
          redeemed: boolean
        }
        Insert: {
          id?: string
          client_id: string
          referral_code: string
          referred_by?: string | null
          redeemed?: boolean
        }
        Update: {
          id?: string
          client_id?: string
          referral_code?: string
          referred_by?: string | null
          redeemed?: boolean
        }
      }
      feedback: {
        Row: {
          id: string
          client_id: string
          message: string
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          message: string
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          message?: string
          rating?: number
          created_at?: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          details: Json | null
          timestamp: string
          client_id: string | null
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          details?: Json | null
          timestamp?: string
          client_id?: string | null
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          details?: Json | null
          timestamp?: string
          client_id?: string | null
        }
      }
      admins: {
        Row: {
          id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 