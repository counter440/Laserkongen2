import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

// Helper function to safely interact with localStorage
const getLocalStorage = (key, defaultValue) => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;
    
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setLocalStorage = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

export const CartProvider = ({ children }) => {
  // Initialize state from localStorage (runs only client-side)
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cart from localStorage (only once on client-side)
  useEffect(() => {
    // First check for temporary cart from login-reload
    const tempCartItems = getLocalStorage('tempCartItems', null);
    
    if (tempCartItems) {
      console.log('Found temporary cart items from login reload:', tempCartItems);
      setCartItems(tempCartItems);
      // Cleanup the temporary storage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('tempCartItems');
      }
    } else {
      // Use normal cart data
      const initialCartItems = getLocalStorage('laserkongen_cart', []);
      console.log('Initial cart from localStorage:', initialCartItems);
      setCartItems(initialCartItems);
    }
    
    setIsInitialized(true);
  }, []);

  // Update cart totals and localStorage whenever cart changes (but only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    // Calculate cart totals
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const itemsTotal = cartItems.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity, 
      0
    );
    
    setCartCount(itemCount);
    setCartTotal(itemsTotal);
    
    // Update localStorage
    console.log('Saving cart to localStorage:', cartItems);
    setLocalStorage('laserkongen_cart', cartItems);
  }, [cartItems, isInitialized]);

  // Add item to cart
  const addToCart = (product, quantity = 1, customOptions = {}) => {
    console.log('Adding to cart:', product, 'quantity:', quantity, 'options:', customOptions);
    
    if (!product || !product.id) {
      console.error('Invalid product data:', product);
      return;
    }
    
    // Debug product image
    console.log('Product image property:', product.image ? 'exists' : 'missing');
    console.log('Product images property:', product.images ? `exists with ${product.images.length} images` : 'missing');
    
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        item => item.id === product.id && 
        JSON.stringify(item.customOptions || {}) === JSON.stringify(customOptions || {})
      );
      
      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        console.log('Updated existing item in cart:', updatedItems[existingItemIndex]);
        return updatedItems;
      } else {
        // Item doesn't exist, add new item
        const imageToUse = product.image || (product.images && product.images.length > 0 ? product.images[0] : null);
        console.log('Image being used for cart item:', imageToUse ? 'valid image' : 'null');
        
        const newItem = {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image: imageToUse,
          quantity,
          customOptions: customOptions || {}
        };
        console.log('Added new item to cart:', newItem);
        return [...prevItems, newItem];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (cartItemId, customOptions = {}) => {
    console.log('Removing from cart, id:', cartItemId, 'options:', customOptions);
    
    setCartItems(prevItems => {
      return prevItems.filter(
        item => !(item.id === cartItemId && 
          JSON.stringify(item.customOptions || {}) === JSON.stringify(customOptions || {}))
      );
    });
  };

  // Update item quantity
  const updateCartQuantity = (cartItemId, newQuantity, customOptions = {}) => {
    console.log('Updating quantity in cart, id:', cartItemId, 'new quantity:', newQuantity);
    
    if (newQuantity <= 0) {
      removeFromCart(cartItemId, customOptions);
      return;
    }
    
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === cartItemId && 
            JSON.stringify(item.customOptions || {}) === JSON.stringify(customOptions || {})) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  // Clear cart
  const clearCart = () => {
    console.log('Clearing cart');
    setCartItems([]);
    setLocalStorage('laserkongen_cart', []);
  };

  // Debug cart contents
  const debugCart = () => {
    console.log('Current cart contents:', cartItems);
    console.log('Cart count:', cartCount);
    console.log('Cart total:', cartTotal);
    console.log('localStorage cart:', getLocalStorage('laserkongen_cart', []));
    
    return {
      cartItems,
      cartCount,
      cartTotal,
      localStorage: getLocalStorage('laserkongen_cart', [])
    };
  };

  const value = {
    cartItems,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    debugCart,
    isInitialized
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;