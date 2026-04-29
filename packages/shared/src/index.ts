import { z } from "zod";

/**
 * 示例：API / Agent 共用的分页查询参数（可按业务替换或扩展）
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
