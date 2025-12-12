import { User, Menu, LogOut, Settings as SettingsIcon, LayoutDashboard, Wallet, Gift, Sparkles, X, ShoppingCart, Heart, Package, Store, Calendar, Building2, ChevronDown } from "lucide-react";
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
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const { data: cartData } = useQuery({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated && isCustomer,
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['/api/wishlist'],
    enabled: isAuthenticated && isCustomer,
  });

  const cartItemsCount = (cartData as any)?.data?.cart?.items?.length || 0;
  const wishlistItemsCount = (wishlistData as any)?.data?.wishlist?.length || 0;

  const NavLink = ({ href, children, icon: Icon, highlight }: { href: string; children: React.ReactNode; icon?: any; highlight?: boolean }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <button
          className={`
            relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300
            ${isActive 
              ? 'text-violet-700 bg-violet-50' 
              : highlight 
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
            group
          `}
        >
          <span className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {children}
          </span>
          {isActive && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-600" />
          )}
        </button>
      </Link>
    );
  };

  return (
    <header 
      className={`
        sticky top-0 z-50 transition-all duration-300
        ${scrolled 
          ? 'bg-gradient-to-r from-violet-50/95 via-white/95 to-rose-50/95 backdrop-blur-xl shadow-sm border-b border-violet-100/50' 
          : 'bg-gradient-to-r from-violet-50/80 via-white/80 to-rose-50/80 backdrop-blur-md'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 rounded-xl shadow-lg shadow-violet-200/50 group-hover:shadow-violet-300/50 transition-all group-hover:scale-105">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-violet-900 to-gray-900 bg-clip-text text-transparent">StudioHub</h1>
                <span className="text-[10px] font-medium text-violet-600 -mt-0.5 tracking-widest uppercase hidden sm:block">
                  Premium Services
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-gradient-to-r from-violet-50/90 via-white/90 to-rose-50/90 backdrop-blur-sm px-2 py-1.5 rounded-full border border-violet-100/50">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/salons" icon={Building2}>Studios</NavLink>
            <NavLink href="/events" icon={Calendar}>Events</NavLink>
            <NavLink href="/shop" icon={Store}>Shop</NavLink>
            <NavLink href="/all-offers" icon={Gift} highlight>Offers</NavLink>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* E-commerce Icons */}
            {isAuthenticated && isCustomer && (
              <div className="hidden sm:flex items-center gap-1">
                <Link href="/wishlist">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative h-9 w-9 rounded-full hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    {wishlistItemsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-pink-500 text-white rounded-full">
                        {wishlistItemsCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative h-9 w-9 rounded-full hover:bg-violet-50 hover:text-violet-600 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-violet-600 text-white rounded-full">
                        {cartItemsCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            )}

            {!isAuthenticated && (
              <>
                {/* Business CTA */}
                <Link href="/join/business">
                  <Button 
                    variant="ghost" 
                    className="hidden lg:inline-flex text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-full px-4 gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    List Your Studio
                  </Button>
                </Link>

                {/* Auth buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/join">
                    <Button 
                      variant="ghost" 
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 rounded-full px-4"
                    >
                      Sign up
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button 
                      className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-full px-6 shadow-lg shadow-violet-200/50 hover:shadow-violet-300/50 transition-all hover:scale-105"
                    >
                      Log in
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {isAuthenticated && (
              <>
                {/* Wallet button for customers */}
                {isCustomer && (
                  <Link href="/wallet">
                    <Button 
                      variant="ghost" 
                      className="hidden lg:inline-flex text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-full px-4 gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      Wallet
                    </Button>
                  </Link>
                )}

                {/* User Menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="relative h-10 gap-2 pl-1 pr-3 rounded-full hover:bg-gray-50 transition-all"
                      >
                        <Avatar className="h-8 w-8 ring-2 ring-violet-100">
                          <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || 'User'} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-semibold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-xl shadow-xl border-gray-100 p-1" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal px-3 py-2">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {user?.firstName && user?.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user?.firstName || user?.email
                            }
                          </p>
                          <p className="text-xs text-gray-500">
                            {user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-1" />
                      
                      {isCustomer && (
                        <DropdownMenuItem 
                          onClick={() => setLocation('/customer/dashboard')} 
                          className="rounded-lg cursor-pointer"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4 text-gray-500" />
                          Dashboard
                        </DropdownMenuItem>
                      )}
                      
                      {isBusiness && (
                        <DropdownMenuItem 
                          onClick={() => setLocation('/business/dashboard')} 
                          className="rounded-lg cursor-pointer"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4 text-gray-500" />
                          Business Dashboard
                        </DropdownMenuItem>
                      )}
                      
                      {isCustomer && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => setLocation('/wallet')} 
                            className="rounded-lg cursor-pointer"
                          >
                            <Wallet className="mr-2 h-4 w-4 text-gray-500" />
                            Wallet
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            onClick={() => setLocation('/orders')} 
                            className="rounded-lg cursor-pointer"
                          >
                            <Package className="mr-2 h-4 w-4 text-gray-500" />
                            My Orders
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setLocation('/wishlist')} 
                            className="rounded-lg cursor-pointer"
                          >
                            <Heart className="mr-2 h-4 w-4 text-gray-500" />
                            Wishlist
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setLocation('/cart')} 
                            className="rounded-lg cursor-pointer"
                          >
                            <ShoppingCart className="mr-2 h-4 w-4 text-gray-500" />
                            Shopping Cart
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem 
                        onClick={() => {
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
                        }} 
                        className="rounded-lg cursor-pointer"
                      >
                        <SettingsIcon className="mr-2 h-4 w-4 text-gray-500" />
                        Settings
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem 
                        onClick={handleLogout} 
                        className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
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
                  className="lg:hidden h-9 w-9 rounded-full hover:bg-gray-100"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[400px] p-0">
                <div className="p-6">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2.5">
                      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 rounded-xl">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-violet-900 bg-clip-text text-transparent">
                        StudioHub
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                </div>
                
                <div className="flex flex-col h-full">
                  {isAuthenticated && (
                    <div className="px-6 pb-4">
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100">
                        <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                          <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || 'User'} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="font-semibold text-gray-900">
                            {user?.firstName && user?.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user?.firstName || user?.email
                            }
                          </p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-6 flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
                      
                      <Link href="/" onClick={closeMobileMenu}>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                          <span className="font-medium">Home</span>
                        </button>
                      </Link>
                      <Link href="/salons" onClick={closeMobileMenu}>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Studios</span>
                        </button>
                      </Link>
                      <Link href="/events" onClick={closeMobileMenu}>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Events</span>
                        </button>
                      </Link>
                      <Link href="/shop" onClick={closeMobileMenu}>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                          <Store className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Shop</span>
                        </button>
                      </Link>
                      <Link href="/all-offers" onClick={closeMobileMenu}>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left">
                          <Gift className="h-4 w-4" />
                          <span className="font-medium">Offers</span>
                        </button>
                      </Link>

                      {isAuthenticated && (
                        <>
                          <Separator className="my-3" />
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                          
                          {isCustomer && (
                            <>
                              <Link href="/customer/dashboard" onClick={closeMobileMenu}>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                  <LayoutDashboard className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Dashboard</span>
                                </button>
                              </Link>
                              <Link href="/wallet" onClick={closeMobileMenu}>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                  <Wallet className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Wallet</span>
                                </button>
                              </Link>
                              <Link href="/orders" onClick={closeMobileMenu}>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                  <Package className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">My Orders</span>
                                </button>
                              </Link>
                              <Link href="/wishlist" onClick={closeMobileMenu}>
                                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                  <span className="flex items-center gap-3">
                                    <Heart className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">Wishlist</span>
                                  </span>
                                  {wishlistItemsCount > 0 && (
                                    <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                                      {wishlistItemsCount}
                                    </Badge>
                                  )}
                                </button>
                              </Link>
                              <Link href="/cart" onClick={closeMobileMenu}>
                                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                  <span className="flex items-center gap-3">
                                    <ShoppingCart className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">Cart</span>
                                  </span>
                                  {cartItemsCount > 0 && (
                                    <Badge className="bg-violet-100 text-violet-700">
                                      {cartItemsCount}
                                    </Badge>
                                  )}
                                </button>
                              </Link>
                            </>
                          )}
                          
                          {isBusiness && (
                            <>
                              <Link href="/business/dashboard" onClick={closeMobileMenu}>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                  <LayoutDashboard className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Business Dashboard</span>
                                </button>
                              </Link>
                              <button 
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                onClick={() => {
                                  const orgId = user?.orgMemberships?.[0]?.orgId;
                                  if (orgId) {
                                    setLocation('/business/settings/' + orgId);
                                  } else {
                                    setLocation('/business/dashboard');
                                  }
                                  closeMobileMenu();
                                }}
                              >
                                <SettingsIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">Settings</span>
                              </button>
                            </>
                          )}
                          
                          {isCustomer && (
                            <Link href="/customer/dashboard" onClick={closeMobileMenu}>
                              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                <SettingsIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">Settings</span>
                              </button>
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    {!isAuthenticated ? (
                      <div className="flex flex-col gap-3">
                        <Link href="/join/business" onClick={closeMobileMenu}>
                          <Button variant="outline" className="w-full rounded-xl h-11 font-medium">
                            <Sparkles className="mr-2 h-4 w-4" />
                            List Your Studio
                          </Button>
                        </Link>
                        <div className="flex gap-2">
                          <Link href="/join" onClick={closeMobileMenu} className="flex-1">
                            <Button variant="outline" className="w-full rounded-xl h-11 font-medium">
                              Sign up
                            </Button>
                          </Link>
                          <Link href="/login" onClick={closeMobileMenu} className="flex-1">
                            <Button className="w-full rounded-xl h-11 font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700">
                              Log in
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full rounded-xl h-11 font-medium text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" 
                        onClick={() => {
                          handleLogout();
                          closeMobileMenu();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
