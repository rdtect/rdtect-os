import { query, queryOne } from './db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  created_at: Date;
  updated_at: Date;
}

interface NoteRow extends RowDataPacket, Note {}

/**
 * Get all notes from the database
 */
export async function getAllNotes(): Promise<Note[]> {
  const notes = await query<NoteRow[]>(
    'SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC'
  );
  return notes;
}

/**
 * Get a single note by ID
 */
export async function getNote(id: string): Promise<Note | null> {
  const note = await queryOne<NoteRow>(
    'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?',
    [id]
  );
  return note;
}

/**
 * Save or update a note
 * If note with ID exists, update it; otherwise create new
 */
export async function saveNote(note: {
  id: string;
  title: string;
  content?: string | null;
  created_at?: Date;
  updated_at?: Date;
}): Promise<Note> {
  const existingNote = await getNote(note.id);

  if (existingNote) {
    // Update existing note
    await query<ResultSetHeader>(
      'UPDATE notes SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
      [note.title, note.content ?? null, note.id]
    );
  } else {
    // Create new note
    await query<ResultSetHeader>(
      'INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [note.id, note.title, note.content ?? null]
    );
  }

  // Return the updated/created note
  const savedNote = await getNote(note.id);
  if (!savedNote) {
    throw new Error(`Failed to save note with id: ${note.id}`);
  }
  return savedNote;
}

/**
 * Delete a note by ID
 */
export async function deleteNote(id: string): Promise<boolean> {
  const result = await query<ResultSetHeader>(
    'DELETE FROM notes WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Search notes by title or content
 */
export async function searchNotes(searchTerm: string): Promise<Note[]> {
  const notes = await query<NoteRow[]>(
    'SELECT id, title, content, created_at, updated_at FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC',
    [`%${searchTerm}%`, `%${searchTerm}%`]
  );
  return notes;
}
