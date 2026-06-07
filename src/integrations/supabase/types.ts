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
      client_churn: {
        Row: {
          churned_at: string | null
          client_id: string
          last_assessed_at: string
          manual_override: boolean
          notes: string | null
          reason: string | null
          risk_level: Database["public"]["Enums"]["churn_risk"]
          score: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          churned_at?: string | null
          client_id: string
          last_assessed_at?: string
          manual_override?: boolean
          notes?: string | null
          reason?: string | null
          risk_level?: Database["public"]["Enums"]["churn_risk"]
          score?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          churned_at?: string | null
          client_id?: string
          last_assessed_at?: string
          manual_override?: boolean
          notes?: string | null
          reason?: string | null
          risk_level?: Database["public"]["Enums"]["churn_risk"]
          score?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      client_churn_log: {
        Row: {
          action: string
          client_id: string
          from_status: string | null
          id: string
          notes: string | null
          performed_at: string
          performed_by: string | null
          to_status: string | null
        }
        Insert: {
          action: string
          client_id: string
          from_status?: string | null
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          client_id?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          to_status?: string | null
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_primary: boolean
          name: string | null
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      client_sites: {
        Row: {
          bandwidth: string | null
          client_id: string
          created_at: string
          created_by: string | null
          go_live_date: string | null
          gps_address: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: Database["public"]["Enums"]["site_status"]
          updated_at: string
        }
        Insert: {
          bandwidth?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          go_live_date?: string | null
          gps_address?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
        }
        Update: {
          bandwidth?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          go_live_date?: string | null
          gps_address?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
        }
        Relationships: []
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
      deal_approvals: {
        Row: {
          approver_id: string | null
          comment: string | null
          created_at: string
          deal_id: string
          decided_at: string | null
          discount_pct: number | null
          id: string
          reason: string
          requested_by: string | null
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          approver_id?: string | null
          comment?: string | null
          created_at?: string
          deal_id: string
          decided_at?: string | null
          discount_pct?: number | null
          id?: string
          reason: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          approver_id?: string | null
          comment?: string | null
          created_at?: string
          deal_id?: string
          decided_at?: string | null
          discount_pct?: number | null
          id?: string
          reason?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_approvals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
      incident_approvals: {
        Row: {
          approver_id: string | null
          created_at: string
          decided_at: string | null
          decision: string
          decision_comment: string | null
          id: string
          incident_id: string
          reason: string
          requested_by: string
          updated_at: string
        }
        Insert: {
          approver_id?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: string
          decision_comment?: string | null
          id?: string
          incident_id: string
          reason: string
          requested_by: string
          updated_at?: string
        }
        Update: {
          approver_id?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: string
          decision_comment?: string | null
          id?: string
          incident_id?: string
          reason?: string
          requested_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_approvals_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_clients: {
        Row: {
          client_id: string
          created_at: string
          id: string
          incident_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          incident_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_clients_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
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
      incident_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          incident_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          incident_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          incident_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_tasks_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_time_entries: {
        Row: {
          billable: boolean
          created_at: string
          id: string
          incident_id: string
          logged_by: string
          minutes: number
          note: string | null
          worked_on: string
        }
        Insert: {
          billable?: boolean
          created_at?: string
          id?: string
          incident_id: string
          logged_by: string
          minutes: number
          note?: string | null
          worked_on?: string
        }
        Update: {
          billable?: boolean
          created_at?: string
          id?: string
          incident_id?: string
          logged_by?: string
          minutes?: number
          note?: string | null
          worked_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_time_entries_incident_id_fkey"
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
          category_id: string | null
          client_id: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          first_response_at: string | null
          id: string
          impact: string | null
          incident_number: string
          issue_category: string | null
          location: string | null
          priority: Database["public"]["Enums"]["incident_priority"]
          reopened_count: number
          resolved_at: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          site_id: string | null
          source: string
          status: Database["public"]["Enums"]["incident_status"]
          sub_category: string | null
          template_id: string | null
          termination_pop: string | null
          title: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          first_response_at?: string | null
          id?: string
          impact?: string | null
          incident_number: string
          issue_category?: string | null
          location?: string | null
          priority?: Database["public"]["Enums"]["incident_priority"]
          reopened_count?: number
          resolved_at?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          site_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["incident_status"]
          sub_category?: string | null
          template_id?: string | null
          termination_pop?: string | null
          title: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          first_response_at?: string | null
          id?: string
          impact?: string | null
          incident_number?: string
          issue_category?: string | null
          location?: string | null
          priority?: Database["public"]["Enums"]["incident_priority"]
          reopened_count?: number
          resolved_at?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          site_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["incident_status"]
          sub_category?: string | null
          template_id?: string | null
          termination_pop?: string | null
          title?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "request_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "client_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "request_templates"
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
          work_order_number: string | null
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
          work_order_number?: string | null
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
          work_order_number?: string | null
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
          approval_required: boolean
          approved_at: string | null
          approved_by: string | null
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
          last_reminder_at: string | null
          mrc_amount: number
          notes: string | null
          nrc_amount: number
          paid_at: string | null
          parent_invoice_id: string | null
          period_end: string | null
          period_start: string | null
          reminder_count: number
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
          approval_required?: boolean
          approved_at?: string | null
          approved_by?: string | null
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
          last_reminder_at?: string | null
          mrc_amount?: number
          notes?: string | null
          nrc_amount?: number
          paid_at?: string | null
          parent_invoice_id?: string | null
          period_end?: string | null
          period_start?: string | null
          reminder_count?: number
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
          approval_required?: boolean
          approved_at?: string | null
          approved_by?: string | null
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
          last_reminder_at?: string | null
          mrc_amount?: number
          notes?: string | null
          nrc_amount?: number
          paid_at?: string | null
          parent_invoice_id?: string | null
          period_end?: string | null
          period_start?: string | null
          reminder_count?: number
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
      project_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          added_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          sort_order: number
          status: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          sort_order?: number
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          sort_order?: number
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimate_hours: number | null
          id: string
          incident_id: string | null
          milestone_id: string | null
          priority: Database["public"]["Enums"]["project_task_priority"]
          project_id: string
          sort_order: number
          status: Database["public"]["Enums"]["project_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimate_hours?: number | null
          id?: string
          incident_id?: string | null
          milestone_id?: string | null
          priority?: Database["public"]["Enums"]["project_task_priority"]
          project_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["project_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimate_hours?: number | null
          id?: string
          incident_id?: string | null
          milestone_id?: string | null
          priority?: Database["public"]["Enums"]["project_task_priority"]
          project_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["project_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_time_entries: {
        Row: {
          billable: boolean
          created_at: string
          id: string
          logged_by: string
          minutes: number
          note: string | null
          project_id: string
          task_id: string | null
          worked_on: string
        }
        Insert: {
          billable?: boolean
          created_at?: string
          id?: string
          logged_by: string
          minutes: number
          note?: string | null
          project_id: string
          task_id?: string | null
          worked_on?: string
        }
        Update: {
          billable?: boolean
          created_at?: string
          id?: string
          logged_by?: string
          minutes?: number
          note?: string | null
          project_id?: string
          task_id?: string | null
          worked_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          budget: number | null
          client_id: string | null
          code: string
          created_at: string
          created_by: string
          deal_id: string | null
          department: string | null
          description: string | null
          health: Database["public"]["Enums"]["project_health"]
          id: string
          name: string
          owner_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_end_date: string | null
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          budget?: number | null
          client_id?: string | null
          code: string
          created_at?: string
          created_by: string
          deal_id?: string | null
          department?: string | null
          description?: string | null
          health?: Database["public"]["Enums"]["project_health"]
          id?: string
          name: string
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_end_date?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          budget?: number | null
          client_id?: string | null
          code?: string
          created_at?: string
          created_by?: string
          deal_id?: string | null
          department?: string | null
          description?: string | null
          health?: Database["public"]["Enums"]["project_health"]
          id?: string
          name?: string
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_end_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
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
      request_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "request_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      request_templates: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          created_by: string | null
          default_impact: string | null
          default_priority: Database["public"]["Enums"]["incident_priority"]
          default_urgency: string | null
          description_template: string | null
          id: string
          name: string
          title_template: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          default_impact?: string | null
          default_priority?: Database["public"]["Enums"]["incident_priority"]
          default_urgency?: string | null
          description_template?: string | null
          id?: string
          name: string
          title_template: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          default_impact?: string | null
          default_priority?: Database["public"]["Enums"]["incident_priority"]
          default_urgency?: string | null
          description_template?: string | null
          id?: string
          name?: string
          title_template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "request_categories"
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
      site_contracts: {
        Row: {
          billing_reference: string | null
          contract_duration_months: number | null
          contract_end: string | null
          contract_start: string | null
          created_at: string
          created_by: string | null
          id: string
          mrc: number
          notes: string | null
          nrc: number
          renewal_date: string | null
          site_id: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          billing_reference?: string | null
          contract_duration_months?: number | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          mrc?: number
          notes?: string | null
          nrc?: number
          renewal_date?: string | null
          site_id: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          billing_reference?: string | null
          contract_duration_months?: number | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          mrc?: number
          notes?: string | null
          nrc?: number
          renewal_date?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_contracts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "client_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_onboarding: {
        Row: {
          created_at: string
          current_stage: Database["public"]["Enums"]["onboarding_stage"]
          id: string
          install_completed_at: string | null
          install_owner: string | null
          live_at: string | null
          notes: string | null
          site_id: string
          survey_completed_at: string | null
          survey_owner: string | null
          test_completed_at: string | null
          test_owner: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stage?: Database["public"]["Enums"]["onboarding_stage"]
          id?: string
          install_completed_at?: string | null
          install_owner?: string | null
          live_at?: string | null
          notes?: string | null
          site_id: string
          survey_completed_at?: string | null
          survey_owner?: string | null
          test_completed_at?: string | null
          test_owner?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stage?: Database["public"]["Enums"]["onboarding_stage"]
          id?: string
          install_completed_at?: string | null
          install_owner?: string | null
          live_at?: string | null
          notes?: string | null
          site_id?: string
          survey_completed_at?: string | null
          survey_owner?: string | null
          test_completed_at?: string | null
          test_owner?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_onboarding_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "client_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_onboarding_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          site_id: string
          stage: Database["public"]["Enums"]["onboarding_stage"]
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          site_id: string
          stage: Database["public"]["Enums"]["onboarding_stage"]
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          site_id?: string
          stage?: Database["public"]["Enums"]["onboarding_stage"]
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_onboarding_tasks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "client_sites"
            referencedColumns: ["id"]
          },
        ]
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
      compute_client_churn_score: {
        Args: { _client_id: string }
        Returns: number
      }
      dunning_sweep: { Args: never; Returns: number }
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
      has_service_delivery_access: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_technology_access: { Args: { _user_id: string }; Returns: boolean }
      invoice_approval_threshold: { Args: never; Returns: number }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_sales_manager_or_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
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
      submit_survey_response: {
        Args: { _feedback: string; _rating: number; _token: string }
        Returns: undefined
      }
      validate_intake_token: {
        Args: { _token: string }
        Returns: {
          active: boolean
          id: string
        }[]
      }
      validate_survey_token: {
        Args: { _token: string }
        Returns: {
          client_id: string
          client_name: string
          expires_at: string
          id: string
          incident_id: string
          used: boolean
        }[]
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
        | "service_delivery"
      approval_status: "pending" | "approved" | "rejected"
      churn_risk: "low" | "medium" | "high" | "churned"
      contract_status: "pending" | "active" | "expired" | "cancelled"
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
        | "pending_approval"
        | "approved"
      isp_service_category: "community_wifi" | "ftth" | "voip" | "dia"
      lead_source: "referral" | "website" | "walk_in" | "campaign"
      lead_status: "new" | "contacted" | "qualified" | "unqualified"
      lead_type: "home" | "sme" | "enterprise"
      onboarding_stage: "survey" | "install" | "test" | "live"
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
      project_health: "green" | "amber" | "red"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      project_task_priority: "low" | "medium" | "high" | "critical"
      project_task_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "review"
        | "done"
        | "blocked"
      quotation_status: "draft" | "sent" | "accepted" | "rejected"
      service_type: "home" | "enterprise"
      site_status: "onboarding" | "active" | "suspended" | "churned"
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
        "service_delivery",
      ],
      approval_status: ["pending", "approved", "rejected"],
      churn_risk: ["low", "medium", "high", "churned"],
      contract_status: ["pending", "active", "expired", "cancelled"],
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
        "pending_approval",
        "approved",
      ],
      isp_service_category: ["community_wifi", "ftth", "voip", "dia"],
      lead_source: ["referral", "website", "walk_in", "campaign"],
      lead_status: ["new", "contacted", "qualified", "unqualified"],
      lead_type: ["home", "sme", "enterprise"],
      onboarding_stage: ["survey", "install", "test", "live"],
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
      project_health: ["green", "amber", "red"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      project_task_priority: ["low", "medium", "high", "critical"],
      project_task_status: [
        "backlog",
        "todo",
        "in_progress",
        "review",
        "done",
        "blocked",
      ],
      quotation_status: ["draft", "sent", "accepted", "rejected"],
      service_type: ["home", "enterprise"],
      site_status: ["onboarding", "active", "suspended", "churned"],
      survey_feasibility: ["pending", "yes", "no"],
      survey_status: ["scheduled", "completed", "cancelled"],
    },
  },
} as const
