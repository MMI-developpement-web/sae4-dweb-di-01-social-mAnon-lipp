import { useState } from 'react';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import { cn } from '../lib/utils';

interface RetweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (content?: string) => Promise<void>;
  isLoading?: boolean;
}

const MAX_COMMENT_LENGTH = 280;

export default function RetweetModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: RetweetModalProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_COMMENT_LENGTH - content.length;
  const isOver = remaining < 0;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm(content || undefined);
      setContent('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retweet failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg sm:p-6">
        <h2 className="mb-4 text-lg font-bold">Ajouter un commentaire (optionnel)</h2>

        <Textarea
          placeholder="Qu'en penses-tu ? (optionnel)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_COMMENT_LENGTH + 100}
          disabled={isLoading}
          className="mb-3"
        />

        <div className={cn('mb-4 text-sm', remaining < 0 ? 'text-red-500 font-semibold' : 'text-gray-500')}>
          {remaining} caractères restants
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading || isOver}
            className="flex-1"
          >
            {isLoading ? 'Retweet en cours...' : 'Retweeter'}
          </Button>
        </div>
      </div>
    </div>
  );
}
