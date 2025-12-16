"use client";

import React, { useRef, useState } from "react";
import { Camera } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@vidcastx/ui/components/avatar";

import { ImageCropperModal } from "./image-cropper-modal";

interface AvatarUploaderProps {
  value?: string;
  onChange: (base64: string) => void;
  fallbackInitials?: string;
  className?: string;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  value,
  onChange,
  fallbackInitials = "??",
  className,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className={className}>
      <div
        className="group relative inline-block cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Avatar className="border-border h-24 w-24 border-2 transition-opacity group-hover:opacity-90">
          <AvatarImage src={value} className="object-cover" />
          <AvatarFallback className="text-xl font-bold uppercase">
            {fallbackInitials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-8 w-8 text-white" />
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      <ImageCropperModal
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        imageSrc={imageSrc}
        onCropComplete={onChange}
      />
    </div>
  );
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => resolve(reader.result as string),
      false,
    );
    reader.readAsDataURL(file);
  });
}
