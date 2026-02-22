ALTER TABLE "livestock_animals" DROP CONSTRAINT "livestock_animals_branch_id_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "livestock_groups" DROP CONSTRAINT "livestock_groups_branch_id_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "livestock_animals" ADD CONSTRAINT "livestock_animals_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_groups" ADD CONSTRAINT "livestock_groups_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;