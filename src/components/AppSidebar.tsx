
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Receipt,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Create Invoice",
    url: "/create-invoice",
    icon: FileText,
  },
  {
    title: "Stock Management",
    url: "/stock-management",
    icon: Package,
  },
  {
    title: "Invoice List",
    url: "/invoices",
    icon: Receipt,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="border-r bg-white shadow-sm">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Vicky's Cafe</h2>
          <SidebarTrigger className="lg:hidden">
            <ChevronRight className="h-4 w-4" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={cn(
                      "w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-blue-50 hover:text-blue-700",
                      location.pathname === item.url 
                        ? "bg-blue-100 text-blue-700 shadow-sm" 
                        : "text-gray-700"
                    )}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <p className="text-xs text-gray-400 text-center">Made by Aarav</p>
      </SidebarFooter>
    </Sidebar>
  );
}
