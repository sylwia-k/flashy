-- Add spaced repetition fields and set_id to flashcard_progress

ALTER TABLE flashcard_progress
  ADD COLUMN IF NOT EXISTS ease_factor NUMERIC DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS repetitions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interval_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_grade INTEGER,
  ADD COLUMN IF NOT EXISTS last_response_ms INTEGER,
  ADD COLUMN IF NOT EXISTS response_ms_avg INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence_avg NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_set ON flashcard_progress(user_id, set_id);

