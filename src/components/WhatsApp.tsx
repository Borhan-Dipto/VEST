'use client';
import { usePathname } from 'next/navigation';

// Floating WhatsApp chat button. On a product page the message mentions that product.
export default function WhatsApp({ number }: { number?: string }) {
  const path = usePathname();
  const n = (number || '').replace(/\D/g, '');
  if (!n || path.startsWith('/admin') || path.startsWith('/invoice') || path.startsWith('/checkout')) return null;
  const product = path.startsWith('/product/') ? decodeURIComponent(path.split('/')[2]).replace(/-/g, ' ').toUpperCase() : '';
  const text = product ? `Hi VEST! I'm interested in ${product}. Is it available?` : 'Hi VEST! I have a question.';
  return (
    <a href={`https://wa.me/${n}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener" aria-label="Chat with VEST on WhatsApp"
      className={`fixed right-4 z-40 flex items-center gap-2 h-12 pl-3 pr-4 rounded-full bg-[#1F8A4C] text-white shadow-lg shadow-black/20 hover:scale-105 transition-transform ${product ? 'bottom-24 md:bottom-6' : 'bottom-5 md:bottom-6'}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
      <span className="text-sm font-medium hidden sm:inline">Chat with us</span>
    </a>
  );
}
