-- Overall monthly budgets (categoryId IS NULL) must be unique per user and month.
-- The existing unique index on (userId, categoryId, month) does not enforce this,
-- because PostgreSQL treats NULLs as distinct in unique indexes.
-- Prisma cannot express partial indexes in schema.prisma, so this lives only in SQL.
CREATE UNIQUE INDEX "Budget_overall_userId_month_key" ON "Budget"("userId", "month") WHERE "categoryId" IS NULL;
