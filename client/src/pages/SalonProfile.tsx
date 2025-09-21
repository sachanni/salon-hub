import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Phone, Star, Users, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function SalonProfile() {
  const { salonId } = useParams();

  // Fetch salon details
  const { data: salon, isLoading: isSalonLoading } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
  });

  // Fetch salon services
  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
  });

  // Fetch salon staff
  const { data: staff, isLoading: isStaffLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    enabled: !!salonId,
  });

  // Fetch media assets
  const { data: mediaAssets } = useQuery({
    queryKey: ['/api/salons', salonId, 'media-assets'],
    enabled: !!salonId,
  });

  if (isSalonLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading salon profile...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Salon Not Found</h1>
          <p className="text-muted-foreground mb-6">The salon you're looking for doesn't exist or isn't published yet.</p>
          <Button asChild>
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const heroImage = mediaAssets?.find(asset => asset.category === 'hero')?.fileUrl || 
                   mediaAssets?.[0]?.fileUrl || 
                   'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80';

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="container mx-auto px-4 pt-4">
        <Button variant="ghost" asChild data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={heroImage}
          alt={salon.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-semibold" data-testid="text-salon-rating">
                {salon.rating || '5.0'}
              </span>
              <span className="text-white/80">({salon.reviewCount || 0} reviews)</span>
            </div>
            <h1 className="text-4xl font-bold mb-2" data-testid="text-salon-name">{salon.name}</h1>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="text-lg" data-testid="text-salon-location">
                {salon.address}, {salon.city}, {salon.state} {salon.zipCode}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About {salon.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4" data-testid="text-salon-description">
                  {salon.description || `Welcome to ${salon.name}, your premier destination for beauty and wellness services. Our experienced team is dedicated to providing exceptional service in a relaxing and professional environment.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{salon.category || 'Beauty & Wellness'}</Badge>
                  <Badge variant="outline">{salon.priceRange || '$$'}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card>
              <CardHeader>
                <CardTitle>Our Services</CardTitle>
              </CardHeader>
              <CardContent>
                {isServicesLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  </div>
                ) : services && services.length > 0 ? (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex justify-between items-start border-b pb-4 last:border-b-0" data-testid={`service-${service.id}`}>
                        <div className="flex-1">
                          <h4 className="font-semibold" data-testid={`text-service-name-${service.id}`}>{service.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`text-service-description-${service.id}`}>
                            {service.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground" data-testid={`text-service-duration-${service.id}`}>
                              {service.duration} minutes
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-lg" data-testid={`text-service-price-${service.id}`}>
                            ₹{service.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Services will be available soon.</p>
                )}
              </CardContent>
            </Card>

            {/* Staff Section */}
            <Card>
              <CardHeader>
                <CardTitle>Our Team</CardTitle>
              </CardHeader>
              <CardContent>
                {isStaffLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-muted rounded-full animate-pulse"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : staff && staff.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {staff.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3" data-testid={`staff-${member.id}`}>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-staff-name-${member.id}`}>{member.name}</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-staff-role-${member.id}`}>
                            {member.role || 'Specialist'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Our team information will be available soon.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card>
              <CardHeader>
                <CardTitle>Book an Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg" data-testid="button-book-appointment">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
                <Separator />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Open {salon.openTime || '9:00 AM'} - {salon.closeTime || '9:00 PM'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{salon.phone || 'Contact information available upon booking'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground" data-testid="text-contact-address">
                    {salon.address}<br />
                    {salon.city}, {salon.state} {salon.zipCode}
                  </p>
                </div>
                {salon.phone && (
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground" data-testid="text-contact-phone">{salon.phone}</p>
                  </div>
                )}
                {salon.email && (
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground" data-testid="text-contact-email">{salon.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}