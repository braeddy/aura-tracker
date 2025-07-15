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

// Interfacce per il sistema di votazione
export interface ActionProposal {
  id: string
  game_id: string
  player_id: string
  proposed_by_user_id?: string
  proposed_by_username: string
  description: string
  points: number
  status: 'pending' | 'approved' | 'rejected' | 'executed'
  votes_for: number
  votes_against: number
  total_voters: number
  required_votes: number
  expires_at: string
  created_at: string
  executed_at?: string
  resulting_action_id?: string
  players?: {
    id: string
    name: string
  }
}

export interface ProposalVote {
  id: string
  proposal_id: string
  user_id: string
  username: string
  vote: boolean
  created_at: string
}
