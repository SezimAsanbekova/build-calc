import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Панель администратора — BuildCalc AI',
};

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {children}
    </div>
  );
}
