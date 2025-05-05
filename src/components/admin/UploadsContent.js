import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEye, FaTrash, FaDownload } from 'react-icons/fa';

export default function UploadsContent() {
  const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch uploads
    const fetchUploads = async () => {
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

        const response = await fetch('/api/uploads', { headers });
        if (response.ok) {
          const data = await response.json();
          setUploads(data.uploads || []);
        }
      } catch (error) {
        console.error('Failed to fetch uploads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploads();
  }, []);

  // Filter uploads by search query
  const filteredUploads = uploads.filter(upload => {
    const searchLower = searchQuery.toLowerCase();
    return (
      upload.id?.toString().includes(searchLower) ||
      upload.filename?.toLowerCase().includes(searchLower) ||
      upload.originalFilename?.toLowerCase().includes(searchLower) ||
      upload.fileType?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Uploads</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <FaSearch className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search uploads..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative inline-block text-left">
            <button 
              className="flex items-center px-4 py-2 border rounded-md bg-white"
            >
              <FaFilter className="mr-2" /> Filter
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUploads.length > 0 ? (
          filteredUploads.map((upload) => (
            <div key={upload.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold truncate">{upload.originalFilename || 'Unnamed file'}</h3>
                <p className="text-sm text-gray-500">{upload.fileType || 'Unknown type'}</p>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">
                    Size: {(upload.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span className="text-sm font-medium">
                    Uploaded: {new Date(upload.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {upload.orderId ? (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Order #{upload.orderId}
                    </span>
                  </div>
                ) : null}

                {upload.analysisResults ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Analysis Results:</h4>
                    <div className="text-xs bg-gray-50 p-2 rounded">
                      <p><strong>Volume:</strong> {upload.analysisResults.volume} cm³</p>
                      <p><strong>Dimensions:</strong> {upload.analysisResults.dimensions}</p>
                      <p><strong>Weight:</strong> {upload.analysisResults.weight} g</p>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-end space-x-2">
                  <button className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200">
                    <FaEye />
                  </button>
                  <button className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200">
                    <FaDownload />
                  </button>
                  <button className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 flex justify-center items-center h-64 bg-white rounded-lg shadow">
            <p className="text-gray-500">No uploads found</p>
          </div>
        )}
      </div>
    </div>
  );
}