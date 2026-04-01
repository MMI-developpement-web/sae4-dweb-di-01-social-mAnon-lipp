import { renderTweetContent } from "../../lib/parseTweet";
import { getImageUrl } from "../../lib/utils";
import type { Tweet } from "../../lib/api";

interface TweetBodyProps {
  tweet: Tweet;
}

export default function TweetBody({ tweet }: TweetBodyProps) {
  return (
    <div className="flex flex-col flex-1">
      {/* Tweet content */}
      <p className="text-tweet-text text-sm font-medium leading-normal break-words w-full">
        {renderTweetContent(tweet.content)}
      </p>

      {/* Media gallery */}
      {tweet.medias && tweet.medias.length > 0 && (
        <div className="mt-3 space-y-2">
          {tweet.medias.map((media, index) => {
            const imageUrl = getImageUrl(media.url);

            if (media.type === "image" && imageUrl) {
              return (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Tweet media ${index + 1}`}
                  className="w-full h-auto max-h-96 object-cover rounded-lg"
                />
              );
            } else if (media.type === "video" && imageUrl) {
              return (
                <video
                  key={index}
                  src={imageUrl}
                  controls
                  className="w-full h-40 sm:h-56 md:h-64 object-cover rounded-lg bg-black"
                />
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
