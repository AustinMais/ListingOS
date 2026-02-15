import ChatBot from '@/components/ChatBot';
import { getClientName } from '@/lib/config';

export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      <ChatBot clientName={getClientName()} floating />
    </div>
  );
}
