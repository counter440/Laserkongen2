import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import Head from 'next/head';
import { FaUpload, FaCheck, FaSpinner, FaShoppingCart, FaCube } from 'react-icons/fa';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import ModelAnalysisPanel from '@/components/ModelAnalysisPanel';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';

// A shared context for model data
const ModelContext = createContext(null);

const useModelData = () => useContext(ModelContext);

const ModelProvider = ({ children, onModelAnalyzed }) => {
  const [modelData, setModelData] = useState(null);
  
  const analyzeModel = useCallback((geometry) => {
    if (!geometry) return null;

    // Compute bounding box for dimensions
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    
    // Calculate dimensions in cm (assuming the model is in mm)
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // Convert to cm by dividing by 10
    const dimensions = {
      x: parseFloat((size.x / 10).toFixed(2)),
      y: parseFloat((size.y / 10).toFixed(2)),
      z: parseFloat((size.z / 10).toFixed(2))
    };
    
    // Calculate bounding box volume in cm³
    const boundingVolume = dimensions.x * dimensions.y * dimensions.z;
    
    // Calculate a more realistic volume using a shape factor
    // Most 3D prints are hollow and have much less volume than their bounding box
    // Using a very conservative shape factor for more accurate results
    const shapeFactor = 0.15; // Only 15% of bounding box is actual material
    
    // Apply shape factor to get a more realistic volume estimation
    const volume = parseFloat((boundingVolume * shapeFactor).toFixed(2));
    
    // Weight calculation needs to be decoupled from volume for more accurate results
    // For 3D prints, we use a formula based on volume but with adjusted parameters
    
    // PLA density ~1.24 g/cm³, but print weight depends on infill and shell
    const density = 1.24; // g/cm³ for PLA
    
    // For weight calculation, we use a higher effective volume factor
    // This is because weight doesn't scale linearly with visible volume
    const weightVolumeFactor = 0.4; // 40% of bounding box for weight calculation
    
    // Calculate effective volume for weight (higher than visible volume)
    const effectiveVolumeForWeight = boundingVolume * weightVolumeFactor;
    
    // Apply infill and shell settings
    const infillFactor = 0.25; // 25% infill as default
    const shellPercentage = 0.15; // Shell is approximately 15% of volume
    
    // Calculate weight with higher effective volume
    const weight = parseFloat((effectiveVolumeForWeight * density * (shellPercentage + infillFactor * (1-shellPercentage))).toFixed(2));
    
    // Calculate print time (rough estimation: 1 hour per 40g of filament - halved from original)
    const printTime = parseFloat((weight / 40).toFixed(1));
    
    const data = {
      dimensions,
      volume,
      weight,
      printTime
    };
    
    setModelData(data);
    if (onModelAnalyzed) {
      onModelAnalyzed(data);
    }
    
    return data;
  }, [onModelAnalyzed]);
  
  return (
    <ModelContext.Provider value={{ modelData, analyzeModel }}>
      {children}
    </ModelContext.Provider>
  );
};

