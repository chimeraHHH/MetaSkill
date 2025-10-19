/**
 * 技能文件格式验证工具
 * 支持Claude Skills标准格式检查和JSON Schema验证
 */

// Claude Skills标准格式接口定义
export interface ClaudeSkillMetadata {
  name: string;
  description: string;
  version?: string;
  author?: string;
  license?: string;
  tags?: string[];
  parameters?: SkillParameter[];
  examples?: SkillExample[];
  requirements?: string[];
}

export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  default?: any;
  enum?: any[];
  pattern?: string;
}

export interface SkillExample {
  title: string;
  description?: string;
  input: Record<string, any>;
  output?: any;
}

// 文件验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: ClaudeSkillMetadata;
}

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  '.skill': 'application/json',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 验证文件类型和大小
 */
export function validateFileBasics(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`文件大小超过限制 (${(file.size / 1024 / 1024).toFixed(2)}MB > 10MB)`);
  }

  // 检查文件扩展名
  const extension = getFileExtension(file.name);
  if (!Object.keys(SUPPORTED_FILE_TYPES).includes(extension)) {
    errors.push(`不支持的文件类型: ${extension}。支持的类型: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`);
  }

  // 检查文件名
  if (!file.name.trim()) {
    errors.push('文件名不能为空');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
}

/**
 * 验证JSON格式的技能文件
 */
export async function validateSkillFile(file: File): Promise<ValidationResult> {
  const basicValidation = validateFileBasics(file);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  try {
    const content = await readFileAsText(file);
    const extension = getFileExtension(file.name);

    if (extension === '.skill' || extension === '.json') {
      return validateJsonSkill(content);
    } else {
      // 对于其他文件类型，进行基本验证
      return validateTextSkill(content);
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`],
      warnings: [],
    };
  }
}

/**
 * 验证JSON格式的技能文件
 */
function validateJsonSkill(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let metadata: ClaudeSkillMetadata | undefined;

  try {
    const parsed = JSON.parse(content);
    metadata = parsed as ClaudeSkillMetadata;

    // 验证必需字段
    if (!metadata.name || typeof metadata.name !== 'string') {
      errors.push('缺少必需字段: name (技能名称)');
    } else if (metadata.name.trim().length === 0) {
      errors.push('技能名称不能为空');
    }

    if (!metadata.description || typeof metadata.description !== 'string') {
      errors.push('缺少必需字段: description (技能描述)');
    } else if (metadata.description.trim().length === 0) {
      errors.push('技能描述不能为空');
    }

    // 验证可选字段格式
    if (metadata.version && typeof metadata.version !== 'string') {
      errors.push('version 字段必须是字符串');
    }

    if (metadata.author && typeof metadata.author !== 'string') {
      errors.push('author 字段必须是字符串');
    }

    if (metadata.license && typeof metadata.license !== 'string') {
      errors.push('license 字段必须是字符串');
    }

    if (metadata.tags && !Array.isArray(metadata.tags)) {
      errors.push('tags 字段必须是字符串数组');
    } else if (metadata.tags) {
      metadata.tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          errors.push(`tags[${index}] 必须是字符串`);
        }
      });
    }

    // 验证参数定义
    if (metadata.parameters) {
      if (!Array.isArray(metadata.parameters)) {
        errors.push('parameters 字段必须是数组');
      } else {
        metadata.parameters.forEach((param, index) => {
          validateParameter(param, index, errors);
        });
      }
    }

    // 验证示例
    if (metadata.examples) {
      if (!Array.isArray(metadata.examples)) {
        errors.push('examples 字段必须是数组');
      } else {
        metadata.examples.forEach((example, index) => {
          validateExample(example, index, errors);
        });
      }
    }

    // 验证需求
    if (metadata.requirements && !Array.isArray(metadata.requirements)) {
      errors.push('requirements 字段必须是字符串数组');
    }

    // 添加警告
    if (!metadata.version) {
      warnings.push('建议添加版本号 (version)');
    }

    if (!metadata.author) {
      warnings.push('建议添加作者信息 (author)');
    }

    if (!metadata.license) {
      warnings.push('建议添加许可证信息 (license)');
    }

    if (!metadata.parameters || metadata.parameters.length === 0) {
      warnings.push('建议添加参数定义 (parameters)');
    }

    if (!metadata.examples || metadata.examples.length === 0) {
      warnings.push('建议添加使用示例 (examples)');
    }

  } catch (parseError) {
    errors.push(`JSON 格式错误: ${parseError instanceof Error ? parseError.message : '无法解析JSON'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata,
  };
}

/**
 * 验证文本格式的技能文件
 */
function validateTextSkill(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.trim()) {
    errors.push('文件内容不能为空');
  }

  if (content.length < 10) {
    warnings.push('文件内容过短，建议添加更详细的描述');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证参数定义
 */
function validateParameter(param: any, index: number, errors: string[]): void {
  if (!param || typeof param !== 'object') {
    errors.push(`parameters[${index}] 必须是对象`);
    return;
  }

  if (!param.name || typeof param.name !== 'string') {
    errors.push(`parameters[${index}].name 是必需的字符串字段`);
  }

  if (!param.type || typeof param.type !== 'string') {
    errors.push(`parameters[${index}].type 是必需的字符串字段`);
  } else {
    const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
    if (!validTypes.includes(param.type)) {
      errors.push(`parameters[${index}].type 必须是以下值之一: ${validTypes.join(', ')}`);
    }
  }

  if (!param.description || typeof param.description !== 'string') {
    errors.push(`parameters[${index}].description 是必需的字符串字段`);
  }

  if (param.required !== undefined && typeof param.required !== 'boolean') {
    errors.push(`parameters[${index}].required 必须是布尔值`);
  }

  if (param.enum && !Array.isArray(param.enum)) {
    errors.push(`parameters[${index}].enum 必须是数组`);
  }

  if (param.pattern && typeof param.pattern !== 'string') {
    errors.push(`parameters[${index}].pattern 必须是字符串`);
  }
}

/**
 * 验证示例定义
 */
function validateExample(example: any, index: number, errors: string[]): void {
  if (!example || typeof example !== 'object') {
    errors.push(`examples[${index}] 必须是对象`);
    return;
  }

  if (!example.title || typeof example.title !== 'string') {
    errors.push(`examples[${index}].title 是必需的字符串字段`);
  }

  if (example.description && typeof example.description !== 'string') {
    errors.push(`examples[${index}].description 必须是字符串`);
  }

  if (!example.input || typeof example.input !== 'object') {
    errors.push(`examples[${index}].input 是必需的对象字段`);
  }
}

/**
 * 读取文件内容为文本
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * 格式化验证错误信息
 */
export function formatValidationErrors(result: ValidationResult): string {
  const messages: string[] = [];
  
  if (result.errors.length > 0) {
    messages.push('错误:');
    result.errors.forEach(error => messages.push(`• ${error}`));
  }
  
  if (result.warnings.length > 0) {
    if (messages.length > 0) messages.push('');
    messages.push('警告:');
    result.warnings.forEach(warning => messages.push(`• ${warning}`));
  }
  
  return messages.join('\n');
}