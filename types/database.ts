// 数据库类型定义
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
      game_sessions: {
        Row: {
          id: string
          name: string
          status: 'online' | 'offline'
          team_count: number
          location_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: 'online' | 'offline'
          team_count?: number
          location_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: 'online' | 'offline'
          team_count?: number
          location_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          game_session_id: string
          name: string
          color: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          game_session_id: string
          name: string
          color: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_session_id?: string
          name?: string
          color?: string
          display_order?: number
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          game_session_id: string
          name: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          game_session_id: string
          name: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_session_id?: string
          name?: string
          display_order?: number
          created_at?: string
        }
      }
      star_records: {
        Row: {
          id: string
          game_session_id: string
          team_id: string
          location_id: string
          stars: number
          points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_session_id: string
          team_id: string
          location_id: string
          stars?: number
          points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_session_id?: string
          team_id?: string
          location_id?: string
          stars?: number
          points?: number
          created_at?: string
          updated_at?: string
        }
      }
      skill_card_logs: {
        Row: {
          id: string
          game_session_id: string
          card_type: string
          activator_team_id: string | null
          target_team_id: string | null
          target_location_id: string | null
          parameters: Json | null
          duration_minutes: number | null
          end_time: string | null
          status: 'active' | 'expired' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          game_session_id: string
          card_type: string
          activator_team_id?: string | null
          target_team_id?: string | null
          target_location_id?: string | null
          parameters?: Json | null
          duration_minutes?: number | null
          end_time?: string | null
          status?: 'active' | 'expired' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          game_session_id?: string
          card_type?: string
          activator_team_id?: string | null
          target_team_id?: string | null
          target_location_id?: string | null
          parameters?: Json | null
          duration_minutes?: number | null
          end_time?: string | null
          status?: 'active' | 'expired' | 'cancelled'
          created_at?: string
        }
      }
      random_events: {
        Row: {
          id: string
          game_session_id: string
          event_type: string
          target_location_id: string | null
          parameters: Json | null
          duration_minutes: number | null
          end_time: string | null
          status: 'active' | 'expired'
          created_at: string
        }
        Insert: {
          id?: string
          game_session_id: string
          event_type: string
          target_location_id?: string | null
          parameters?: Json | null
          duration_minutes?: number | null
          end_time?: string | null
          status?: 'active' | 'expired'
          created_at?: string
        }
        Update: {
          id?: string
          game_session_id?: string
          event_type?: string
          target_location_id?: string | null
          parameters?: Json | null
          duration_minutes?: number | null
          end_time?: string | null
          status?: 'active' | 'expired'
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          username: string
          password_hash: string
          role: 'junior' | 'mid' | 'senior'
          game_session_id: string | null
          assigned_location_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          role: 'junior' | 'mid' | 'senior'
          game_session_id?: string | null
          assigned_location_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          role?: 'junior' | 'mid' | 'senior'
          game_session_id?: string | null
          assigned_location_id?: string | null
          created_at?: string
        }
      }
      active_effects: {
        Row: {
          id: string
          game_session_id: string
          team_id: string
          effect_type: string
          effect_value: number | null
          target_location_id: string | null
          alliance_team_id: string | null
          source_card_log_id: string | null
          end_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          game_session_id: string
          team_id: string
          effect_type: string
          effect_value?: number | null
          target_location_id?: string | null
          alliance_team_id?: string | null
          source_card_log_id?: string | null
          end_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_session_id?: string
          team_id?: string
          effect_type?: string
          effect_value?: number | null
          target_location_id?: string | null
          alliance_team_id?: string | null
          source_card_log_id?: string | null
          end_time?: string | null
          created_at?: string
        }
      }
    }
  }
}
