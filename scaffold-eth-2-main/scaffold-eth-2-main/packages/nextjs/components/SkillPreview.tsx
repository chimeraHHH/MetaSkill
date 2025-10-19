"use client";

import React, { useState } from 'react';
import { type ClaudeSkillMetadata, type SkillParameter, type SkillExample } from '~~/utils/skillValidation';

interface SkillPreviewProps {
  metadata: ClaudeSkillMetadata;
  rawContent?: string;
  className?: string;
}

export const SkillPreview: React.FC<SkillPreviewProps> = ({
  metadata,
  rawContent,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'parameters' | 'examples' | 'raw'>('overview');

  const renderParameter = (param: SkillParameter, index: number) => (
    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900">{param.name}</h4>
        <div className="flex space-x-2">
          <span className={`badge badge-sm ${param.required ? 'badge-error' : 'badge-warning'}`}>
            {param.required ? '必需' : '可选'}
          </span>
          <span className="badge badge-sm badge-info">{param.type}</span>
        </div>
      </div>
      
      {param.description && (
        <p className="text-sm text-gray-600 mb-2">{param.description}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {param.default !== undefined && (
          <div>
            <span className="font-medium text-gray-700">默认值:</span>
            <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
              {JSON.stringify(param.default)}
            </code>
          </div>
        )}
        
        {param.enum && param.enum.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">可选值:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {param.enum.map((value, i) => (
                <span key={i} className="badge badge-outline badge-xs">
                  {value}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {param.pattern && (
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700">格式:</span>
            <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
              {param.pattern}
            </code>
          </div>
        )}
        
        {(param.minLength !== undefined || param.maxLength !== undefined) && (
          <div>
            <span className="font-medium text-gray-700">长度限制:</span>
            <span className="ml-2 text-gray-600">
              {param.minLength !== undefined && `最小: ${param.minLength}`}
              {param.minLength !== undefined && param.maxLength !== undefined && ', '}
              {param.maxLength !== undefined && `最大: ${param.maxLength}`}
            </span>
          </div>
        )}
        
        {(param.minimum !== undefined || param.maximum !== undefined) && (
          <div>
            <span className="font-medium text-gray-700">数值范围:</span>
            <span className="ml-2 text-gray-600">
              {param.minimum !== undefined && `最小: ${param.minimum}`}
              {param.minimum !== undefined && param.maximum !== undefined && ', '}
              {param.maximum !== undefined && `最大: ${param.maximum}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderExample = (example: SkillExample, index: number) => (
    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">
          示例 {index + 1}
          {example.name && `: ${example.name}`}
        </h4>
        {example.tags && example.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {example.tags.map((tag, i) => (
              <span key={i} className="badge badge-outline badge-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {example.description && (
        <p className="text-sm text-gray-600 mb-3">{example.description}</p>
      )}
      
      <div className="space-y-3">
        {example.input && (
          <div>
            <h5 className="font-medium text-gray-700 mb-1">输入:</h5>
            <pre className="bg-gray-50 border rounded p-3 text-sm overflow-x-auto">
              <code>{JSON.stringify(example.input, null, 2)}</code>
            </pre>
          </div>
        )}
        
        {example.output && (
          <div>
            <h5 className="font-medium text-gray-700 mb-1">输出:</h5>
            <pre className="bg-gray-50 border rounded p-3 text-sm overflow-x-auto">
              <code>{JSON.stringify(example.output, null, 2)}</code>
            </pre>
          </div>
        )}
        
        {example.explanation && (
          <div>
            <h5 className="font-medium text-gray-700 mb-1">说明:</h5>
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
              {example.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 py-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            概览
          </button>
          
          {metadata.parameters && metadata.parameters.length > 0 && (
            <button
              onClick={() => setActiveTab('parameters')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'parameters'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              参数 ({metadata.parameters.length})
            </button>
          )}
          
          {metadata.examples && metadata.examples.length > 0 && (
            <button
              onClick={() => setActiveTab('examples')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'examples'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              示例 ({metadata.examples.length})
            </button>
          )}
          
          {rawContent && (
            <button
              onClick={() => setActiveTab('raw')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'raw'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              原始内容
            </button>
          )}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">技能名称</label>
                    <p className="mt-1 text-sm text-gray-900">{metadata.name}</p>
                  </div>
                  
                  {metadata.version && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">版本</label>
                      <p className="mt-1 text-sm text-gray-900">{metadata.version}</p>
                    </div>
                  )}
                  
                  {metadata.author && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">作者</label>
                      <p className="mt-1 text-sm text-gray-900">{metadata.author}</p>
                    </div>
                  )}
                  
                  {metadata.license && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">许可证</label>
                      <p className="mt-1 text-sm text-gray-900">{metadata.license}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {metadata.category && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">分类</label>
                      <p className="mt-1 text-sm text-gray-900">{metadata.category}</p>
                    </div>
                  )}
                  
                  {metadata.difficulty && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">难度</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        metadata.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        metadata.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        metadata.difficulty === 'advanced' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {metadata.difficulty === 'beginner' ? '初级' :
                         metadata.difficulty === 'intermediate' ? '中级' :
                         metadata.difficulty === 'advanced' ? '高级' :
                         metadata.difficulty}
                      </span>
                    </div>
                  )}
                  
                  {metadata.estimatedTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">预估时间</label>
                      <p className="mt-1 text-sm text-gray-900">{metadata.estimatedTime}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{metadata.description}</p>
              </div>
            </div>

            {/* 标签 */}
            {metadata.tags && metadata.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {metadata.tags.map((tag, index) => (
                    <span key={index} className="badge badge-outline">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metadata.parameters ? metadata.parameters.length : 0}
                </div>
                <div className="text-sm text-blue-600">参数</div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metadata.examples ? metadata.examples.length : 0}
                </div>
                <div className="text-sm text-green-600">示例</div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metadata.parameters ? metadata.parameters.filter(p => p.required).length : 0}
                </div>
                <div className="text-sm text-purple-600">必需参数</div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metadata.tags ? metadata.tags.length : 0}
                </div>
                <div className="text-sm text-orange-600">标签</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parameters' && metadata.parameters && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">参数详情</h3>
            {metadata.parameters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>此技能没有定义参数</p>
              </div>
            ) : (
              <div className="space-y-4">
                {metadata.parameters.map(renderParameter)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'examples' && metadata.examples && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">使用示例</h3>
            {metadata.examples.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>此技能没有提供使用示例</p>
              </div>
            ) : (
              <div className="space-y-6">
                {metadata.examples.map(renderExample)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'raw' && rawContent && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">原始文件内容</h3>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm">
                <code>{rawContent}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};