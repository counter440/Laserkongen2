import { useState, useEffect } from 'react';
import { FaSave, FaEnvelope, FaCreditCard, FaBell, FaGlobe, FaSearch } from 'react-icons/fa';

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState('site');
  const [settings, setSettings] = useState({
    site: {
      siteName: '',
      siteDescription: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      logo: '',
      favicon: ''
    },
    email: {
      provider: 'smtp',
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: ''
    },
    payments: {
      enableVipps: false,
      vippsClientId: '',
      vippsClientSecret: '',
      vippsSubKey: '',
      vippsMerchantId: '',
      testMode: true
    },
    notifications: {
      newOrderEmail: true,
      newOrderSms: false,
      paymentConfirmationEmail: true,
      orderStatusChangeEmail: true,
      newContactFormEmail: true
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch settings based on active tab
    const fetchSettings = async () => {
      setIsLoading(true);
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

        const response = await fetch(`/api/settings/${activeTab}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setSettings(prev => ({
            ...prev,
            [activeTab]: data
          }));
        }
      } catch (error) {
        console.error(`Failed to fetch ${activeTab} settings:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [activeTab]);

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Get auth token from session storage
      const userInfo = sessionStorage.getItem('userInfo')
        ? JSON.parse(sessionStorage.getItem('userInfo'))
        : null;
          
      // If no auth token, return early
      if (!userInfo || !userInfo.token) {
        console.error('No authentication token found');
        setIsSaving(false);
        alert('Authentication error. Please log in again.');
        return;
      }
      
      const response = await fetch(`/api/settings/${activeTab}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings[activeTab])
      });

      if (response.ok) {
        // Handle success
        alert('Settings saved successfully!');
      } else {
        // Handle error
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error(`Failed to save ${activeTab} settings:`, error);
      alert('An error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'site', label: 'Site', icon: <FaGlobe /> },
    { id: 'email', label: 'Email', icon: <FaEnvelope /> },
    { id: 'payments', label: 'Payments', icon: <FaCreditCard /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
  ];

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'site':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.site.siteName}
                  onChange={(e) => handleInputChange('site', 'siteName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.site.contactEmail}
                  onChange={(e) => handleInputChange('site', 'contactEmail', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
                value={settings.site.siteDescription}
                onChange={(e) => handleInputChange('site', 'siteDescription', e.target.value)}
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.site.contactPhone}
                  onChange={(e) => handleInputChange('site', 'contactPhone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.site.address}
                  onChange={(e) => handleInputChange('site', 'address', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.site.logo}
                  onChange={(e) => handleInputChange('site', 'logo', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Favicon URL
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.site.favicon}
                  onChange={(e) => handleInputChange('site', 'favicon', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.email.smtpHost}
                  onChange={(e) => handleInputChange('email', 'smtpHost', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Port
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.email.smtpPort}
                  onChange={(e) => handleInputChange('email', 'smtpPort', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Username
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.email.smtpUser}
                  onChange={(e) => handleInputChange('email', 'smtpUser', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.email.smtpPassword}
                  onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.email.fromEmail}
                  onChange={(e) => handleInputChange('email', 'fromEmail', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={settings.email.fromName}
                  onChange={(e) => handleInputChange('email', 'fromName', e.target.value)}
                />
              </div>
            </div>

            <div>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <FaEnvelope className="mr-2" /> Send Test Email
              </button>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-4">Vipps Settings</h3>
              
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="enableVipps"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={settings.payments.enableVipps}
                  onChange={(e) => handleInputChange('payments', 'enableVipps', e.target.checked)}
                />
                <label htmlFor="enableVipps" className="ml-2 block text-sm text-gray-900">
                  Enable Vipps Payments
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={settings.payments.vippsClientId}
                    onChange={(e) => handleInputChange('payments', 'vippsClientId', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={settings.payments.vippsClientSecret}
                    onChange={(e) => handleInputChange('payments', 'vippsClientSecret', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Key
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={settings.payments.vippsSubKey}
                    onChange={(e) => handleInputChange('payments', 'vippsSubKey', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={settings.payments.vippsMerchantId}
                    onChange={(e) => handleInputChange('payments', 'vippsMerchantId', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="testMode"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={settings.payments.testMode}
                  onChange={(e) => handleInputChange('payments', 'testMode', e.target.checked)}
                />
                <label htmlFor="testMode" className="ml-2 block text-sm text-gray-900">
                  Test Mode (No real payments will be processed)
                </label>
              </div>

              <div className="mt-4">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Test Vipps Connection
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="newOrderEmail"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings.notifications.newOrderEmail}
                      onChange={(e) => handleInputChange('notifications', 'newOrderEmail', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="newOrderEmail" className="font-medium text-gray-700">New Order Notification</label>
                    <p className="text-gray-500">Receive an email when a new order is placed</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="paymentConfirmationEmail"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings.notifications.paymentConfirmationEmail}
                      onChange={(e) => handleInputChange('notifications', 'paymentConfirmationEmail', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="paymentConfirmationEmail" className="font-medium text-gray-700">Payment Confirmation</label>
                    <p className="text-gray-500">Receive an email when a payment is confirmed</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="orderStatusChangeEmail"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings.notifications.orderStatusChangeEmail}
                      onChange={(e) => handleInputChange('notifications', 'orderStatusChangeEmail', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="orderStatusChangeEmail" className="font-medium text-gray-700">Order Status Changes</label>
                    <p className="text-gray-500">Receive an email when an order status changes</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="newContactFormEmail"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings.notifications.newContactFormEmail}
                      onChange={(e) => handleInputChange('notifications', 'newContactFormEmail', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="newContactFormEmail" className="font-medium text-gray-700">Contact Form Submissions</label>
                    <p className="text-gray-500">Receive an email when a contact form is submitted</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">SMS Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="newOrderSms"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings.notifications.newOrderSms}
                      onChange={(e) => handleInputChange('notifications', 'newOrderSms', e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="newOrderSms" className="font-medium text-gray-700">New Order SMS</label>
                    <p className="text-gray-500">Receive a text message when a new order is placed</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 p-4 rounded">
                <p className="text-sm text-yellow-700">
                  Note: SMS notifications require additional configuration and may incur charges from your SMS provider.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : (
            <>
              <FaSave className="mr-2" /> Save Settings
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="flex items-center">
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}