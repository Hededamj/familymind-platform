-- Journey.targetAgeMin/targetAgeMax: months → years
--
-- Unlike ContentUnit.ageMin/ageMax (which was never actually used in filters
-- and had admin-typed year values), Journey.targetAgeMin/targetAgeMax was
-- seeded with month values (e.g. 6-72 = 6 months to 6 years). Divide by 12.

ALTER TABLE "Journey"
  ALTER COLUMN "targetAgeMin" TYPE double precision USING ("targetAgeMin"::double precision / 12),
  ALTER COLUMN "targetAgeMax" TYPE double precision USING ("targetAgeMax"::double precision / 12);
