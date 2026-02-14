import React from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export const ShareButton: React.FC<ShareButtonsProps> = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const openShare = (link: string) => {
    window.open(link, "_blank", "width=600,height=400");
  };

  const btnBase =
    "w-10 h-10 flex items-center justify-center rounded-full text-white hover:scale-105 transition-transform";

  return (
    <div className="mt-6">
      <p className="text-gray-700 font-semibold mb-2">Share:</p>
      <div className="flex gap-3">
        <button
          onClick={() => openShare(socialLinks.facebook)}
          className={`${btnBase} bg-blue-600 hover:bg-blue-700`}
          aria-label="Share on Facebook"
        >
          <FaFacebookF className="w-5 h-5" />
        </button>

        <button
          onClick={() => openShare(socialLinks.twitter)}
          className={`${btnBase} bg-sky-400 hover:bg-sky-500`}
          aria-label="Share on Twitter"
        >
          <FaTwitter className="w-5 h-5" />
        </button>

        <button
          onClick={() => openShare(socialLinks.linkedin)}
          className={`${btnBase} bg-blue-500 hover:bg-blue-600`}
          aria-label="Share on LinkedIn"
        >
          <FaLinkedinIn className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
