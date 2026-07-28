"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, Menu, Search, User, LayoutDashboard, Shield, GraduationCap, LogOut } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/app/actions/auth"

interface HeaderProps {
  user?: {
    id: string
    email: string
    role: string
  } | null
}

export function Header({ user }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-600">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-indigo-600">LearnHub</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/courses" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
            Courses
          </Link>
          <Link href="/categories" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
            Categories
          </Link>
          <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {user.role === "admin" && (
                <Button asChild variant="ghost">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              {user.role === "instructor" && (
                <Button asChild variant="ghost">
                  <Link href="/instructor/dashboard">Teach</Link>
                </Button>
              )}
              <Button asChild variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account menu">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "instructor" && (
                    <DropdownMenuItem asChild>
                      <Link href="/instructor/dashboard">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Instructor
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <form action={signOut}>
                    <button type="submit" className="w-full">
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" asChild>
                        <span>
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </span>
                      </DropdownMenuItem>
                    </button>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 pt-8">
                <Link href="/courses" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                  Courses
                </Link>
                <Link href="/categories" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                  Categories
                </Link>
                <Link href="/about" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                  About
                </Link>
                {user && (
                  <>
                    <Link href="/dashboard" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                      Dashboard
                    </Link>
                    {user.role === "instructor" && (
                      <Link
                        href="/instructor/dashboard"
                        className="text-lg font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        Teach
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link href="/admin" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                        Admin
                      </Link>
                    )}
                    <Link href="/profile" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                      Profile
                    </Link>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="flex items-center gap-2 text-lg font-medium text-red-600"
                        onClick={() => setIsOpen(false)}
                      >
                        <LogOut className="h-5 w-5" />
                        Log out
                      </button>
                    </form>
                  </>
                )}
                {!user && (
                  <>
                    <Button asChild className="mt-4">
                      <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/auth/sign-up" onClick={() => setIsOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
