import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getNote, saveNote, deleteNote } from '$lib/server/notes';

/**
 * GET /api/notes/[id] - Get a single note by ID
 */
export const GET: RequestHandler = async ({ params }) => {
  try {
    const note = await getNote(params.id);

    if (!note) {
      throw error(404, 'Note not found');
    }

    return json(note);
  } catch (err) {
    if ((err as { status?: number }).status) {
      throw err;
    }
    console.error('Failed to get note:', err);
    throw error(500, 'Failed to retrieve note');
  }
};

/**
 * PUT /api/notes/[id] - Update an existing note
 */
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const existingNote = await getNote(params.id);

    if (!existingNote) {
      throw error(404, 'Note not found');
    }

    const body = await request.json();

    if (!body.title || typeof body.title !== 'string') {
      throw error(400, 'Title is required');
    }

    const note = await saveNote({
      id: params.id,
      title: body.title,
      content: body.content ?? null,
    });

    return json(note);
  } catch (err) {
    if ((err as { status?: number }).status) {
      throw err;
    }
    console.error('Failed to update note:', err);
    throw error(500, 'Failed to update note');
  }
};

/**
 * DELETE /api/notes/[id] - Delete a note
 */
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const deleted = await deleteNote(params.id);

    if (!deleted) {
      throw error(404, 'Note not found');
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    if ((err as { status?: number }).status) {
      throw err;
    }
    console.error('Failed to delete note:', err);
    throw error(500, 'Failed to delete note');
  }
};
