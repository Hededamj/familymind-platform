-- Age fields: months → years (decimals allowed).
--
-- ContentUnit.ageMin/ageMax: column values appear to already have been typed by
-- admins as years (not months as the old "// months" comment claimed), so we
-- only change the column type — no UPDATE needed. USING ... / 1.0 just coerces.
--
-- UserProfile.childAges (Json array): written by onboarding as months. Divide
-- each element by 12 to convert to years.
--
-- RecommendationRule.conditions (Json): if it contains ageMin/ageMax keys
-- (measured in months), divide them by 12. Rules without age conditions are
-- untouched.

-- 1. ContentUnit age columns: Int → double precision
ALTER TABLE "ContentUnit"
  ALTER COLUMN "ageMin" TYPE double precision USING "ageMin"::double precision,
  ALTER COLUMN "ageMax" TYPE double precision USING "ageMax"::double precision;

-- 2. UserProfile.childAges: divide each array element by 12
UPDATE "UserProfile"
SET "childAges" = (
  SELECT jsonb_agg(to_jsonb((value::text)::numeric / 12.0))
  FROM jsonb_array_elements("childAges"::jsonb) AS value
)
WHERE "childAges" IS NOT NULL
  AND jsonb_typeof("childAges"::jsonb) = 'array'
  AND jsonb_array_length("childAges"::jsonb) > 0;

-- 3. RecommendationRule.conditions: divide ageMin/ageMax by 12 if present
UPDATE "RecommendationRule"
SET "conditions" = (
  CASE
    WHEN "conditions" ? 'ageMin' AND "conditions" ? 'ageMax'
      THEN jsonb_set(
        jsonb_set(
          "conditions"::jsonb,
          '{ageMin}',
          to_jsonb(("conditions"->>'ageMin')::numeric / 12.0)
        ),
        '{ageMax}',
        to_jsonb(("conditions"->>'ageMax')::numeric / 12.0)
      )
    WHEN "conditions" ? 'ageMin'
      THEN jsonb_set(
        "conditions"::jsonb,
        '{ageMin}',
        to_jsonb(("conditions"->>'ageMin')::numeric / 12.0)
      )
    WHEN "conditions" ? 'ageMax'
      THEN jsonb_set(
        "conditions"::jsonb,
        '{ageMax}',
        to_jsonb(("conditions"->>'ageMax')::numeric / 12.0)
      )
    ELSE "conditions"::jsonb
  END
)
WHERE "conditions" ? 'ageMin' OR "conditions" ? 'ageMax';
