import Link from 'next/link';

export default function QuickLinks({ clerkId }: { clerkId: string }) {
  return (
    <section>
      <h3 className="font-semibold text-lg mb-2">Quick Links</h3>
      <Link href={`/users/${clerkId}/gigs`} className="text-emerald-600 hover:underline">
        View My Gigs
      </Link>
    </section>
  );
}
