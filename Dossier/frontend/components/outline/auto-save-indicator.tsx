'use client';

interface AutoSaveIndicatorProps {
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 10) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  return 'earlier';
}

export function AutoSaveIndicator({ hasUnsavedChanges, lastSaved }: AutoSaveIndicatorProps) {
  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
        <span className="font-mono text-xs text-muted-foreground">Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-1.5 w-1.5 rounded-full bg-brand" />
        <span className="font-mono text-xs text-muted-foreground">Saved {formatRelativeTime(lastSaved)}</span>
      </div>
    );
  }

  return null;
}
