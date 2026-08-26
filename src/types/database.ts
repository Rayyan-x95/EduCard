export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserStatusEnum =
  | 'high_school'
  | 'undergraduate'
  | 'postgraduate'
  | 'vocational'
  | 'alumni'
  | 'professional'
  | 'mentor'
  | 'other';

export type QuestionStatusEnum = 'open' | 'solved' | 'closed';

export type ContentVisibilityEnum = 'public' | 'community' | 'unlisted' | 'removed';

export type ReactionTypeEnum = 'helpful' | 'upvote' | 'like';

export type ReportReasonEnum =
  | 'harassment'
  | 'bullying'
  | 'hate_speech'
  | 'sexual_content'
  | 'threats'
  | 'self_harm'
  | 'spam'
  | 'scam'
  | 'impersonation'
  | 'misinformation'
  | 'academic_dishonesty'
  | 'other';

export type ReportStatusEnum = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export type ModerationActionEnum =
  | 'content_removed'
  | 'content_flagged'
  | 'user_warned'
  | 'user_restricted'
  | 'user_suspended'
  | 'user_banned'
  | 'report_dismissed';

export type SystemRoleEnum = 'user' | 'moderator' | 'admin';

export type VerificationStatusEnum =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'revoked';

export type VerificationTypeEnum =
  | 'student_email'
  | 'alumni_diploma'
  | 'professional_id'
  | 'mentor_credential';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_path: string | null;
          country_code: string | null;
          current_status: UserStatusEnum;
          system_role: SystemRoleEnum;
          is_verified: boolean;
          reputation_score: number;
          total_questions: number;
          total_answers: number;
          helpful_count: number;
          is_public_profile: boolean;
          activity_status: boolean;
          dm_notifications: boolean;
          answer_notifications: boolean;
          weekly_digest: boolean;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_path?: string | null;
          country_code?: string | null;
          current_status?: UserStatusEnum;
          system_role?: SystemRoleEnum;
          is_verified?: boolean;
          reputation_score?: number;
          total_questions?: number;
          total_answers?: number;
          helpful_count?: number;
          is_public_profile?: boolean;
          activity_status?: boolean;
          dm_notifications?: boolean;
          answer_notifications?: boolean;
          weekly_digest?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_path?: string | null;
          country_code?: string | null;
          current_status?: UserStatusEnum;
          system_role?: SystemRoleEnum;
          is_verified?: boolean;
          reputation_score?: number;
          total_questions?: number;
          total_answers?: number;
          helpful_count?: number;
          is_public_profile?: boolean;
          activity_status?: boolean;
          dm_notifications?: boolean;
          answer_notifications?: boolean;
          weekly_digest?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      universities: {
        Row: {
          id: string;
          name: string;
          country_code: string;
          domain: string | null;
          website: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          country_code: string;
          domain?: string | null;
          website?: string | null;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          country_code?: string;
          domain?: string | null;
          website?: string | null;
          verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      education: {
        Row: {
          id: string;
          user_id: string;
          university_id: string | null;
          institution_name: string;
          degree: string;
          field: string;
          start_year: number;
          end_year: number | null;
          education_status: UserStatusEnum;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          university_id?: string | null;
          institution_name: string;
          degree: string;
          field: string;
          start_year: number;
          end_year?: number | null;
          education_status: UserStatusEnum;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          university_id?: string | null;
          institution_name?: string;
          degree?: string;
          field?: string;
          start_year?: number;
          end_year?: number | null;
          education_status?: UserStatusEnum;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "education_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "education_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      topics: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_topics: {
        Row: {
          user_id: string;
          topic_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          topic_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          topic_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_topics_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_topics_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      communities: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          rules: string | null;
          university_id: string | null;
          topic_id: string | null;
          created_by: string | null;
          member_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          rules?: string | null;
          university_id?: string | null;
          topic_id?: string | null;
          created_by?: string | null;
          member_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          rules?: string | null;
          university_id?: string | null;
          topic_id?: string | null;
          created_by?: string | null;
          member_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communities_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communities_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          }
        ];
      };
      community_members: {
        Row: {
          community_id: string;
          user_id: string;
          role: 'member' | 'moderator' | 'admin';
          joined_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          role?: 'member' | 'moderator' | 'admin';
          joined_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          role?: 'member' | 'moderator' | 'admin';
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey";
            columns: ["community_id"];
            referencedRelation: "communities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      posts: {
        Row: {
          id: string;
          author_id: string | null;
          community_id: string | null;
          body: string;
          visibility: ContentVisibilityEnum;
          image_paths: string[];
          helpful_count: number;
          comment_count: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          author_id?: string | null;
          community_id?: string | null;
          body: string;
          visibility?: ContentVisibilityEnum;
          image_paths?: string[];
          helpful_count?: number;
          comment_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string | null;
          community_id?: string | null;
          body?: string;
          visibility?: ContentVisibilityEnum;
          image_paths?: string[];
          helpful_count?: number;
          comment_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_community_id_fkey";
            columns: ["community_id"];
            referencedRelation: "communities";
            referencedColumns: ["id"];
          }
        ];
      };
      questions: {
        Row: {
          id: string;
          author_id: string | null;
          community_id: string | null;
          title: string;
          body: string;
          status: QuestionStatusEnum;
          accepted_answer_id: string | null;
          solved_at: string | null;
          answer_count: number;
          helpful_count: number;
          image_paths: string[];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          author_id?: string | null;
          community_id?: string | null;
          title: string;
          body: string;
          status?: QuestionStatusEnum;
          accepted_answer_id?: string | null;
          solved_at?: string | null;
          answer_count?: number;
          helpful_count?: number;
          image_paths?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string | null;
          community_id?: string | null;
          title?: string;
          body?: string;
          status?: QuestionStatusEnum;
          accepted_answer_id?: string | null;
          solved_at?: string | null;
          answer_count?: number;
          helpful_count?: number;
          image_paths?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "questions_accepted_answer_id_fkey";
            columns: ["accepted_answer_id"];
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_community_id_fkey";
            columns: ["community_id"];
            referencedRelation: "communities";
            referencedColumns: ["id"];
          }
        ];
      };
      question_topics: {
        Row: {
          question_id: string;
          topic_id: string;
        };
        Insert: {
          question_id: string;
          topic_id: string;
        };
        Update: {
          question_id?: string;
          topic_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_topics_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_topics_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          }
        ];
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          author_id: string | null;
          body: string;
          is_accepted: boolean;
          helpful_count: number;
          comment_count: number;
          image_paths: string[];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          question_id: string;
          author_id?: string | null;
          body: string;
          is_accepted?: boolean;
          helpful_count?: number;
          comment_count?: number;
          image_paths?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          question_id?: string;
          author_id?: string | null;
          body?: string;
          is_accepted?: boolean;
          helpful_count?: number;
          comment_count?: number;
          image_paths?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "answers_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          author_id: string | null;
          post_id: string | null;
          question_id: string | null;
          answer_id: string | null;
          body: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          author_id?: string | null;
          post_id?: string | null;
          question_id?: string | null;
          answer_id?: string | null;
          body: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string | null;
          post_id?: string | null;
          question_id?: string | null;
          answer_id?: string | null;
          body?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_answer_id_fkey";
            columns: ["answer_id"];
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          }
        ];
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          question_id: string | null;
          answer_id: string | null;
          comment_id: string | null;
          reaction_type: ReactionTypeEnum;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          question_id?: string | null;
          answer_id?: string | null;
          comment_id?: string | null;
          reaction_type?: ReactionTypeEnum;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          question_id?: string | null;
          answer_id?: string | null;
          comment_id?: string | null;
          reaction_type?: ReactionTypeEnum;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reactions_answer_id_fkey";
            columns: ["answer_id"];
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reactions_comment_id_fkey";
            columns: ["comment_id"];
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reactions_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reactions_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          question_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          question_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          question_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookmarks_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          device_os: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          device_os: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expo_push_token?: string;
          device_os?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string | null;
          type: string;
          entity_type: string;
          entity_id: string;
          read_at: string | null;
          push_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id?: string | null;
          type: string;
          entity_type: string;
          entity_id: string;
          read_at?: string | null;
          push_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          actor_id?: string | null;
          type?: string;
          entity_type?: string;
          entity_id?: string;
          read_at?: string | null;
          push_sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          post_id: string | null;
          question_id: string | null;
          answer_id: string | null;
          comment_id: string | null;
          profile_id: string | null;
          reason: ReportReasonEnum;
          details: string | null;
          status: ReportStatusEnum;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          post_id?: string | null;
          question_id?: string | null;
          answer_id?: string | null;
          comment_id?: string | null;
          profile_id?: string | null;
          reason: ReportReasonEnum;
          details?: string | null;
          status?: ReportStatusEnum;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          post_id?: string | null;
          question_id?: string | null;
          answer_id?: string | null;
          comment_id?: string | null;
          profile_id?: string | null;
          reason?: ReportReasonEnum;
          details?: string | null;
          status?: ReportStatusEnum;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_answer_id_fkey";
            columns: ["answer_id"];
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_comment_id_fkey";
            columns: ["comment_id"];
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      verification_requests: {
        Row: {
          id: string;
          user_id: string;
          verification_type: VerificationTypeEnum;
          evidence_path: string | null;
          institutional_email: string | null;
          status: VerificationStatusEnum;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          verification_type: VerificationTypeEnum;
          evidence_path?: string | null;
          institutional_email?: string | null;
          status?: VerificationStatusEnum;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          verification_type?: VerificationTypeEnum;
          evidence_path?: string | null;
          institutional_email?: string | null;
          status?: VerificationStatusEnum;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      moderation_audit_logs: {
        Row: {
          id: string;
          moderator_id: string | null;
          action: ModerationActionEnum;
          post_id: string | null;
          question_id: string | null;
          answer_id: string | null;
          comment_id: string | null;
          profile_id: string | null;
          reason: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          moderator_id?: string | null;
          action: ModerationActionEnum;
          post_id?: string | null;
          question_id?: string | null;
          answer_id?: string | null;
          comment_id?: string | null;
          profile_id?: string | null;
          reason: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          moderator_id?: string | null;
          action?: ModerationActionEnum;
          post_id?: string | null;
          question_id?: string | null;
          answer_id?: string | null;
          comment_id?: string | null;
          profile_id?: string | null;
          reason?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_audit_logs_answer_id_fkey";
            columns: ["answer_id"];
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_audit_logs_comment_id_fkey";
            columns: ["comment_id"];
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_audit_logs_moderator_id_fkey";
            columns: ["moderator_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_audit_logs_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_audit_logs_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_audit_logs_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          }
        ];
      };
      client_error_reports: {
        Row: {
          id: string;
          user_id: string | null;
          message: string;
          stack: string | null;
          fingerprint: string | null;
          context: Json;
          breadcrumbs: Json;
          app_version: string | null;
          platform: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          message: string;
          stack?: string | null;
          fingerprint?: string | null;
          context?: Json;
          breadcrumbs?: Json;
          app_version?: string | null;
          platform?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          message?: string;
          stack?: string | null;
          fingerprint?: string | null;
          context?: Json;
          breadcrumbs?: Json;
          app_version?: string | null;
          platform?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_error_reports_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_answer: {
        Args: {
          p_question_id: string;
          p_answer_id: string;
        };
        Returns: void;
      };
      unaccept_answer: {
        Args: {
          p_question_id: string;
        };
        Returns: void;
      };
      toggle_reaction: {
        Args: {
          p_target_type: string;
          p_target_id: string;
          p_reaction_type?: ReactionTypeEnum;
        };
        Returns: {
          is_active: boolean;
          count: number;
        };
      };
      complete_onboarding: {
        Args: {
          p_username: string;
          p_display_name: string;
          p_country_code: string;
          p_current_status: UserStatusEnum;
          p_institution_name: string;
          p_degree: string;
          p_field: string;
          p_start_year: number;
          p_end_year?: number | null;
          p_topic_ids?: string[];
        };
        Returns: void;
      };
      delete_own_account: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      check_username_available: {
        Args: {
          p_username: string;
        };
        Returns: boolean;
      };
      is_moderator: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      execute_moderation_action: {
        Args: {
          p_report_id: string | null;
          p_target_type: string;
          p_target_id: string;
          p_action: ModerationActionEnum;
          p_reason: string;
          p_metadata?: Json;
        };
        Returns: void;
      };
      get_home_feed: {
        Args: {
          p_filter?: string;
          p_limit?: number;
          p_cursor_created_at?: string | null;
          p_cursor_id?: string | null;
        };
        Returns: {
          item_type: string;
          id: string;
          author_id: string | null;
          author_username: string;
          author_display_name: string;
          author_avatar_path: string | null;
          author_status: UserStatusEnum;
          author_is_verified: boolean;
          title: string;
          body: string;
          status: QuestionStatusEnum;
          answer_count: number;
          helpful_count: number;
          comment_count: number;
          image_paths: string[];
          created_at: string;
          is_helpful: boolean;
          is_bookmarked: boolean;
        }[];
      };
      rpc_create_community: {
        Args: {
          p_name: string;
          p_slug: string;
          p_description: string;
          p_rules?: string | null;
          p_topic_id?: string | null;
          p_university_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["communities"]["Row"];
      };
      rpc_create_question: {
        Args: {
          p_title: string;
          p_body: string;
          p_community_id?: string | null;
          p_topic_ids?: string[];
          p_image_paths?: string[];
        };
        Returns: string;
      };
      rpc_get_user_bookmarks: {
        Args: {
          p_item_type?: 'post' | 'question' | null;
          p_limit?: number;
          p_cursor_bookmarked_at?: string | null;
          p_cursor_id?: string | null;
        };
        Returns: {
          bookmark_id: string;
          item_type: 'post' | 'question';
          id: string;
          title: string | null;
          body: string;
          created_at: string;
          author_id: string | null;
          author_username: string;
          author_display_name: string;
          author_avatar_path: string | null;
          author_status: UserStatusEnum;
          author_is_verified: boolean;
          status: QuestionStatusEnum | null;
          answer_count: number;
          helpful_count: number;
          comment_count: number;
          image_paths: string[] | null;
          bookmarked_at: string;
        }[];
      };
      get_unread_notification_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      search_questions_fts: {
        Args: {
          p_query: string;
          p_limit?: number;
        };
        Returns: {
          id: string;
          title: string;
          body: string;
          status: QuestionStatusEnum;
          answer_count: number;
          helpful_count: number;
          created_at: string;
          rank: number;
        }[];
      };
      get_related_questions: {
        Args: {
          p_question_id: string;
          p_limit?: number;
        };
        Returns: {
          id: string;
          title: string;
          status: QuestionStatusEnum;
          answer_count: number;
          helpful_count: number;
          created_at: string;
          shared_topics: number;
        }[];
      };
    };
    Enums: {
      user_status_enum: UserStatusEnum;
      question_status_enum: QuestionStatusEnum;
      content_visibility_enum: ContentVisibilityEnum;
      reaction_type_enum: ReactionTypeEnum;
      report_reason_enum: ReportReasonEnum;
      report_status_enum: ReportStatusEnum;
      moderation_action_enum: ModerationActionEnum;
      system_role_enum: SystemRoleEnum;
      verification_status_enum: VerificationStatusEnum;
      verification_type_enum: VerificationTypeEnum;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export interface QuestionDetailRecord {
  id: string;
  author_id: string | null;
  community_id: string | null;
  title: string;
  body: string;
  status: QuestionStatusEnum;
  accepted_answer_id: string | null;
  solved_at: string | null;
  answer_count: number;
  helpful_count: number;
  image_paths: string[];
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_path: string | null;
    current_status: UserStatusEnum;
    is_verified: boolean;
  } | null;
}

