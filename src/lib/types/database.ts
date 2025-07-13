export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          code: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          game_id: string
          name: string
          avatar: string
          aura_points: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          name: string
          avatar: string
          aura_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          name?: string
          avatar?: string
          aura_points?: number
          created_at?: string
        }
      }
      actions: {
        Row: {
          id: string
          game_id: string
          player_id: string
          action_type: string
          points: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          action_type: string
          points: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          action_type?: string
          points?: number
          description?: string
          created_at?: string
        }
      }
    }
  }
}
