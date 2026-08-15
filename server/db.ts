import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  assignmentSubmissions,
  assignments,
  courseSections,
  InsertUser,
  lessonMaterials,
  lessons,
  lessonViews,
  users,
} from "../drizzle/schema";
import { hashPassword } from "./auth/password";
import { ENV } from "./_core/env";
import { storageGetSignedUrl } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "username", "passwordHash"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (user.isActive !== undefined) {
    values.isActive = user.isActive;
    updateSet.isActive = user.isActive;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getLocalUserByUsername(username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.select().from(users).where(eq(users.username, username.trim().toLowerCase())).limit(1);
  return result[0] ?? null;
}

export async function ensureAdminAccount() {
  const current = await getLocalUserByUsername("admin");
  if (current) return current;
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(users).values({
    openId: "local-admin",
    username: "admin",
    passwordHash: await hashPassword("admin"),
    name: "Администратор",
    loginMethod: "password",
    role: "admin",
    isActive: true,
    lastSignedIn: new Date(),
  });
  return (await getLocalUserByUsername("admin"))!;
}

export async function createStudentAccount(input: { name: string; username: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(users).values({
    openId: `local-${randomUUID()}`,
    username: input.username,
    passwordHash: input.passwordHash,
    name: input.name,
    loginMethod: "password",
    role: "user",
    isActive: true,
    lastSignedIn: new Date(),
  });
  return (await getLocalUserByUsername(input.username))!;
}

export async function setStudentActive(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(users).set({ isActive }).where(and(eq(users.id, id), eq(users.role, "user")));
  return { success: true };
}

export async function updateStudentAccount(id: number, input: { name: string; username: string; passwordHash?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const values: { name: string; username: string; passwordHash?: string } = { name: input.name, username: input.username };
  if (input.passwordHash) values.passwordHash = input.passwordHash;
  await db.update(users).set(values).where(and(eq(users.id, id), eq(users.role, "user")));
  return { success: true };
}

export async function deleteStudentAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(users).where(and(eq(users.id, id), eq(users.role, "user")));
  return { success: true };
}

export async function listStudentAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: users.id, name: users.name, username: users.username, isActive: users.isActive, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn })
    .from(users)
    .where(eq(users.role, "user"))
    .orderBy(desc(users.createdAt));
}

export async function getStudentStats() {
  const db = await getDb();
  if (!db) return [];
  const students = await listStudentAccounts();
  return Promise.all(students.map(async student => {
    const viewed = await db.select({ total: count() }).from(lessonViews).where(eq(lessonViews.studentId, student.id));
    const completed = await db.select({ total: count() }).from(assignmentSubmissions).where(and(eq(assignmentSubmissions.studentId, student.id), eq(assignmentSubmissions.status, "approved")));
    return { ...student, viewedLessons: viewed[0]?.total ?? 0, completedAssignments: completed[0]?.total ?? 0 };
  }));
}

export async function createCourseSection(input: { title: string; description?: string | null; orderIndex: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(courseSections).values(input);
  return { id: Number(result[0].insertId) };
}

export async function updateCourseSection(id: number, input: { title: string; description?: string | null; orderIndex: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(courseSections).set(input).where(eq(courseSections.id, id));
  return { success: true };
}

export async function deleteCourseSection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(courseSections).where(eq(courseSections.id, id));
  return { success: true };
}

type LessonWrite = { sectionId: number; title: string; summary?: string | null; contentMode: "text" | "video" | "mixed"; textContent?: string | null; videoUrl?: string | null; orderIndex: number; isPublished: boolean };

export async function createLesson(input: LessonWrite) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(lessons).values(input);
  return { id: Number(result[0].insertId) };
}

export async function updateLesson(id: number, input: LessonWrite) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(lessons).set(input).where(eq(lessons.id, id));
  return { success: true };
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(lessons).where(eq(lessons.id, id));
  return { success: true };
}

export async function listCourseSectionsWithLessons(includeUnpublished = false, studentId?: number) {
  const db = await getDb();
  if (!db) return [];
  const sections = await db.select().from(courseSections).orderBy(asc(courseSections.orderIndex), asc(courseSections.createdAt));
  const allLessons = await db.select().from(lessons).orderBy(asc(lessons.orderIndex), asc(lessons.createdAt));
  const visibleLessons = includeUnpublished ? allLessons : allLessons.filter(lesson => lesson.isPublished);
  const views = studentId ? await db.select().from(lessonViews).where(eq(lessonViews.studentId, studentId)) : [];
  const viewedIds = new Set(views.map(view => view.lessonId));
  return sections.map(section => ({
    ...section,
    lessons: visibleLessons.filter(lesson => lesson.sectionId === section.id).map(lesson => ({ ...lesson, isViewed: viewedIds.has(lesson.id) })),
  }));
}

export async function listAdminLessons() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: lessons.id, title: lessons.title, sectionId: lessons.sectionId, sectionTitle: courseSections.title, contentMode: lessons.contentMode, isPublished: lessons.isPublished, orderIndex: lessons.orderIndex, updatedAt: lessons.updatedAt })
    .from(lessons)
    .innerJoin(courseSections, eq(lessons.sectionId, courseSections.id))
    .orderBy(asc(courseSections.orderIndex), asc(lessons.orderIndex));
}

