-- Allow anonymous users to read shared/public sets and their cards

-- flashcard_sets: allow anon select for public or shared sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flashcard_sets' 
      AND policyname = 'flashcard_sets_select_shared_anon'
  ) THEN
    EXECUTE 'CREATE POLICY flashcard_sets_select_shared_anon ON flashcard_sets
      FOR SELECT
      TO anon
      USING (is_public = TRUE OR share_code IS NOT NULL)';
  END IF;
END$$;

-- flashcards: allow anon select for cards belonging to public or shared sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flashcards' 
      AND policyname = 'flashcards_select_shared_anon'
  ) THEN
    EXECUTE 'CREATE POLICY flashcards_select_shared_anon ON flashcards
      FOR SELECT
      TO anon
      USING (EXISTS (
        SELECT 1 FROM flashcard_sets s
        WHERE s.id = set_id AND (s.is_public = TRUE OR s.share_code IS NOT NULL)
      ))';
  END IF;
END$$;

