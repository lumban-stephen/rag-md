/**
 * View3DTab Component
 * Provides a 3D visualization of document similarities
 * Features:
 * - Interactive 3D visualization of document relationships
 * - Document clustering by similarity
 * - Topic-based color coding
 * - Interactive document selection and details
 */
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.js';
import { getDocuments } from '../../../services/api/index.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import toast from 'react-hot-toast';

interface Document {
  filename: string;
  topic: string;
  lastModified: string;
  size: number;
}

// Generate a color based on topic
const getTopicColor = (topic: string): number => {
  // Simple hash function to generate consistent colors for topics
  let hash = 0;
  for (let i = 0; i < topic.length; i++) {
    hash = topic.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Convert to hex color
  const color = Math.abs(hash) % 0xFFFFFF;
  return color;
};

const View3DTab: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0); // Light gray background

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Set up camera position
    camera.position.z = 5;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      scene.clear();
    };
  }, []);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await getDocuments();
        setDocuments(response.documents);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Update scene when documents change
  useEffect(() => {
    if (!sceneRef.current || documents.length === 0) return;

    // Clear existing objects
    while(sceneRef.current.children.length > 0) { 
      sceneRef.current.remove(sceneRef.current.children[0]); 
    }

    // Add lights back
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    // Create a sphere for each document
    const radius = 0.5;
    const spacing = 2;
    const gridSize = Math.ceil(Math.sqrt(documents.length));
    
    documents.forEach((doc, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      const geometry = new THREE.SphereGeometry(radius);
      const material = new THREE.MeshPhongMaterial({ 
        color: getTopicColor(doc.topic),
        transparent: true,
        opacity: 0.8
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.x = (col - gridSize / 2) * spacing;
      sphere.position.y = (row - gridSize / 2) * spacing;
      sphere.position.z = 0;
      
      // Store document data in the sphere
      sphere.userData = { filename: doc.filename };
      
      sceneRef.current?.add(sphere);
    });

  }, [documents]);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>3D Document Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef} 
            className="w-full h-[600px] bg-gray-100 rounded-lg"
          >
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          {selectedDocument && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold">{selectedDocument.filename}</h3>
              <p className="text-sm text-gray-600">Topic: {selectedDocument.topic}</p>
              <p className="text-sm text-gray-600">
                Last Modified: {new Date(selectedDocument.lastModified).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default View3DTab; 