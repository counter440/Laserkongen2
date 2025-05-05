import Link from 'next/link';
import ProductCard from './ProductCard';

// Sample data, in a real app this would come from an API
const featuredProducts = [
  {
    id: '1',
    name: 'Custom Phone Stand',
    description: 'A customizable phone stand that can be adjusted to any angle.',
    price: 24.99,
    image: '/images/phone-stand.jpg',
    category: '3d-printing'
  },
  {
    id: '2',
    name: 'Personalized Keychain',
    description: 'Custom laser engraved keychain with your name or initials.',
    price: 14.99,
    image: '/images/keychain.jpg',
    category: 'laser-engraving'
  },
  {
    id: '3',
    name: 'Desktop Organizer',
    description: 'Keep your desk tidy with this stylish organizer.',
    price: 34.99,
    image: '/images/organizer.jpg',
    category: '3d-printing'
  },
  {
    id: '4',
    name: 'Custom Wooden Sign',
    description: 'Laser engraved wooden sign for your home or office.',
    price: 49.99,
    image: '/images/wooden-sign.jpg',
    category: 'laser-engraving'
  }
];

export default function FeaturedProducts() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Featured Products</h2>
          <Link href="/shop" className="text-primary-600 hover:text-primary-800 font-medium">
            View All Products &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}