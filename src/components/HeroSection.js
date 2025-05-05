import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className="relative bg-gray-900">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent opacity-90" />
      
      {/* Hero content */}
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-start">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4">
          <span className="block">Bring Your Ideas to Life</span>
          <span className="block text-primary-400">With 3D Printing & Laser Engraving</span>
        </h1>
        
        <p className="mt-4 text-xl text-gray-300 max-w-2xl">
          Upload your designs and get an instant quote. High-quality 3D printing and laser engraving services with quick turnaround times.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/upload" className="btn btn-primary text-lg px-8 py-3 font-medium">
            Upload Your Design
          </Link>
          <Link href="/shop" className="btn btn-outline text-white border-white text-lg px-8 py-3 font-medium hover:bg-white hover:text-gray-900">
            Browse Shop
          </Link>
        </div>
        
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl font-bold text-white">100+</div>
            <div className="text-gray-400">Materials</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl font-bold text-white">1000+</div>
            <div className="text-gray-400">Happy Customers</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl font-bold text-white">24h</div>
            <div className="text-gray-400">Turnaround Time</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl font-bold text-white">5★</div>
            <div className="text-gray-400">Customer Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
}