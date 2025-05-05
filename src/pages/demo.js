import { useState } from 'react';
import Head from 'next/head';

export default function Demo() {
  const [file, setFile] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [options, setOptions] = useState({
    material: 'pla',
    quality: 'standard',
    infill: 20
  });
  
  const handleFileChange = (e) => {
    if (e.target.files.length === 0) return;
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Mock data - in a real app this would come from the server
    setTimeout(() => {
      setModelData({
        volume: 125, // cm³
        weight: 150, // grams
        dimensions: { x: 10, y: 8, z: 5 }, // cm
        printTime: 3.5, // hours
      });
    }, 500);
  };
  
  const calculatePrice = () => {
    if (!modelData) return 0;
    
    const materialPrices = {
      pla: 0.05,
      abs: 0.06,
      petg: 0.07,
    };
    
    const qualityMultipliers = {
      draft: 0.8,
      standard: 1.0,
      high: 1.3,
    };
    
    const materialCost = modelData.weight * materialPrices[options.material];
    const qualityCost = materialCost * qualityMultipliers[options.quality];
    const infillMultiplier = 0.7 + (options.infill / 100) * 0.6;
    const adjustedCost = qualityCost * infillMultiplier;
    const timeCost = modelData.printTime * 5; // $5 per hour
    
    return (adjustedCost + timeCost).toFixed(2);
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Head>
        <title>Laserkongen Demo</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-4">3D Print Price Calculator</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="border p-4 rounded mb-4">
            <h2 className="font-bold mb-2">Upload 3D Model</h2>
            <input 
              type="file" 
              accept=".stl,.obj,.3mf" 
              onChange={handleFileChange}
              className="block w-full p-2 border rounded"
            />
          </div>
          
          {modelData && (
            <div className="border p-4 rounded">
              <h2 className="font-bold mb-2">Model Information</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>Volume:</div>
                <div>{modelData.volume} cm³</div>
                
                <div>Weight:</div>
                <div>{modelData.weight} g</div>
                
                <div>Dimensions:</div>
                <div>{modelData.dimensions.x} × {modelData.dimensions.y} × {modelData.dimensions.z} cm</div>
                
                <div>Print Time:</div>
                <div>{modelData.printTime} hours</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="border p-4 rounded mb-4">
            <h2 className="font-bold mb-2">Print Settings</h2>
            
            <div className="mb-3">
              <label className="block mb-1">Material</label>
              <select 
                value={options.material}
                onChange={(e) => setOptions({...options, material: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="pla">PLA</option>
                <option value="abs">ABS</option>
                <option value="petg">PETG</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label className="block mb-1">Quality</label>
              <select 
                value={options.quality}
                onChange={(e) => setOptions({...options, quality: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="draft">Draft (0.3mm layer height)</option>
                <option value="standard">Standard (0.2mm layer height)</option>
                <option value="high">High (0.1mm layer height)</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label className="block mb-1">Infill: {options.infill}%</label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={options.infill}
                onChange={(e) => setOptions({...options, infill: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="border p-4 rounded">
            <h2 className="font-bold mb-2">Price Calculation</h2>
            {!modelData ? (
              <p>Upload a file to see the price</p>
            ) : (
              <div>
                <div className="text-2xl font-bold text-center my-4">
                  ${calculatePrice()}
                </div>
                <button 
                  className="w-full p-2 bg-blue-500 text-white rounded font-bold"
                  onClick={() => alert('Added to cart!')}
                >
                  Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Admin Panel Preview */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Admin Dashboard Preview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border p-4 rounded bg-blue-50">
            <div className="font-bold">Total Orders</div>
            <div className="text-xl">124</div>
          </div>
          <div className="border p-4 rounded bg-green-50">
            <div className="font-bold">Revenue</div>
            <div className="text-xl">$12,850.75</div>
          </div>
          <div className="border p-4 rounded bg-yellow-50">
            <div className="font-bold">Pending Orders</div>
            <div className="text-xl">18</div>
          </div>
        </div>
        
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Order ID</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">#ORD-1234</td>
                <td className="p-2">John Doe</td>
                <td className="p-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Processing
                  </span>
                </td>
                <td className="p-2 text-right">$154.99</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">#ORD-1233</td>
                <td className="p-2">Jane Smith</td>
                <td className="p-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Shipped
                  </span>
                </td>
                <td className="p-2 text-right">$89.50</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">#ORD-1232</td>
                <td className="p-2">Mike Johnson</td>
                <td className="p-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Delivered
                  </span>
                </td>
                <td className="p-2 text-right">$212.75</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p className="mt-4 text-gray-500">
          The full application includes comprehensive order management, advanced 3D model analysis,
          and a complete e-commerce platform with products, user accounts, and more.
        </p>
      </div>
    </div>
  );
}