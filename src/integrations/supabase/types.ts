export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes: number
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number
          uploaded_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          field_changed: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      client_satisfaction: {
        Row: {
          client_id: string
          created_at: string
          feedback: string | null
          id: string
          incident_id: string | null
          rating: number
          surveyed_by: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          incident_id?: string | null
          rating: number
          surveyed_by: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          incident_id?: string | null
          rating?: number
          surveyed_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_satisfaction_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_satisfaction_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: []
      }
      deal_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          completed_at: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          id: string
          lead_id: string | null
          scheduled_at: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          scheduled_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          scheduled_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          acv: number | null
          assigned_to: string | null
          bandwidth: string | null
          billing_active_at: string | null
          client_id: string | null
          contract_duration_months: number | null
          created_at: string
          created_by: string
          expected_close_date: string | null
          id: string
          installation_completed_at: string | null
          installation_complexity:
            | Database["public"]["Enums"]["installation_complexity"]
            | null
          isp_category:
            | Database["public"]["Enums"]["isp_service_category"]
            | null
          lead_id: string | null
          mrc: number | null
          notes: string | null
          nrc: number | null
          probability: number | null
          service_type: Database["public"]["Enums"]["deal_service_type"] | null
          stage: Database["public"]["Enums"]["deal_stage"]
          survey_completed_at: string | null
          tcv: number | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          acv?: number | null
          assigned_to?: string | null
          bandwidth?: string | null
          billing_active_at?: string | null
          client_id?: string | null
          contract_duration_months?: number | null
          created_at?: string
          created_by: string
          expected_close_date?: string | null
          id?: string
          installation_completed_at?: string | null
          installation_complexity?:
            | Database["public"]["Enums"]["installation_complexity"]
            | null
          isp_category?:
            | Database["public"]["Enums"]["isp_service_category"]
            | null
          lead_id?: string | null
          mrc?: number | null
          notes?: string | null
          nrc?: number | null
          probability?: number | null
          service_type?: Database["public"]["Enums"]["deal_service_type"] | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          survey_completed_at?: string | null
          tcv?: number | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          acv?: number | null
          assigned_to?: string | null
          bandwidth?: string | null
          billing_active_at?: string | null
          client_id?: string | null
          contract_duration_months?: number | null
          created_at?: string
          created_by?: string
          expected_close_date?: string | null
          id?: string
          installation_completed_at?: string | null
          installation_complexity?:
            | Database["public"]["Enums"]["installation_complexity"]
            | null
          isp_category?:
            | Database["public"]["Enums"]["isp_service_category"]
            | null
          lead_id?: string | null
          mrc?: number | null
          notes?: string | null
          nrc?: number | null
          probability?: number | null
          service_type?: Database["public"]["Enums"]["deal_service_type"] | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          survey_completed_at?: string | null
          tcv?: number | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_pay_items: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          pay_item_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          pay_item_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          pay_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_pay_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_pay_items_pay_item_id_fkey"
            columns: ["pay_item_id"]
            isOneToOne: false
            referencedRelation: "pay_items"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bank_account: string | null
          bank_branch: string | null
          bank_name: string | null
          basic_salary: number
          created_at: string
          created_by: string | null
          department: string | null
          email: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          full_name: string
          ghana_card_number: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          momo_network: string | null
          momo_number: string | null
          notes: string | null
          phone: string | null
          ssnit_number: string | null
          status: Database["public"]["Enums"]["employment_status"]
          termination_date: string | null
          tier2_trustee: string | null
          tin: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          basic_salary?: number
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name: string
          ghana_card_number?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          momo_network?: string | null
          momo_number?: string | null
          notes?: string | null
          phone?: string | null
          ssnit_number?: string | null
          status?: Database["public"]["Enums"]["employment_status"]
          termination_date?: string | null
          tier2_trustee?: string | null
          tin?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          basic_salary?: number
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name?: string
          ghana_card_number?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          momo_network?: string | null
          momo_number?: string | null
          notes?: string | null
          phone?: string | null
          ssnit_number?: string | null
          status?: Database["public"]["Enums"]["employment_status"]
          termination_date?: string | null
          tier2_trustee?: string | null
          tin?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      incident_closures: {
        Row: {
          closed_by: string
          created_at: string
          id: string
          incident_id: string
          recommendation: string
          resolution: string
          root_cause: string
        }
        Insert: {
          closed_by: string
          created_at?: string
          id?: string
          incident_id: string
          recommendation: string
          resolution: string
          root_cause: string
        }
        Update: {
          closed_by?: string
          created_at?: string
          id?: string
          incident_id?: string
          recommendation?: string
          resolution?: string
          root_cause?: string
        }
        Relationships: []
      }
      incident_history: {
        Row: {
          created_at: string
          field_changed: string
          id: string
          incident_id: string
          new_value: string | null
          old_value: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          field_changed: string
          id?: string
          incident_id: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          field_changed?: string
          id?: string
          incident_id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_history_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_notes: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          incident_id: string
          note_type: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          incident_id: string
          note_type?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          incident_id?: string
          note_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_notes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          incident_number: string
          issue_category: string | null
          location: string | null
          priority: Database["public"]["Enums"]["incident_priority"]
          resolved_at: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: Database["public"]["Enums"]["incident_status"]
          termination_pop: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          incident_number: string
          issue_category?: string | null
          location?: string | null
          priority?: Database["public"]["Enums"]["incident_priority"]
          resolved_at?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["incident_status"]
          termination_pop?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          incident_number?: string
          issue_category?: string | null
          location?: string | null
          priority?: Database["public"]["Enums"]["incident_priority"]
          resolved_at?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["incident_status"]
          termination_pop?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      installations: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          deal_id: string
          id: string
          notes: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["installation_status"]
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          deal_id: string
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["installation_status"]
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["installation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_links: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string | null
          sales_rep_id: string
          token: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string | null
          sales_rep_id: string
          token?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string | null
          sales_rep_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          client_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          kind: Database["public"]["Enums"]["invoice_kind"]
          mrc_amount: number
          notes: string | null
          nrc_amount: number
          paid_at: string | null
          parent_invoice_id: string | null
          period_end: string | null
          period_start: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
          updated_at: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          due_date?: string
          id?: string
          invoice_number: string
          issue_date?: string
          kind?: Database["public"]["Enums"]["invoice_kind"]
          mrc_amount?: number
          notes?: string | null
          nrc_amount?: number
          paid_at?: string | null
          parent_invoice_id?: string | null
          period_end?: string | null
          period_start?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          kind?: Database["public"]["Enums"]["invoice_kind"]
          mrc_amount?: number
          notes?: string | null
          nrc_amount?: number
          paid_at?: string | null
          parent_invoice_id?: string | null
          period_end?: string | null
          period_start?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_parent_invoice_id_fkey"
            columns: ["parent_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          company_name: string | null
          converted_deal_id: string | null
          created_at: string
          created_by: string
          email: string | null
          ghana_card_number: string | null
          gps_address: string | null
          id: string
          lead_type: Database["public"]["Enums"]["lead_type"]
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          company_name?: string | null
          converted_deal_id?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          ghana_card_number?: string | null
          gps_address?: string | null
          id?: string
          lead_type?: Database["public"]["Enums"]["lead_type"]
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          company_name?: string | null
          converted_deal_id?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          ghana_card_number?: string | null
          gps_address?: string | null
          id?: string
          lead_type?: Database["public"]["Enums"]["lead_type"]
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pay_items: {
        Row: {
          active: boolean
          calc_method: Database["public"]["Enums"]["pay_item_calc"]
          created_at: string
          default_value: number
          description: string | null
          id: string
          item_type: Database["public"]["Enums"]["pay_item_type"]
          name: string
          pension_qualifying: boolean
          taxable: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          calc_method?: Database["public"]["Enums"]["pay_item_calc"]
          created_at?: string
          default_value?: number
          description?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["pay_item_type"]
          name: string
          pension_qualifying?: boolean
          taxable?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          calc_method?: Database["public"]["Enums"]["pay_item_calc"]
          created_at?: string
          default_value?: number
          description?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["pay_item_type"]
          name?: string
          pension_qualifying?: boolean
          taxable?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      paye_bands: {
        Row: {
          band_order: number
          created_at: string
          effective_from: string
          id: string
          lower_bound: number
          rate_percent: number
          upper_bound: number | null
        }
        Insert: {
          band_order: number
          created_at?: string
          effective_from: string
          id?: string
          lower_bound: number
          rate_percent: number
          upper_bound?: number | null
        }
        Update: {
          band_order?: number
          created_at?: string
          effective_from?: string
          id?: string
          lower_bound?: number
          rate_percent?: number
          upper_bound?: number | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string
          document_url: string | null
          id: string
          installation_cost: number | null
          monthly_cost: number | null
          notes: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id: string
          document_url?: string | null
          id?: string
          installation_cost?: number | null
          monthly_cost?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string
          document_url?: string | null
          id?: string
          installation_cost?: number | null
          monthly_cost?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          carryover_amount: number
          category: Database["public"]["Enums"]["isp_service_category"]
          created_at: string
          created_by: string
          id: string
          notes: string | null
          target_amount: number
          target_month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          carryover_amount?: number
          category: Database["public"]["Enums"]["isp_service_category"]
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          target_amount?: number
          target_month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          carryover_amount?: number
          category?: Database["public"]["Enums"]["isp_service_category"]
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          target_amount?: number
          target_month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_surveys: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          cost_estimate: number | null
          created_at: string
          deal_id: string
          engineer_notes: string | null
          feasibility: Database["public"]["Enums"]["survey_feasibility"]
          id: string
          infrastructure_notes: string | null
          photos_url: Json | null
          requested_at: string | null
          requested_by: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["survey_status"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          deal_id: string
          engineer_notes?: string | null
          feasibility?: Database["public"]["Enums"]["survey_feasibility"]
          id?: string
          infrastructure_notes?: string | null
          photos_url?: Json | null
          requested_at?: string | null
          requested_by?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["survey_status"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          deal_id?: string
          engineer_notes?: string | null
          feasibility?: Database["public"]["Enums"]["survey_feasibility"]
          id?: string
          infrastructure_notes?: string | null
          photos_url?: Json | null
          requested_at?: string | null
          requested_by?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["survey_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_surveys_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_policies: {
        Row: {
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["incident_priority"]
          resolution_time_minutes: number
          response_time_minutes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority: Database["public"]["Enums"]["incident_priority"]
          resolution_time_minutes: number
          response_time_minutes: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["incident_priority"]
          resolution_time_minutes?: number
          response_time_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      statutory_rates: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          notes: string | null
          ssnit_employee_pct: number
          ssnit_employer_pct: number
          tier2_pct: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          id?: string
          notes?: string | null
          ssnit_employee_pct?: number
          ssnit_employer_pct?: number
          tier2_pct?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          notes?: string | null
          ssnit_employee_pct?: number
          ssnit_employer_pct?: number
          tier2_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      survey_tokens: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          incident_id: string | null
          token: string
          used: boolean
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          incident_id?: string | null
          token?: string
          used?: boolean
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          incident_id?: string | null
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "survey_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_tokens_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_escalate_stale_incidents: { Args: never; Returns: number }
      can_access_attachment: {
        Args: { _entity_id: string; _entity_type: string }
        Returns: boolean
      }
      can_close_incident: { Args: { _user_id: string }; Returns: boolean }
      generate_monthly_recurring_invoices: { Args: never; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_finance_access: { Args: { _user_id: string }; Returns: boolean }
      has_hr_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_sales_access: { Args: { _user_id: string }; Returns: boolean }
      has_technology_access: { Args: { _user_id: string }; Returns: boolean }
      is_sales_manager_or_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      log_audit: {
        Args: {
          _action: string
          _entity_id: string
          _entity_type: string
          _field?: string
          _metadata?: Json
          _new?: string
          _old?: string
        }
        Returns: undefined
      }
      notify_role: {
        Args: {
          _body?: string
          _link?: string
          _metadata?: Json
          _role: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          _body?: string
          _link?: string
          _metadata?: Json
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      activity_type: "call" | "email" | "meeting" | "follow_up"
      app_role:
        | "admin"
        | "network_engineer"
        | "support_agent"
        | "viewer"
        | "client_experience"
        | "sales_representative"
        | "sales_manager"
        | "network_manager"
        | "technology_engineer"
        | "technology_manager"
        | "finance_officer"
        | "hr_officer"
      deal_service_type: "fiber_home" | "dedicated_business" | "enterprise_link"
      deal_stage:
        | "new_lead"
        | "qualification"
        | "site_survey"
        | "proposal_sent"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      employment_status: "active" | "on_leave" | "terminated"
      employment_type: "permanent" | "contract" | "probation" | "intern"
      incident_priority: "low" | "medium" | "high" | "critical"
      incident_status:
        | "open"
        | "in_progress"
        | "escalated"
        | "resolved"
        | "closed"
      installation_complexity: "low" | "medium" | "high"
      installation_status: "pending" | "in_progress" | "completed" | "cancelled"
      invoice_kind: "initial" | "recurring" | "one_off" | "credit_note"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
      isp_service_category: "community_wifi" | "ftth" | "voip" | "dia"
      lead_source: "referral" | "website" | "walk_in" | "campaign"
      lead_status: "new" | "contacted" | "qualified" | "unqualified"
      lead_type: "home" | "sme" | "enterprise"
      pay_item_calc: "fixed" | "percent_of_basic"
      pay_item_type: "allowance" | "deduction" | "employer_cost"
      payment_method:
        | "bank_transfer"
        | "mobile_money"
        | "cash"
        | "cheque"
        | "card"
        | "other"
      payroll_run_status: "draft" | "approved" | "paid"
      quotation_status: "draft" | "sent" | "accepted" | "rejected"
      service_type: "home" | "enterprise"
      survey_feasibility: "pending" | "yes" | "no"
      survey_status: "scheduled" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: ["call", "email", "meeting", "follow_up"],
      app_role: [
        "admin",
        "network_engineer",
        "support_agent",
        "viewer",
        "client_experience",
        "sales_representative",
        "sales_manager",
        "network_manager",
        "technology_engineer",
        "technology_manager",
        "finance_officer",
        "hr_officer",
      ],
      deal_service_type: [
        "fiber_home",
        "dedicated_business",
        "enterprise_link",
      ],
      deal_stage: [
        "new_lead",
        "qualification",
        "site_survey",
        "proposal_sent",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      employment_status: ["active", "on_leave", "terminated"],
      employment_type: ["permanent", "contract", "probation", "intern"],
      incident_priority: ["low", "medium", "high", "critical"],
      incident_status: [
        "open",
        "in_progress",
        "escalated",
        "resolved",
        "closed",
      ],
      installation_complexity: ["low", "medium", "high"],
      installation_status: ["pending", "in_progress", "completed", "cancelled"],
      invoice_kind: ["initial", "recurring", "one_off", "credit_note"],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
      ],
      isp_service_category: ["community_wifi", "ftth", "voip", "dia"],
      lead_source: ["referral", "website", "walk_in", "campaign"],
      lead_status: ["new", "contacted", "qualified", "unqualified"],
      lead_type: ["home", "sme", "enterprise"],
      pay_item_calc: ["fixed", "percent_of_basic"],
      pay_item_type: ["allowance", "deduction", "employer_cost"],
      payment_method: [
        "bank_transfer",
        "mobile_money",
        "cash",
        "cheque",
        "card",
        "other",
      ],
      payroll_run_status: ["draft", "approved", "paid"],
      quotation_status: ["draft", "sent", "accepted", "rejected"],
      service_type: ["home", "enterprise"],
      survey_feasibility: ["pending", "yes", "no"],
      survey_status: ["scheduled", "completed", "cancelled"],
    },
  },
} as const
