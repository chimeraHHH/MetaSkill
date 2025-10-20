"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookmarkIcon, HeartIcon, PlayIcon } from "@heroicons/react/24/outline";
import type { SkillItem } from "~~/hooks/useSkillsData";

const fallbackImage = "/placeholder.png"; // 需要时可添加占位图

const formatPriceEth = (value: number) => {
  if (!value) return "Free";
  const precision = value >= 1 ? 3 : 4;
  const trimmed = Number(value.toFixed(precision)).toString();
  return `${trimmed} ETH`;
};

export interface SkillCardProps {
  skill: SkillItem;
  href?: string;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (skill: SkillItem) => void;
  showPrice?: boolean;
  showCreator?: boolean;
  extra?: React.ReactNode; // 卡片底部额外内容（如市场页的上架/下架按钮）
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  href,
  onClick,
  isFavorite,
  onToggleFavorite,
  showPrice = true,
  showCreator = true,
  extra,
}) => {
  const router = useRouter();
  const mediaUrl = skill.metadata?.mediaUrl;
  const isVideo = mediaUrl ? mediaUrl.startsWith("data:video") || mediaUrl.includes(".mp4") : false;

  const CardInner = (
    <div className="card bg-base-100 shadow hover:shadow-xl transition cursor-pointer">
      <figure className="relative h-48 overflow-hidden bg-base-200">
        {mediaUrl ? (
          isVideo ? (
            <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted />
          ) : (
            <Image
              src={mediaUrl}
              alt={skill.metadata?.name ?? "Skill preview"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          )
        ) : (
          <Image
            src={fallbackImage}
            alt="Skill placeholder"
            fill
            sizes="100vw"
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        )}
      </figure>
      <div className="card-body">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h4 className="card-title text-lg line-clamp-1">{skill.metadata?.name ?? `#${skill.tokenId.toString()}`}</h4>
            {skill.metadata?.description && (
              <p className="text-sm opacity-70 line-clamp-2">{skill.metadata.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`btn btn-circle btn-ghost btn-xs ${isFavorite ? "text-red-500" : ""}`}
              type="button"
              onClick={e => {
                e.stopPropagation();
                onToggleFavorite?.(skill);
              }}
              aria-label={isFavorite ? "Unfavourite" : "Favourite"}
            >
              <HeartIcon className="w-4 h-4" />
            </button>
            <button className="btn btn-circle btn-ghost btn-xs" type="button" aria-label="Preview">
              <PlayIcon className="w-4 h-4" />
            </button>
            <button className="btn btn-circle btn-ghost btn-xs" type="button" aria-label="Bookmark">
              <BookmarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          {showCreator ? (
            <span className="text-xs opacity-70">By {skill.creator?.slice(0, 6)}…</span>
          ) : (
            <span />
          )}
          {showPrice ? <span className="text-xs font-medium">{formatPriceEth(skill.priceEth)}</span> : <span />}
        </div>

        {extra && <div className="mt-4">{extra}</div>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block" onClick={onClick}>
        {CardInner}
      </Link>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick ? onClick() : router.push(`/skills/${skill.tokenId.toString()}`)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") (onClick ? onClick() : router.push(`/skills/${skill.tokenId.toString()}`));
      }}
    >
      {CardInner}
    </div>
  );
};

export default SkillCard;