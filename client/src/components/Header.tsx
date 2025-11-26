import { User, Menu, LogOut, Settings as SettingsIcon, LayoutDashboard, Wallet, Gift, Sparkles, X, ShoppingCart, Heart, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const isCustomer = user?.roles?.includes('customer');
  const isBusiness = user?.roles?.includes('business') || user?.roles?.includes('salon_owner');

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Fetch cart count for badge
  const { data: cartData } = useQuery({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated && isCustomer,
  });

  // Fetch wishlist count for badge
  const { data: wishlistData } = useQuery({
    queryKey: ['/api/wishlist'],
    enabled: isAuthenticated && isCustomer,
  });

  const cartItemsCount = (cartData as any)?.data?.cart?.items?.length || 0;
  const wishlistItemsCount = (wishlistData as any)?.data?.wishlist?.length || 0;

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer hover-elevate px-3 py-2 rounded-md transition-all">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                SalonHub
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button 
                variant="ghost" 
                className="text-foreground"
                data-testid="link-home"
              >
                Home
              </Button>
            </Link>
            <Link href="/shop">
              <Button 
                variant="ghost" 
                className="text-foreground"
                data-testid="link-shop"
              >
                <Store className="h-4 w-4 mr-2" />
                Shop
              </Button>
            </Link>
            <Link href="/all-offers">
              <Button 
                variant="ghost"
                className="bg-green-600/10 text-green-700 dark:text-green-400 hover:bg-green-600/20"
                data-testid="link-all-offers"
              >
                <Gift className="h-4 w-4 mr-2" />
                Offers
              </Button>
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* E-commerce Icons - Always visible */}
            {isAuthenticated && isCustomer && (
              <div className="flex items-center gap-2">
                <Link href="/wishlist">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative"
                    data-testid="button-wishlist"
                  >
                    <Heart className="h-5 w-5" />
                    {wishlistItemsCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        variant="destructive"
                      >
                        {wishlistItemsCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative"
                    data-testid="button-cart"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemsCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {cartItemsCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </div>
            )}

            {!isAuthenticated && (
              <>
                {/* Business CTA - Hidden on mobile, shown on desktop */}
                <Link href="/join/business">
                  <Button 
                    variant="outline" 
                    className="hidden md:inline-flex"
                    data-testid="button-list-salon"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    List Your Salon
                  </Button>
                </Link>

                {/* Auth buttons - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/join">
                    <Button variant="ghost" data-testid="button-signup">
                      Sign up
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button data-testid="button-login">
                      Log in
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {isAuthenticated && (
              <>
                {/* Wallet button for customers - desktop only */}
                {isCustomer && (
                  <Link href="/wallet">
                    <Button 
                      variant="outline" 
                      className="hidden md:inline-flex"
                      data-testid="button-wallet"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Wallet
                    </Button>
                  </Link>
                )}

                {/* User Menu - desktop only */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="relative h-9 w-9 rounded-full"
                        data-testid="button-user-menu"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || 'User'} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user?.firstName && user?.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user?.firstName || user?.email
                            }
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {isCustomer && (
                        <DropdownMenuItem onClick={() => setLocation('/customer/dashboard')} data-testid="menu-dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                      )}
                      
                      {isBusiness && (
                        <DropdownMenuItem onClick={() => setLocation('/business/dashboard')} data-testid="menu-business-dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Business Dashboard
                        </DropdownMenuItem>
                      )}
                      
                      {isCustomer && (
                        <>
                          <DropdownMenuItem onClick={() => setLocation('/wallet')} data-testid="menu-wallet">
                            <Wallet className="mr-2 h-4 w-4" />
                            Wallet
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setLocation('/orders')} data-testid="menu-orders">
                            <Package className="mr-2 h-4 w-4" />
                            My Orders
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation('/wishlist')} data-testid="menu-wishlist">
                            <Heart className="mr-2 h-4 w-4" />
                            Wishlist
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation('/cart')} data-testid="menu-cart">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Shopping Cart
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        if (isCustomer) {
                          setLocation('/customer/dashboard');
                        } else if (isBusiness) {
                          const orgId = user?.orgMemberships?.[0]?.orgId;
                          if (orgId) {
                            setLocation('/business/settings/' + orgId);
                          } else {
                            setLocation('/business/dashboard');
                          }
                        }
                      }} data-testid="menu-settings">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  data-testid="button-mobile-menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      SalonHub
                    </span>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-4 mt-6">
                  {isAuthenticated && (
                    <>
                      {/* User Profile in Mobile */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || 'User'} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="font-medium text-sm">
                            {user?.firstName && user?.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user?.firstName || user?.email
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Navigation Links */}
                  <div className="flex flex-col gap-2">
                    <Link href="/" onClick={closeMobileMenu}>
                      <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-home">
                        Home
                      </Button>
                    </Link>
                    <Link href="/shop" onClick={closeMobileMenu}>
                      <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-shop">
                        <Store className="mr-2 h-4 w-4" />
                        Shop
                      </Button>
                    </Link>
                    <Link href="/all-offers" onClick={closeMobileMenu}>
                      <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-offers">
                        <Gift className="mr-2 h-4 w-4" />
                        Offers
                      </Button>
                    </Link>

                    {isAuthenticated && (
                      <>
                        <Separator className="my-2" />
                        {isCustomer && (
                          <>
                            <Link href="/customer/dashboard" onClick={closeMobileMenu}>
                              <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                              </Button>
                            </Link>
                            <Link href="/wallet" onClick={closeMobileMenu}>
                              <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-wallet">
                                <Wallet className="mr-2 h-4 w-4" />
                                Wallet
                              </Button>
                            </Link>
                            <Separator className="my-2" />
                            <Link href="/orders" onClick={closeMobileMenu}>
                              <Button variant="ghost" className="w-full justify-start relative" data-testid="mobile-link-orders">
                                <Package className="mr-2 h-4 w-4" />
                                My Orders
                              </Button>
                            </Link>
                            <Link href="/wishlist" onClick={closeMobileMenu}>
                              <Button variant="ghost" className="w-full justify-start relative" data-testid="mobile-link-wishlist">
                                <Heart className="mr-2 h-4 w-4" />
                                Wishlist
                                {wishlistItemsCount > 0 && (
                                  <Badge className="ml-auto" variant="destructive">
                                    {wishlistItemsCount}
                                  </Badge>
                                )}
                              </Button>
                            </Link>
                            <Link href="/cart" onClick={closeMobileMenu}>
                              <Button variant="ghost" className="w-full justify-start relative" data-testid="mobile-link-cart">
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Cart
                                {cartItemsCount > 0 && (
                                  <Badge className="ml-auto">
                                    {cartItemsCount}
                                  </Badge>
                                )}
                              </Button>
                            </Link>
                          </>
                        )}
                        {isBusiness && (
                          <>
                            <Link href="/business/dashboard" onClick={closeMobileMenu}>
                              <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-business-dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Business Dashboard
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start" 
                              onClick={() => {
                                const orgId = user?.orgMemberships?.[0]?.orgId;
                                if (orgId) {
                                  setLocation('/business/settings/' + orgId);
                                } else {
                                  setLocation('/business/dashboard');
                                }
                                closeMobileMenu();
                              }}
                              data-testid="mobile-button-business-settings"
                            >
                              <SettingsIcon className="mr-2 h-4 w-4" />
                              Settings
                            </Button>
                          </>
                        )}
                        {isCustomer && (
                          <Link href="/customer/dashboard" onClick={closeMobileMenu}>
                            <Button variant="ghost" className="w-full justify-start" data-testid="mobile-button-customer-settings">
                              <SettingsIcon className="mr-2 h-4 w-4" />
                              Settings
                            </Button>
                          </Link>
                        )}
                        <Separator className="my-2" />
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-destructive hover:text-destructive" 
                          onClick={() => {
                            handleLogout();
                            closeMobileMenu();
                          }}
                          data-testid="mobile-button-logout"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Auth Actions */}
                  {!isAuthenticated ? (
                    <div className="flex flex-col gap-2">
                      <Link href="/join/business" onClick={closeMobileMenu}>
                        <Button variant="outline" className="w-full" data-testid="mobile-button-list-salon">
                          <Sparkles className="mr-2 h-4 w-4" />
                          List Your Salon
                        </Button>
                      </Link>
                      <Link href="/join" onClick={closeMobileMenu}>
                        <Button variant="outline" className="w-full" data-testid="mobile-button-signup">
                          Sign up
                        </Button>
                      </Link>
                      <Link href="/login" onClick={closeMobileMenu}>
                        <Button className="w-full" data-testid="mobile-button-login">
                          Log in
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      data-testid="mobile-button-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
