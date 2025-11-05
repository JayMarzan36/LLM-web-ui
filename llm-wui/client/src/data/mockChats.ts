export interface Chat {
  id: string;
  title: string;
  timestamp: Date;
}

export const mockChats: Chat[] = [
  {
    id: "1",
    title: "UI Design Principles",
    timestamp: new Date("2025-11-03T10:30:00"),
  },
  {
    id: "2",
    title: "React Best Practices",
    timestamp: new Date("2025-11-02T15:45:00"),
  },
  {
    id: "3",
    title: "API Integration Guide",
    timestamp: new Date("2025-11-01T09:20:00"),
  },
  {
    id: "4",
    title: "TypeScript Tips",
    timestamp: new Date("2025-10-31T14:10:00"),
  },
];
