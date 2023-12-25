import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"
import { Separator } from "@radix-ui/react-separator"
import Image from "next/image"
import NavItems from "./NavItems"

const MobileNav = () => {
  return (
    <nav className="md:hidden">
        <Sheet>
            <SheetTrigger className="align-middle">
                <Image
                    src="/assets/icons/menu.svg"
                    alt="menu"
                    width={24}
                    height={24}
                    className="cursor-pointer" 
                />
            </SheetTrigger>
            <SheetContent className="flex flex-col gap-6 bg-white">
                <Image 
                    src="/assets/images/logo.svg"
                    alt="logo"
                    width={128}
                    height={38}
                />
                <Separator className="border-grey-50 border" />
                <NavItems />
            </SheetContent>
        </Sheet>
    </nav>
  )
}

export default MobileNav