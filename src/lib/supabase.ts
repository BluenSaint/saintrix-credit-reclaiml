import { createClient } from '@supabase/supabase-js'

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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey) 