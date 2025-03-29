import type React from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { UserNav } from "@/components/dashboard/user-nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />

      <div className="flex-1 ml-20 md:ml-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(15,23,42,0.8)] backdrop-blur-md px-4">
          <div className="flex flex-1 items-center justify-end">
            <UserNav user={session.user} />
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}

