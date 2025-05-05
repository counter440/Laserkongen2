import { useState, useEffect } from 'react';
import { FaBoxOpen, FaUsers, FaFileUpload, FaMoneyBillWave, FaShoppingBag, FaExclamationTriangle } from 'react-icons/fa';

export default function DashboardContent() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalUploads: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        // Get auth token from session storage
        const userInfo = sessionStorage.getItem('userInfo')
          ? JSON.parse(sessionStorage.getItem('userInfo'))
          : null;
          
        // If no auth token, return early
        if (!userInfo || !userInfo.token) {
          console.error('No authentication token found');
          setIsLoading(false);
          return;
        }
        
        // Set up the auth header
        const headers = {
          'Authorization': `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        };
        
        const [ordersRes, usersRes, productsRes, uploadsRes] = await Promise.all([
          fetch('/api/orders/stats', { headers }),
          fetch('/api/users?count=true', { headers }),
          fetch('/api/products?count=true', { headers }),
          fetch('/api/uploads?count=true', { headers })
        ]);

        if (ordersRes.ok && usersRes.ok && productsRes.ok && uploadsRes.ok) {
          const ordersData = await ordersRes.json();
          const usersData = await usersRes.json();
          const productsData = await productsRes.json();
          const uploadsData = await uploadsRes.json();

          setStats({
            totalOrders: ordersData.totalOrders || 0,
            pendingOrders: ordersData.pendingOrders || 0,
            totalRevenue: ordersData.totalRevenue || 0,
            totalUsers: usersData.count || 0,
            totalProducts: productsData.count || 0,
            totalUploads: uploadsData.count || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <FaBoxOpen className="h-6 w-6 text-blue-500" />,
      bgColor: 'bg-blue-50',
      link: '/admin/orders'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: <FaExclamationTriangle className="h-6 w-6 text-yellow-500" />,
      bgColor: 'bg-yellow-50',
      link: '/admin/orders?status=pending'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: <FaMoneyBillWave className="h-6 w-6 text-green-500" />,
      bgColor: 'bg-green-50',
      link: '/admin/reports/revenue'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <FaUsers className="h-6 w-6 text-purple-500" />,
      bgColor: 'bg-purple-50',
      link: '/admin/users'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: <FaShoppingBag className="h-6 w-6 text-indigo-500" />,
      bgColor: 'bg-indigo-50',
      link: '/admin/products'
    },
    {
      title: 'Total Uploads',
      value: stats.totalUploads,
      icon: <FaFileUpload className="h-6 w-6 text-pink-500" />,
      bgColor: 'bg-pink-50',
      link: '/admin/uploads'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`card ${card.bgColor} p-6 flex items-center transition-transform hover:scale-105`}
          >
            <div className="mr-4">{card.icon}</div>
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}