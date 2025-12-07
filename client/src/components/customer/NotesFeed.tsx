import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Pin,
  Calendar,
  Scissors,
  AlertCircle,
  Heart,
  FileText,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title?: string;
  content: string;
  noteType: string;
  serviceName?: string;
  createdAt: string;
  isPinned?: boolean;
}

interface NotesFeedProps {
  notes: Note[];
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  maxItems?: number;
  showExpandButton?: boolean;
  onShowMore?: () => void;
  className?: string;
}

const NOTE_TYPE_CONFIG: Record<
  string,
  { icon: any; label: string; bgColor: string; textColor: string }
> = {
  general: {
    icon: FileText,
    label: "Note",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
  },
  appointment: {
    icon: Calendar,
    label: "Appointment",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  formula: {
    icon: Sparkles,
    label: "Formula",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
  compliment: {
    icon: Heart,
    label: "Compliment",
    bgColor: "bg-pink-100",
    textColor: "text-pink-700",
  },
  complaint: {
    icon: AlertCircle,
    label: "Feedback",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
  },
};

export function NotesFeed({
  notes,
  loading = false,
  error = false,
  errorMessage = "Unable to load notes. Please try again later.",
  emptyMessage = "No notes from your stylist yet",
  maxItems,
  showExpandButton = true,
  onShowMore,
  className,
}: NotesFeedProps) {
  const [expanded, setExpanded] = useState(false);

  const displayNotes = maxItems && !expanded ? notes.slice(0, maxItems) : notes;
  const hasMore = maxItems && notes.length > maxItems && !expanded;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-gray-500 text-sm">{errorMessage}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
        <p className="text-gray-400 text-xs mt-1">
          Your stylist's notes about your preferences will appear here
        </p>
      </div>
    );
  }

  const pinnedNotes = displayNotes.filter((n) => n.isPinned);
  const regularNotes = displayNotes.filter((n) => !n.isPinned);

  const renderNote = (note: Note, isPinned: boolean = false) => {
    const config = NOTE_TYPE_CONFIG[note.noteType] || NOTE_TYPE_CONFIG.general;
    const Icon = config.icon;

    return (
      <Card
        key={note.id}
        className={cn(
          "overflow-hidden transition-all duration-200 hover:shadow-md",
          isPinned && "border-purple-200 bg-purple-50/30"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                config.bgColor
              )}
            >
              <Icon className={cn("w-5 h-5", config.textColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {note.title && (
                    <h4 className="font-medium text-gray-900 text-sm">
                      {note.title}
                    </h4>
                  )}
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", config.bgColor, config.textColor)}
                  >
                    {config.label}
                  </Badge>
                  {isPinned && (
                    <Badge
                      variant="outline"
                      className="text-xs border-purple-300 text-purple-600"
                    >
                      <Pin className="w-3 h-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDistanceToNow(new Date(note.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
              {note.serviceName && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Scissors className="w-3 h-3" />
                  <span>{note.serviceName}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          {pinnedNotes.map((note) => renderNote(note, true))}
        </div>
      )}

      {pinnedNotes.length > 0 && regularNotes.length > 0 && (
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-xs text-gray-400">
              Other notes
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {regularNotes.map((note) => renderNote(note, false))}
      </div>

      {hasMore && showExpandButton && (
        <div className="pt-2">
          <Button
            variant="ghost"
            className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={() => {
              if (onShowMore) {
                onShowMore();
              } else {
                setExpanded(true);
              }
            }}
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Show {notes.length - (maxItems || 0)} more notes
          </Button>
        </div>
      )}
    </div>
  );
}
