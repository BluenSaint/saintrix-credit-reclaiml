Need to install the following packages:
supabase@2.24.3
Ok to proceed? (y) 

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
      credit_reports: {
        Row: {
          id: string
          client_id: string
          bureau: 'Experian' | 'Equifax' | 'TransUnion'
          report_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          bureau: 'Experian' | 'Equifax' | 'TransUnion'
          report_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          bureau?: 'Experian' | 'Equifax' | 'TransUnion'
          report_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
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
      admins: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
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