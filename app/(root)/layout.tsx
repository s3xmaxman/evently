import Footer from "@/components/shared/Footer"
import Header from "@/components/shared/Header"
import { ClerkProvider } from "@clerk/nextjs"




export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen">
      <ClerkProvider>
        <Header />
          <main className="flex-1">{children}</main>
        <Footer />
      </ClerkProvider>
   </div>
  )
}
