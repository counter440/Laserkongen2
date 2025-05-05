import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Laserkongen</h3>
            <p className="text-gray-300 mb-4">Professional 3D printing and laser engraving services. Upload your designs or shop from our curated collection of products.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <FaFacebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <FaInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <FaTwitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <FaLinkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/3d-printing" className="text-gray-300 hover:text-white">
                  3D Printing
                </Link>
              </li>
              <li>
                <Link href="/laser-engraving" className="text-gray-300 hover:text-white">
                  Laser Engraving
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-gray-300 hover:text-white">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/custom-orders" className="text-gray-300 hover:text-white">
                  Custom Orders
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <FaMapMarkerAlt className="h-5 w-5 mr-2 text-primary-400" />
                <span className="text-gray-300">123 Main Street, City, Country</span>
              </li>
              <li className="flex items-center">
                <FaPhone className="h-5 w-5 mr-2 text-primary-400" />
                <span className="text-gray-300">+1 234 567 890</span>
              </li>
              <li className="flex items-center">
                <FaEnvelope className="h-5 w-5 mr-2 text-primary-400" />
                <span className="text-gray-300">info@laserkongen.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-gray-300 text-center">&copy; {new Date().getFullYear()} Laserkongen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}