import { z } from "zod";

/** Sentinel select value meaning "not linked / none". */
export const NONE = "none";

/** Optional free-text field — empty string is allowed (normalised to null later). */
export const optionalText = (max = 8000) => z.string().max(max);

/** Required, trimmed text field with a custom "required" message. */
export const requiredText = (message: string, max = 200) =>
  z.string().trim().min(1, message).max(max);

/** A relation <Select> whose value is either a uuid or the NONE sentinel. */
export const idSelect = z.string();

/** Optional URL — empty string allowed. */
export const optionalUrl = z.union([z.literal(""), z.url("Enter a valid URL")]);

/** Required 1–10 score. */
export const requiredScore = z.number().int().min(1).max(10);

/** Optional 1–10 score (null = not scored). */
export const optionalScore = z.number().int().min(1).max(10).nullable();

/** Optional non-negative number (null = unset). */
export const optionalNonNegative = z.number().min(0).nullable();

/** Optional non-negative integer (null = unset). */
export const optionalNonNegativeInt = z.number().int().min(0).nullable();
