"use client";

import React, { useState, useCallback, useRef } from 'react';
import { validateSkillFile, formatValidationErrors, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE, type ValidationResult } from '~~/utils/skillValidation';

interface SkillFileUploadProps {
  onFileSelect: (file: File | null) => void;
  onValidationResult?: (result: ValidationResult | null) => void;
  disabled?: boolean;
  className?: string;
}

export const SkillFileUpload: React.FC<SkillFileUploadProps> = ({
  onFileSelect,
  onValidationResult,
  disabled = false,
  className = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setIsValidating(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // 验证文件
      const result = await validateSkillFile(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setValidationResult(result);
      onValidationResult?.(result);
      
      if (result.isValid) {
        onFileSelect(selectedFile);
      } else {
        onFileSelect(null);
      }
    } catch (error) {
      console.error('File validation error:', error);
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [`文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`],
        warnings: [],
      };
      setValidationResult(errorResult);
      onValidationResult?.(errorResult);
      onFileSelect(null);
    } finally {
      setIsValidating(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [onFileSelect, onValidationResult]);

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  // 点击选择文件
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // 文件输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // 清除文件
  const handleClear = useCallback(() => {
    setFile(null);
    setValidationResult(null);
    setUploadProgress(0);
    onFileSelect(null);
    onValidationResult?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect, onValidationResult]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 文件上传区域 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-primary bg-primary/10 scale-105' 
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${validationResult?.isValid === false ? 'border-error bg-error/10' : ''}
          ${validationResult?.isValid === true ? 'border-success bg-success/10' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={Object.keys(SUPPORTED_FILE_TYPES).join(',')}
          onChange={handleInputChange}
          disabled={disabled}
        />

        {isValidating ? (
          <div className="space-y-3">
            <div className="loading loading-spinner loading-lg mx-auto"></div>
            <p className="text-sm text-gray-600">正在验证文件...</p>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : file ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="btn btn-sm btn-outline btn-error"
            >
              移除文件
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-900">
                拖拽文件到此处或点击选择
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支持 .skill, .json, .txt, .md 文件
              </p>
              <p className="text-xs text-gray-400 mt-1">
                最大文件大小: {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 支持的文件类型提示 */}
      <div className="bg-info/10 border border-info/20 rounded-lg p-4">
        <h4 className="font-medium text-info-content mb-2">📋 支持的文件格式</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">.skill</span> - Claude Skills 标准格式
          </div>
          <div>
            <span className="font-medium">.json</span> - JSON 格式技能文件
          </div>
          <div>
            <span className="font-medium">.txt</span> - 纯文本技能描述
          </div>
          <div>
            <span className="font-medium">.md</span> - Markdown 格式文档
          </div>
        </div>
      </div>

      {/* 验证结果显示 */}
      {validationResult && (
        <div className={`
          border rounded-lg p-4
          ${validationResult.isValid 
            ? 'border-success bg-success/10 text-success-content' 
            : 'border-error bg-error/10 text-error-content'
          }
        `}>
          <div className="flex items-start space-x-2">
            {validationResult.isValid ? (
              <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <div className="flex-1">
              <h4 className="font-medium mb-1">
                {validationResult.isValid ? '✅ 文件验证通过' : '❌ 文件验证失败'}
              </h4>
              {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {formatValidationErrors(validationResult)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 技能元数据预览 */}
      {validationResult?.isValid && validationResult.metadata && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">📄 技能信息预览</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">名称:</span> {validationResult.metadata.name}
            </div>
            <div>
              <span className="font-medium">描述:</span> {validationResult.metadata.description}
            </div>
            {validationResult.metadata.version && (
              <div>
                <span className="font-medium">版本:</span> {validationResult.metadata.version}
              </div>
            )}
            {validationResult.metadata.author && (
              <div>
                <span className="font-medium">作者:</span> {validationResult.metadata.author}
              </div>
            )}
            {validationResult.metadata.license && (
              <div>
                <span className="font-medium">许可证:</span> {validationResult.metadata.license}
              </div>
            )}
            {validationResult.metadata.tags && validationResult.metadata.tags.length > 0 && (
              <div>
                <span className="font-medium">标签:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {validationResult.metadata.tags.map((tag, index) => (
                    <span key={index} className="badge badge-outline badge-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {validationResult.metadata.parameters && validationResult.metadata.parameters.length > 0 && (
              <div>
                <span className="font-medium">参数数量:</span> {validationResult.metadata.parameters.length}
              </div>
            )}
            {validationResult.metadata.examples && validationResult.metadata.examples.length > 0 && (
              <div>
                <span className="font-medium">示例数量:</span> {validationResult.metadata.examples.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};