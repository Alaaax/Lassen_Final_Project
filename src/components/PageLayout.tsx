/**
 * PageLayout - تخطيط الصفحات الداخلية
 * يشمل الشريط الجانبي وزر التبديل
 */
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, title }) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* الشريط العلوي */}
          <header className="h-14 flex items-center border-b border-border/50 px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger className="text-foreground/60 hover:text-primary" />
            {title && (
              <h1 className="font-display text-lg text-foreground/80 mr-4">
                {title}
              </h1>
            )}
          </header>
          {/* محتوى الصفحة */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PageLayout;
