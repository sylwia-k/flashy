-- User-specific progress for each flashcard

CREATE TABLE IF NOT EXISTS flashcard_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('learn','recognize','know')) NOT NULL DEFAULT 'learn',
  last_reviewed TIMESTAMP WITH TIME ZONE,
  due_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_card ON flashcard_progress(user_id, card_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_due ON flashcard_progress(user_id, due_at);

ALTER TABLE IF EXISTS flashcard_progress ENABLE ROW LEVEL SECURITY;

-- Only owner can see or modify their progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='flashcard_progress' AND policyname='flashcard_progress_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY flashcard_progress_select_own ON flashcard_progress
      FOR SELECT USING (user_id = auth.uid())';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='flashcard_progress' AND policyname='flashcard_progress_insert_own'
  ) THEN
    EXECUTE 'CREATE POLICY flashcard_progress_insert_own ON flashcard_progress
      FOR INSERT WITH CHECK (user_id = auth.uid())';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='flashcard_progress' AND policyname='flashcard_progress_update_own'
  ) THEN
    EXECUTE 'CREATE POLICY flashcard_progress_update_own ON flashcard_progress
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;
END$$;

