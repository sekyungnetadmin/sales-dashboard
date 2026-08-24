import ConsentGate from '@/components/ConsentGate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ConsentGate>{children}</ConsentGate>;
}