// This is a component that loads and displays the 3D model
function Model({ url, onModelLoaded }) {
  const { scene, gl, camera } = useThree();
  const [model, setModel] = useState(null);
  const { analyzeModel } = useModelData();
  
  // Expose renderer for screenshot capture
  useEffect(() => {
    if (gl && window) {
      // Store both the renderer and the scene/camera for complete access
      window.modelRenderer = gl;
      window.modelScene = scene;
      window.modelCamera = camera;
      
      // Force a render to make sure scene is correctly displayed
      gl.render(scene, camera);
    }
    return () => {
      if (window) {
        window.modelRenderer = null;
        window.modelScene = null;
        window.modelCamera = null;
      }
    };
  }, [gl, scene, camera]);
  
  useEffect(() => {
    // Clear previous model from scene when URL changes
    if (model) {
      scene.remove(model);
      setModel(null);
    }
    
    if (!url) return;
    
    // Safety check - if we're dealing with large files, don't attempt to load them
    // The file size check and estimation is already handled in handleFileChange
    if (url.includes("large_file_estimation")) {
      return; // Skip loading for large files where we're using estimates
    }
    
    // Determine file extension
    const fileExtension = url.split('.').pop().toLowerCase();
    
    try {
      // Try to detect file type based on URL/BLOB
      if (url.startsWith('blob:') || fileExtension === 'stl') {
        // Use STLLoader for STL files with try-catch for memory errors
        const loader = new STLLoader();
        
        // Instead of adding a placeholder immediately, we'll just track whether we've loaded a model
        let placeholderMesh = null;
        
        try {
          loader.load(
            url,
            (geometry) => {
              try {
                // Remove placeholder if it exists
                if (placeholderMesh) {
                  scene.remove(placeholderMesh);
                }
                
                // Analyze the geometry and get actual model data
                const modelData = analyzeModel(geometry);
                
                const material = new THREE.MeshStandardMaterial({ 
                  color: 0x2196f3,
                  roughness: 0.5,
                  metalness: 0.2,
                  flatShading: false
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                // Center the model by computing bounding box
                geometry.computeBoundingBox();
                const boundingBox = geometry.boundingBox;
                const center = new THREE.Vector3();
                boundingBox.getCenter(center);
                
                // First reset any existing transformations
                mesh.position.set(0, 0, 0);
                mesh.rotation.set(0, 0, 0);
                mesh.scale.set(1, 1, 1);
                
                // Create a proper geometry group to handle centering
                const group = new THREE.Group();
                group.add(mesh);
                
                // Step 1: Center the mesh
                mesh.position.set(-center.x, -center.y, -center.z);
                
                // Step 2: Get the size of the model
                const size = new THREE.Vector3();
                boundingBox.getSize(size);
                
                // Scale the model to a reasonable size
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim; // Smaller scale for better view
                group.scale.set(scale, scale, scale);
                
                // First apply the rotation
                group.rotation.x = -Math.PI / 2; // Rotate 90 degrees around X axis
                
                // IMPORTANT: Now after rotation we need to reposition
                // Add the group to scene temporarily so we can get correct world bounds
                scene.add(group);
                
                // Force update matrices to get proper bounding box in world space
                group.updateMatrixWorld(true);
                
                // Calculate world bounds
                const bbox = new THREE.Box3().setFromObject(mesh);
                
                // Position the group so the bottom of the mesh is at y=0
                group.position.y = -bbox.min.y;
                
                // Remove from scene (will be added properly later)
                scene.remove(group);
                
                // Set up shadows
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                // Replace the placeholder with the actual model
                scene.remove(placeholderMesh);
                scene.add(group);
                setModel(group);
                
                if (onModelLoaded) {
                  onModelLoaded(modelData);
                }
              } catch (geometryError) {
                console.error('Error processing STL geometry:', geometryError);
                
                // On error, keep using the placeholder but with a different color
                placeholderMaterial.color.set(0xf59e0b); // Amber color to indicate issue
                
                if (onModelLoaded) {
                  // Generate fallback data based on file size if available
                  const fallbackData = {
                    dimensions: { x: 5, y: 5, z: 5 },
                    volume: fileSizeMB ? fileSizeMB * 5 : 125,
                    weight: fileSizeMB ? fileSizeMB * 3 : 75,
                    printTime: fileSizeMB ? (fileSizeMB * 3) / 20 : 3.5
                  };
                  onModelLoaded(fallbackData);
                }
              }
            },
            (xhr) => {
              // Progress callback (optional)
              console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            (error) => {
              console.error('Error loading STL:', error);
              
              // Create a simple placeholder cube on load error
              const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
              const cubeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000, // Red to indicate error
                transparent: true, 
                opacity: 0.8
              });
              const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
              cube.castShadow = true;
              cube.receiveShadow = true;
              
              if (model) {
                scene.remove(model);
              }
              
              scene.add(cube);
              setModel(cube);
              
              if (onModelLoaded) {
                // Generate fallback data
                const fallbackData = {
                  dimensions: { x: 5, y: 5, z: 5 },
                  volume: 125,
                  weight: 75,
                  printTime: 3.5
                };
                onModelLoaded(fallbackData);
              }
            }
          );
          
          // No cleanup needed for this simple implementation
        } catch (loaderError) {
          console.error('Exception in STL loader setup:', loaderError);
          
          // Create a simple cube as fallback
          const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
          const cubeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, // Red to indicate error
            transparent: true, 
            opacity: 0.8
          });
          const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
          cube.castShadow = true;
          cube.receiveShadow = true;
          
          if (model) {
            scene.remove(model);
          }
          
          scene.add(cube);
          setModel(cube);
          
          // Generate fallback data
          if (onModelLoaded) {
            const fallbackData = {
              dimensions: { x: 5, y: 5, z: 5 },
              volume: 125,
              weight: 75,
              printTime: 3.5
            };
            onModelLoaded(fallbackData);
          }
        }
      } else if (fileExtension === 'obj') {
        console.log('OBJ file format detected - will add support soon');
        // Placeholder for OBJ support
        
        // Create a fallback for OBJ files
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x2196f3,
          transparent: true, 
          opacity: 0.8
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        if (model) {
          scene.remove(model);
        }
        
        scene.add(cube);
        setModel(cube);
        
        if (onModelLoaded) {
          // Generate fallback data
          const fallbackData = {
            dimensions: { x: 5, y: 5, z: 5 },
            volume: 125,
            weight: 75,
            printTime: 3.5
          };
          onModelLoaded(fallbackData);
        }
        
      } else if (fileExtension === '3mf') {
        console.log('3MF file format detected - importing Three.js ThreeMFLoader');
        
        // We need to get the 3MFLoader directly from three-stdlib to avoid import issues
        import('three-stdlib').then(ThreeStdLib => {
          console.log('Three-stdlib imported successfully');
          const ThreeMFLoader = ThreeStdLib.ThreeMFLoader;
          
          try {
            console.log('Initializing ThreeMFLoader');
            const loader = new ThreeMFLoader();
            console.log('Loading 3MF file from URL:', url);
            
            loader.load(
              url,
              (object) => {
                console.log('3MF loaded successfully:', object);
                
                // Remove previous model if it exists
                if (model) {
                  scene.remove(model);
                }
                
                // Create a group to hold the loaded model
                const group = new THREE.Group();
                group.add(object);
                
                // Scale and position the model
                const bbox = new THREE.Box3().setFromObject(object);
                const size = new THREE.Vector3();
                bbox.getSize(size);
                
                console.log('Model dimensions:', size);
                
                // Calculate scale to make the model a reasonable size
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                group.scale.set(scale, scale, scale);
                
                // Center the object
                const center = new THREE.Vector3();
                bbox.getCenter(center);
                object.position.set(-center.x, -center.y, -center.z);
                
                // Apply rotation to the group
                group.rotation.x = -Math.PI / 2;
                
                // Set up shadows
                object.traverse(child => {
                  if (child.isMesh) {
                    console.log('Processing mesh in 3MF:', child);
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Update materials if needed
                    if (!child.material || !child.material.isMeshStandardMaterial) {
                      child.material = new THREE.MeshStandardMaterial({
                        color: (child.material && child.material.color) ? child.material.color : 0x2196f3,
                        roughness: 0.5,
                        metalness: 0.2
                      });
                    }
                  }
                });
                
                // Add to scene
                scene.add(group);
                setModel(group);
                
                // Generate model data
                // Since we can't directly compute volume from a Group,
                // we'll estimate based on bounding box
                const dimensions = {
                  x: parseFloat((size.x / 10).toFixed(2)),
                  y: parseFloat((size.y / 10).toFixed(2)), 
                  z: parseFloat((size.z / 10).toFixed(2))
                };
                
                const volume = parseFloat((dimensions.x * dimensions.y * dimensions.z).toFixed(2));
                const density = 1.24; // PLA density
                const infillFactor = 0.5; // 50% infill
                const weight = parseFloat((volume * density * infillFactor).toFixed(2));
                const printTime = parseFloat((weight / 20).toFixed(1));
                
                const modelData = {
                  dimensions,
                  volume,
                  weight,
                  printTime
                };
                
                console.log('3MF analysis complete:', modelData);
                
                if (onModelLoaded) {
                  onModelLoaded(modelData);
                }
              },
              (xhr) => {
                console.log(`3MF loading progress: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
              },
              (error) => {
                console.error('Error loading 3MF:', error);
                
                // Create a fallback cube on error
                const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
                const cubeMaterial = new THREE.MeshStandardMaterial({ 
                  color: 0x2196f3,
                  transparent: true, 
                  opacity: 0.8
                });
                const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
                cube.castShadow = true;
                cube.receiveShadow = true;
                
                if (model) {
                  scene.remove(model);
                }
                
                scene.add(cube);
                setModel(cube);
                
                if (onModelLoaded) {
                  // Generate fallback data
                  const fallbackData = {
                    dimensions: { x: 5, y: 5, z: 5 },
                    volume: 125,
                    weight: 75,
                    printTime: 3.5
                  };
                  onModelLoaded(fallbackData);
                }
              }
            );
          } catch (error) {
            console.error('Failed to initialize 3MF loader:', error);
            
            // Create a fallback cube
            const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
            const cubeMaterial = new THREE.MeshStandardMaterial({ 
              color: 0x2196f3,
              transparent: true, 
              opacity: 0.8
            });
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.castShadow = true;
            cube.receiveShadow = true;
            
            if (model) {
              scene.remove(model);
            }
            
            scene.add(cube);
            setModel(cube);
            
            if (onModelLoaded) {
              const fallbackData = {
                dimensions: { x: 5, y: 5, z: 5 },
                volume: 125,
                weight: 75,
                printTime: 3.5
              };
              onModelLoaded(fallbackData);
            }
          }
        }).catch(error => {
          console.error('Failed to import three-stdlib for 3MF loading:', error);
          
          // Create a fallback cube if module import fails
          const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
          const cubeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2196f3,
            transparent: true, 
            opacity: 0.8
          });
          const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
          cube.castShadow = true;
          cube.receiveShadow = true;
          
          if (model) {
            scene.remove(model);
          }
          
          scene.add(cube);
          setModel(cube);
          
          if (onModelLoaded) {
            const fallbackData = {
              dimensions: { x: 5, y: 5, z: 5 },
              volume: 125,
              weight: 75,
              printTime: 3.5
            };
            onModelLoaded(fallbackData);
          }
        });
      } else {
        console.warn('File format not explicitly supported, trying STL loader...');
        // Try STL loader as fallback
        const loader = new STLLoader();
        loader.load(url, 
          (geometry) => {
            // Process geometry as above...
            const modelData = analyzeModel(geometry);
            
            const material = new THREE.MeshStandardMaterial({ 
              color: 0x2196f3,
              roughness: 0.5,
              metalness: 0.2,
              flatShading: false
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Center the model
            geometry.computeBoundingBox();
            const boundingBox = geometry.boundingBox;
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            // Center the mesh completely
            mesh.position.set(-center.x, -center.y, -center.z);
            
            // Create a group for better positioning
            const group = new THREE.Group();
            group.add(mesh);
            
            // Scale the model to a reasonable size
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3 / maxDim; // Slightly smaller scale for better view
            group.scale.set(scale, scale, scale);
            
            // First apply the rotation
            group.rotation.x = -Math.PI / 2; // Rotate 90 degrees around X axis
            
            // IMPORTANT: Now after rotation we need to reposition
            // Add the group to scene temporarily so we can get correct world bounds
            scene.add(group);
            
            // Force update matrices to get proper bounding box in world space
            group.updateMatrixWorld(true);
            
            // Calculate world bounds
            const bbox = new THREE.Box3().setFromObject(mesh);
            
            // Position the group so the bottom of the mesh is at y=0
            group.position.y = -bbox.min.y;
            
            // Remove from scene (will be added properly later)
            scene.remove(group);
            
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            if (model) {
              scene.remove(model);
            }
            scene.add(group);
            setModel(group);
            
            if (onModelLoaded) {
              onModelLoaded(modelData);
            }
          }, 
          null, 
          (error) => {
            console.error('Error loading with fallback loader:', error);
          }
        );
      }
    } catch (error) {
      console.error('Exception during model loading:', error);
    }
    
    // Cleanup function
    return () => {
      if (model) {
        scene.remove(model);
      }
    };
  }, [url, scene, model, analyzeModel, onModelLoaded]);
  
  return null; // The model is added directly to the scene
}

export default function Upload() {
  const { cartItems, addToCart } = useCart();
  const [file, setFile] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewKey, setPreviewKey] = useState(0); // Used to force re-render of 3D preview
  const [activeTab, setActiveTab] = useState('3d-printing');
  const [selectedMaterial, setSelectedMaterial] = useState('pla');
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedQuality, setSelectedQuality] = useState('standard');
  const [selectedInfill, setSelectedInfill] = useState(20);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelPreviewImage, setModelPreviewImage] = useState(null);
  
  // Final optimized pricing calculations
  const materialPrices = {
    pla: 0.04, // per gram (further increased)
    abs: 0.045,
    petg: 0.05,
    tpu: 0.08,
    nylon: 0.1,
  };
  
  const qualityMultipliers = {
    draft: 0.8,
    standard: 1.0,
    high: 1.6, // significant premium for high quality
  };
  
  const infillMultiplier = (infill) => 0.7 + (infill / 100) * 0.7; // stronger infill impact
  
  // Pricing adjustment factors
  const timeScalingFactor = 0.9; // only 10% reduction in time cost
  const totalPriceDiscountFactor = 1.0; // no discount at all
  
  // Handle model loaded callback from 3D viewer
  const handleModelLoaded = useCallback((data) => {
    if (data) {
      setModelData(data);
      setLoading(false);
      
      // Single capture attempt with a delay to ensure model is rendered
      setTimeout(() => {
        captureModelPreview();
        console.log('Model capture completed');
      }, 500);
    }
  }, []);
  
  // Function to capture a screenshot of the 3D model
  const captureModelPreview = () => {
    try {
      // Skip if we already have a preview image
      if (modelPreviewImage) {
        return;
      }
      
      // Check for empty data URLs
      const isEmptyDataUrl = (dataUrl) => {
        return !dataUrl || dataUrl.includes('data:,');
      };
      
      // Direct capture from the renderer with a subtle zoom
      if (window.modelRenderer && window.modelCamera && window.modelScene) {
        try {
          // Store original camera settings
          const originalFov = window.modelCamera.fov;
          const originalPosition = window.modelCamera.position.clone();
          
          // Apply zoom by reducing FOV
          window.modelCamera.fov = originalFov * 0.7;
          window.modelCamera.position.multiplyScalar(0.85);
          window.modelCamera.updateProjectionMatrix();
          
          // Render once with zoomed view
          window.modelRenderer.render(window.modelScene, window.modelCamera);
          
          // Get the data URL
          const dataUrl = window.modelRenderer.domElement.toDataURL('image/png');
          
          // Restore original camera settings
          window.modelCamera.fov = originalFov;
          window.modelCamera.position.copy(originalPosition);
          window.modelCamera.updateProjectionMatrix();
          window.modelRenderer.render(window.modelScene, window.modelCamera);
          
          // Save the image if it's valid
          if (!isEmptyDataUrl(dataUrl)) {
            setModelPreviewImage(dataUrl);
            return;
          }
        } catch (error) {
          // Fallback to direct canvas capture if renderer method fails
          const canvas = canvasRef.current?.querySelector('canvas');
          if (canvas) {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              if (!isEmptyDataUrl(dataUrl)) {
                setModelPreviewImage(dataUrl);
              }
            } catch (canvasError) {
              console.error('Canvas capture failed:', canvasError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in model preview capture:', error);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files.length === 0) return;
    
    const selectedFile = e.target.files[0];
    
    // Check file size
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      alert('Filstørrelsen overstiger 50MB. Last opp en mindre fil for å unngå minneproblemer.');
      return;
    }
    
    // Clear previous data when loading a new file
    setModelData(null);
    setFile(selectedFile);
    
    // Increment the preview key to force re-render of 3D preview component
    setPreviewKey(prevKey => prevKey + 1);
    
    // Check file extension
    const fileName = selectedFile.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    if (!['stl', 'obj', '3mf'].includes(fileExtension)) {
      alert('Vennligst last opp et støttet 3D-filformat (STL, OBJ, 3MF)');
      return;
    }
    
    // Start loading process
    setLoading(true);
    
    try {
      // Release previous preview URL if one exists
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      
      // Create a preview URL for the file
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      
      // Also upload the file to the server
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Get user info from localStorage if available
      const userInfo = localStorage.getItem('userInfo') 
        ? JSON.parse(localStorage.getItem('userInfo')) 
        : null;
      
      // Always try to send a model preview if available
      if (modelPreviewImage) {
        console.log('Adding model preview to form data, length:', modelPreviewImage.length);
        formData.append('preview', modelPreviewImage);
      } else {
        console.log('No model preview image available');
        // Try to get from localStorage as fallback
        const savedPreview = localStorage.getItem('lastModelPreview');
        if (savedPreview) {
          console.log('Using saved preview from localStorage');
          formData.append('preview', savedPreview);
        }
      }
      
      console.log('Sending file to upload API...');
      
      // Send file to the backend
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: userInfo?.token ? {
          'Authorization': `Bearer ${userInfo.token}`
        } : {},
        body: formData
      });
      
      let uploadedFileId = null;
      
      if (!uploadResponse.ok) {
        console.error('File upload to server failed:', await uploadResponse.text());
        console.warn('File upload to server failed, but continuing with local processing');
      } else {
        console.log('File uploaded successfully to server');
        // Get the uploaded file ID from the response
        const uploadedFileData = await uploadResponse.json();
        if (uploadedFileData && uploadedFileData.id) {
          uploadedFileId = uploadedFileData.id;
          console.log('Uploaded file ID:', uploadedFileId);
          
          // Store in localStorage as a backup
          localStorage.setItem('lastUploadedFileId', uploadedFileId);
        } else {
          console.error('No file ID returned from upload response:', uploadedFileData);
        }
        // The model data will be analyzed locally by the Model component
      }
      
      // Store the uploaded file ID for later use
      setUploadedFileId(uploadedFileId);
      
      // The actual model analysis is done in the Model component
      // which will call handleModelLoaded when finished
      
      console.log('File loading initiated:', {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileExtension,
        fileSize: fileSizeMB
      });
    } catch (error) {
      console.error("Error in file processing:", error);
      setLoading(false);
      alert("Det oppsto en feil under behandling av filen din. Prøv en annen fil.");
    }
  };
  
  const calculatePrice = () => {
    if (!modelData) return 0;
    
    const materialCost = modelData.weight * materialPrices[selectedMaterial];
    const qualityCost = materialCost * qualityMultipliers[selectedQuality];
    const infillCost = qualityCost * infillMultiplier(selectedInfill);
    const timeCost = modelData.printTime * 6.5 * timeScalingFactor; // $6.50 per hour of printing with only 10% reduction
    
    // Apply final pricing adjustments
    const rawTotalCost = (infillCost + timeCost) * quantity;
    const discountedCost = rawTotalCost * totalPriceDiscountFactor; // no discount
    
    // Apply minimum price of 99 NOK (equivalent to $9.43 at 10.5 exchange rate)
    const minPriceUSD = 99 / 10.5;
    return Math.max(discountedCost, minPriceUSD);
  };
  
  const handleAddToCart = () => {
    if (!modelData || !file || addedToCart) return;
    
    // Set button to "Added" state
    setAddedToCart(true);
    
    // Show loading state
    const loadingEl = document.createElement('div');
    loadingEl.textContent = 'Preparing your model...';
    loadingEl.style.position = 'fixed';
    loadingEl.style.bottom = '20px';
    loadingEl.style.right = '20px';
    loadingEl.style.background = '#0ea5e9';
    loadingEl.style.color = 'white';
    loadingEl.style.padding = '10px 20px';
    loadingEl.style.borderRadius = '5px';
    loadingEl.style.zIndex = '9999';
    document.body.appendChild(loadingEl);
    
    // Use existing preview image if available, otherwise capture once
    if (!modelPreviewImage) {
      captureModelPreview();
    }
    
    // Calculate the price with the currency conversion factor
    const rawPrice = calculatePrice();
    const displayPrice = rawPrice * 10.5; // This matches the display price shown to the user
    
    // Save the preview image to localStorage to ensure it persists
    if (modelPreviewImage) {
      try {
        localStorage.setItem('lastModelPreview', modelPreviewImage);
      } catch (storageError) {
        console.error('Could not save preview to localStorage:', storageError);
      }
    }
    
    // Remove loading indicator
    document.body.removeChild(loadingEl);
    
    const customProduct = {
      id: 'custom-' + Date.now(),
      name: file.name.split('.')[0] || 'Tilpasset 3D-utskrift',
      price: displayPrice, // Use the same price shown in the UI
      image: modelPreviewImage || localStorage.getItem('lastModelPreview') || '/images/phone-stand.jpg', // Use the captured 3D preview with fallbacks
      customOptions: {
        type: activeTab,
        material: selectedMaterial,
        color: selectedColor,
        quality: selectedQuality,
        infill: selectedInfill,
        notes: additionalNotes,
        fileData: preview, // For local display
        fileUrl: preview, // For server reference
        uploadedFileId: uploadedFileId, // Store ID of the uploaded file
        uploadTime: new Date().toISOString(),
        modelData,
      },
      quantity: quantity,
    };
    
    // Save uploadedFileId to localStorage as backup
    if (uploadedFileId) {
      try {
        localStorage.setItem('lastUploadedFileId', uploadedFileId.toString());
      } catch (error) {
        console.error('Failed to save uploadedFileId to localStorage:', error);
      }
    }
    
    addToCart(customProduct);
    
    // Reset button state after 1.5 seconds
    setTimeout(() => {
      setAddedToCart(false);
    }, 1500);
  };
  
  // Add state for window width
  const [windowWidth, setWindowWidth] = useState(null);
  
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
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Head>
        <title>Last opp din design | Laserkongen</title>
        <meta name="description" content="Last opp din design for 3D-utskrift eller lasergravering og få et umiddelbart pristilbud." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Header cartItemCount={cartItems?.length || 0} />
      
      <div style={{ 
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
        padding: isMobile ? '40px 20px' : '60px 24px', 
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '28px' : '36px', 
          fontWeight: '800', 
          marginBottom: '16px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          Gi liv til ideene dine
        </h1>
        <p style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          maxWidth: '800px', 
          margin: '0 auto 24px',
          opacity: '0.9'
        }}>
          Last opp din design og få et umiddelbart pristilbud. Vår avanserte kalkulator analyserer modellen din for å gi nøyaktig prissetting.
        </p>
      </div>
      
      <main style={{ flexGrow: 1, padding: '0', backgroundColor: '#f8fafc', marginTop: '-40px' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
          padding: isMobile ? '20px' : '40px',
          position: 'relative'
        }}>
          
          {/* Service Type Tabs */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #e5e7eb', 
            marginBottom: isMobile ? '24px' : '32px',
            justifyContent: 'center'
          }}>
            <button 
              style={{ 
                padding: isMobile ? '12px 16px' : '16px 32px', 
                fontWeight: '600',
                fontSize: isMobile ? '16px' : '18px',
                color: activeTab === '3d-printing' ? '#0284c7' : '#6b7280',
                borderBottom: activeTab === '3d-printing' ? '3px solid #0284c7' : 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActiveTab('3d-printing')}
            >
              3D-utskrift
            </button>
            <button 
              style={{ 
                padding: isMobile ? '12px 16px' : '16px 32px', 
                fontWeight: '600',
                fontSize: isMobile ? '16px' : '18px',
                color: activeTab === 'laser-engraving' ? '#0284c7' : '#6b7280',
                borderBottom: activeTab === 'laser-engraving' ? '3px solid #0284c7' : 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActiveTab('laser-engraving')}
            >
              Lasergravering
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: isMobile ? '24px' : '40px' }}>
            {/* File Upload */}
            <div>
              <div style={{ 
                borderRadius: '12px', 
                padding: isMobile ? '20px' : '30px', 
                marginBottom: isMobile ? '20px' : '30px', 
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb'
              }}>
                <h2 style={{ 
                  fontSize: isMobile ? '20px' : '22px', 
                  fontWeight: 'bold', 
                  marginBottom: isMobile ? '16px' : '20px',
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaUpload style={{ height: isMobile ? '18px' : '20px', width: isMobile ? '18px' : '20px' }} />
                  Last opp din fil
                </h2>
                
                <div 
                  style={{ 
                    border: '2px dashed #d1d5db', 
                    borderRadius: '12px', 
                    padding: isMobile ? '20px' : '40px', 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: '#f9fafb',
                    ':hover': {
                      borderColor: '#0ea5e9',
                      background: '#f0f9ff'
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {!file ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                        width: isMobile ? '60px' : '80px',
                        height: isMobile ? '60px' : '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: isMobile ? '16px' : '24px',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                      }}>
                        <FaUpload style={{ 
                          height: isMobile ? '24px' : '32px', 
                          width: isMobile ? '24px' : '32px', 
                          color: 'white' 
                        }} />
                      </div>
                      <p style={{ 
                        color: '#1f2937', 
                        marginBottom: '12px',
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: '500'
                      }}>Klikk eller dra for å laste opp filen din</p>
                      <p style={{ 
                        fontSize: isMobile ? '12px' : '14px', 
                        color: '#6b7280',
                        padding: isMobile ? '6px 12px' : '8px 16px',
                        background: 'rgba(2, 132, 199, 0.05)',
                        borderRadius: '20px',
                        display: 'inline-block'
                      }}>
                        {activeTab === '3d-printing' 
                          ? 'Støttede formater: STL, OBJ, 3MF (maks 50MB)' 
                          : 'Støttede formater: SVG, PNG, JPG (maks 20MB)'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {loading ? (
                        <div style={{
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '24px',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                          animation: 'spin 1s linear infinite'
                        }}>
                          <FaSpinner style={{ height: '32px', width: '32px', color: 'white' }} />
                        </div>
                      ) : (
                        <div style={{
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '24px',
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                        }}>
                          <FaCheck style={{ height: '32px', width: '32px', color: 'white' }} />
                        </div>
                      )}
                      <p style={{ 
                        color: '#1f2937', 
                        fontWeight: '500', 
                        marginBottom: '8px',
                        fontSize: '18px'
                      }}>{file.name}</p>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#6b7280',
                        padding: '4px 12px',
                        background: 'rgba(2, 132, 199, 0.05)',
                        borderRadius: '20px'
                      }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={activeTab === '3d-printing' ? '.stl,.obj,.3mf' : '.svg,.png,.jpg,.jpeg'}
                  />
                </div>
              </div>
              
              {/* 3D Preview */}
              {activeTab === '3d-printing' && preview && (
                <div style={{ 
                  borderRadius: '12px', 
                  padding: '30px', 
                  marginBottom: '30px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white'
                }}>
                  <h2 style={{ 
                    fontSize: isMobile ? '20px' : '22px', 
                    fontWeight: 'bold', 
                    marginBottom: isMobile ? '16px' : '20px',
                    color: '#0ea5e9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaCube /> 3D-forhåndsvisning
                  </h2>
                  <div 
                    ref={canvasRef}
                    style={{ 
                      width: '100%', 
                      height: isMobile ? '250px' : '300px', 
                      backgroundColor: '#f1f5f9', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                      position: 'relative'
                    }}
                  >
                    {/* Use the previewKey to force re-mount of the canvas when file changes */}
                    <ModelProvider key={`model-provider-${previewKey}`} onModelAnalyzed={handleModelLoaded}>
                      <Canvas 
                        key={`canvas-${previewKey}`}
                        camera={{ 
                          position: [5, 4, 5], 
                          fov: 35,
                          near: 0.1,
                          far: 1000
                        }}
                      >
                        <ambientLight intensity={0.5} />
                        <hemisphereLight intensity={0.5} color="#ffffff" groundColor="#bbbbbb" />
                        <directionalLight 
                          position={[5, 10, 5]} 
                          intensity={0.8} 
                          castShadow 
                          shadow-mapSize-width={1024} 
                          shadow-mapSize-height={1024}
                        />
                        <spotLight 
                          position={[-5, 10, 5]} 
                          angle={0.25} 
                          penumbra={0.8} 
                          intensity={0.6} 
                          castShadow 
                        />
                        <Model url={preview} onModelLoaded={handleModelLoaded} />
                        <OrbitControls 
                          enablePan={true} 
                          enableZoom={true} 
                          enableRotate={true}
                          target={[0, 0, 0]}
                          maxDistance={20}
                          minDistance={2}
                        />
                        <gridHelper args={[20, 20, '#bbbbbb', '#eeeeee']} position={[0, 0, 0]} rotation={[0, 0, 0]} />
                        <axesHelper args={[5]} visible={false} />
                      </Canvas>
                    </ModelProvider>
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#4b5563'
                    }}>
                      Dra for å rotere | Scroll for å zoome
                    </div>
                  </div>
                </div>
              )}
              
              {/* 3D Model Analysis */}
              {activeTab === '3d-printing' && modelData && (
                <div style={{ 
                  borderRadius: '12px', 
                  padding: isMobile ? '20px' : '30px',
                  marginBottom: isMobile ? '20px' : '30px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white'
                }}>
                  <h2 style={{ 
                    fontSize: isMobile ? '20px' : '22px', 
                    fontWeight: 'bold', 
                    marginBottom: isMobile ? '16px' : '20px',
                    color: '#0ea5e9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>Modellanalyse</h2>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                    gap: '16px', 
                    marginBottom: isMobile ? '20px' : '24px' 
                  }}>
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f0f9ff', 
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#6b7280', fontSize: isMobile ? '12px' : '14px', marginBottom: '4px' }}>Volum</span>
                      <span style={{ fontWeight: 'bold', fontSize: isMobile ? '20px' : '24px', color: '#0ea5e9' }}>{modelData.volume} cm³</span>
                    </div>
                    
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f0f9ff', 
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#6b7280', fontSize: isMobile ? '12px' : '14px', marginBottom: '4px' }}>Vekt</span>
                      <span style={{ fontWeight: 'bold', fontSize: isMobile ? '20px' : '24px', color: '#0ea5e9' }}>{modelData.weight} g</span>
                    </div>
                    
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f0f9ff', 
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#6b7280', fontSize: isMobile ? '12px' : '14px', marginBottom: '4px' }}>Dimensjoner</span>
                      <span style={{ fontWeight: 'bold', fontSize: isMobile ? '16px' : '18px', color: '#0ea5e9' }}>
                        {modelData.dimensions.x} × {modelData.dimensions.y} × {modelData.dimensions.z} cm
                      </span>
                    </div>
                    
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f0f9ff', 
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#6b7280', fontSize: isMobile ? '12px' : '14px', marginBottom: '4px' }}>Utskriftstid</span>
                      <span style={{ fontWeight: 'bold', fontSize: isMobile ? '20px' : '24px', color: '#0ea5e9' }}>{modelData.printTime} timer</span>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: isMobile ? '6px' : '8px', color: '#374151', fontSize: isMobile ? '14px' : '16px' }}>
                        Materiale
                      </label>
                      <select
                        value={selectedMaterial}
                        onChange={(e) => setSelectedMaterial(e.target.value)}
                        style={{
                          width: '100%',
                          padding: isMobile ? '10px' : '12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: isMobile ? '14px' : '16px'
                        }}
                      >
                        <option value="pla">PLA</option>
                        <option value="abs">ABS</option>
                        <option value="petg">PETG</option>
                        <option value="tpu">TPU (Flexible)</option>
                        <option value="nylon">Nylon</option>
                      </select>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: isMobile ? '6px' : '8px', color: '#374151', fontSize: isMobile ? '14px' : '16px' }}>
                        Utskriftskvalitet
                      </label>
                      <select
                        value={selectedQuality}
                        onChange={(e) => setSelectedQuality(e.target.value)}
                        style={{
                          width: '100%',
                          padding: isMobile ? '10px' : '12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: isMobile ? '14px' : '16px'
                        }}
                      >
                        <option value="draft">Utkast (0.3mm laghøyde)</option>
                        <option value="standard">Standard (0.2mm laghøyde)</option>
                        <option value="high">Høy (0.1mm laghøyde)</option>
                      </select>
                    </div>
                    
                    <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: isMobile ? '6px' : '8px', color: '#374151', fontSize: isMobile ? '14px' : '16px' }}>
                        Fyllingsgrad: {selectedInfill}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={selectedInfill}
                        onChange={(e) => setSelectedInfill(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '12px' : '14px', color: '#6b7280', marginTop: '4px' }}>
                        <span>10% (Lett)</span>
                        <span>100% (Solid)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Image Preview for Laser Engraving */}
              {activeTab === 'laser-engraving' && preview && (
                <div style={{ 
                  borderRadius: '12px', 
                  padding: '30px',
                  marginBottom: '30px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white'
                }}>
                  <h2 style={{ 
                    fontSize: '22px', 
                    fontWeight: 'bold', 
                    marginBottom: '20px',
                    color: '#0ea5e9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>Bildeforhåndsvisning</h2>
                  <div style={{ 
                    width: '100%', 
                    height: '300px', 
                    backgroundColor: '#f1f5f9', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}>
                    <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </div>
            
            {/* Print Options and Pricing */}
            <div>
              <div style={{ 
                borderRadius: '12px', 
                padding: '30px', 
                marginBottom: '30px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white'
              }}>
                <h2 style={{ 
                  fontSize: '22px', 
                  fontWeight: 'bold', 
                  marginBottom: '20px',
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {activeTab === '3d-printing' ? '3D-utskriftsalternativer' : 'Lasergraveringsalternativer'}
                </h2>
                
                {activeTab === '3d-printing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }} htmlFor="color">
                        Farge
                      </label>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {['white', 'black', 'gray', 'red', 'blue', 'green', 'yellow'].map(color => (
                          <div 
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '50%', 
                              backgroundColor: color === 'white' ? '#fff' : color,
                              border: selectedColor === color ? '3px solid #0ea5e9' : '1px solid #d1d5db',
                              cursor: 'pointer',
                              boxShadow: selectedColor === color ? '0 0 0 2px rgba(14, 165, 233, 0.2)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          />
                        ))}
                      </div>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px', textTransform: 'capitalize' }}>
                        Valgt: {selectedColor === 'white' ? 'hvit' : 
                               selectedColor === 'black' ? 'svart' : 
                               selectedColor === 'gray' ? 'grå' : 
                               selectedColor === 'red' ? 'rød' : 
                               selectedColor === 'blue' ? 'blå' : 
                               selectedColor === 'green' ? 'grønn' : 
                               selectedColor === 'yellow' ? 'gul' : selectedColor}
                      </p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'laser-engraving' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }} htmlFor="material">
                        Materiale
                      </label>
                      <select
                        id="material"
                        value={selectedMaterial}
                        onChange={(e) => setSelectedMaterial(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '16px'
                        }}
                      >
                        <option value="wood">Tre</option>
                        <option value="acrylic">Akryl</option>
                        <option value="leather">Lær</option>
                        <option value="glass">Glass</option>
                        <option value="metal">Metall</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }} htmlFor="engravingType">
                        Graveringstype
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {[
                          { value: 'draft', label: 'Kun omriss' },
                          { value: 'standard', label: 'Standard' },
                          { value: 'high', label: 'Dyp gravering' }
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedQuality(option.value)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              textAlign: 'center',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              backgroundColor: selectedQuality === option.value ? '#0ea5e9' : 'white',
                              color: selectedQuality === option.value ? 'white' : '#374151',
                              fontWeight: selectedQuality === option.value ? '600' : '400',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }} htmlFor="size">
                        Størrelse (cm)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <input
                          type="number"
                          placeholder="Bredde"
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '16px'
                          }}
                          min="1"
                          max="50"
                        />
                        <input
                          type="number"
                          placeholder="Høyde"
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '16px'
                          }}
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: '24px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }} htmlFor="notes">
                    Tilleggsnotater
                  </label>
                  <textarea
                    id="notes"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      resize: 'vertical'
                    }}
                    placeholder="Spesielle instruksjoner for din bestilling..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                  ></textarea>
                </div>
                
                <div style={{ marginTop: '24px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', color: '#374151' }} htmlFor="quantity">
                    Antall
                  </label>
                  <div style={{ display: 'flex', width: 'fit-content', alignItems: 'center' }}>
                    <button 
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px 0 0 8px',
                        border: '1px solid #d1d5db',
                        borderRight: 'none',
                        backgroundColor: '#f9fafb',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      style={{
                        width: '60px',
                        height: '40px',
                        padding: '8px',
                        borderRadius: '0',
                        border: '1px solid #d1d5db',
                        textAlign: 'center',
                        fontSize: '16px'
                      }}
                    />
                    <button 
                      onClick={() => quantity < 100 && setQuantity(quantity + 1)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '0 8px 8px 0',
                        border: '1px solid #d1d5db',
                        borderLeft: 'none',
                        backgroundColor: '#f9fafb',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Add to Cart Section */}
              <div style={{ 
                borderRadius: '12px', 
                padding: isMobile ? '20px' : '30px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                marginTop: isMobile ? '20px' : '24px'
              }}>
                {!modelData ? (
                  <div>
                    <h2 style={{ 
                      fontSize: isMobile ? '20px' : '22px', 
                      fontWeight: 'bold', 
                      marginBottom: isMobile ? '12px' : '16px',
                      color: '#0ea5e9'
                    }}>Prisberegning</h2>
                    <p style={{ color: '#6b7280', fontSize: isMobile ? '14px' : '16px' }}>Last opp en fil for å få et prisoverslag.</p>
                  </div>
                ) : loading ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '24px 0'
                  }}>
                    <FaSpinner style={{ 
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px',
                      color: '#0284c7'
                    }} />
                    <span>Beregner pris...</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      padding: '30px 0', 
                      margin: '0 -30px',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '500', color: '#0284c7', marginBottom: '8px' }}>
                        Total pris
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '30px' : '36px', 
                        fontWeight: '800', 
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ fontSize: isMobile ? '20px' : '24px' }}>kr</span>
                        <span>{(calculatePrice() * 10.5).toFixed(2)}</span>
                      </div>
                      <p style={{ fontSize: isMobile ? '12px' : '14px', color: '#6b7280', marginTop: '8px' }}>
                        {(calculatePrice() * 10.5).toFixed(2) === '99.00' ? (
                          <span style={{ fontWeight: '500', color: '#0ea5e9' }}>Minstepris kr 99 anvendt</span>
                        ) : (
                          'Inkluderer materialer, utskriftstid og behandling'
                        )}
                      </p>
                    </div>
                    
                    <button 
                      onClick={handleAddToCart}
                      disabled={loading || addedToCart}
                      style={{
                        width: '100%',
                        padding: isMobile ? '14px' : '16px',
                        marginTop: isMobile ? '20px' : '24px',
                        backgroundColor: addedToCart ? '#059669' : '#0ea5e9',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: isMobile ? '15px' : '16px',
                        fontWeight: '600',
                        cursor: addedToCart ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {addedToCart ? (
                        <>
                          <div style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: '100%',
                            backgroundColor: '#059669',
                            transform: 'translateX(-100%)',
                            animation: 'slideIn 1.5s ease forwards'
                          }}></div>
                          <svg 
                            style={{ 
                              height: 18, 
                              width: 18, 
                              zIndex: 1, 
                              position: 'relative'
                            }}
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span style={{ zIndex: 1, position: 'relative' }}>Lagt til</span>
                        </>
                      ) : (
                        <>
                          <FaShoppingCart size={18} />
                          <span>Legg til i handlekurv</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <div style={{
        backgroundColor: '#1e293b',
        padding: isMobile ? '20px 0' : '24px 0',
        color: 'white',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            gap: '20px'
          }}>
            <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>About Us</a>
            <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Contact</a>
            <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Terms & Conditions</a>
            <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Privacy Policy</a>
          </div>
          
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            © {new Date().getFullYear()} Laserkongen. All rights reserved.
          </p>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}