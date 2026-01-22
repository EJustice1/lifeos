-- Add batch_id column to transactions table for grouping bulk imports
ALTER TABLE transactions
  ADD COLUMN batch_id UUID DEFAULT NULL;

-- Create index on batch_id for faster queries
CREATE INDEX transactions_batch_id_idx ON transactions(batch_id) WHERE batch_id IS NOT NULL;

-- Function for bulk insert with per-row validation and error handling
CREATE OR REPLACE FUNCTION bulk_insert_transactions(transactions_json JSONB)
RETURNS TABLE (
  inserted_count INTEGER,
  failed_rows JSONB[]
) AS $$
DECLARE
  rec JSONB;
  inserted INTEGER := 0;
  failed JSONB[] := ARRAY[]::JSONB[];
  batch_uuid UUID := gen_random_uuid();
BEGIN
  -- Iterate through each transaction in the JSON array
  FOR rec IN SELECT * FROM jsonb_array_elements(transactions_json) LOOP
    BEGIN
      -- Insert transaction with batch_id
      INSERT INTO transactions (
        user_id,
        account_id,
        date,
        type,
        amount,
        category,
        description,
        batch_id
      ) VALUES (
        auth.uid(),
        (rec->>'account_id')::UUID,
        (rec->>'date')::DATE,
        rec->>'type',
        (rec->>'amount')::NUMERIC,
        rec->>'category',
        rec->>'description',
        batch_uuid
      );
      inserted := inserted + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Capture error and continue with next row
      failed := array_append(failed, rec || jsonb_build_object('error', SQLERRM));
    END;
  END LOOP;

  -- Return summary
  RETURN QUERY SELECT inserted, failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
