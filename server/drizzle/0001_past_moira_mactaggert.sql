-- Pre-migration cleanup so FK addition is deterministic.
-- If pedigree refs exist but are invalid/cross-tenant/wrong-sex/terminal, null them out.
UPDATE public.livestock_animals a
SET sire_id = NULL
WHERE a.sire_id IS NOT NULL
  AND (
    a.sire_id = a.id
    OR a.sire_id = a.dam_id
    OR NOT EXISTS (SELECT 1 FROM public.livestock_animals p WHERE p.id = a.sire_id)
    OR EXISTS (SELECT 1 FROM public.livestock_animals p WHERE p.id = a.sire_id AND p.tenant_id <> a.tenant_id)
    OR EXISTS (SELECT 1 FROM public.livestock_animals p WHERE p.id = a.sire_id AND p.sex <> 'male')
    OR EXISTS (SELECT 1 FROM public.livestock_animals p WHERE p.id = a.sire_id AND p.status IN ('sold', 'deceased'))
  );
--> statement-breakpoint

UPDATE public.livestock_animals a
SET dam_id = NULL
WHERE a.dam_id IS NOT NULL
  AND (
    a.dam_id = a.id
    OR a.dam_id = a.sire_id
    OR NOT EXISTS (SELECT 1 FROM public.livestock_animals p WHERE p.id = a.dam_id)
    OR EXISTS (SELECT 1 FROM public.livestock_animals p WHERE p.id = a.dam_id AND p.tenant_id <> a.tenant_id)
    OR EXISTS (SELECT 1 FROM public.livestock_animals p WHERE p.id = a.dam_id AND p.sex <> 'female')
    OR EXISTS (SELECT 1 FROM public.livestock_animals p WHERE p.id = a.dam_id AND p.status IN ('sold', 'deceased'))
  );
--> statement-breakpoint

ALTER TABLE "livestock_animals" ADD CONSTRAINT "livestock_animals_sire_id_livestock_animals_id_fk" FOREIGN KEY ("sire_id") REFERENCES "public"."livestock_animals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_animals" ADD CONSTRAINT "livestock_animals_dam_id_livestock_animals_id_fk" FOREIGN KEY ("dam_id") REFERENCES "public"."livestock_animals"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public"."livestock_animals_pedigree_guard"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  sire_tenant uuid;
  sire_sex text;
  sire_status text;
  dam_tenant uuid;
  dam_sex text;
  dam_status text;
BEGIN
  IF NEW.sire_id IS NOT NULL AND NEW.id IS NOT NULL AND NEW.sire_id = NEW.id THEN
    RAISE EXCEPTION 'sireId cannot reference the same animal';
  END IF;
  IF NEW.dam_id IS NOT NULL AND NEW.id IS NOT NULL AND NEW.dam_id = NEW.id THEN
    RAISE EXCEPTION 'damId cannot reference the same animal';
  END IF;
  IF NEW.sire_id IS NOT NULL AND NEW.dam_id IS NOT NULL AND NEW.sire_id = NEW.dam_id THEN
    RAISE EXCEPTION 'sireId and damId cannot be the same';
  END IF;

  IF NEW.sire_id IS NOT NULL THEN
    SELECT tenant_id, sex, status
      INTO sire_tenant, sire_sex, sire_status
      FROM public.livestock_animals
     WHERE id = NEW.sire_id;

    IF sire_tenant IS NULL THEN
      RAISE EXCEPTION 'Invalid sireId for tenant';
    END IF;
    IF sire_tenant <> NEW.tenant_id THEN
      RAISE EXCEPTION 'Invalid sireId for tenant';
    END IF;
    IF sire_status IN ('sold', 'deceased') THEN
      RAISE EXCEPTION 'sireId cannot reference a sold or deceased animal';
    END IF;
    IF sire_sex <> 'male' THEN
      RAISE EXCEPTION 'sireId must reference a male animal';
    END IF;
  END IF;

  IF NEW.dam_id IS NOT NULL THEN
    SELECT tenant_id, sex, status
      INTO dam_tenant, dam_sex, dam_status
      FROM public.livestock_animals
     WHERE id = NEW.dam_id;

    IF dam_tenant IS NULL THEN
      RAISE EXCEPTION 'Invalid damId for tenant';
    END IF;
    IF dam_tenant <> NEW.tenant_id THEN
      RAISE EXCEPTION 'Invalid damId for tenant';
    END IF;
    IF dam_status IN ('sold', 'deceased') THEN
      RAISE EXCEPTION 'damId cannot reference a sold or deceased animal';
    END IF;
    IF dam_sex <> 'female' THEN
      RAISE EXCEPTION 'damId must reference a female animal';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint

DROP TRIGGER IF EXISTS "trg_livestock_animals_pedigree_guard" ON "public"."livestock_animals";
--> statement-breakpoint

CREATE TRIGGER "trg_livestock_animals_pedigree_guard"
BEFORE INSERT OR UPDATE OF sire_id, dam_id, tenant_id
ON "public"."livestock_animals"
FOR EACH ROW
EXECUTE FUNCTION "public"."livestock_animals_pedigree_guard"();
