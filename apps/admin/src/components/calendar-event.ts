export interface CalendarEvent {
  id: string;
  title: string;
  subtitle?: string;
  timeLabel?: string;
  start: string;
  end?: string;
  color: string;
  requestId: string;
}
