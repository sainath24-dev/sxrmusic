import React from 'react';
import { clsx } from 'clsx';

export const Skeleton = ({ className, circle }) => {
  return (
    <div
      className={clsx(
        "animate-pulse bg-[#E5E7EB]",
        circle ? "rounded-full" : "rounded-xl",
        className
      )}
    />
  );
};

export const CardSkeleton = ({ type = 'square' }) => (
  <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB] flex flex-col gap-3 animate-pulse">
    <div className={clsx("w-full aspect-square bg-[#E5E7EB]", type === 'circle' ? "rounded-full" : "rounded-xl")} />
    <div className="flex flex-col gap-2 pt-1">
      <div className="w-3/4 h-3.5 bg-[#E5E7EB] rounded-md" />
      <div className="w-1/2 h-2.5 bg-[#E5E7EB] rounded-md" />
    </div>
  </div>
);

export const RowSkeleton = () => (
  <div className="flex items-center gap-4 py-2 animate-pulse">
    <div className="w-10 h-10 bg-[#E5E7EB] rounded-xl shrink-0" />
    <div className="flex flex-col gap-2 flex-1">
      <div className="w-1/3 h-3.5 bg-[#E5E7EB] rounded-md" />
      <div className="w-1/4 h-2.5 bg-[#E5E7EB] rounded-md" />
    </div>
  </div>
);
