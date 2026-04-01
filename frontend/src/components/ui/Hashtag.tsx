import { useNavigate } from "react-router-dom";

interface HashtagProps {
  hashtag: string;
}

export default function Hashtag({ hashtag }: HashtagProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/?type=hashtag&q=${encodeURIComponent(hashtag)}`);
  };

  return (
    <button
      onClick={handleClick}
      className="text-blue-500 font-semibold hover:underline cursor-pointer bg-none border-none p-0 inline"
      type="button"
      title={`Search #${hashtag}`}
    >
      #{hashtag}
    </button>
  );
}
