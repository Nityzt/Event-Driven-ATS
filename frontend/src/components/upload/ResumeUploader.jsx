// src/components/upload/ResumeUploader.jsx
import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

const ResumeUploader = ({ onFileSelect, existingFile = null, error = null }) => {
  const [file, setFile] = useState(null);
  const toPreviewString = (f) =>
    !f ? null : typeof f === 'string' ? f : f?.filename ?? null;
  const [preview, setPreview] = useState(() => toPreviewString(existingFile));
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!file) setPreview(toPreviewString(existingFile));
  }, [existingFile]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['application/pdf'];

  const validateFile = (file) => {
    setUploadError(null);

    if (!file) {
      return false;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only PDF files are allowed');
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleFile = (selectedFile) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setPreview(selectedFile.name);
      if (onFileSelect) {
        onFileSelect(selectedFile);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        className="hidden"
      />

      {!preview ? (
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-colors
            ${dragActive
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
              : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 bg-stone-50 dark:bg-stone-800/60'
            }
            ${(uploadError || error) ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40' : ''}
          `}
        >
          <Upload className={`
            w-12 h-12 mx-auto mb-4
            ${dragActive ? 'text-brand-500 dark:text-brand-400' : 'text-stone-400 dark:text-stone-500'}
          `} />
          
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            PDF only (max 5MB)
          </p>
        </div>
      ) : (
        <div className="border border-stone-300 dark:border-stone-700 rounded-xl p-4 bg-white dark:bg-stone-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-lg">
                <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {preview}
                </p>
                {file && (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
              <button
                onClick={handleRemove}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-stone-500 dark:text-stone-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {(uploadError || error) && (
        <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{uploadError || error}</span>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;