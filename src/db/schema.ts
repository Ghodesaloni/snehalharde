import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (Firebase Auth linked)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  avatar: text('avatar'),
  role: text('role').default('recruiter'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Jobs table
export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  dept: text('dept').notNull(),
  jobLevel: text('job_level'),
  reportsTo: text('reports_to'),
  loc: text('loc'),
  isRemotePosition: boolean('is_remote_position').default(false),
  workMode: text('work_mode'),
  type: text('type'),
  expLevel: text('exp_level'),
  description: text('description'),
  keySkills: jsonb('key_skills').$type<string[]>(),
  candidates: integer('candidates').default(0),
  status: text('status').default('Active'),
  posted: text('posted'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Candidates table
export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').notNull(),
  avatar: text('avatar'),
  interviewDate: text('interview_date'),
  timestamp: text('timestamp'),
  duration: text('duration'),
  mode: text('mode').default('AI Interview'),
  score: integer('score'),
  status: text('status').default('Under Review'),
  notes: text('notes'),
  summaryPoints: jsonb('summary_points').$type<Array<{ text: string; type: string }>>(),
  recommendation: text('recommendation'),
  transcript: jsonb('transcript').$type<Array<{ speaker: string; time: string; isAI: boolean; text: string }>>(),
  evaluationBreakdown: jsonb('evaluation_breakdown').$type<Array<{ category: string; score: number; weight: string }>>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Interviews table
export const interviews = pgTable('interviews', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatar: text('avatar'),
  role: text('role').notNull(),
  company: text('company'),
  date: text('date'),
  dayOfWeek: text('day_of_week'),
  time: text('time'),
  timeZone: text('time_zone'),
  duration: text('duration'),
  durationMins: integer('duration_mins').default(45),
  linkCode: text('link_code').unique(),
  status: text('status').default('Active'),
  expiry: text('expiry'),
  expiryTime: text('expiry_time'),
  isExpired: boolean('is_expired').default(false),
  score: integer('score'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Resumes table
export const resumes = pgTable('resumes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: text('role'),
  score: integer('score'),
  status: text('status').default('Analyzed'),
  experience: text('experience'),
  skills: jsonb('skills').$type<string[]>(),
  summary: text('summary'),
  extractedText: text('extracted_text'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Email templates table
export const emailTemplates = pgTable('email_templates', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow(),
});
