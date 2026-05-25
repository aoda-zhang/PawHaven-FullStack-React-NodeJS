import { X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './index.module.css';

interface ImageUploaderProps {
  images: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxFiles = 5,
}) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/'),
      );
      const allFiles = [...images, ...newFiles].slice(0, maxFiles);
      onChange(allFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/'),
      );

      const allFiles = [...images, ...newFiles].slice(0, maxFiles);
      onChange(allFiles);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('reportStray.images')}</h3>

      <div
        className={`${styles.uploadContainer} ${dragActive ? 'border-primary' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <p className={styles.uploadText}>
          {t('reportStray.upload_images_hint')}
        </p>
        <label htmlFor="image-upload" className={styles.uploadButton}>
          {t('reportStray.select_images')}
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={images.length >= maxFiles}
        />
        <p className="text-xs text-gray-500 mt-2">
          {t('reportStray.max_images', { max: maxFiles })}
        </p>
      </div>

      {images.length > 0 && (
        <div className={styles.previewImages}>
          {images.map((file, index) => (
            <div key={file.name} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className={styles.previewImage}
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                onClick={() => removeImage(index)}
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
