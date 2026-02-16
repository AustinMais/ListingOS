import ChatBot from '@/components/ChatBot';
import DemoGate from '@/components/DemoGate';

export default function EmbedPage() {
  return (
    <DemoGate>
      <div className="min-h-screen min-w-full bg-transparent font-sans">
        <ChatBot floating />
      </div>
    </DemoGate>
  );
}
