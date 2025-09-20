import SalonCard from '../SalonCard';
import salonImage from '@assets/generated_images/Modern_luxury_salon_interior_aa8eed5a.png';

export default function SalonCardExample() {
  //todo: remove mock functionality
  return (
    <div className="max-w-sm">
      <SalonCard
        id="1"
        name="Artisan Theory Salon"
        rating={5.0}
        reviewCount={140}
        location="100 Roosevelt Road, Villa Park"
        category="Hair Salon"
        image={salonImage}
        priceRange="$$"
        openTime="9 PM"
      />
    </div>
  );
}