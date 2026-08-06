export interface Notification {
  id: number;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}