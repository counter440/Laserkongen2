import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaCheck, FaExclamationCircle, FaUserPlus, FaUserCircle } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const Checkout = () => {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart, isInitialized } = useCart();
  const { user, register, login, isAuthenticated, setUser, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [success, setSuccess] = useState(false);
  const [windowWidth, setWindowWidth] = useState(null);
  const [isPageReady, setIsPageReady] = useState(false);
  
  // Handle window resize for responsiveness
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // Determine if we're on mobile
  const isMobile = windowWidth && windowWidth < 768;
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Norway',
    phone: '',
    paymentMethod: 'credit-card',
    password: '',
    confirmPassword: '',
    createAccount: false,
    loginEmail: '',
    loginPassword: '',
    showLogin: false,
    saveAddress: false
  });

  useEffect(() => {
    // Mark the page as ready once cart is initialized
    if (isInitialized) {
      // Check for empty cart after initialization
      if (cartItems.length === 0 && !success) {
        console.log('Cart is initialized and empty, redirecting to cart');
        router.push('/cart');
      } else {
        // Cart has items or we're in success state, mark page as ready
        setIsPageReady(true);
      }
    }
  }, [cartItems, router, success, isInitialized]);
  
  // Setting a flag in sessionStorage to prevent automatic redirects
  // This lets the auth context know we're on the checkout page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set a flag that we're on the checkout page
      sessionStorage.setItem('on_checkout_page', 'true');
      
      // Clean up when leaving the page
      return () => {
        sessionStorage.removeItem('on_checkout_page');
      };
    }
  }, []);
  
  // Check for temporary cart data (from login reload)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tempCartData = localStorage.getItem('tempCartItems');
      if (tempCartData) {
        try {
          // We don't use this directly since the CartContext should handle it,
          // but this confirms we had a login-triggered reload
          console.log('Found temporary cart data from login reload');
          
          // Remove the temporary data
          localStorage.removeItem('tempCartItems');
          
          // DIAGNOSTIC: Check the session storage and auth state after login-triggered reload
          const userInfoStr = sessionStorage.getItem('userInfo');
          const userInfoFromStorage = userInfoStr ? JSON.parse(userInfoStr) : null;
          
          console.log('DIAGNOSTIC: After reload - userInfo in session storage:', !!userInfoStr);
          console.log('DIAGNOSTIC: After reload - user in context:', !!user);
          console.log('DIAGNOSTIC: After reload - isAuthenticated():', isAuthenticated());
          console.log('DIAGNOSTIC: After reload - user email from storage:', userInfoFromStorage?.email);
          
          // Log for debug purposes
          console.log(`User check after reload:
- Session storage: ${!!userInfoStr}
- User in context: ${!!user}
- isAuthenticated: ${isAuthenticated()}
- Name: ${userInfoFromStorage?.name || 'Not found'}`);
          
          // Show a success notification that login worked
          const successToast = document.createElement('div');
          successToast.style.position = 'fixed';
          successToast.style.top = '20px';
          successToast.style.left = '50%';
          successToast.style.transform = 'translateX(-50%)';
          successToast.style.backgroundColor = '#d1fae5'; 
          successToast.style.color = '#065f46';
          successToast.style.padding = '1rem 2rem';
          successToast.style.borderRadius = '0.5rem';
          successToast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          successToast.style.zIndex = '1000';
          successToast.style.fontFamily = "'Outfit', sans-serif";
          successToast.style.fontWeight = '600';
          successToast.innerHTML = `Innlogging vellykket!${user ? '<br>Logget inn som: ' + user.name : ''}`;
          
          document.body.appendChild(successToast);
          setTimeout(() => {
            successToast.style.opacity = '0';
            successToast.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
              document.body.removeChild(successToast);
            }, 500);
          }, 3000);
        } catch (err) {
          console.error('Error processing temp cart data:', err);
        }
      }
    }
  }, [user, isAuthenticated]);
  
  // Load user address data if logged in - runs when user changes (like after login)
  useEffect(() => {
    console.log("User changed effect triggered, user:", user ? user.name : 'null');
    
    // Add detailed logging of user address including phone
    if (user && user.address) {
      console.log('User address in context:', {
        street: user.address.street,
        city: user.address.city,
        postalCode: user.address.postalCode,
        country: user.address.country,
        phone: user.address.phone || 'Not provided'
      });
    }
    
    // Check for user info in session storage directly as a fallback
    if (!user && typeof window !== 'undefined') {
      const userInfoStr = sessionStorage.getItem('userInfo');
      if (userInfoStr) {
        try {
          const userFromStorage = JSON.parse(userInfoStr);
          console.log('Found user in session storage but not in context:', userFromStorage.name);
          
          // Log storage user's address data
          if (userFromStorage.address) {
            console.log('User address from storage:', {
              street: userFromStorage.address.street,
              city: userFromStorage.address.city,
              postalCode: userFromStorage.address.postalCode,
              country: userFromStorage.address.country,
              phone: userFromStorage.address.phone || 'Not provided'
            });
          }
          
          // Force-update the auth context
          if (setUser && typeof setUser === 'function') {
            console.log('Force updating auth context with session storage data');
            setUser(userFromStorage);
          }
        } catch (e) {
          console.error('Error parsing user info from session storage:', e);
        }
      }
    }
    
    if (isAuthenticated() && user) {
      console.log('Authenticated user detected, updating form data with:', user.name);
      
      // Since we're reading formData inside useEffect, we need to use the callback form
      // of setFormData to ensure we're working with the latest formData state
      setFormData(prevFormData => {
        // If user data hasn't changed, don't update formData to avoid potential loops
        if (prevFormData.fullName === user.name && 
            prevFormData.email === user.email && 
            user.address?.street === prevFormData.address &&
            user.address?.phone === prevFormData.phone) {
          console.log('User data unchanged, skipping form update');
          return prevFormData;
        }
        
        console.log('Updating form data with user information');
        
        // Start with base user data
        const updatedData = {
          ...prevFormData,
          fullName: user.name || prevFormData.fullName,
          email: user.email || prevFormData.email
        };
        
        // Add address data if available
        if (user.address) {
          updatedData.address = user.address.street || prevFormData.address;
          updatedData.city = user.address.city || prevFormData.city;
          updatedData.postalCode = user.address.postalCode || prevFormData.postalCode;
          updatedData.country = user.address.country || prevFormData.country;
          updatedData.phone = user.address.phone || prevFormData.phone;
          
          console.log('Updated phone from user address:', user.address.phone);
          console.log('Form data phone value after update:', updatedData.phone);
        }
        
        return updatedData;
      });
    }
  }, [isAuthenticated, user, setUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle login - Using a completely manual approach for debugging
  const handleLogin = async (e) => {
    // If called from a form submission event, prevent default
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setLoginError('');
    
    if (!formData.loginEmail || !formData.loginPassword) {
      setLoginError('Vennligst oppgi både e-post og passord');
      return;
    }
    
    try {
      setLoading(true);
      
      // DIRECT IMPLEMENTATION: Skip the auth context completely
      console.log('CHECKOUT LOGIN: Making direct API call');
      
      // Make direct API call to login endpoint
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.loginEmail, 
          password: formData.loginPassword 
        }),
      });
      
      // Get the response data
      const data = await response.json();
      console.log('CHECKOUT LOGIN: Response status:', response.status);
      console.log('CHECKOUT LOGIN: Response data:', Object.keys(data));
      
      // Log for debug purposes
      console.log(`Login response: ${response.status}. Has token: ${!!data.token}`);
      
      // Handle error responses
      if (!response.ok) {
        console.error('CHECKOUT LOGIN: Login failed:', data.message);
        setLoginError(data.message || 'Innlogging mislyktes. Sjekk e-post og passord.');
        setLoading(false);
        return;
      }
      
      // Manually update the session storage
      console.log('CHECKOUT LOGIN: Updating sessionStorage and user context');
      
      // Make an additional request to get the complete user data with address
      const validateResponse = await fetch('/api/users/validate-session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      let userData = data;
      
      if (validateResponse.ok) {
        const validatedData = await validateResponse.json();
        console.log('CHECKOUT LOGIN: Validation response data:', Object.keys(validatedData));
        console.log('CHECKOUT LOGIN: Address in validation:', validatedData.address);
        
        // Merge the validated data (which includes the address) with our login data
        userData = {
          ...data,
          ...validatedData
        };
        
        // Update the session storage with the complete data
        sessionStorage.setItem('userInfo', JSON.stringify(userData));
      } else {
        // If validation fails, still store the login data
        sessionStorage.setItem('userInfo', JSON.stringify(data));
        console.warn('CHECKOUT LOGIN: Validation request failed, using login data only');
      }
      
      // Force update the user context
      setUser(userData);
      
      // Set login success state
      setLoginSuccess(true);
      
      // Update formData with user information
      setFormData(prev => {
        console.log('Updating form after login with userData:', {
          name: userData.name,
          email: userData.email,
          street: userData.address?.street,
          city: userData.address?.city,
          postalCode: userData.address?.postalCode,
          country: userData.address?.country,
          phone: userData.address?.phone || 'Not provided'
        });
        
        const updatedForm = {
          ...prev,
          loginEmail: '',
          loginPassword: '',
          showLogin: false,
          fullName: userData.name || prev.fullName,
          email: userData.email || prev.email,
        };
        
        // Add address data if available
        if (userData.address) {
          updatedForm.address = userData.address.street || prev.address;
          updatedForm.city = userData.address.city || prev.city;
          updatedForm.postalCode = userData.address.postalCode || prev.postalCode;
          updatedForm.country = userData.address.country || prev.country;
          updatedForm.phone = userData.address.phone || prev.phone;
          
          console.log('Phone number set after login:', updatedForm.phone);
        } else {
          console.warn('CHECKOUT LOGIN: No address data in user object after login');
        }
        
        return updatedForm;
      });
      
      // Show a success toast notification 
      if (typeof window !== 'undefined') {
        console.log('CHECKOUT LOGIN: Login successful, showing toast');
        
        const successToast = document.createElement('div');
        successToast.style.position = 'fixed';
        successToast.style.top = '20px';
        successToast.style.left = '50%';
        successToast.style.transform = 'translateX(-50%)';
        successToast.style.backgroundColor = '#d1fae5'; 
        successToast.style.color = '#065f46';
        successToast.style.padding = '1rem 2rem';
        successToast.style.borderRadius = '0.5rem';
        successToast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        successToast.style.zIndex = '1000';
        successToast.style.fontFamily = "'Outfit', sans-serif";
        successToast.style.fontWeight = '600';
        successToast.innerHTML = `Innlogging vellykket!${data.name ? '<br>Logget inn som: ' + data.name : ''}`;
        
        document.body.appendChild(successToast);
        setTimeout(() => {
          successToast.style.opacity = '0';
          successToast.style.transition = 'opacity 0.5s ease';
          setTimeout(() => {
            document.body.removeChild(successToast);
          }, 500);
        }, 3000);
      }
      
    } catch (err) {
      console.error('CHECKOUT LOGIN: Error:', err);
      setLoginError('En uventet feil oppstod under innlogging.');
      
      // Log for debug purposes
      console.log(`Login error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const requiredFields = ['fullName', 'email', 'address', 'city', 'postalCode', 'country'];
    let isValid = true;
    let errorMsg = '';

    // Check required fields
    for (const field of requiredFields) {
      if (!formData[field]) {
        isValid = false;
        errorMsg = 'Vennligst fyll ut alle påkrevde felt';
        break;
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (isValid && !emailRegex.test(formData.email)) {
      isValid = false;
      errorMsg = 'Vennligst oppgi en gyldig e-postadresse';
    }

    // Validate postal code (simple check for now)
    if (isValid && formData.postalCode.length < 4) {
      isValid = false;
      errorMsg = 'Vennligst oppgi et gyldig postnummer';
    }

    // Validate password if creating account
    if (isValid && formData.createAccount) {
      if (!formData.password) {
        isValid = false;
        errorMsg = 'Passord er påkrevd for å opprette en konto';
      } else if (formData.password.length < 6) {
        isValid = false;
        errorMsg = 'Passordet må være minst 6 tegn';
      } else if (formData.password !== formData.confirmPassword) {
        isValid = false;
        errorMsg = 'Passordene stemmer ikke overens';
      }
    }

    setError(errorMsg);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setRegistrationError('');
    
    try {
      // Create an account if requested and user is not already logged in
      let userId = null;
      let authToken = null;
      
      if (formData.createAccount && !isAuthenticated()) {
        console.log('Registering new user account');
        
        // Register the user with the address information
        const registerResult = await register(
          formData.fullName,
          formData.email,
          formData.password,
          {
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country,
            phone: formData.phone || ''
          }
        );
        
        if (!registerResult.success) {
          setRegistrationError(registerResult.error);
          setLoading(false);
          return;
        }
        
        // Extract user ID and token from successful registration
        userId = registerResult.data.id;
        authToken = registerResult.data.token;
        console.log('User registered successfully with ID:', userId);
      }
      
      // Prepare order data
      const orderData = {
        orderItems: cartItems.map(item => {
          // If image is a data URL (base64), replace with placeholder
          let imageUrl = item.image || '/placeholder-product.jpg';
          if (imageUrl && imageUrl.startsWith('data:image')) {
            imageUrl = '/placeholder-product.jpg';
          }
          
          // Ensure the uploaded file ID is properly included ONLY for custom products
          const customOptions = {...(item.customOptions || {})};
          
          // Check if this is a custom product (ID starts with "custom-")
          const isCustomProduct = (typeof item.id === 'string' && item.id.startsWith('custom-'));
          
          // Only include uploadedFileId for custom products
          if (isCustomProduct) {
            // Log the uploadedFileId to verify it's being included
            if (customOptions.uploadedFileId) {
              console.log('Including uploadedFileId in custom product order item:', customOptions.uploadedFileId);
              console.log('Upload time:', customOptions.uploadTime || 'Not available');
              
              // Add more debug info
              console.log('CHECKOUT DEBUG: Custom product details:');
              console.log('- Product ID:', item.id);
              console.log('- Product Name:', item.name);
              console.log('- File ID:', customOptions.uploadedFileId);
              console.log('- Full custom options:', JSON.stringify(customOptions));
            } else {
              console.warn('No uploadedFileId found in customOptions for custom product:', item.name);
              console.warn('Custom options available:', JSON.stringify(customOptions));
              
              // Try to recover uploadedFileId from localStorage
              try {
                if (typeof window !== 'undefined') {
                  const lastUploadedFileId = localStorage.getItem('lastUploadedFileId');
                  if (lastUploadedFileId) {
                    console.log('Recovered uploadedFileId from localStorage:', lastUploadedFileId);
                    customOptions.uploadedFileId = lastUploadedFileId;
                    console.log('RECOVERY: Added uploadedFileId to customOptions:', customOptions.uploadedFileId);
                  }
                }
              } catch (error) {
                console.error('Error recovering uploadedFileId from localStorage:', error);
              }
            }
          } else {
            // For standard shop products, ensure there is no uploadedFileId
            if (customOptions.uploadedFileId) {
              console.log('Removing uploadedFileId from standard shop product:', item.name);
              delete customOptions.uploadedFileId;
            }
          }
          
          return {
            name: item.name,
            quantity: item.quantity,
            image: imageUrl,
            price: parseFloat(item.price),
            product: item.id ? item.id.toString() : null, // Include product ID if available and ensure it's a string
            customOptions: customOptions
          };
        }),
        shippingAddress: {
          fullName: formData.fullName,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
          email: formData.email
        },
        paymentMethod: formData.paymentMethod,
        itemsPrice: parseFloat(cartTotal.toFixed(2)),
        taxPrice: parseFloat((cartTotal * 0.25).toFixed(2)), // 25% tax
        shippingPrice: 0,
        totalPrice: parseFloat((cartTotal * 1.25).toFixed(2)), // Total with tax
        status: 'pending',
        isPaid: formData.paymentMethod === 'credit-card' ? true : false, // Auto-mark as paid for demo
        paidAt: formData.paymentMethod === 'credit-card' ? new Date().toISOString() : null
      };
      
      // Add user ID if registered or already authenticated
      if (userId || (user && user.id)) {
        // The backend expects 'user' to be the user ID
        orderData.user = userId || user.id;
        console.log(`Adding user ID to order: ${orderData.user}`);
      } else if (user) {
        // If user object exists but doesn't have an ID property, try _id
        orderData.user = user._id;
        console.log(`Adding fallback user ID to order: ${orderData.user}`);
      }
      
      console.log('Submitting order data:', JSON.stringify(orderData));
      
      // Prepare headers with authentication token if available
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (authToken || (user && user.token)) {
        headers['Authorization'] = `Bearer ${authToken || user.token}`;
      }
      
      // Send order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error creating order');
      }
      
      // Order created successfully
      const orderResult = await response.json();
      
      // Save address to user profile if checkbox is checked and user is logged in
      if (formData.saveAddress && isAuthenticated()) {
        console.log('Saving address to user profile');
        
        try {
          const addressData = {
            address: {
              street: formData.address,
              city: formData.city,
              postalCode: formData.postalCode,
              country: formData.country,
              phone: formData.phone || ''
            }
          };
          
          // Update user profile with new address
          const updateResult = await updateProfile(addressData);
          
          if (updateResult.success) {
            console.log('Address saved successfully to user profile');
            
            // Show a success toast notification for address save
            if (typeof window !== 'undefined') {
              const addressSaveToast = document.createElement('div');
              addressSaveToast.style.position = 'fixed';
              addressSaveToast.style.top = '20px';
              addressSaveToast.style.left = '50%';
              addressSaveToast.style.transform = 'translateX(-50%)';
              addressSaveToast.style.backgroundColor = '#d1fae5'; 
              addressSaveToast.style.color = '#065f46';
              addressSaveToast.style.padding = '1rem 2rem';
              addressSaveToast.style.borderRadius = '0.5rem';
              addressSaveToast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              addressSaveToast.style.zIndex = '1000';
              addressSaveToast.style.fontFamily = "'Outfit', sans-serif";
              addressSaveToast.style.fontWeight = '600';
              addressSaveToast.innerHTML = 'Adresse lagret til din brukerkonto';
              
              document.body.appendChild(addressSaveToast);
              setTimeout(() => {
                addressSaveToast.style.opacity = '0';
                addressSaveToast.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                  document.body.removeChild(addressSaveToast);
                }, 500);
              }, 3000);
            }
          } else {
            console.error('Failed to save address to profile:', updateResult.error);
            // We don't want to fail the order if address saving fails
          }
        } catch (addressError) {
          console.error('Error saving address to profile:', addressError);
          // Continue with order confirmation even if saving address fails
        }
      }
      
      // Clear cart and show success message
      clearCart();
      setSuccess(true);
      
      // Save order ID for receipt page
      localStorage.setItem('lastOrder', JSON.stringify(orderResult));
      
      // Redirect to order confirmation after a delay
      setTimeout(() => {
        router.push(`/order-confirmation?id=${orderResult.id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message || 'Error processing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `kr ${parseFloat(price).toFixed(2)}`;
  };

  // Show loading state until cart is initialized
  if (!isPageReady && !success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem' }}>
        <div style={{ 
          backgroundColor: '#f0f9ff', 
          color: '#0284c7',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          maxWidth: '600px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
            <div className="cart-loader"></div>
          </div>
          <h2 style={{ 
            marginBottom: '1rem', 
            fontSize: '1.5rem',
            fontWeight: '700',
            letterSpacing: '-0.025em',
            fontFamily: "'Outfit', sans-serif",
            color: '#0284c7'
          }}>Laster handlekurv...</h2>
        </div>
        
        <style jsx global>{`
          .cart-loader {
            border: 4px solid rgba(2, 132, 199, 0.1);
            border-top: 4px solid #0284c7;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: cartSpin 1s linear infinite;
            margin: 0 auto;
          }
          
          @keyframes cartSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem' }}>
        <div style={{ 
          backgroundColor: '#d1fae5', 
          color: '#065f46',
          padding: '2.5rem',
          borderRadius: '1rem',
          textAlign: 'center',
          maxWidth: '600px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <FaCheck style={{ fontSize: '3rem', marginBottom: '1.5rem' }} />
          <h1 style={{ 
            marginBottom: '1rem', 
            fontSize: '2rem',
            fontWeight: '800',
            letterSpacing: '-0.025em',
            fontFamily: "'Outfit', sans-serif",
            color: '#065f46'
          }}>Bestillingen er fullført!</h1>
          <p style={{ 
            marginBottom: '2rem',
            fontSize: '1.1rem',
            letterSpacing: '-0.01em',
            lineHeight: 1.5
          }}>Takk for ditt kjøp. Du vil nå bli videresendt til ordrebekreftelsessiden...</p>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <div className="loader"></div>
          </div>
        </div>
        
        <style jsx global>{`
          .loader {
            border: 4px solid rgba(6, 95, 70, 0.1);
            border-top: 4px solid #065f46;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1.5s linear infinite;
            margin: 0 auto;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Debug log to check phone number in formData when rendering
  console.log('Current formData when rendering checkout:', {
    phone: formData.phone,
    userHasPhone: user?.address?.phone || 'No phone in user data',
    isAuthenticated: isAuthenticated()
  });
  
  return (
    <div>
      <Head>
        <title>Til kassen | Laserkongen</title>
        <meta name="description" content="Fullfør din bestilling" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      
      <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
      
      {/* Back button */}
      <div style={{ maxWidth: '1200px', margin: '1rem auto', padding: '0 ' + (isMobile ? '1rem' : '1rem') }}>
        <Link href="/cart" style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#64748b',
          textDecoration: 'none',
          padding: '0.5rem'
        }}>
          <FaArrowLeft /> Tilbake til handlekurven
        </Link>
      </div>
      
      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 ' + (isMobile ? '1rem' : '1rem') + ' 3rem' }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.75rem' : '2.25rem', 
          marginBottom: isMobile ? '1.5rem' : '2rem',
          fontWeight: '800',
          letterSpacing: '-0.025em',
          fontFamily: "'Outfit', sans-serif",
          color: '#0f172a'
        }}>Til kassen</h1>
        
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FaExclamationCircle />
            {error}
          </div>
        )}
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2.8fr 2.2fr', 
          gap: isMobile ? '2rem' : '3rem' 
        }}>
          {/* Checkout form */}
          <div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ 
                  fontSize: isMobile ? '1.25rem' : '1.375rem', 
                  marginBottom: isMobile ? '1rem' : '1.25rem', 
                  letterSpacing: '-0.025em', 
                  fontWeight: '700',
                  fontFamily: "'Outfit', sans-serif",
                  color: '#0f172a'
                }}>Kontaktinformasjon</h2>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: isMobile ? '1.75rem' : '2rem', 
                  marginBottom: isMobile ? '1.75rem' : '2rem' 
                }}>
                  <div>
                    <label htmlFor="fullName" style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: isMobile ? '0.375rem' : '0.5rem', 
                      fontSize: isMobile ? '0.85rem' : '0.9rem', 
                      fontWeight: '600',
                      fontFamily: "'Outfit', sans-serif",
                      color: '#334155'
                    }}>
                      Fullt navn *
                      {isAuthenticated() && user?.name && (
                        <span style={{
                          fontSize: '0.7rem',
                          backgroundColor: '#dbeafe',
                          color: '#0284c7',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.3rem',
                          marginLeft: '0.5rem',
                          fontWeight: '600'
                        }}>
                          Auto
                        </span>
                      )}
                    </label>
                    <input 
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: isMobile ? '0.75rem 0.875rem' : '0.85rem 1rem',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '0.6rem',
                        fontSize: isMobile ? '0.9375rem' : '1rem',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '500',
                        backgroundColor: isAuthenticated() && user?.name ? '#f0f9ff' : '#f8fafc',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: '0.5rem', 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      fontFamily: "'Outfit', sans-serif",
                      color: '#334155'
                    }}>
                      E-postadresse *
                      {isAuthenticated() && user?.email && (
                        <span style={{
                          fontSize: '0.7rem',
                          backgroundColor: '#dbeafe',
                          color: '#0284c7',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.3rem',
                          marginLeft: '0.5rem',
                          fontWeight: '600'
                        }}>
                          Auto
                        </span>
                      )}
                    </label>
                    <input 
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '0.6rem',
                        fontSize: '1rem',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '500',
                        backgroundColor: isAuthenticated() && user?.email ? '#f0f9ff' : '#f8fafc',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="phone" style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '0.5rem', 
                    fontSize: '0.9rem', 
                    fontWeight: '600',
                    fontFamily: "'Outfit', sans-serif",
                    color: '#334155'
                  }}>
                    Telefonnummer
                    {isAuthenticated() && user?.address?.phone && (
                      <span style={{
                        fontSize: '0.7rem',
                        backgroundColor: '#dbeafe',
                        color: '#0284c7',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.3rem',
                        marginLeft: '0.5rem',
                        fontWeight: '600'
                      }}>
                        Auto
                      </span>
                    )}
                  </label>
                  <input 
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '0.6rem',
                      fontSize: '1rem',
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '500',
                      backgroundColor: isAuthenticated() && user?.address?.phone ? '#f0f9ff' : '#f8fafc',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>
              </div>
              
              {!isAuthenticated() && (
                <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: isMobile ? '1rem' : '1.25rem'
                  }}>
                    <h2 style={{ 
                      fontSize: isMobile ? '1.25rem' : '1.375rem', 
                      letterSpacing: '-0.025em', 
                      fontWeight: '700',
                      fontFamily: "'Outfit', sans-serif",
                      color: '#0f172a',
                    }}>
                      Konto (valgfritt)
                    </h2>
                    
                    <div style={{ 
                      display: 'flex',
                      gap: '0.75rem'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginSuccess(false);
                          setFormData(prevData => ({
                            ...prevData,
                            showLogin: false,
                            createAccount: !prevData.createAccount,
                            loginEmail: '',
                            loginPassword: ''
                          }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          fontFamily: "'Outfit', sans-serif",
                          cursor: 'pointer',
                          backgroundColor: formData.createAccount && !formData.showLogin ? '#0ea5e9' : '#e2e8f0',
                          color: formData.createAccount && !formData.showLogin ? 'white' : '#475569',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FaUserPlus size={14} /> Opprett ny
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setLoginSuccess(false);
                          setFormData(prevData => ({
                            ...prevData,
                            showLogin: !prevData.showLogin,
                            createAccount: false,
                            password: '',
                            confirmPassword: ''
                          }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          fontFamily: "'Outfit', sans-serif",
                          cursor: 'pointer',
                          backgroundColor: formData.showLogin ? '#0ea5e9' : '#e2e8f0',
                          color: formData.showLogin ? 'white' : '#475569',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FaUserCircle size={14} /> Logg inn
                      </button>
                    </div>
                  </div>
                  
                  {registrationError && (
                    <div style={{ 
                      backgroundColor: '#fee2e2', 
                      color: '#b91c1c',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FaExclamationCircle />
                      {registrationError}
                    </div>
                  )}
                  
                  {loginError && (
                    <div style={{ 
                      backgroundColor: '#fee2e2', 
                      color: '#b91c1c',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FaExclamationCircle />
                      {loginError}
                    </div>
                  )}
                  
                  {/* Login Form */}
                  {formData.showLogin && (
                    <div style={{ 
                      backgroundColor: '#f1f5f9', 
                      padding: '1.25rem',
                      borderRadius: '0.6rem',
                      marginBottom: '1.25rem'
                    }}>
                      <div>
                        {loginSuccess ? (
                          <div style={{
                            backgroundColor: '#d1fae5',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: '#065f46'
                          }}>
                            <FaCheck size={18} />
                            <div>
                              <p style={{
                                fontWeight: '600',
                                marginBottom: '0.25rem',
                                fontFamily: "'Outfit', sans-serif"
                              }}>
                                Innlogging vellykket!
                              </p>
                              <p style={{
                                fontSize: '0.85rem',
                                fontFamily: "'Outfit', sans-serif"
                              }}>
                                Din adresse blir nå lastet inn automatisk.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p style={{ 
                            fontSize: '0.875rem', 
                            color: '#64748b', 
                            marginBottom: '1rem',
                            fontFamily: "'Outfit', sans-serif"
                          }}>
                            Logg inn med din eksisterende konto for å forenkle kjøpsprosessen.
                          </p>
                        )}
                        
                        {!loginSuccess && (
                          <>
                            <div style={{ marginBottom: '1.5rem' }}>
                              <label htmlFor="loginEmail" style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontSize: '0.9rem', 
                                fontWeight: '600',
                                fontFamily: "'Outfit', sans-serif",
                                color: '#334155'
                              }}>
                                E-postadresse *
                              </label>
                              <input 
                                type="email"
                                id="loginEmail"
                                name="loginEmail"
                                value={formData.loginEmail}
                                onChange={handleChange}
                                style={{
                                  width: '100%',
                                  padding: '0.85rem 1rem',
                                  border: '1.5px solid #e2e8f0',
                                  borderRadius: '0.6rem',
                                  fontSize: '1rem',
                                  fontFamily: "'Outfit', sans-serif",
                                  fontWeight: '500',
                                  backgroundColor: '#f8fafc',
                                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                            </div>
                            
                            <div style={{ marginBottom: '1.25rem' }}>
                              <label htmlFor="loginPassword" style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontSize: '0.9rem', 
                                fontWeight: '600',
                                fontFamily: "'Outfit', sans-serif",
                                color: '#334155'
                              }}>
                                Passord *
                              </label>
                              <input 
                                type="password"
                                id="loginPassword"
                                name="loginPassword"
                                value={formData.loginPassword}
                                onChange={handleChange}
                                style={{
                                  width: '100%',
                                  padding: '0.85rem 1rem',
                                  border: '1.5px solid #e2e8f0',
                                  borderRadius: '0.6rem',
                                  fontSize: '1rem',
                                  fontFamily: "'Outfit', sans-serif",
                                  fontWeight: '500',
                                  backgroundColor: '#f8fafc',
                                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                            </div>
                            
                            <button
                              type="button"
                              onClick={handleLogin}
                              disabled={loading}
                              style={{
                                width: '100%',
                                padding: '0.85rem 1rem',
                                backgroundColor: '#0ea5e9',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.6rem',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                fontFamily: "'Outfit', sans-serif",
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 2px 5px rgba(14, 165, 233, 0.2)',
                                transition: 'all 0.2s ease',
                                opacity: loading ? 0.7 : 1
                              }}
                            >
                              {loading ? (
                                <>
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24"
                                    style={{
                                      animation: 'spin 1s linear infinite',
                                    }}
                                  >
                                    <path 
                                      fill="currentColor" 
                                      d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8Z"
                                    />
                                  </svg>
                                  <span>Logger inn...</span>
                                </>
                              ) : (
                                <>
                                  <FaUserCircle size={18} />
                                  <span>Logg inn</span>
                                </>
                              )}
                            </button>
                            
                            <style jsx>{`
                              @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                              }
                            `}</style>
                            
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#64748b',
                              marginTop: '0.75rem',
                              textAlign: 'center',
                              fontFamily: "'Outfit', sans-serif"
                            }}>
                              Har du ikke en konto?{' '}
                              <button
                                type="button"
                                onClick={() => {
                                  setLoginSuccess(false);
                                  setFormData(prevData => ({
                                    ...prevData,
                                    showLogin: false,
                                    createAccount: true
                                  }));
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: '#0ea5e9',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontFamily: "'Outfit', sans-serif",
                                  textDecoration: 'underline',
                                }}
                              >
                                Opprett en ny
                              </button>
                            </p>
                          </>
                        )}
                        
                        {loginSuccess && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prevData => ({
                                ...prevData,
                                showLogin: false
                              }));
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0.75rem 1rem',
                              marginTop: '0.5rem',
                              backgroundColor: '#0ea5e9',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.6rem',
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              fontFamily: "'Outfit', sans-serif",
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            Fortsett til utsjekk
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Registration Section */}
                  {!formData.showLogin && (
                    <div style={{ 
                      backgroundColor: '#f1f5f9', 
                      padding: '1.25rem',
                      borderRadius: '0.6rem',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          cursor: 'pointer',
                          userSelect: 'none',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          color: '#334155',
                          fontFamily: "'Outfit', sans-serif"
                        }}>
                          <div style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            border: formData.createAccount ? '1.5px solid #0ea5e9' : '1.5px solid #94a3b8',
                            borderRadius: '0.25rem',
                            backgroundColor: formData.createAccount ? '#0ea5e9' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            marginRight: '0.25rem',
                            position: 'relative'
                          }}>
                            {formData.createAccount && (
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="white" 
                                style={{ width: '0.875rem', height: '0.875rem' }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            name="createAccount"
                            checked={formData.createAccount}
                            onChange={(e) => setFormData({
                              ...formData,
                              createAccount: e.target.checked
                            })}
                            style={{ display: 'none' }}
                          />
                          Opprett konto for å lagre ordrene dine og forenkle fremtidige kjøp
                        </label>
                      </div>
                      
                      {formData.createAccount && (
                        <div>
                          <p style={{ 
                            fontSize: '0.875rem', 
                            color: '#64748b', 
                            marginBottom: '1rem',
                            fontFamily: "'Outfit', sans-serif"
                          }}>
                            Opprett en konto for å se din ordrehistorikk, spore leveringer og få personlige tilbud.
                          </p>
                          
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                            gap: isMobile ? '0.875rem' : '1rem', 
                            marginBottom: isMobile ? '0.875rem' : '1rem' 
                          }}>
                            <div>
                              <label htmlFor="password" style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontSize: '0.9rem', 
                                fontWeight: '600',
                                fontFamily: "'Outfit', sans-serif",
                                color: '#334155'
                              }}>
                                Passord *
                              </label>
                              <input 
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                style={{
                                  width: '100%',
                                  padding: '0.85rem 1rem',
                                  border: '1.5px solid #e2e8f0',
                                  borderRadius: '0.6rem',
                                  fontSize: '1rem',
                                  fontFamily: "'Outfit', sans-serif",
                                  fontWeight: '500',
                                  backgroundColor: '#f8fafc',
                                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="confirmPassword" style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontSize: '0.9rem', 
                                fontWeight: '600',
                                fontFamily: "'Outfit', sans-serif",
                                color: '#334155'
                              }}>
                                Bekreft passord *
                              </label>
                              <input 
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                style={{
                                  width: '100%',
                                  padding: '0.85rem 1rem',
                                  border: '1.5px solid #e2e8f0',
                                  borderRadius: '0.6rem',
                                  fontSize: '1rem',
                                  fontFamily: "'Outfit', sans-serif",
                                  fontWeight: '500',
                                  backgroundColor: '#f8fafc',
                                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                            </div>
                          </div>
                          
                          <p style={{
                            fontSize: '0.8rem',
                            color: '#64748b',
                            marginTop: '0.75rem',
                            fontFamily: "'Outfit', sans-serif"
                          }}>
                            Har du allerede en konto?{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setLoginSuccess(false);
                                setFormData(prevData => ({
                                  ...prevData,
                                  showLogin: true,
                                  createAccount: false
                                }));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: '#0ea5e9',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontFamily: "'Outfit', sans-serif",
                                textDecoration: 'underline',
                              }}
                            >
                              Logg inn her
                            </button>
                          </p>
                        </div>
                      )}
                      
                      {!formData.createAccount && (
                        <div>
                          <p style={{ 
                            fontSize: '0.875rem', 
                            color: '#64748b',
                            fontFamily: "'Outfit', sans-serif",
                            marginTop: '0.5rem'
                          }}>
                            Du kan fortsette som gjest uten å opprette konto.
                            <br />
                            <button
                              type="button"
                              onClick={() => {
                                setLoginSuccess(false);
                                setFormData(prevData => ({
                                  ...prevData,
                                  showLogin: true
                                }));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                marginTop: '0.5rem',
                                color: '#0ea5e9',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontFamily: "'Outfit', sans-serif",
                                textDecoration: 'underline',
                              }}
                            >
                              Har du allerede en konto? Logg inn her
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {isAuthenticated() && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '0.6rem', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <FaUserCircle style={{ fontSize: '1.5rem', color: '#0284c7' }} />
                  <div>
                    <p style={{ 
                      fontWeight: '600',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                      fontFamily: "'Outfit', sans-serif",
                      marginBottom: '0.25rem'
                    }}>
                      Innlogget som {user?.name || 'bruker'}
                    </p>
                    <p style={{ 
                      fontSize: '0.85rem',
                      color: '#334155',
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      {user?.address 
                        ? 'Din lagrede adresse er automatisk utfylt' 
                        : 'Bestillingen vil bli knyttet til din konto'}
                    </p>
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: isMobile ? '2rem' : '2.5rem' }}>
                <h2 style={{ 
                  fontSize: isMobile ? '1.25rem' : '1.375rem', 
                  marginBottom: isMobile ? '1rem' : '1.25rem', 
                  letterSpacing: '-0.025em', 
                  fontWeight: '700',
                  fontFamily: "'Outfit', sans-serif",
                  color: '#0f172a'
                }}>Leveringsadresse</h2>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="address" style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '0.5rem', 
                    fontSize: '0.9rem', 
                    fontWeight: '600',
                    fontFamily: "'Outfit', sans-serif",
                    color: '#334155'
                  }}>
                    Adresse *
                    {isAuthenticated() && user?.address?.street && (
                      <span style={{
                        fontSize: '0.7rem',
                        backgroundColor: '#dbeafe',
                        color: '#0284c7',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.3rem',
                        marginLeft: '0.5rem',
                        fontWeight: '600'
                      }}>
                        Automatisk utfylt
                      </span>
                    )}
                  </label>
                  <input 
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '0.6rem',
                      fontSize: '1rem',
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '500',
                      backgroundColor: isAuthenticated() && user?.address?.street ? '#f0f9ff' : '#f8fafc',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: isMobile ? '1.75rem' : '2rem', 
                  marginBottom: isMobile ? '1.75rem' : '2rem' 
                }}>
                  <div>
                    <label htmlFor="city" style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: '0.5rem', 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      fontFamily: "'Outfit', sans-serif",
                      color: '#334155'
                    }}>
                      Poststed *
                      {isAuthenticated() && user?.address?.city && (
                        <span style={{
                          fontSize: '0.7rem',
                          backgroundColor: '#dbeafe',
                          color: '#0284c7',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.3rem',
                          marginLeft: '0.5rem',
                          fontWeight: '600'
                        }}>
                          Auto
                        </span>
                      )}
                    </label>
                    <input 
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '0.6rem',
                        fontSize: '1rem',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '500',
                        backgroundColor: isAuthenticated() && user?.address?.city ? '#f0f9ff' : '#f8fafc',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="postalCode" style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: '0.5rem', 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      fontFamily: "'Outfit', sans-serif",
                      color: '#334155'
                    }}>
                      Postnummer *
                      {isAuthenticated() && user?.address?.postalCode && (
                        <span style={{
                          fontSize: '0.7rem',
                          backgroundColor: '#dbeafe',
                          color: '#0284c7',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.3rem',
                          marginLeft: '0.5rem',
                          fontWeight: '600'
                        }}>
                          Auto
                        </span>
                      )}
                    </label>
                    <input 
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '0.6rem',
                        fontSize: '1rem',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '500',
                        backgroundColor: isAuthenticated() && user?.address?.postalCode ? '#f0f9ff' : '#f8fafc',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="country" style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '0.5rem', 
                    fontSize: '0.9rem', 
                    fontWeight: '600',
                    fontFamily: "'Outfit', sans-serif",
                    color: '#334155'
                  }}>
                    Land *
                    {isAuthenticated() && user?.address?.country && (
                      <span style={{
                        fontSize: '0.7rem',
                        backgroundColor: '#dbeafe',
                        color: '#0284c7',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.3rem',
                        marginLeft: '0.5rem',
                        fontWeight: '600'
                      }}>
                        Auto
                      </span>
                    )}
                  </label>
                  <select 
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '0.6rem',
                      fontSize: '1rem',
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '500',
                      backgroundColor: isAuthenticated() && user?.address?.country ? '#f0f9ff' : '#f8fafc',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.2s ease',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23334155%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem top 50%',
                      backgroundSize: '0.65rem auto',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="Norway">Norge</option>
                    <option value="Sweden">Sverige</option>
                    <option value="Denmark">Danmark</option>
                    <option value="Finland">Finland</option>
                    <option value="Iceland">Island</option>
                  </select>
                </div>
                
                {/* Save Address Option for logged-in users */}
                {isAuthenticated() && (
                  <div style={{ 
                    marginTop: '1.75rem',
                    marginBottom: '0.75rem',
                    padding: '1.25rem',
                    backgroundColor: '#f1f9fe',
                    borderRadius: '0.6rem',
                    borderLeft: '3px solid #0ea5e9'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontFamily: "'Outfit', sans-serif"
                    }}>
                      <div style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        border: formData.saveAddress ? '1.5px solid #0ea5e9' : '1.5px solid #94a3b8',
                        borderRadius: '0.25rem',
                        backgroundColor: formData.saveAddress ? '#0ea5e9' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}>
                        {formData.saveAddress && (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="white" 
                            style={{ width: '0.875rem', height: '0.875rem' }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        name="saveAddress"
                        checked={formData.saveAddress}
                        onChange={(e) => setFormData({
                          ...formData,
                          saveAddress: e.target.checked
                        })}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>
                        Lagre denne adressen til min konto
                      </span>
                    </label>
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: '#64748b', 
                      marginTop: '0.5rem', 
                      paddingLeft: '2rem',
                      fontFamily: "'Outfit', sans-serif"
                    }}>
                      Denne adressen vil bli lagret på din brukerkonto for fremtidige bestillinger
                    </p>
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: isMobile ? '2rem' : '2.5rem' }}>
                <h2 style={{ 
                  fontSize: isMobile ? '1.25rem' : '1.375rem', 
                  marginBottom: isMobile ? '1rem' : '1.25rem', 
                  letterSpacing: '-0.025em', 
                  fontWeight: '700',
                  fontFamily: "'Outfit', sans-serif",
                  color: '#0f172a'
                }}>Betalingsmåte</h2>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  {/* In a real app, we would integrate with a payment provider */}
                  {/* For now, just simulate payment methods */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer', 
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '500',
                      padding: '1rem 1.2rem',
                      borderRadius: '0.6rem',
                      marginBottom: '0.75rem',
                      border: formData.paymentMethod === 'credit-card' ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0',
                      backgroundColor: formData.paymentMethod === 'credit-card' ? 'rgba(14, 165, 233, 0.05)' : '#f8fafc',
                      transition: 'all 0.2s ease'
                    }}>
                      <span style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        border: formData.paymentMethod === 'credit-card' ? '0px solid #e2e8f0' : '1.5px solid #94a3b8',
                        marginRight: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: formData.paymentMethod === 'credit-card' ? '#0ea5e9' : 'white',
                        transition: 'all 0.2s ease'
                      }}>
                        {formData.paymentMethod === 'credit-card' && (
                          <span style={{
                            width: '0.6rem',
                            height: '0.6rem',
                            borderRadius: '50%',
                            backgroundColor: 'white'
                          }}></span>
                        )}
                      </span>
                      <input 
                        type="radio"
                        name="paymentMethod"
                        value="credit-card"
                        checked={formData.paymentMethod === 'credit-card'}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontWeight: formData.paymentMethod === 'credit-card' ? '600' : '500' }}>Kredittkort (Demo)</span>
                    </label>
                  </div>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer', 
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '500',
                      padding: '1rem 1.2rem',
                      borderRadius: '0.6rem',
                      marginBottom: '0.75rem',
                      border: formData.paymentMethod === 'paypal' ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0',
                      backgroundColor: formData.paymentMethod === 'paypal' ? 'rgba(14, 165, 233, 0.05)' : '#f8fafc',
                      transition: 'all 0.2s ease'
                    }}>
                      <span style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        border: formData.paymentMethod === 'paypal' ? '0px solid #e2e8f0' : '1.5px solid #94a3b8',
                        marginRight: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: formData.paymentMethod === 'paypal' ? '#0ea5e9' : 'white',
                        transition: 'all 0.2s ease'
                      }}>
                        {formData.paymentMethod === 'paypal' && (
                          <span style={{
                            width: '0.6rem',
                            height: '0.6rem',
                            borderRadius: '50%',
                            backgroundColor: 'white'
                          }}></span>
                        )}
                      </span>
                      <input 
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={formData.paymentMethod === 'paypal'}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontWeight: formData.paymentMethod === 'paypal' ? '600' : '500' }}>PayPal (Demo)</span>
                    </label>
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer', 
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '500',
                      padding: '1rem 1.2rem',
                      borderRadius: '0.6rem',
                      border: formData.paymentMethod === 'bank-transfer' ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0',
                      backgroundColor: formData.paymentMethod === 'bank-transfer' ? 'rgba(14, 165, 233, 0.05)' : '#f8fafc',
                      transition: 'all 0.2s ease'
                    }}>
                      <span style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        border: formData.paymentMethod === 'bank-transfer' ? '0px solid #e2e8f0' : '1.5px solid #94a3b8',
                        marginRight: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: formData.paymentMethod === 'bank-transfer' ? '#0ea5e9' : 'white',
                        transition: 'all 0.2s ease'
                      }}>
                        {formData.paymentMethod === 'bank-transfer' && (
                          <span style={{
                            width: '0.6rem',
                            height: '0.6rem',
                            borderRadius: '50%',
                            backgroundColor: 'white'
                          }}></span>
                        )}
                      </span>
                      <input 
                        type="radio"
                        name="paymentMethod"
                        value="bank-transfer"
                        checked={formData.paymentMethod === 'bank-transfer'}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontWeight: formData.paymentMethod === 'bank-transfer' ? '600' : '500' }}>Bankoverføring (Demo)</span>
                    </label>
                  </div>
                </div>
                
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#64748b', 
                  marginTop: '1.75rem', 
                  marginBottom: '0.75rem',
                  fontFamily: "'Outfit', sans-serif", 
                  letterSpacing: '-0.01em',
                  backgroundColor: 'rgba(241, 245, 249, 0.7)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  borderLeft: '3px solid #94a3b8',
                  fontStyle: 'italic'
                }}>
                  Merk: Dette er en demoside. Ingen faktisk betaling vil bli behandlet.
                </p>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.95rem' : '1.1rem',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                    transition: 'all 0.2s ease',
                    opacity: loading ? 0.7 : 1,
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '0.01em',
                    textTransform: 'uppercase'
                  }}
                >
                  {loading ? 'BEHANDLER...' : 'FULLFØR BESTILLING'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Order summary */}
          <div>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '0.75rem', 
              padding: isMobile ? '1.25rem' : '1.75rem',
              position: isMobile ? 'static' : 'sticky',
              top: '2rem',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
              marginTop: isMobile ? '1.5rem' : '0'
            }}>
              <h2 style={{ 
                fontSize: isMobile ? '1.25rem' : '1.375rem', 
                marginBottom: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                letterSpacing: '-0.025em',
                fontFamily: "'Outfit', sans-serif",
                color: '#0f172a'
              }}>Ordreoppsummering</h2>
              
              <div style={{ 
                marginBottom: isMobile ? '1.25rem' : '1.5rem', 
                maxHeight: isMobile ? '250px' : '300px', 
                overflowY: 'auto' 
              }}>
                {cartItems.map((item, index) => (
                  <div key={`${item.id}-${JSON.stringify(item.customOptions)}`} style={{
                    display: 'flex',
                    marginBottom: isMobile ? '1rem' : '1.25rem',
                    paddingBottom: isMobile ? '1rem' : '1.25rem',
                    borderBottom: index < cartItems.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <div style={{ 
                      width: isMobile ? '60px' : '70px', 
                      height: isMobile ? '60px' : '70px', 
                      marginRight: isMobile ? '0.75rem' : '1rem', 
                      flexShrink: 0 
                    }}>
                      <img 
                        src={item.image || '/placeholder-product.jpg'} 
                        alt={item.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '0.5rem',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' 
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontWeight: '600', 
                        marginBottom: '0.3rem',
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '-0.01em',
                        fontSize: '1rem',
                        color: '#0f172a'
                      }}>{item.name}</p>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#64748b', 
                        marginBottom: '0.3rem',
                        fontFamily: "'Outfit', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <span style={{ fontWeight: '600', color: '#475569' }}>Antall:</span> {item.quantity}
                      </p>
                      {Object.keys(item.customOptions).length > 0 && (
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#64748b',
                          fontFamily: "'Outfit', sans-serif"
                        }}>
                          {item.customOptions.material && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ fontWeight: '600', color: '#475569' }}>Materiale:</span> {item.customOptions.material}
                              {item.customOptions.color && <span>, </span>}
                            </span>
                          )}
                          {item.customOptions.color && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ fontWeight: '600', color: '#475569' }}>Farge:</span> {item.customOptions.color}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      fontWeight: '700',
                      fontFamily: "'Outfit', sans-serif",
                      color: '#0284c7',
                      fontSize: '1.05rem',
                      display: 'flex',
                      alignItems: 'center',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      padding: '0.4rem 0.7rem',
                      borderRadius: '0.5rem',
                      height: 'fit-content'
                    }}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                borderTop: '1px solid #e2e8f0', 
                paddingTop: '1.25rem', 
                marginBottom: '1.25rem',
                backgroundColor: 'rgba(248, 250, 252, 0.5)',
                padding: '1.25rem',
                borderRadius: '0.6rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ 
                    color: '#475569',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>Delsum</span>
                  <span style={{ 
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: '600',
                    color: '#0f172a'
                  }}>{formatPrice(cartTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ 
                    color: '#475569',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>Moms (25%)</span>
                  <span style={{ 
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: '600',
                    color: '#0f172a'
                  }}>{formatPrice(cartTotal * 0.25)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ 
                    color: '#475569',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>Frakt</span>
                  <span style={{ 
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: '600',
                    color: '#10b981'
                  }}>Gratis</span>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '1.25rem', 
                borderTop: '1px solid #e2e8f0', 
                fontWeight: 'bold', 
                fontSize: '1.25rem',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.01em',
                margin: '0.5rem 0 1.25rem'
              }}>
                <span style={{ color: '#0f172a' }}>Totalt</span>
                <span style={{ 
                  color: '#0284c7',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}>{formatPrice(cartTotal * 1.25)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;