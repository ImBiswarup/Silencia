'use client';

import Header from "@/app/components/Header";
import axios from "axios";
import { useEffect, useState } from "react";


interface Post {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  userId: string;
  reactions: Reaction[];
  comments: Comment[];
}

interface Reaction {
  id: string;
  type: string;
  userId: string;
  confessionId: string;
}

interface Comment {
  id: string;
  text: string;
  userId: string;
  confessionId: string;
  createdAt: string;
}

const reactionLabels: Record<string, string> = {
  STAY_STRONG: "💪 Stay Strong",
  SUPPORT: "🤝 Support",
};

const WORD_LIMIT = 50;

const ProfilePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get("/api/user/posts");
        console.log(res.data);
        setPosts(res.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError("Please login to view profile");
        } else {
          setError("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        <h1 className="text-2xl font-semibold">Your confessions ...</h1>

        {posts.length === 0 && (
          <p className="text-gray-500">
            You haven't posted anything yet.
          </p>
        )}

        {posts.map((post) => {
          const words = post.content.trim().split(/\s+/);
          const exceedsLimit = words.length > WORD_LIMIT;
          const isExpanded = expandedPosts[post.id];

          const displayedText =
            exceedsLimit && !isExpanded
              ? words.slice(0, WORD_LIMIT).join(" ")
              : post.content;

          const reactionCounts = post.reactions.reduce<Record<string, number>>(
            (acc, r) => {
              acc[r.type] = (acc[r.type] || 0) + 1;
              return acc;
            },
            {}
          );

          return (
            <div
              key={post.id}
              className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
            >
              <div className="text-sm text-gray-400 mb-2">
                {new Date(post.createdAt).toLocaleDateString()} • {post.category}
              </div>

              <p className="text-gray-800 whitespace-pre-wrap mb-2">
                {displayedText}
                {exceedsLimit && !isExpanded && " ..."}
              </p>

              {exceedsLimit && (
                <button
                  onClick={() => toggleExpand(post.id)}
                  className="text-sm text-indigo-600 hover:underline mb-4"
                >
                  {isExpanded ? "Read less" : "Read more"}
                </button>
              )}

              {/* Reactions */}
              <div className="flex flex-wrap gap-3 text-sm">
                {Object.keys(reactionCounts).length === 0 && (
                  <span className="text-gray-400">
                    No reactions yet
                  </span>
                )}

                {Object.entries(reactionCounts).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 bg-gray-100 text-black px-3 py-1 rounded-lg"
                  >
                    <span>
                      {reactionLabels[type] || type}
                    </span>
                    <span className="font-medium text-black">
                      {count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Comments Section */}
              <div className="mt-4 border-t pt-3">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Comments ({post.comments.length})
                </h3>

                {post.comments.length === 0 && (
                  <p className="text-sm text-gray-400">
                    No comments yet
                  </p>
                )}

                <div className="space-y-2">
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 p-3 rounded-lg text-sm"
                    >
                      <div className="text-gray-800 whitespace-pre-wrap">
                        {comment.text}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </>
  );
};

export default ProfilePage;