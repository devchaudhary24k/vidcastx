import type { Metadata } from "next";
import merge from "lodash.merge";

type MetadataGenerator = Omit<Metadata, "description" | "title"> & {
  title: string;
  description: string;
  image?: string;
};

const applicationName = "Pixelact Studios";
const author: Metadata["authors"] = {
  name: "Dev Talan",
  url: "https://devtalan.com",
};

const publisher = "Pixelact Studios";
const twitterHandle = "@pixelactstudios";
const protocol = process.env.ENVIRONMENT === "production" ? "https" : "http";
const productionUrl = process.env.PRODUCTION_URL;

export const createMetadata = ({
  title,
  description,
  image,
  ...properties
}: MetadataGenerator): Metadata => {
  const parsedTitle =
    title === applicationName
      ? applicationName
      : `${title} | ${applicationName}`;
  const defaultMetadata: Metadata = {
    title: parsedTitle,
    description,
    applicationName,
    metadataBase: productionUrl
      ? new URL(`${protocol}://${productionUrl}`)
      : undefined,
    authors: [author],
    creator: author.name,
    formatDetection: {
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: parsedTitle,
    },
    openGraph: {
      title: parsedTitle,
      description,
      type: "website",
      siteName: applicationName,
      locale: "en_US",
    },
    publisher,
    twitter: {
      card: "summary_large_image",
      creator: twitterHandle,
    },
  };

  const metadata: Metadata = merge(defaultMetadata, properties);

  if (image && metadata.openGraph) {
    metadata.openGraph.images = [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
  }

  return metadata;
};
