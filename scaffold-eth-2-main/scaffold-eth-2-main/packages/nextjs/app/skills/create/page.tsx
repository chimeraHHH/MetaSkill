"use client";

import { useMemo, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton, EtherInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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
  const [priceEth, setPriceEth] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
    try {
      setUploading(true);
      let fileObj: any = undefined;
      if (file) {
        const content = await file.arrayBuffer();
        const b64 = arrayBufferToBase64(content);
        fileObj = { name: file.name, type: file.type, size: file.size, base64: b64 };
      }
      const metadata = {
        name,
        description,
        license,
        createdAt: new Date().toISOString(),
        skill: fileObj,
      };
      const tokenURI = await uploadJsonToIPFS(metadata);
      const tx = await writeContractAsync({ functionName: "mintSkill", args: [address, tokenURI, BigInt(priceWei)] });
      notification.success(`Tx sent: ${tx}`);
      setName("");
      setDescription("");
      setLicense("CC-BY-4.0");
      setPriceEth("0");
      setFile(null);
    } catch (err: any) {
      console.error(err);
      notification.error(err?.message || "Create failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Skill</h1>
        <RainbowKitCustomConnectButton />
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="form-control">
          <label className="label"><span className="label-text">Skill Name</span></label>
          <input className="input input-bordered" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Image Captioning" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Description</span></label>
          <textarea className="textarea textarea-bordered" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe the skill" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">License</span></label>
          <input className="input input-bordered" value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. CC-BY-4.0" />
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
    </div>
  );
};

export default CreateSkillPage;

