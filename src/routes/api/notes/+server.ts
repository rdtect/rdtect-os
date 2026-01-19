import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllNotes, saveNote } from '$lib/server/notes';
import { randomUUID } from 'crypto';

/**
 * GET /api/notes - Get all notes
 */
export const GET: RequestHandler = async () => {
  try {
    const notes = await getAllNotes();
    return json(notes);
  } catch (err) {
    console.error('Failed to get notes:', err);
    throw error(500, 'Failed to retrieve notes');
  }
};

/**
 * POST /api/notes - Create a new note
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== 'string') {
      throw error(400, 'Title is required');
    }

    const note = await saveNote({
      id: body.id || randomUUID(),
      title: body.title,
      content: body.content ?? null,
    });

    return json(note, { status: 201 });
  } catch (err) {
    if ((err as { status?: number }).status) {
      throw err;
    }
    console.error('Failed to create note:', err);
    throw error(500, 'Failed to create note');
  }
};
