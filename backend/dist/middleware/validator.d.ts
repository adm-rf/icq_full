import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const schemas: {
    login: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
    register: z.ZodObject<{
        username: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        username: string;
        password: string;
    }, {
        email: string;
        username: string;
        password: string;
    }>;
    profile: z.ZodObject<{
        username: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status?: string | undefined;
        username?: string | undefined;
    }, {
        status?: string | undefined;
        username?: string | undefined;
    }>;
    message: z.ZodObject<{
        content: z.ZodString;
        type: z.ZodOptional<z.ZodEnum<["text", "image", "file"]>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        type?: "text" | "image" | "file" | undefined;
    }, {
        content: string;
        type?: "text" | "image" | "file" | undefined;
    }>;
};
export declare const validate: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validator.d.ts.map