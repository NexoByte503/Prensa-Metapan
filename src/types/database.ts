import type { ArticleStatus } from './article'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProfileRole = 'admin' | 'editor'
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam'
export type LiveStreamStatus = 'scheduled' | 'live' | 'finished'
export type ArticleMediaType = 'image' | 'video' | 'audio' | 'document'

export type ProfileRow = {
  id: string
  full_name: string
  email: string
  role: ProfileRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ProfileInsert = {
  id: string
  full_name: string
  email: string
  role?: ProfileRole
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

export type ProfileUpdate = {
  id?: string
  full_name?: string
  email?: string
  role?: ProfileRole
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

export type CategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export type CategoryInsert = {
  id?: string
  name: string
  slug: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export type CategoryUpdate = {
  id?: string
  name?: string
  slug?: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export type ArticleRow = {
  id: string
  title: string
  slug: string
  subtitle: string | null
  content: string
  excerpt: string | null
  featured_image: string | null
  category_id: string
  author_id: string
  status: ArticleStatus
  is_featured: boolean
  is_breaking: boolean
  views_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  search_vector: unknown
  search_vector_phase4: unknown
  seo_title: string | null
  seo_description: string | null
  og_image: string | null
  featured_image_alt: string | null
}

export type ArticleInsert = {
  id?: string
  title: string
  slug: string
  subtitle?: string | null
  content?: string
  excerpt?: string | null
  featured_image?: string | null
  category_id: string
  author_id: string
  status?: ArticleStatus
  is_featured?: boolean
  is_breaking?: boolean
  views_count?: number
  published_at?: string | null
  created_at?: string
  updated_at?: string
  seo_title?: string | null
  seo_description?: string | null
  og_image?: string | null
  featured_image_alt?: string | null
}

export type ArticleUpdate = {
  id?: string
  title?: string
  slug?: string
  subtitle?: string | null
  content?: string
  excerpt?: string | null
  featured_image?: string | null
  category_id?: string
  author_id?: string
  status?: ArticleStatus
  is_featured?: boolean
  is_breaking?: boolean
  views_count?: number
  published_at?: string | null
  created_at?: string
  updated_at?: string
  seo_title?: string | null
  seo_description?: string | null
  og_image?: string | null
  featured_image_alt?: string | null
}

export type TagRow = {
  id: string
  name: string
  slug: string
  created_at: string
}

export type TagInsert = {
  id?: string
  name: string
  slug: string
  created_at?: string
}

export type TagUpdate = {
  id?: string
  name?: string
  slug?: string
  created_at?: string
}

export type ArticleTagRow = {
  article_id: string
  tag_id: string
}

export type ArticleTagInsert = {
  article_id: string
  tag_id: string
}

export type ArticleTagUpdate = {
  article_id?: string
  tag_id?: string
}

export type ArticleMediaRow = {
  id: string
  article_id: string
  media_url: string
  media_type: ArticleMediaType
  alt_text: string | null
  caption: string | null
  created_at: string
}

export type ArticleMediaInsert = {
  id?: string
  article_id: string
  media_url: string
  media_type: ArticleMediaType
  alt_text?: string | null
  caption?: string | null
  created_at?: string
}

export type ArticleMediaUpdate = {
  id?: string
  article_id?: string
  media_url?: string
  media_type?: ArticleMediaType
  alt_text?: string | null
  caption?: string | null
  created_at?: string
}

export type CommentRow = {
  id: string
  article_id: string
  author_name: string
  author_email: string | null
  content: string
  status: CommentStatus
  moderated_by: string | null
  moderated_at: string | null
  created_at: string
}

export type CommentInsert = {
  id?: string
  article_id: string
  author_name: string
  author_email?: string | null
  content: string
  status?: CommentStatus
  moderated_by?: string | null
  moderated_at?: string | null
  created_at?: string
}

export type CommentUpdate = {
  id?: string
  article_id?: string
  author_name?: string
  author_email?: string
  content?: string
  status?: CommentStatus
  moderated_by?: string | null
  moderated_at?: string | null
  created_at?: string
}

export type LiveStreamRow = {
  id: string
  title: string
  description: string | null
  facebook_url: string | null
  embed_url: string | null
  status: LiveStreamStatus
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type LiveStreamInsert = {
  id?: string
  title: string
  description?: string | null
  facebook_url?: string | null
  embed_url?: string | null
  status?: LiveStreamStatus
  scheduled_at?: string | null
  started_at?: string | null
  finished_at?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export type LiveStreamUpdate = {
  id?: string
  title?: string
  description?: string | null
  facebook_url?: string | null
  embed_url?: string | null
  status?: LiveStreamStatus
  scheduled_at?: string | null
  started_at?: string | null
  finished_at?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export type AdvertisementRow = {
  id: string
  title: string
  advertiser_name: string
  image_url: string
  target_url: string
  placement: string
  start_date: string
  end_date: string
  is_active: boolean
  priority: number
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'finished'
  created_at: string
  updated_at: string
}

export type AdvertisementInsert = {
  id?: string
  title: string
  advertiser_name: string
  image_url: string
  target_url: string
  placement: string
  start_date: string
  end_date: string
  is_active?: boolean
  priority?: number
  status?: AdvertisementRow['status']
  created_at?: string
  updated_at?: string
}

export type AdvertisementUpdate = {
  id?: string
  title?: string
  advertiser_name?: string
  image_url?: string
  target_url?: string
  placement?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
  priority?: number
  status?: AdvertisementRow['status']
  created_at?: string
  updated_at?: string
}

export type SiteSettingRow = {
  id: string
  setting_key: string
  setting_value: Json
  updated_at: string
}

export type SiteSettingInsert = {
  id?: string
  setting_key: string
  setting_value?: Json
  updated_at?: string
}

export type SiteSettingUpdate = {
  id?: string
  setting_key?: string
  setting_value?: Json
  updated_at?: string
}

export type ArticleViewRow = {
  id: number
  article_id: string
  viewed_at: string
}

export type ArticleViewInsert = {
  id?: number
  article_id: string
  viewed_at?: string
}

export type AuditLogRow = {
  id: number
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Json
  created_at: string
}

export type AuditLogInsert = {
  id?: number
  user_id?: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  details?: Json
  created_at?: string
}

export type AuditLogUpdate = {
  id?: number
  user_id?: string | null
  action?: string
  entity_type?: string
  entity_id?: string | null
  details?: Json
  created_at?: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: ProfileInsert
        Update: ProfileUpdate
        Relationships: []
      }
      categories: {
        Row: CategoryRow
        Insert: CategoryInsert
        Update: CategoryUpdate
        Relationships: []
      }
      articles: {
        Row: ArticleRow
        Insert: ArticleInsert
        Update: ArticleUpdate
        Relationships: [
          {
            foreignKeyName: 'articles_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'articles_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      tags: {
        Row: TagRow
        Insert: TagInsert
        Update: TagUpdate
        Relationships: []
      }
      article_tags: {
        Row: ArticleTagRow
        Insert: ArticleTagInsert
        Update: ArticleTagUpdate
        Relationships: [
          {
            foreignKeyName: 'article_tags_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'article_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
      article_media: {
        Row: ArticleMediaRow
        Insert: ArticleMediaInsert
        Update: ArticleMediaUpdate
        Relationships: [
          {
            foreignKeyName: 'article_media_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: CommentRow
        Insert: CommentInsert
        Update: CommentUpdate
        Relationships: [
          {
            foreignKeyName: 'comments_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_moderated_by_fkey'
            columns: ['moderated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      live_streams: {
        Row: LiveStreamRow
        Insert: LiveStreamInsert
        Update: LiveStreamUpdate
        Relationships: [
          {
            foreignKeyName: 'live_streams_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      advertisements: {
        Row: AdvertisementRow
        Insert: AdvertisementInsert
        Update: AdvertisementUpdate
        Relationships: []
      }
      site_settings: {
        Row: SiteSettingRow
        Insert: SiteSettingInsert
        Update: SiteSettingUpdate
        Relationships: []
      }
      article_views: {
        Row: ArticleViewRow
        Insert: ArticleViewInsert
        Update: never
        Relationships: [
          {
            foreignKeyName: 'article_views_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
        ]
      }
      analytics_events: {
        Row: { id: number; event_type: 'page_view' | 'ad_impression' | 'ad_click'; path: string; article_id: string | null; advertisement_id: string | null; visitor_hash: string; created_at: string }
        Insert: never
        Update: never
        Relationships: []
      }
      audit_logs: {
        Row: AuditLogRow
        Insert: AuditLogInsert
        Update: AuditLogUpdate
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_editor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      admin_set_user_role: {
        Args: {
          target_user_id: string
          new_role: ProfileRole
        }
        Returns: undefined
      }
      search_published_article_ids: {
        Args: { search_query: string; page_limit?: number; page_offset?: number }
        Returns: string[]
      }
      submit_public_comment: {
        Args: { target_article_id: string; submitted_name: string; submitted_content: string }
        Returns: string
      }
      record_public_analytics_event: {
        Args: { event_name: 'page_view' | 'ad_impression' | 'ad_click'; event_path: string; visitor_token: string; target_article_id?: string | null; target_advertisement_id?: string | null }
        Returns: boolean
      }
      get_admin_site_analytics: {
        Args: { day_count?: number }
        Returns: Json
      }
    }
    Enums: {
      profile_role: ProfileRole
      article_status: ArticleStatus
      comment_status: CommentStatus
      live_stream_status: LiveStreamStatus
      article_media_type: ArticleMediaType
    }
    CompositeTypes: Record<string, never>
  }
}
