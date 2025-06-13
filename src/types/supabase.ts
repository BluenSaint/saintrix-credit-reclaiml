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
          score: number
          synced_at: string
          report_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          bureau: 'Experian' | 'Equifax' | 'TransUnion'
          report_data: Json
          score?: number
          synced_at?: string
          report_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          bureau?: 'Experian' | 'Equifax' | 'TransUnion'
          report_data?: Json
          score?: number
          synced_at?: string
          report_url?: string
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
      documents: {
        Row: {
          id: string
          client_id: string
          type: string
          file_name: string
          file_url: string
          file_size: number
          mime_type: string
          status: string
          classification: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          type: string
          file_name: string
          file_url: string
          file_size: number
          mime_type: string
          status?: string
          classification?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          type?: string
          file_name?: string
          file_url?: string
          file_size?: number
          mime_type?: string
          status?: string
          classification?: string
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
          status: string
          fcra_section: string
          evidence: Json[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          bureau: 'Experian' | 'Equifax' | 'TransUnion'
          reason: string
          status?: string
          fcra_section?: string
          evidence?: Json[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          bureau?: 'Experian' | 'Equifax' | 'TransUnion'
          reason?: string
          status?: string
          fcra_section?: string
          evidence?: Json[]
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
      messages: {
        Row: {
          id: string
          client_id: string
          message: string
          type: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          message: string
          type: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          message?: string
          type?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      legal_coach_interactions: {
        Row: {
          id: string
          user_id: string
          question: string
          answer: string
          category: string
          helpful: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          answer: string
          category: string
          helpful?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          answer?: string
          category?: string
          helpful?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dispute_followups: {
        Row: {
          id: string
          dispute_id: string
          type: string
          status: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dispute_id: string
          type: string
          status?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          dispute_id?: string
          type?: string
          status?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      credit_insurance: {
        Row: {
          id: string
          client_id: string
          status: string
          coverage_amount: number
          monthly_premium: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          status?: string
          coverage_amount: number
          monthly_premium: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          status?: string
          coverage_amount?: number
          monthly_premium?: number
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