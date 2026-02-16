import ChatBot from '@/components/ChatBot';
import DemoGate from '@/components/DemoGate';
import RealtorBackdrop from '@/components/RealtorBackdrop';

export default function Home() {
  return (
    <DemoGate>
      <div className="relative min-h-screen font-sans">
        <RealtorBackdrop />
        <ChatBot floating />
      </div>
    </DemoGate>
  );
}
