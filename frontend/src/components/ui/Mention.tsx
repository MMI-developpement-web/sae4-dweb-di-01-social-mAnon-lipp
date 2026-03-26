import { useNavigate } from "react-router-dom";
import { fetchUserByUsername } from "../../lib/api";

interface MentionProps {
  username: string;
}

export default function Mention({ username }: MentionProps) {
  const navigate = useNavigate();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetchUserByUsername(username);
      navigate(`/profile/${response.user.id}`);
    } catch (error) {
      console.error(`Failed to navigate to @${username}:`, error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-blue-500 font-semibold hover:underline cursor-pointer bg-none border-none p-0"
      type="button"
    >
      @{username}
    </button>
  );
}
