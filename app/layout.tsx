import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Codex Pets Studio', description: 'Create an expressive desktop pet from captured facial expressions or an original character.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
