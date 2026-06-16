import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";

/**
 * Version-agnostic RHF resolver. Zod 4 implements the Standard Schema spec, so
 * this avoids zod-version type skew between zod and @hookform/resolvers.
 * Use across all forms instead of `zodResolver`.
 */
export const zodFormResolver = standardSchemaResolver;
