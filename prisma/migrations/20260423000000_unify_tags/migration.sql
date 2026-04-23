-- Unify AdminTag into ContentTag.
-- Preserves manual user tagging via UserTag, but re-points it at ContentTag.

-- 1. Extend ContentTag with color and createdAt (borrowed from AdminTag design).
ALTER TABLE "ContentTag"
  ADD COLUMN "color" TEXT NOT NULL DEFAULT '#6B7280',
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Copy AdminTag rows into ContentTag. If a row with a matching name OR
--    generated slug already exists in ContentTag, remap any UserTag rows to
--    point at the existing ContentTag (so we never duplicate).
DO $$
DECLARE
  at_row RECORD;
  generated_slug TEXT;
  target_tag_id UUID;
BEGIN
  FOR at_row IN SELECT "id", "name", "color", "createdAt" FROM "AdminTag" LOOP
    -- Slugify the admin tag name (lowercase, Danish chars folded, non-alnum to -).
    generated_slug := LOWER(at_row."name");
    generated_slug := REPLACE(generated_slug, 'æ', 'ae');
    generated_slug := REPLACE(generated_slug, 'ø', 'oe');
    generated_slug := REPLACE(generated_slug, 'å', 'aa');
    generated_slug := REGEXP_REPLACE(generated_slug, '[^a-z0-9]+', '-', 'g');
    generated_slug := TRIM(BOTH '-' FROM generated_slug);

    -- Prefer slug match, fall back to name match, otherwise create new.
    SELECT "id" INTO target_tag_id FROM "ContentTag" WHERE "slug" = generated_slug LIMIT 1;
    IF target_tag_id IS NULL THEN
      SELECT "id" INTO target_tag_id FROM "ContentTag" WHERE "name" = at_row."name" LIMIT 1;
    END IF;

    IF target_tag_id IS NULL THEN
      -- No collision: import the admin tag as-is, keeping its UUID so UserTag rows stay valid.
      INSERT INTO "ContentTag" ("id", "name", "slug", "color", "createdAt")
      VALUES (at_row."id", at_row."name", generated_slug, at_row."color", at_row."createdAt");
    ELSE
      -- Collision: remap any UserTag rows pointing at this admin tag to the existing content tag.
      UPDATE "UserTag" SET "tagId" = target_tag_id WHERE "tagId" = at_row."id";
    END IF;
  END LOOP;
END $$;

-- 3. Swap UserTag.tagId FK from AdminTag to ContentTag.
ALTER TABLE "UserTag" DROP CONSTRAINT "UserTag_tagId_fkey";
ALTER TABLE "UserTag" ADD CONSTRAINT "UserTag_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "ContentTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Drop the AdminTag table.
DROP TABLE "AdminTag";
