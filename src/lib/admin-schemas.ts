import { z } from "zod";
const uppercase=(v:string)=>v.trim().replace(/\s+/g," ").toUpperCase();
export const programSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(20)
    .transform(uppercase)
    .pipe(z.string().regex(/^[A-Z0-9-]+$/)),
  name: z.string().min(2).max(160).transform(uppercase),
  description: z.string().max(1000).optional().nullable(),
  rules: z.string().max(5000).optional().nullable(),
  category_eligibility: z.enum([
    "junior",
    "senior",
    "super_senior",
    "general",
  ]),
  gender_eligibility: z.enum(["male", "female", "general"]),
  submission_form_url: z
    .union([
      z.literal(""),
      z
        .string()
        .url()
        .refine(
          (v) => {
            try {
              return new URL(v).hostname.endsWith("google.com");
            } catch {
              return false;
            }
          },
          { message: "Use a valid Google Forms URL" }
        ),
    ])
    .optional()
    .nullable(),
  registration_id_entry_key: z.string().regex(/^\d*$/).optional().nullable(),
  full_name_entry_key: z.string().regex(/^\d*$/).optional().nullable(),
  global_status: z.enum(["not_started", "ongoing", "closed"]),
  is_swalath_campaign: z
    .union([
      z.boolean(),
      z.literal("true").transform(() => true),
      z.literal("false").transform(() => false),
    ])
    .optional(),
  campaign_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal("")),
  campaign_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal("")),
});

export const programEditableSchema = programSchema.pick({
  description: true,
  rules: true,
  submission_form_url: true,
  registration_id_entry_key: true,
  full_name_entry_key: true,
  global_status: true,
  is_swalath_campaign: true,
  campaign_start_date: true,
  campaign_end_date: true,
});

export const groupSchema=z.object({name:z.string().trim().min(2).max(80).transform(v=>v.replace(/\s+/g," ").toUpperCase()),whatsappGroupLink:z.union([z.literal(""),z.string().url().refine(v=>new URL(v).hostname==="chat.whatsapp.com")]).optional()});
