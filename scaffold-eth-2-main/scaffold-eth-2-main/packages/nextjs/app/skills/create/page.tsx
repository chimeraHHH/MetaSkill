"use client";

import { useMemo, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton, EtherInput } from "~~/components/scaffold-eth";
import { SkillFileUpload } from "~~/components/SkillFileUpload";
import { SkillPreview } from "~~/components/SkillPreview";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { type ValidationResult } from "~~/utils/skillValidation";

const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
  }
  return typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}

async function uploadJsonToIPFS(payload: any): Promise<string> {
  if (!pinataJwt) {
    const data = `data:application/json;utf8,${encodeURIComponent(JSON.stringify(payload))}`;
    return data;
  }
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Pinata error: ${res.status}`);
  const json = await res.json();
  return `ipfs://${json.IpfsHash}`;
}

const CreateSkillPage: NextPage = () => {
  const { address } = useAccount();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [license, setLicense] = useState("CC-BY-4.0");
  const [category, setCategory] = useState("tools");
  const [tagsInput, setTagsInput] = useState("AI, Skill");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [priceEth, setPriceEth] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [rawFileContent, setRawFileContent] = useState<string>("");

  const categories = useMemo(
    () => [
      { value: "tools", label: "工具" },
      { value: "creative", label: "创意" },
      { value: "analytics", label: "数据分析" },
      { value: "assistant", label: "智能助理" },
      { value: "education", label: "教育" },
      { value: "entertainment", label: "娱乐" },
      { value: "others", label: "其他" },
    ],
    [],
  );

  const priceWei = useMemo(() => {
    try {
      const [whole, frac = ""] = priceEth.split(".");
      const fracPadded = (frac + "000000000000000000").slice(0, 18);
      const wei = BigInt(whole || "0") * 10n ** 18n + BigInt(fracPadded || "0");
      return wei.toString();
    } catch {
      return "0";
    }
  }, [priceEth]);

  const { writeContractAsync, isPending } = useScaffoldWriteContract("SkillNFT");

  // 处理文件选择和验证结果
  const handleFileSelect = async (selectedFile: File | null) => {
    setFile(selectedFile);
    if (selectedFile) {
      try {
        const content = await selectedFile.text();
        setRawFileContent(content);
      } catch (error) {
        console.error('Error reading file content:', error);
        setRawFileContent("");
      }
    } else {
      setRawFileContent("");
    }
  };

  const handleValidationResult = (result: ValidationResult | null) => {
    setValidationResult(result);
    
    // 如果验证通过且有元数据，自动填充表单字段
    if (result?.isValid && result.metadata) {
      if (result.metadata.name && !name.trim()) {
        setName(result.metadata.name);
      }
      if (result.metadata.description && !description.trim()) {
        setDescription(result.metadata.description);
      }
      if (result.metadata.license && license === "CC-BY-4.0") {
        setLicense(result.metadata.license);
      }
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      notification.error("Please connect wallet");
      return;
    }
    if (!name.trim()) {
      notification.error("Please enter skill name");
      return;
    }
    
    // 如果有文件但验证失败，阻止提交
    if (file && validationResult && !validationResult.isValid) {
      notification.error("Please fix file validation errors before submitting");
      return;
    }
    
    try {
      setUploading(true);
      let fileObj: any = undefined;
      if (file) {
        const content = await file.arrayBuffer();
        const b64 = arrayBufferToBase64(content);
        fileObj = { 
          name: file.name, 
          type: file.type, 
          size: file.size, 
          base64: b64,
          // 如果有验证结果，包含元数据
          ...(validationResult?.isValid && validationResult.metadata ? {
            metadata: validationResult.metadata
          } : {})
        };
      }
      const parseCommaList = (value: string) =>
        value
          .split(/[，,]/)
          .map(item => item.trim())
          .filter(Boolean);

      const metadata = {
        name,
        description,
        license,
        category,
        tags: parseCommaList(tagsInput),
        keywords: parseCommaList(keywordsInput || tagsInput),
        createdAt: new Date().toISOString(),
        skill: fileObj,
        // 如果有验证通过的技能元数据，也包含在顶层
        ...(validationResult?.isValid && validationResult.metadata ? {
          skillMetadata: validationResult.metadata
        } : {})
      };
      const tokenURI = await uploadJsonToIPFS(metadata);
      const tx = await writeContractAsync({ functionName: "mintSkill", args: [address, tokenURI, BigInt(priceWei)] });
      notification.success(`Skill created successfully! Transaction: ${tx}`);
      
      // 重置表单
      setName("");
      setDescription("");
      setLicense("CC-BY-4.0");
      setCategory("tools");
      setTagsInput("AI, Skill");
      setKeywordsInput("");
      setPriceEth("0");
      setFile(null);
      setValidationResult(null);
      setRawFileContent("");
    } catch (err: any) {
      console.error(err);
      notification.error(err?.message || "Create failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Skill</h1>
        <RainbowKitCustomConnectButton />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：表单 */}
        <div className="space-y-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">技能名称 *</span>
              </label>
              <input 
                className="input input-bordered" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="例如：图像描述生成" 
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">技能描述</span>
              </label>
              <textarea 
                className="textarea textarea-bordered" 
                rows={4} 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="简要描述这个技能的功能和用途" 
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">许可证</span>
              </label>
              <input 
                className="input input-bordered" 
                value={license} 
                onChange={e => setLicense(e.target.value)} 
                placeholder="例如：CC-BY-4.0" 
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">价格 (ETH)</span>
              </label>
              <EtherInput 
                name="price" 
                value={priceEth} 
                onChange={setPriceEth} 
                placeholder="0.00" 
              />
            </div>
            
            <button 
              className="btn btn-primary w-full" 
              type="submit" 
              disabled={isPending || uploading || (file && validationResult && !validationResult.isValid)}
            >
              {isPending || uploading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  处理中...
                </>
              ) : (
                "创建技能"
              )}
            </button>
          </form>
          
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm">
              如果未配置 IPFS，元数据将存储为 data URI，仅用于本地演示。
            </span>
          </div>
        </div>

        {/* 右侧：文件上传和预览 */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">技能文件上传</h2>
            <SkillFileUpload
              onFileSelect={handleFileSelect}
              onValidationResult={handleValidationResult}
              disabled={uploading || isPending}
            />
          </div>
          
          {/* 技能预览 */}
          {validationResult?.isValid && validationResult.metadata && (
            <div>
              <h2 className="text-xl font-semibold mb-4">技能预览</h2>
              <SkillPreview
                metadata={validationResult.metadata}
                rawContent={rawFileContent}
              />
            </div>
          )}
        </div>
<<<<<<< Updated upstream
      </div>
=======
        <div className="form-control">
          <label className="label"><span className="label-text">License</span></label>
          <input className="input input-bordered" value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. CC-BY-4.0" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Category</span></label>
            <select className="select select-bordered" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Tags</span></label>
            <input
              className="input input-bordered"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="Comma separated tags"
            />
            <label className="label">
              <span className="label-text-alt">例：AI, DeFi, NFT</span>
            </label>
          </div>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Search Keywords (optional)</span></label>
          <input
            className="input input-bordered"
            value={keywordsInput}
            onChange={e => setKeywordsInput(e.target.value)}
            placeholder="e.g. 自动化,营销,中文"
          />
          <label className="label">
            <span className="label-text-alt">用于增强搜索匹配，多个词用逗号分隔。</span>
          </label>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Price</span></label>
          <EtherInput name="price" value={priceEth} onChange={setPriceEth} placeholder="0.00" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Skill File (optional)</span></label>
          <input className="file-input file-input-bordered" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={isPending || uploading}>{isPending || uploading ? "Processing..." : "Create Skill"}</button>
      </form>
      <p className="mt-4 text-sm opacity-70">If IPFS is not configured, metadata will be stored as a data URI for local demo only.</p>
>>>>>>> Stashed changes
    </div>
  );
};

export default CreateSkillPage;
