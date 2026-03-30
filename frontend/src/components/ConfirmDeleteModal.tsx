import Button from "./ui/Button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isLoading?: boolean;
  confirmButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  isLoading = false,
  confirmButtonText = "Supprimer",
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg p-6 max-w-sm mx-4 shadow-lg">
        <h2 className="text-lg font-bold text-text mb-2">{title}</h2>
        <p className="text-text-muted text-sm mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            type="button"
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? `${confirmButtonText}...` : confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}

