import React, { useState, useRef } from 'react';
import { cn } from '../lib/utils';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Avatar from './ui/Avatar';
import Banner from './ui/Banner';

interface EditProfileFormProps {
  initialBio?: string;
  initialWebsite?: string;
  initialLocation?: string;
  initialProfilePicture?: string;
  initialBanner?: string;
  onSubmit: (bio: string, website: string, location: string, profilePicture?: File, bannerPicture?: File) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function EditProfileForm({
  initialBio = '',
  initialWebsite = '',
  initialLocation = '',
  initialProfilePicture,
  initialBanner,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: EditProfileFormProps) {
  // Form fields
  const [bio, setBio] = useState(initialBio);
  const [website, setWebsite] = useState(initialWebsite);
  const [location, setLocation] = useState(initialLocation);
  
  // File uploads
  const [profilePictureFile, setProfilePictureFile] = useState<File | undefined>();
  const [bannerPictureFile, setBannerPictureFile] = useState<File | undefined>();
  
  // Preview URLs
  const [profilePicturePreview, setProfilePicturePreview] = useState(initialProfilePicture);
  const [bannerPreview, setBannerPreview] = useState(initialBanner);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Input refs
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Handle profile picture change
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('La photo de profil doit être une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La photo de profil ne doit pas dépasser 5MB');
      return;
    }

    setProfilePictureFile(file);
    setProfilePicturePreview(URL.createObjectURL(file));
    setError(null);
  };

  // Handle banner picture change
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('La bannière doit être une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La bannière ne doit pas dépasser 5MB');
      return;
    }

    setBannerPictureFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit(bio, website, location, profilePictureFile, bannerPictureFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('w-full max-w-md', className)}>
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Banner Section */}
      <div className="relative mb-8">
        <div className="relative">
          <Banner
            src={bannerPreview}
            alt="Banner preview"
            height="lg"
          />
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors w-full"
            disabled={isLoading}
            aria-label="Change banner"
          >
            <svg
              className="h-7 w-7 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 7a2 2 0 0 1 2-2h3l1.2-1.6A2 2 0 0 1 10.8 3h2.4a2 2 0 0 1 1.6.8L16 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
          </button>
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerChange}
          disabled={isLoading}
          className="hidden"
          aria-label="Banner file input"
        />

        {/* Profile Picture */}
        <div className="absolute -bottom-8 left-4 md:left-6">
          <button
            type="button"
            onClick={() => profilePictureInputRef.current?.click()}
            className="relative inline-block disabled:opacity-50"
            disabled={isLoading}
            aria-label="Change profile picture"
          >
            <div className="relative rounded-lg overflow-hidden ring-4 ring-white">
              <Avatar
                src={profilePicturePreview}
                alt="Profile picture preview"
                size="lg"
                className="w-24 h-24 md:w-28 md:h-28"
              />
            </div>
            <div className="absolute inset-0 rounded-lg bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors">
              <svg
                className="h-6 w-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 7a2 2 0 0 1 2-2h3l1.2-1.6A2 2 0 0 1 10.8 3h2.4a2 2 0 0 1 1.6.8L16 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
            </div>
          </button>
        </div>
        <input
          ref={profilePictureInputRef}
          type="file"
          accept="image/*"
          onChange={handleProfilePictureChange}
          disabled={isLoading}
          className="hidden"
          aria-label="Profile picture file input"
        />
      </div>

      {/* Form fields */}
      <div className="space-y-4 mt-12">
        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
            placeholder="Parlez-nous de vous..."
            maxLength={500}
            disabled={isLoading}
            className="min-h-20"
          />
          <p className="text-xs text-gray-500 mt-1">{bio.length}/500</p>
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Site Web
          </label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
            placeholder="https://votre-site.com"
            disabled={isLoading}
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Localisation
          </label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
            placeholder="Votre ville, pays"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-6 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