export async function getLessonDetail(id: number, includeUnpublished = true, studentId?: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  const lesson = result[0];
  if (!lesson || (!includeUnpublished && !lesson.isPublished)) return null;
  const [materials, lessonAssignments] = await Promise.all([
    db.select().from(lessonMaterials).where(eq(lessonMaterials.lessonId, id)).orderBy(asc(lessonMaterials.orderIndex)),
    db.select().from(assignments).where(eq(assignments.lessonId, id)).orderBy(asc(assignments.orderIndex)),
  ]);
  const view = studentId ? await db.select().from(lessonViews).where(and(eq(lessonViews.studentId, studentId), eq(lessonViews.lessonId, id))).limit(1) : [];
  const submissions = studentId ? await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.studentId, studentId)) : [];
  const submissionsByAssignment = new Map(submissions.map(item => [item.assignmentId, item]));
  return {
    ...lesson,
    isViewed: view.length > 0,
    materials,
    assignments: lessonAssignments.map(assignment => {
      const submission = submissionsByAssignment.get(assignment.id);
      return { ...assignment, isCompleted: submission?.status === "approved", response: submission?.response ?? null, submissionStatus: submission?.status ?? null, reviewComment: submission?.reviewComment ?? null };
    }),
  };
}

export async function addLessonMaterial(input: { lessonId: number; title: string; sourceType: "file" | "link"; fileUrl: string; fileKey: string | null; orderIndex: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(lessonMaterials).values(input);
  return { id: Number(result[0].insertId) };
}

export async function deleteLessonMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(lessonMaterials).where(eq(lessonMaterials.id, id));
  return { success: true };
}

export async function updateLessonMaterial(id: number, input: { title: string; fileUrl: string; orderIndex: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(lessonMaterials).set(input).where(eq(lessonMaterials.id, id));
  return { success: true };
}

export async function getStudentMaterialAccessUrl(materialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db
    .select({ sourceType: lessonMaterials.sourceType, fileUrl: lessonMaterials.fileUrl, fileKey: lessonMaterials.fileKey, isPublished: lessons.isPublished })
    .from(lessonMaterials)
    .innerJoin(lessons, eq(lessonMaterials.lessonId, lessons.id))
    .where(eq(lessonMaterials.id, materialId))
    .limit(1);
  const material = result[0];
  if (!material || !material.isPublished) return null;
  if (material.sourceType === "file" && material.fileKey) {
    return { url: await storageGetSignedUrl(material.fileKey) };
  }
  return { url: material.fileUrl };
}

export async function addAssignment(input: { lessonId: number; title: string; instructions: string; orderIndex: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(assignments).values(input);
  return { id: Number(result[0].insertId) };
}

export async function updateAssignment(id: number, input: { title: string; instructions: string; orderIndex: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(assignments).set(input).where(eq(assignments.id, id));
  return { success: true };
}

export async function deleteAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(assignments).where(eq(assignments.id, id));
  return { success: true };
}

export async function markLessonViewed(studentId: number, lessonId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const lesson = await db.select({ isPublished: lessons.isPublished }).from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson[0]?.isPublished) throw new Error("Lesson is unavailable");
  await db.insert(lessonViews).values({ studentId, lessonId }).onDuplicateKeyUpdate({ set: { viewedAt: new Date() } });
  return { success: true };
}

export async function submitAssignment(studentId: number, assignmentId: number, response: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const assignment = await db.select({ id: assignments.id, isPublished: lessons.isPublished }).from(assignments).innerJoin(lessons, eq(assignments.lessonId, lessons.id)).where(eq(assignments.id, assignmentId)).limit(1);
  if (!assignment[0]?.isPublished) throw new Error("Assignment is unavailable");
  await db.insert(assignmentSubmissions).values({ studentId, assignmentId, response, status: "pending" }).onDuplicateKeyUpdate({ set: { response, status: "pending", reviewComment: null, reviewedAt: null, reviewedById: null, completedAt: new Date() } });
  return { success: true, status: "pending" as const };
}

export async function listStudentProgress(studentId: number) {
  const db = await getDb();
  if (!db) return { viewedLessonIds: [], completedAssignmentIds: [] };
  const [views, submissions] = await Promise.all([
    db.select({ lessonId: lessonViews.lessonId }).from(lessonViews).where(eq(lessonViews.studentId, studentId)),
    db.select({ assignmentId: assignmentSubmissions.assignmentId }).from(assignmentSubmissions).where(and(eq(assignmentSubmissions.studentId, studentId), eq(assignmentSubmissions.status, "approved"))),
  ]);
  return { viewedLessonIds: views.map(row => row.lessonId), completedAssignmentIds: submissions.map(row => row.assignmentId) };
}

export async function listAssignmentSubmissionsForReview() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: assignmentSubmissions.id,
      response: assignmentSubmissions.response,
      status: assignmentSubmissions.status,
      reviewComment: assignmentSubmissions.reviewComment,
      submittedAt: assignmentSubmissions.completedAt,
      reviewedAt: assignmentSubmissions.reviewedAt,
      studentId: users.id,
      studentName: users.name,
      studentUsername: users.username,
      assignmentId: assignments.id,
      assignmentTitle: assignments.title,
      assignmentInstructions: assignments.instructions,
      lessonTitle: lessons.title,
      sectionTitle: courseSections.title,
    })
    .from(assignmentSubmissions)
    .innerJoin(users, eq(assignmentSubmissions.studentId, users.id))
    .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
    .innerJoin(lessons, eq(assignments.lessonId, lessons.id))
    .innerJoin(courseSections, eq(lessons.sectionId, courseSections.id))
    .orderBy(desc(assignmentSubmissions.updatedAt));
}

export async function reviewAssignmentSubmission(input: { id: number; status: "approved" | "revision"; reviewComment: string | null; reviewerId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(assignmentSubmissions).set({ status: input.status, reviewComment: input.reviewComment, reviewedAt: new Date(), reviewedById: input.reviewerId }).where(eq(assignmentSubmissions.id, input.id));
  return { success: true };
}
