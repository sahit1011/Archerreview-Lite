'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  NotebookPen,
  Search,
  Sparkles,
  Trash2,
  Pencil,
  ChevronDown,
  MessageCircleQuestion,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteItem {
  _id: string;
  title: string;
  content: string;
  source: 'TUTOR_SESSION' | 'MANUAL';
  subject?: string;
  topic?: { _id: string; name: string; category: string } | null;
  tags: string[];
  updatedAt: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  PHYSICS: 'Physics',
  CHEMISTRY: 'Chemistry',
  BIOLOGY: 'Biology',
  MATHEMATICS: 'Mathematics',
};

const SUBJECT_COLORS: Record<string, string> = {
  PHYSICS: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25',
  CHEMISTRY: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  BIOLOGY: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  MATHEMATICS: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25',
};

/** Tiny markdown-bullets renderer: -/* bullets, **bold**, nested "  - " lines. */
function NoteContent({ content }: { content: string }) {
  const lines = content.split('\n').filter((l) => l.trim());
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
      {lines.map((line, i) => {
        const nested = /^\s{2,}[-*]/.test(line);
        const text = line.replace(/^\s*[-*]\s*/, '');
        const html = text
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
        return (
          <div key={i} className={cn('flex gap-2', nested && 'ml-5')}>
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      })}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return mins < 1 ? 'just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotesPage() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (data.success) setNotes(data.notes);
    } catch (err) {
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (subjectFilter && (n.subject || n.topic?.category) !== subjectFilter) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.topic?.name?.toLowerCase().includes(q)
      );
    });
  }, [notes, query, subjectFilter]);

  const subjectsPresent = useMemo(
    () => [...new Set(notes.map((n) => n.subject || n.topic?.category).filter(Boolean))] as string[],
    [notes]
  );

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => prev.filter((n) => n._id !== id));
        toast.success('Note deleted');
      }
    } catch {
      toast.error('Could not delete note');
    }
  };

  const startEdit = (note: NoteItem) => {
    setEditingId(note._id);
    setEditContent(note.content);
    setExpanded((prev) => new Set(prev).add(note._id));
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, content: editContent } : n)));
        toast.success('Note updated');
      }
    } catch {
      toast.error('Could not save changes');
    } finally {
      setEditingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="mx-auto max-w-4xl">
          <Reveal className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">My Notes</h1>
                <p className="mt-1.5 text-muted-foreground">
                  Your personal revision notebook — key points from AI tutor sessions, organized by topic.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Search + subject filters */}
          <Reveal delay={0.05} className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your notes…"
                  className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
                />
              </div>
              {subjectsPresent.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {subjectsPresent.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubjectFilter(subjectFilter === s ? null : s)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                        subjectFilter === s
                          ? SUBJECT_COLORS[s] || 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {SUBJECT_LABELS[s] || s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* Notes list */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary/60" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Reveal>
              <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <NotebookPen className="h-7 w-7" />
                </div>
                <h2 className="font-display text-lg font-semibold">
                  {notes.length === 0 ? 'No notes yet' : 'Nothing matches your search'}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {notes.length === 0
                    ? 'Chat with your AI tutor about any topic, then hit "Save key points to My Notes" — your revision points will collect here automatically.'
                    : 'Try a different search term or clear the subject filter.'}
                </p>
                {notes.length === 0 && (
                  <Button asChild variant="brand" className="mt-5">
                    <Link href="/tutor">
                      <MessageCircleQuestion className="h-4 w-4" /> Ask the AI Tutor
                    </Link>
                  </Button>
                )}
              </div>
            </Reveal>
          ) : (
            <div className="space-y-3">
              {filtered.map((note, i) => {
                const subject = note.subject || note.topic?.category;
                const isOpen = expanded.has(note._id);
                const isEditing = editingId === note._id;
                return (
                  <Reveal key={note._id} delay={Math.min(i * 0.04, 0.3)}>
                    <div className="lift rounded-2xl border border-border bg-card shadow-sm hover:border-primary/25">
                      <button onClick={() => toggleExpand(note._id)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                            note.source === 'TUTOR_SESSION' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {note.source === 'TUTOR_SESSION' ? <Sparkles className="h-4.5 w-4.5" /> : <NotebookPen className="h-4.5 w-4.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">{note.title}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            {subject && (
                              <span className={cn('rounded-md border px-1.5 py-0.5 font-medium', SUBJECT_COLORS[subject])}>
                                {SUBJECT_LABELS[subject] || subject}
                              </span>
                            )}
                            {note.topic?.name && <span className="truncate">{note.topic.name}</span>}
                            <span>· {timeAgo(note.updatedAt)}</span>
                          </span>
                        </span>
                        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                      </button>

                      {isOpen && (
                        <div className="border-t border-border px-5 py-4">
                          {isEditing ? (
                            <div>
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={Math.min(14, Math.max(5, editContent.split('\n').length + 1))}
                                className="w-full rounded-xl border border-input bg-background p-3 font-mono text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
                              />
                              <div className="mt-2 flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                  <X className="h-4 w-4" /> Cancel
                                </Button>
                                <Button size="sm" variant="brand" onClick={() => saveEdit(note._id)}>
                                  <Check className="h-4 w-4" /> Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <NoteContent content={note.content} />
                              <div className="mt-4 flex items-center justify-between">
                                {note.topic?._id ? (
                                  <Link
                                    href={`/tutor/topic/${note.topic._id}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                                  >
                                    <MessageCircleQuestion className="h-3.5 w-3.5" /> Continue with tutor
                                  </Link>
                                ) : (
                                  <span />
                                )}
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEdit(note)}
                                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                    aria-label="Edit note"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(note._id)}
                                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                    aria-label="Delete note"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
