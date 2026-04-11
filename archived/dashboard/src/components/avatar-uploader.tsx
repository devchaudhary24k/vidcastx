"use client";

import React, { useRef, useState } from "react";
import { Camera, Pencil, Trash2, Upload } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@vidcastx/ui/components/avatar";

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
    const file = e.target.files?.[0];
    if (file) {
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsDialogOpen(true);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={className}>
      <div className="group relative inline-block cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <Avatar className="border-border h-24 w-24 border-2 transition-opacity">
          <AvatarImage src={value} className="object-cover" />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-bold uppercase">
            {fallbackInitials}
          </AvatarFallback>
        </Avatar>

        <div className="absolute -right-1 -bottom-1 z-10">
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm transition-colors dark:border-gray-950"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm dark:border-gray-950">
              <Pencil className="h-4 w-4" />
            </div>
          )}
        </div>

        <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} className="hidden" />
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
    reader.addEventListener("load", () => resolve(reader.result as string), false);
    reader.readAsDataURL(file);
  });
}
