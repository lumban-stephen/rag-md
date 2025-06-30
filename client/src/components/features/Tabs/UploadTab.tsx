/**
 * UploadTab Component
 * Provides a user interface for uploading documents to the system
 * Supports drag-and-drop and manual file selection
 * Handles file validation, topic management, and upload progress
 */
import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { TopicSelect } from '../ui/Select';
import { uploadFile, checkFileExists, getAllTopics } from '../../../services/api';
import toast from 'react-hot-toast';
import { LoadingContext } from '../../../App';
import ConfirmationModal from '../ui/ConfirmationModal';


const UploadTab: React.FC = () => {
  const { setIsLoading } = React.useContext(LoadingContext);
  // State management for form fields and upload process
  const [topic, setTopic] = useState('');
  const [filename, setFilename] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [topics, setTopics] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [fileExists, setFileExists] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Accepted file types and MIME types for validation
  const acceptedFileTypes = '.pdf,.txt,.md,.json,.csv';
  const acceptedMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/json',
    'text/csv'
  ];

  /**
   * Fetches existing topics when component mounts
   * Updates the topics list with unique, sorted values
   */
  useEffect(() => {
    const fetchTopics = async () => {
      console.log('Starting to fetch topics...');
      setIsLoadingTopics(true);
      try {
        const topicsList = await getAllTopics();
        console.log('Received topics:', topicsList);
        
        // Filter out empty strings and duplicates, then sort alphabetically
        const uniqueTopics = Array.from(new Set(topicsList.filter(Boolean)))
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

  /**
   * Adds a new topic to the list
   * Validates for duplicates and maintains alphabetical order
   * @param newTopic - The new topic to add
   */
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

  /**
   * Validates a file before upload
   * Checks file type and MIME type
   * @param file - The file to validate
   * @returns Whether the file is valid
   */
  const validateFile = (file: File): boolean => {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB limit. Please upload a smaller file.');
      return false;
    }

    // Check if file is an image
    if (file.type.startsWith('image/')) {
      toast.error('Image files are not allowed. Please upload text files only.');
      return false;
    }

    // Check if file type is accepted
    if (!acceptedMimeTypes.includes(file.type)) {
      // Fallback: Check file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'md' || extension === 'txt' || extension === 'pdf') {
        return true;
      }
      toast.error('Invalid file type. Please upload PDF, TXT, or MD files only.');
      return false;
    }

    return true;
  };

  /**
   * Handles file selection from input
   * Validates file and updates state
   * @param e - Change event from file input
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setFileExists(false);
        setFilename(selectedFile.name);
      } else {
        // Reset the input
        e.target.value = '';
      }
    }
  };

  /**
   * Handles drag over event for file drop zone
   * Prevents default browser behavior
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Handles file drop event
   * Validates dropped file and updates state
   * @param e - Drop event from drop zone
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setFileExists(false);
        setFilename(droppedFile.name);
      }
    }
  };

  /**
   * Triggers file input click when upload area is clicked
   */
  const handleUploadAreaClick = () => {
    document.getElementById('file-upload')?.click();
  };

  /**
   * Checks if a file with the same name exists in the selected topic
   */
  const checkExistingFile = async () => {
    if (!topic || !filename) {
      setFileExists(false);
      return;
    }

    try {
      const exists = await checkFileExists(topic, filename);
      setFileExists(exists);
    } catch (error) {
      console.error('Error checking file existence:', error);
    }
  };

  // Check for existing file when topic or filename changes
  useEffect(() => {
    checkExistingFile();
  }, [topic, filename]);

  /**
   * Handles file upload process
   * Validates form fields, shows progress, and handles success/error states
   */
  const handleUpload = async () => {
    if (!topic || !filename || !file) {
      toast.error('Please fill all fields and select a file');
      return;
    }

    // Check if file exists before proceeding
    try {
      setIsLoading(true);
      const exists = await checkFileExists(topic, filename);
      if (exists) {
        setShowConfirmModal(true);
      } else {
        // If file doesn't exist, proceed with upload
        await performUpload();
      }
    } catch (error) {
      console.error('Error checking file existence:', error);
      toast.error('Error checking if file exists. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Performs the actual file upload
   */
  const performUpload = async () => {
    if (!file) {
      toast.error('No file selected');
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
        setFileExists(false);
        setShowConfirmModal(false);
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading file. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Formats file size in bytes to human-readable format
   * @param bytes - File size in bytes
   * @returns Formatted size string (e.g., "1.5 MB")
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full">
      <div className="h-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            {/* Topic selection with ability to add new topics */}
            <TopicSelect
              label="Topic"
              topics={topics}
              value={topic}
              onChange={(value) => setTopic(value)}
              onAddTopic={handleAddTopic}
              fullWidth
              disabled={isLoadingTopics}
            />
            
            {/* Filename input */}
            <Input
              label="Filename"
              placeholder="Enter a filename or use the original filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              fullWidth
            />

            {/* Warning message if file exists */}
            {fileExists && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center text-yellow-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Warning: A file with this name already exists in this topic. Uploading will replace the existing file.
                  </span>
                </div>
              </div>
            )}
            
            {/* File upload area with drag and drop support */}
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
                  {file ? (
                    <>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Click or drag to replace
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex text-sm text-gray-600">
                        <span className="text-blue-600 hover:text-blue-500">
                          Upload a file
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {acceptedFileTypes} up to 10MB
                      </p>
                    </>
                  )}
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
          <CardFooter>
            {/* Upload button with progress indicator */}
            <Button
              variant="primary"
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!topic || !filename || !file || isUploading}
            >
              {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          performUpload();
        }}
        title="Replace Existing File"
        message={`A file named "${filename}" already exists in the "${topic}" topic. Uploading will replace the existing file and all its associated data. Are you sure you want to proceed?`}
        confirmText="replace"
        confirmButtonText="Replace File"
        cancelButtonText="Cancel"
      />
    </div>
  );
};

export default UploadTab;