import React, { useState, useEffect } from 'react';
import { UploadCloud, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { TopicSelect } from '../ui/Select';
import { generateUploadUrl, uploadFile, getDocuments } from '../../../services/api';
import toast from 'react-hot-toast';

interface Document {
  topic: string;
  filename: string;
  lastModified: string;
  size: number;
}

interface DocumentsResponse {
  documents: Document[];
}

const UploadTab: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [filename, setFilename] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [topics, setTopics] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);

  const acceptedFileTypes = '.pdf,.txt,.md';
  const acceptedMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown'
  ];

  useEffect(() => {
    // Fetch existing topics when component mounts
    const fetchTopics = async () => {
      console.log('Starting to fetch topics...');
      setIsLoadingTopics(true);
      try {
        const response = await getDocuments();
        console.log('API Response:', response);
        
        const documents = response?.documents || [];
        console.log('Documents array:', documents);
        
        // Extract unique topics and sort them alphabetically
        const uniqueTopics = Array.from(new Set(documents.map(doc => doc.topic)))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
          .map(topic => ({ value: topic, label: topic }));
        
        console.log('Extracted unique topics:', uniqueTopics);
        setTopics(uniqueTopics);
      } catch (error) {
        console.error('Error fetching topics:', error);
        toast.error('Failed to load topics. Please try again.');
      } finally {
        setIsLoadingTopics(false);
      }
    };
    fetchTopics();
  }, []);

  const handleAddTopic = (newTopic: string) => {
    console.log('Adding new topic:', newTopic);
    // Check if topic already exists
    if (topics.some(t => t.value.toLowerCase() === newTopic.toLowerCase())) {
      console.log('Topic already exists:', newTopic);
      toast.error('This topic already exists');
      return;
    }
    
    // Add new topic and sort the list
    const updatedTopics = [...topics, { value: newTopic, label: newTopic }]
      .sort((a, b) => a.value.localeCompare(b.value));
    console.log('Updated topics list:', updatedTopics);
    setTopics(updatedTopics);
    setTopic(newTopic);
    toast.success(`Added new topic: ${newTopic}`);
  };

  const validateFile = (file: File): boolean => {
    // Check if file is an image
    if (file.type.startsWith('image/')) {
      toast.error('Image files are not allowed. Please upload text files only.');
      return false;
    }

    // Check if file type is accepted
    if (!acceptedMimeTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, TXT, or MD files only.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        
        // Auto-fill filename if not already set
        if (!filename) {
          setFilename(selectedFile.name);
        }
      } else {
        // Reset the input
        e.target.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        
        // Auto-fill filename if not already set
        if (!filename) {
          setFilename(droppedFile.name);
        }
      }
    }
  };

  const handleUploadAreaClick = () => {
    document.getElementById('file-upload')?.click();
  };

  const handleUpload = async () => {
    if (!topic || !filename || !file) {
      toast.error('Please fill all fields and select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate initial progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Cap at 80% until actual upload completes
          const newProgress = prev + Math.random() * 10;
          return newProgress > 80 ? 80 : newProgress;
        });
      }, 300);

      // Upload file through backend proxy
      await uploadFile(file, topic, filename);
      
      // Clear interval and set to 100% on success
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('File uploaded successfully!');
      
      // Reset form after successful upload
      setTimeout(() => {
        setTopic('');
        setFilename('');
        setFile(null);
        setUploadProgress(0);
        setIsUploading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading file. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="h-full">
      <div className="h-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <TopicSelect
              label="Topic"
              topics={topics}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onAddTopic={handleAddTopic}
              fullWidth
              disabled={isLoadingTopics}
            />
            
            <Input
              label="Filename"
              placeholder="Enter a filename or use the original filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              fullWidth
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File
              </label>
              <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md h-48 cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors duration-200"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleUploadAreaClick}
              >
                <div className="space-y-1 text-center flex flex-col justify-center items-center w-full">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <span className="text-blue-600 hover:text-blue-500">
                      Upload a file
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {acceptedFileTypes} up to 10MB
                  </p>
                </div>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept={acceptedFileTypes}
                  onChange={handleFileChange}
                />
              </div>
              {file && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  {file.name}
                </div>
              )}
            </div>
            
            {uploadProgress > 0 && (
              <div className="w-full mt-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        Upload Progress
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div
                      style={{ width: `${uploadProgress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!topic || !filename || !file || isUploading || isLoadingTopics}
              icon={<UploadCloud className="h-4 w-4" />}
            >
              Upload File
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default UploadTab;