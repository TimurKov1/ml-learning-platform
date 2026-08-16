import { boolean, index, int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  username: varchar("username", { length: 32 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const courseSections = mysqlTable("course_sections", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull().references(() => courseSections.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  summary: varchar("summary", { length: 500 }),
  contentMode: mysqlEnum("contentMode", ["text", "video", "mixed"]).notNull(),
  textContent: text("textContent"),
  videoUrl: varchar("videoUrl", { length: 2000 }),
  orderIndex: int("orderIndex").default(0).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("lessons_section_order_idx").on(table.sectionId, table.orderIndex)]);

export const lessonMaterials = mysqlTable("lesson_materials", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["file", "link"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 2000 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("lesson_materials_lesson_order_idx").on(table.lessonId, table.orderIndex)]);

export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  instructions: text("instructions").notNull(),
  assignmentType: mysqlEnum("assignmentType", ["manual_file", "code"]).default("manual_file").notNull(),
  language: varchar("language", { length: 32 }),
  starterCode: text("starterCode"),
  functionSignature: varchar("functionSignature", { length: 500 }),
  testsJson: text("testsJson"),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("assignments_lesson_order_idx").on(table.lessonId, table.orderIndex)]);

export const lessonViews = mysqlTable("lesson_views", {
  studentId: int("studentId").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: int("lessonId").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.studentId, table.lessonId] })]);

export const assignmentSubmissions = mysqlTable("assignment_submissions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignmentId: int("assignmentId").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  response: text("response").notNull(),
  submittedFileName: varchar("submittedFileName", { length: 255 }),
  submittedFileUrl: varchar("submittedFileUrl", { length: 2000 }),
  submittedFileKey: varchar("submittedFileKey", { length: 512 }),
  autoCheckResult: text("autoCheckResult"),
  status: mysqlEnum("status", ["pending", "approved", "revision"]).default("pending").notNull(),
  reviewComment: text("reviewComment"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedById: int("reviewedById"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("assignment_submissions_student_assignment_unique").on(table.studentId, table.assignmentId)]);


export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  recipientUserId: int("recipientUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 64 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 255 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("notifications_recipient_read_idx").on(table.recipientUserId, table.isRead), index("notifications_created_idx").on(table.createdAt)]);
