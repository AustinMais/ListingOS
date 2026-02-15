import ChatBot from '@/components/ChatBot';
import { getClientName } from '@/lib/config';

export default function EmbedPage() {
  return (
    <div className="min-h-screen min-w-full bg-transparent font-sans">
      <ChatBot clientName={getClientName()} floating />
    </div>
  );
}
