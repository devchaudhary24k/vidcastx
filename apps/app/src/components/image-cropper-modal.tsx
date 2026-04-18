import type { Area } from "react-easy-crop";
import React, { useState } from "react";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import Cropper from "react-easy-crop";

import { Button } from "@vidcastx/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@vidcastx/ui/components/dialog";
import { Slider } from "@vidcastx/ui/components/slider";

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImageBase64: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleSave = async () => {
    if (imageSrc && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedImage) {
        onCropComplete(croppedImage);
        onClose();
      }
    }
  };

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile Photo</DialogTitle>
        </DialogHeader>
        <div className="relative h-64 w-full overflow-hidden bg-slate-900">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onRotationChange={setRotation}
              onCropComplete={(_, pixels) => {
                setCroppedAreaPixels(pixels);
              }}
              onZoomChange={setZoom}
              cropShape="round"
              showGrid={false}
            />
          )}
        </div>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <ZoomOut className="text-muted-foreground h-4 w-4" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(val: number | readonly number[]) => {
                const next = typeof val === "number" ? val : val[0];
                setZoom(next ?? 1);
              }}
              className="flex-1"
            />
            <ZoomIn className="text-muted-foreground h-4 w-4" />
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={handleRotateLeft} title="Rotate Left">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="text-muted-foreground min-w-[3ch] text-center text-sm">{rotation % 360}°</div>
            <Button variant="outline" size="icon" onClick={handleRotateRight} title="Rotate Right">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSave();
            }}
          >
            Save Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Helper Functions ---

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      resolve(image);
    });
    image.addEventListener("error", () => {
      reject(new Error("Failed to load image"));
    });
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  return canvas.toDataURL("image/jpeg");
}
