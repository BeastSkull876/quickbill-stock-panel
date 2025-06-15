
import {
  Home,
  Receipt,
  Package,
  FileText,
  Shield,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Create Invoice",
    url: "/create-invoice",
    icon: Receipt,
  },
  {
    title: "Stock Management",
    url: "/stock-management",
    icon: Package,
  },
  {
    title: "Invoice List",
    url: "/invoices",
    icon: FileText,
  },
]

export function AppSidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const adminItems = isAdmin ? [
    {
      title: "Admin Panel",
      url: "/admin",
      icon: Shield,
    },
  ] : []

  const allItems = [...items, ...adminItems]

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Vicky's Cafe</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 border-t">
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600">
              Logged in as: {user?.email}
            </div>
            <div className="text-xs text-gray-500">
              Role: {user?.role}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          <div className="mt-4 text-xs text-gray-400 text-center">
            Made by Aarav
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
