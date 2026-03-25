import { useEffect, useState } from 'react';
import { useNavigate, redirect } from 'react-router-dom';
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import Button from '../components/ui/Button';
import EditProfileForm from '../components/EditProfileForm';
import { useStore } from '../store/StoreContext';

export async function loader() {
  const token = localStorage.getItem('auth_token');
  if (!token) return redirect('/login');
  return null;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, errors, clearError } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (
    bio: string,
    website: string,
    location: string,
    profilePicture?: File,
    bannerPicture?: File,
  ) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearError('updateProfile');

    try {
      await updateProfile(bio, website, location, profilePicture, bannerPicture);
      setSuccessMessage('Profil mis à jour avec succès!');
      
      // Redirect after a brief delay
      setTimeout(() => {
        if (currentUser) {
          navigate(`/profile/${currentUser.id}`);
        }
      }, 1500);
    } catch (err) {
      console.error('Update profile error:', err);
      // Error is already set in store
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard: don't render form if not authenticated (useEffect will handle redirect)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        {/* Header with back button and title */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Retour"
            >
              <svg
                className="w-5 h-6"
                viewBox="0 0 13 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 2L2 10l9 8" />
              </svg>
            </Button>
            <h1 className="text-lg font-medium text-gray-900">Modifier le profil</h1>
          </div>
        </header>

        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error message from store */}
        {errors['updateProfile'] && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{errors['updateProfile']}</p>
          </div>
        )}

        {/* Form */}
        <EditProfileForm
          initialBio={currentUser.bio || ''}
          initialWebsite={currentUser.website || ''}
          initialLocation={currentUser.location || ''}
          initialProfilePicture={currentUser.profilePicture}
          initialBanner={currentUser.bannerPicture}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          isLoading={isSubmitting}
        />
      </main>
      <NavBar />
    </div>
  );
}
