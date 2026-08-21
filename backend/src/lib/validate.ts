export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

// Server-side input validation for CRUD payloads. Strict on required fields
// and well-known formats; lenient on optional fields (just trim strings).

const isString = (v: unknown): v is string => typeof v === "string";
const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROJECT_STATUS = new Set(["planned", "active", "done"]);

export function validateCreatePerson(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Body must be a JSON object"] };
  }
  const p = input as Record<string, unknown>;
  if (!isNonEmptyString(p["name"])) errors.push("name is required");
  if (!isNonEmptyString(p["email"]) || !EMAIL.test(String(p["email"])))
    errors.push("email must be a valid email");
  if (!isNonEmptyString(p["title"])) errors.push("title is required");
  if (!isString(p["joinedAt"]) || !ISO_DATE.test(p["joinedAt"]))
    errors.push("joinedAt must be ISO date YYYY-MM-DD");
  if (p["id"] !== undefined && !isNonEmptyString(p["id"]))
    errors.push("id must be a non-empty string when provided");
  return { ok: errors.length === 0, errors };
}

export function validateUpdatePerson(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Body must be a JSON object"] };
  }
  const p = input as Record<string, unknown>;
  const errors: string[] = [];
  if (p["name"] !== undefined && !isNonEmptyString(p["name"]))
    errors.push("name must be a non-empty string");
  if (p["email"] !== undefined && (!isString(p["email"]) || !EMAIL.test(String(p["email"]))))
    errors.push("email must be a valid email");
  if (p["title"] !== undefined && !isNonEmptyString(p["title"]))
    errors.push("title must be a non-empty string");
  if (p["joinedAt"] !== undefined && (!isString(p["joinedAt"]) || !ISO_DATE.test(p["joinedAt"])))
    errors.push("joinedAt must be ISO date YYYY-MM-DD");
  return { ok: errors.length === 0, errors };
}

export function validateCreateDepartment(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") return { ok: false, errors: ["Body must be a JSON object"] };
  const p = input as Record<string, unknown>;
  const errors: string[] = [];
  if (!isNonEmptyString(p["name"])) errors.push("name is required");
  if (!isNonEmptyString(p["costCenter"])) errors.push("costCenter is required");
  return { ok: errors.length === 0, errors };
}
export const validateUpdateDepartment = validateCreateDepartment;

export function validateCreateProject(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") return { ok: false, errors: ["Body must be a JSON object"] };
  const p = input as Record<string, unknown>;
  const errors: string[] = [];
  if (!isNonEmptyString(p["name"])) errors.push("name is required");
  if (!isString(p["status"]) || !PROJECT_STATUS.has(p["status"]))
    errors.push("status must be one of planned | active | done");
  const managerIds = p["managerIds"];
  if (
    managerIds !== undefined &&
    (!Array.isArray(managerIds) ||
      !managerIds.every((id) => typeof id === "string" && id.trim().length > 0))
  )
    errors.push("managerIds must be an array of non-empty strings");
  return { ok: errors.length === 0, errors };
}
export const validateUpdateProject = validateCreateProject;

export function validateCreateProduct(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") return { ok: false, errors: ["Body must be a JSON object"] };
  const p = input as Record<string, unknown>;
  const errors: string[] = [];
  if (!isNonEmptyString(p["name"])) errors.push("name is required");
  if (!isNonEmptyString(p["sku"])) errors.push("sku is required");
  if (!isNonEmptyString(p["category"])) errors.push("category is required");
  return { ok: errors.length === 0, errors };
}
export const validateUpdateProduct = validateCreateProduct;

export function validateCreateSupplier(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") return { ok: false, errors: ["Body must be a JSON object"] };
  const p = input as Record<string, unknown>;
  const errors: string[] = [];
  if (!isNonEmptyString(p["name"])) errors.push("name is required");
  if (typeof p["rating"] !== "number" || p["rating"] < 0 || p["rating"] > 5)
    errors.push("rating must be a number between 0 and 5");
  return { ok: errors.length === 0, errors };
}
export const validateUpdateSupplier = validateCreateSupplier;

export function validateCreateLocation(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") return { ok: false, errors: ["Body must be a JSON object"] };
  const p = input as Record<string, unknown>;
  const errors: string[] = [];
  if (!isNonEmptyString(p["city"])) errors.push("city is required");
  if (!isNonEmptyString(p["country"])) errors.push("country is required");
  if (!isNonEmptyString(p["region"])) errors.push("region is required");
  return { ok: errors.length === 0, errors };
}
export const validateUpdateLocation = validateCreateLocation;
