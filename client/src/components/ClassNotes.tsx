import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { StickyNote, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import type { StudentDataClassNote } from "@shared/schema";

interface ClassNotesProps {
  classId: string;
  className: string;
  notes: StudentDataClassNote[];
  isStudent: boolean;
  addClassNote: (note: { classId: string; note: string }) => Promise<void>;
  deleteClassNote: (id: string) => Promise<void>;
}

export function ClassNotes({ 
  classId, 
  className, 
  notes, 
  isStudent, 
  addClassNote, 
  deleteClassNote 
}: ClassNotesProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const classNotes = notes
    .filter(n => n.classId === classId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      setIsAdding(true);
      await addClassNote({ classId, note: newNote.trim() });
      setNewNote("");
      toast({ title: "Note added!" });
    } catch {
      toast({ title: "Failed to add note", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <StickyNote className="w-4 h-4" />
          <span>Notes ({classNotes.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* Add Note Input */}
          {isStudent && (
            <div className="flex gap-2">
              <Input
                placeholder="Quick note (homework, reminders...)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                maxLength={200}
                className="text-sm"
              />
              <Button 
                size="sm" 
                onClick={handleAddNote}
                disabled={isAdding || !newNote.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Notes List */}
          {classNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No notes yet
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {classNotes.map((note) => (
                <div 
                  key={note.id} 
                  className="flex items-start justify-between gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{note.note}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(note.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {isStudent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this note.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              await deleteClassNote(note.id);
                              toast({ title: "Note deleted" });
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for class cards
interface ClassNotesCompactProps {
  classId: string;
  notes: StudentDataClassNote[];
  isStudent: boolean;
  addClassNote: (note: { classId: string; note: string }) => Promise<void>;
  deleteClassNote: (id: string) => Promise<void>;
}

export function ClassNotesCompact({ 
  classId, 
  notes, 
  isStudent, 
  addClassNote, 
  deleteClassNote 
}: ClassNotesCompactProps) {
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const classNotes = notes
    .filter(n => n.classId === classId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayNotes = showAll ? classNotes : classNotes.slice(0, 2);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      setIsAdding(true);
      await addClassNote({ classId, note: newNote.trim() });
      setNewNote("");
      toast({ title: "Note added!" });
    } catch {
      toast({ title: "Failed to add note", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Quick Add */}
      {isStudent && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a quick note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            maxLength={200}
            className="text-sm h-8"
          />
          <Button 
            size="sm" 
            className="h-8"
            onClick={handleAddNote}
            disabled={isAdding || !newNote.trim()}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Notes */}
      {displayNotes.map((note) => (
        <div 
          key={note.id} 
          className="flex items-start justify-between gap-2 text-sm p-2 bg-yellow-500/10 border-l-2 border-yellow-500 rounded-r"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm">{note.note}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(note.createdAt), "MMM d")}
            </p>
          </div>
          {isStudent && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 flex-shrink-0"
              onClick={async () => {
                await deleteClassNote(note.id);
                toast({ title: "Note deleted" });
              }}
            >
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </Button>
          )}
        </div>
      ))}

      {classNotes.length > 2 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show less" : `Show ${classNotes.length - 2} more`}
        </Button>
      )}
    </div>
  );
}
