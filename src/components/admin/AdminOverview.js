import { FaBoxOpen, FaUsers, FaFileUpload, FaMoneyBillWave, FaShoppingBag, FaExclamationTriangle } from 'react-icons/fa';

export default function AdminOverview({ stats }) {
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
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => (
        <a 
          key={index}
          href={card.link}
          className={`card ${card.bgColor} p-6 flex items-center transition-transform hover:scale-105`}
        >
          <div className="mr-4">{card.icon}</div>
          <div>
            <p className="text-gray-500 text-sm">{card.title}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        </a>
      ))}
    </div>
  );
}