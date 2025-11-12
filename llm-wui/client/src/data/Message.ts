export interface Attachment {
  id: string;
  name: string;
  file: string;
  size?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

export const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm an AI assistant. How can I help you today?",
  },
  {
    id: "2",
    role: "user",
    content: "Can you explain what makes a good user interface?",
  },
  {
    id: "3",
    role: "assistant",
    content: "A good user interface should be:\n\n1. **Intuitive** - Users should understand how to use it without extensive instruction\n2. **Consistent** - Similar elements should behave in similar ways\n3. **Responsive** - Provide immediate feedback to user actions\n4. **Accessible** - Usable by people with diverse abilities\n5. **Efficient** - Allow users to accomplish tasks quickly\n6. **Aesthetic** - Visually pleasing while maintaining functionality\n\nThe best interfaces feel invisible - they help users achieve their goals without getting in the way.",
  },
];
