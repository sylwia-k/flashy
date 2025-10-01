-- Enable RLS and add policies for flashcard system

-- Flashcard sets RLS
ALTER TABLE IF EXISTS flashcard_sets ENABLE ROW LEVEL SECURITY;

-- Owner can select own sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flashcard_sets' 
      AND policyname = 'flashcard_sets_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY flashcard_sets_select_own ON flashcard_sets
      FOR SELECT
      USING (user_id = auth.uid())';
  END IF;
END$$;

-- Owner can insert own sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flashcard_sets' 
      AND policyname = 'flashcard_sets_insert_own'
  ) THEN
    EXECUTE 'CREATE POLICY flashcard_sets_insert_own ON flashcard_sets
      FOR INSERT
      WITH CHECK (user_id = auth.uid())';
  END IF;
END$$;

-- Owner can update own sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flashcard_sets' 
      AND policyname = 'flashcard_sets_update_own'
  ) THEN
    EXECUTE 'CREATE POLICY flashcard_sets_update_own ON flashcard_sets
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())';
  END IF;
END$$;

-- Owner can delete own sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flashcard_sets' 
      AND policyname = 'flashcard_sets_delete_own'
  ) THEN
    EXECUTE 'CREATE POLICY flashcard_sets_delete_own ON flashcard_sets
      FOR DELETE
      USING (user_id = auth.uid())';
  END IF;
END$$;

-- Any authenticated user can read public or shared sets (for share links)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flashcard_sets' 
      AND policyname = 'flashcard_sets_select_shared'
  ) THEN
    EXECUTE 'CREATE POLICY flashcard_sets_select_shared ON flashcard_sets
      FOR SELECT
      TO authenticated
      USING (is_public = TRUE OR share_code IS NOT NULL)';
  END IF;
END$$;

-- Flashcards RLS
ALTER TABLE IF EXISTS flashcards ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD cards that belong to their sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flashcards' 
      AND policyname = 'flashcards_owner_crud'
  ) THEN
    EXECUTE 'CREATE POLICY flashcards_owner_crud ON flashcards
      FOR ALL
      USING (EXISTS (SELECT 1 FROM flashcard_sets s WHERE s.id = set_id AND s.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM flashcard_sets s WHERE s.id = set_id AND s.user_id = auth.uid()))';
  END IF;
END$$;

-- Any authenticated user can read cards for public or shared sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flashcards' 
      AND policyname = 'flashcards_select_shared'
  ) THEN
    EXECUTE 'CREATE POLICY flashcards_select_shared ON flashcards
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM flashcard_sets s
        WHERE s.id = set_id AND (s.is_public = TRUE OR s.share_code IS NOT NULL)
      ))';
  END IF;
END$$;

-- User profiles RLS
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'user_profiles_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY user_profiles_select_own ON user_profiles
      FOR SELECT
      USING (id = auth.uid())';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'user_profiles_insert_own'
  ) THEN
    EXECUTE 'CREATE POLICY user_profiles_insert_own ON user_profiles
      FOR INSERT
      WITH CHECK (id = auth.uid())';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'user_profiles_update_own'
  ) THEN
    EXECUTE 'CREATE POLICY user_profiles_update_own ON user_profiles
      FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid())';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'user_profiles_delete_own'
  ) THEN
    EXECUTE 'CREATE POLICY user_profiles_delete_own ON user_profiles
      FOR DELETE
      USING (id = auth.uid())';
  END IF;
END$$;

