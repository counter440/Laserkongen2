import Image from 'next/image';
import Link from 'next/link';
import { FaCartPlus } from 'react-icons/fa';

export default function ProductCard({ product, addToCart }) {
  const { id, name, description, price, image, category } = product;
  
  const handleAddToCart = () => {
    if (addToCart) {
      addToCart(product);
    }
  };
  
  return (
    <div className="card h-full flex flex-col">
      <div className="relative h-48 w-full bg-gray-200">
        {/* We'll use a placeholder for now, but in a real app you'd have actual product images */}
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          {image ? (
            <Image 
              src={image} 
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <span>Product Image</span>
          )}
        </div>
        <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
          {category === '3d-printing' ? '3D Print' : 'Laser Engraved'}
        </div>
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <Link href={`/products/${id}`} className="block">
          <h3 className="text-lg font-bold text-gray-900 hover:text-primary-600 mb-1">{name}</h3>
        </Link>
        <p className="text-gray-600 text-sm mb-2 flex-grow">{description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
          <button 
            onClick={handleAddToCart} 
            className="btn btn-primary inline-flex items-center"
          >
            <FaCartPlus className="mr-2" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}