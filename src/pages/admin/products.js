import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaStore, FaEdit, FaTrashAlt, FaPlus, FaSearch, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import AdminSidebar from '../../components/admin/AdminSidebar';
import withAdminAuth from '../../middleware/authAdminPage';

const AdminProducts = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '3d-printing',
    images: [''],
    materials: [{ name: '', price: '' }],
    colors: [''],
    inStock: true,
    featuredProduct: false,
    dimensions: {
      width: '',
      height: '',
      depth: '',
      unit: 'cm'
    },
    weight: {
      value: '',
      unit: 'g'
    },
    customizationOptions: {
      canCustomizeSize: false,
      canCustomizeColor: false,
      canCustomizeMaterial: false,
      canCustomizeDesign: false
    },
    printTime: ''
  });
  
  // Load data on mount
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      
      // Check if userInfo exists and has a token
      if (!userInfo || !userInfo.token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle top-level properties
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleArrayInput = (index, field, value, parentField = null) => {
    setFormData(prev => {
      if (parentField) {
        // Handle nested arrays (e.g., materials with name and price)
        const updatedArray = [...prev[parentField]];
        updatedArray[index] = {
          ...updatedArray[index],
          [field]: value
        };
        return {
          ...prev,
          [parentField]: updatedArray
        };
      } else {
        // Handle simple arrays (e.g., images, colors)
        const updatedArray = [...prev[field]];
        updatedArray[index] = value;
        return {
          ...prev,
          [field]: updatedArray
        };
      }
    });
  };
  
  const addArrayItem = (field, defaultValue = '') => {
    setFormData(prev => {
      if (field === 'materials') {
        return {
          ...prev,
          [field]: [...prev[field], { name: '', price: '' }]
        };
      } else {
        return {
          ...prev,
          [field]: [...prev[field], defaultValue]
        };
      }
    });
  };
  
  const removeArrayItem = (field, index) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return {
        ...prev,
        [field]: newArray
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      
      // Clean up form data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        printTime: formData.printTime ? parseFloat(formData.printTime) : undefined,
        dimensions: {
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined,
          depth: formData.dimensions.depth ? parseFloat(formData.dimensions.depth) : undefined,
          unit: formData.dimensions.unit
        },
        weight: {
          value: formData.weight.value ? parseFloat(formData.weight.value) : undefined,
          unit: formData.weight.unit
        },
        // Filter out empty values
        images: formData.images.filter(img => img.trim() !== ''),
        colors: formData.colors.filter(color => color.trim() !== ''),
        materials: formData.materials.filter(mat => mat.name.trim() !== '').map(mat => ({
          name: mat.name,
          price: parseFloat(mat.price) || 0
        }))
      };
      
      const url = currentProduct 
        ? `/api/products/${currentProduct.id}`
        : '/api/products';
        
      const method = currentProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save product');
      }
      
      // Success!
      setShowAddModal(false);
      setShowEditModal(false);
      setCurrentProduct(null);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '3d-printing',
        images: [''],
        materials: [{ name: '', price: '' }],
        colors: [''],
        inStock: true,
        featuredProduct: false,
        dimensions: {
          width: '',
          height: '',
          depth: '',
          unit: 'cm'
        },
        weight: {
          value: '',
          unit: 'g'
        },
        customizationOptions: {
          canCustomizeSize: false,
          canCustomizeColor: false,
          canCustomizeMaterial: false,
          canCustomizeDesign: false
        },
        printTime: ''
      });
      
      // Refresh product list
      fetchProducts();
      
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (product) => {
    setCurrentProduct(product);
    
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || '3d-printing',
      images: product.images?.length > 0 ? [...product.images] : [''],
      materials: product.materials?.length > 0 ? [...product.materials] : [{ name: '', price: '' }],
      colors: product.colors?.length > 0 ? [...product.colors] : [''],
      inStock: product.inStock !== undefined ? product.inStock : true,
      featuredProduct: product.featuredProduct || false,
      dimensions: {
        width: product.dimensions?.width || '',
        height: product.dimensions?.height || '',
        depth: product.dimensions?.depth || '',
        unit: product.dimensions?.unit || 'cm'
      },
      weight: {
        value: product.weight?.value || '',
        unit: product.weight?.unit || 'g'
      },
      customizationOptions: {
        canCustomizeSize: product.customizationOptions?.canCustomizeSize || false,
        canCustomizeColor: product.customizationOptions?.canCustomizeColor || false,
        canCustomizeMaterial: product.customizationOptions?.canCustomizeMaterial || false,
        canCustomizeDesign: product.customizationOptions?.canCustomizeDesign || false
      },
      printTime: product.printTime || ''
    });
    
    setShowEditModal(true);
  };
  
  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      setLoading(true);
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete product');
      }
      
      // Refresh product list
      fetchProducts();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter products by search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatPrice = (price) => {
    return `kr ${parseFloat(price).toFixed(2)}`;
  };
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Head>
        <title>Product Management | Admin Dashboard</title>
        <meta name="description" content="Manage your products" />
      </Head>
      
      {/* Global styles */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
        }
        
        * {
          box-sizing: border-box;
        }
        
        button, input, select, textarea {
          font-family: inherit;
          font-size: inherit;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <AdminSidebar />
      
      {/* Main content */}
      <div style={{ flexGrow: 1, backgroundColor: '#f1f5f9', padding: '20px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Product Management</h1>
          
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#1e3a8a',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 150ms ease',
              border: 'none'
            }}
          >
            <FaPlus size={14} />
            Add Product
          </button>
        </div>
        
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaExclamationCircle />
            {error}
          </div>
        )}
        
        {/* Search and filters */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <input 
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                width: '100%'
              }}
            />
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>
        
        {/* Products table */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <FaSpinner style={{ fontSize: '24px', color: '#64748b', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              {searchTerm ? 'No products match your search' : 'No products found. Create your first product!'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Image</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Price</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ width: '50px', height: '50px', overflow: 'hidden', borderRadius: '4px' }}>
                        <img 
                          src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.jpg'} 
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>
                        <p style={{ fontWeight: '500' }}>{product.name}</p>
                        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                          {product.description.length > 60 
                            ? product.description.substring(0, 60) + '...' 
                            : product.description}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{product.category}</td>
                    <td style={{ padding: '12px 16px' }}>{formatPrice(product.price)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        backgroundColor: product.inStock ? '#dcfce7' : '#fee2e2',
                        color: product.inStock ? '#166534' : '#b91c1c'
                      }}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleEdit(product)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          padding: '2rem',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            padding: '24px', 
            width: '800px',
            maxWidth: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {currentProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setCurrentProduct(null);
                }}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: 'none', 
                  fontSize: '20px', 
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db'
                  }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label htmlFor="price" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Price (kr) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
                
                <div>
                  <label htmlFor="category" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    <option value="3d-printing">3D Printing</option>
                    <option value="laser-engraving">Laser Engraving</option>
                    <option value="custom">Custom</option>
                    <option value="ready-made">Ready-made</option>
                  </select>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Images
                </label>
                {formData.images.map((url, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleArrayInput(index, 'images', e.target.value)}
                      placeholder="Image URL"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => removeArrayItem('images', index)}
                      disabled={formData.images.length <= 1}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0 8px',
                        cursor: formData.images.length <= 1 ? 'not-allowed' : 'pointer',
                        opacity: formData.images.length <= 1 ? 0.5 : 1
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => addArrayItem('images')}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + Add Image
                </button>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Materials
                </label>
                {formData.materials.map((material, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={material.name}
                      onChange={(e) => handleArrayInput(index, 'name', e.target.value, 'materials')}
                      placeholder="Material name"
                      style={{
                        flex: 2,
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                    <input
                      type="number"
                      value={material.price}
                      onChange={(e) => handleArrayInput(index, 'price', e.target.value, 'materials')}
                      placeholder="Add. price"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => removeArrayItem('materials', index)}
                      disabled={formData.materials.length <= 1}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0 8px',
                        cursor: formData.materials.length <= 1 ? 'not-allowed' : 'pointer',
                        opacity: formData.materials.length <= 1 ? 0.5 : 1
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => addArrayItem('materials')}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + Add Material
                </button>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Colors
                </label>
                {formData.colors.map((color, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => handleArrayInput(index, 'colors', e.target.value)}
                      placeholder="Color name"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => removeArrayItem('colors', index)}
                      disabled={formData.colors.length <= 1}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0 8px',
                        cursor: formData.colors.length <= 1 ? 'not-allowed' : 'pointer',
                        opacity: formData.colors.length <= 1 ? 0.5 : 1
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => addArrayItem('colors')}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + Add Color
                </button>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
                  Dimensions
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <input
                      type="number"
                      name="dimensions.width"
                      value={formData.dimensions.width}
                      onChange={handleInputChange}
                      placeholder="Width"
                      min="0"
                      step="0.1"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="dimensions.height"
                      value={formData.dimensions.height}
                      onChange={handleInputChange}
                      placeholder="Height"
                      min="0"
                      step="0.1"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="dimensions.depth"
                      value={formData.dimensions.depth}
                      onChange={handleInputChange}
                      placeholder="Depth"
                      min="0"
                      step="0.1"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>
                  <div>
                    <select
                      name="dimensions.unit"
                      value={formData.dimensions.unit}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    >
                      <option value="cm">cm</option>
                      <option value="mm">mm</option>
                      <option value="in">inches</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
                  Weight
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <div>
                    <input
                      type="number"
                      name="weight.value"
                      value={formData.weight.value}
                      onChange={handleInputChange}
                      placeholder="Weight"
                      min="0"
                      step="0.1"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>
                  <div>
                    <select
                      name="weight.unit"
                      value={formData.weight.unit}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="lb">lb</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="printTime" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Print Time (hours)
                </label>
                <input
                  type="number"
                  id="printTime"
                  name="printTime"
                  value={formData.printTime}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
                  Customization Options
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="customizationOptions.canCustomizeSize"
                        checked={formData.customizationOptions.canCustomizeSize}
                        onChange={handleInputChange}
                        style={{ marginRight: '8px' }}
                      />
                      Can Customize Size
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="customizationOptions.canCustomizeColor"
                        checked={formData.customizationOptions.canCustomizeColor}
                        onChange={handleInputChange}
                        style={{ marginRight: '8px' }}
                      />
                      Can Customize Color
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="customizationOptions.canCustomizeMaterial"
                        checked={formData.customizationOptions.canCustomizeMaterial}
                        onChange={handleInputChange}
                        style={{ marginRight: '8px' }}
                      />
                      Can Customize Material
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="customizationOptions.canCustomizeDesign"
                        checked={formData.customizationOptions.canCustomizeDesign}
                        onChange={handleInputChange}
                        style={{ marginRight: '8px' }}
                      />
                      Can Customize Design
                    </label>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="inStock"
                        checked={formData.inStock}
                        onChange={handleInputChange}
                        style={{ marginRight: '8px' }}
                      />
                      In Stock
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="featuredProduct"
                        checked={formData.featuredProduct}
                        onChange={handleInputChange}
                        style={{ marginRight: '8px' }}
                      />
                      Featured Product
                    </label>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setCurrentProduct(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Saving...' : (currentProduct ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAdminAuth(AdminProducts);