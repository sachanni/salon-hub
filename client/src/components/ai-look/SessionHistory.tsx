import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Search, Calendar, Sparkles, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface SessionHistoryProps {
  salonId: string;
}

export default function SessionHistory({ salonId }: SessionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['/api/premium/ai-look/sessions', salonId, page],
    queryFn: async () => {
      const response = await fetch(`/api/premium/ai-look/sessions/${salonId}?page=${page}&limit=20`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load sessions');
      return response.json();
    },
    enabled: !!salonId,
  });

  const sessions = sessionsData?.sessions || [];
  const filteredSessions = sessions.filter((session: any) =>
    session.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="p-4 bg-white/80 backdrop-blur-sm border-purple-100 h-[calc(100vh-12rem)] flex flex-col">
      <div className="space-y-4 flex-shrink-0">
        {/* Header */}
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">Session History</h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 mt-4 -mx-4 px-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchQuery ? 'No sessions found' : 'No sessions yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session: any) => (
              <button
                key={session.id}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {session.customerName}
                    </h4>
                    {session.selectedLookName && (
                      <p className="text-xs text-purple-600 truncate flex items-center gap-1 mt-1">
                        <Sparkles className="h-3 w-3" />
                        {session.selectedLookName}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                </div>

                {session.totalLooks > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      {session.totalLooks} look{session.totalLooks > 1 ? 's' : ''} created
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Load More */}
      {sessionsData?.pagination?.hasMore && (
        <div className="pt-3 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setPage(page + 1)}
          >
            Load More
          </Button>
        </div>
      )}
    </Card>
  );
}
