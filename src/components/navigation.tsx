"use client";

import { Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlaceholderLogo } from "@/components/ui/placeholder-logo";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();

  const navItems = [
    { label: t("titleHomePage"), to: "/" },
    { label: "Projects", to: "/projects" },
  ];

  const navigationContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useClickOutside(navigationContainerRef, () => {
    if (isMobile && isMenuOpen) {
      setIsMenuOpen(false);
    }
  });

  return (
    // To make this a sticky navigation, you can add `sticky top-0 z-50` classes to the parent div
    <div
      className="bg-background w-full border-b py-3.5 transition-all ease-in-out"
      role="navigation"
      aria-label="Website top navigation"
      ref={navigationContainerRef}
    >
      <div className="relative flex flex-col justify-between gap-x-5 px-4 md:flex-row lg:gap-x-9">
        {/* Logo and Toggle Mobile Nav Button */}
        <div className="flex items-center justify-between">
          {/* Replace with actual logo */}
          <a href="/" aria-label="Go to home page">
            <PlaceholderLogo />
          </a>

          {/* Toggle Mobile Nav Button - Visible on screen sizes < 768px */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-label={
              isMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
          >
            {isMenuOpen ? (
              <X className="animate-in zoom-in-50" />
            ) : (
              <Menu className="animate-in zoom-in-50" />
            )}
          </Button>
        </div>

        {/* Desktop Navigation - Visible on screen sizes ≥ 768px */}
        <div className="hidden flex-1 justify-between gap-4 md:flex md:items-center">
          <nav className="ml-auto flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = !!matchRoute({ to: item.to, fuzzy: true });
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "hover:bg-accent/50 hover:text-accent-foreground rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    isActive && "bg-accent text-accent-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation - Visible on screen sizes < 768px */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out md:hidden",
            isMenuOpen
              ? "grid-rows-[1fr] pt-5 opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0",
          )}
        >
          <div
            className={cn(isMenuOpen ? "overflow-visible" : "overflow-hidden")}
            inert={!isMenuOpen || undefined}
            aria-hidden={!isMenuOpen}
          >
            <div className="flex flex-col gap-9">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = !!matchRoute({ to: item.to, fuzzy: true });
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "hover:bg-accent/50 hover:text-accent-foreground rounded-md px-2 py-3.5 text-base font-medium transition-colors",
                        isActive && "bg-accent text-accent-foreground",
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
