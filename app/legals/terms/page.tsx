// app/legals/terms/page.tsx
import TermsOfUse from '@/components/legal/TermsOfUse'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pb-24 md:pb-6">
        <TermsOfUse />
      </main>
      <BottomNav />
    </div>
  )
}