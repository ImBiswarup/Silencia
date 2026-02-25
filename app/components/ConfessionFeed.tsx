"use client";
import axios from "axios";
import { useEffect, useState, useRef } from "react";

type User = { id: string; username: string };

type Post = {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  reactions: Record<string, number>;
  userReaction: string | null;
  user: User;
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: User;
};

const reactionConfig: Record<
  string,
  { emoji: string; label: string }
> = {
  SUPPORT: { emoji: "🤝", label: "Support" },
  RELATE: { emoji: "🫶", label: "Relate" },
  HUG: { emoji: "🤗", label: "Hug" },
  STAY_STRONG: { emoji: "💪", label: "Stay Strong" },
  PROUD_OF_YOU: { emoji: "🌟", label: "Proud of You" },
  THATS_TOUGH: { emoji: "💔", label: "That's Tough" },
};

export default function ConfessionFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activePost, setActivePost] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/confessions");
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to load posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const react = async (id: string, type: string) => {
    setPosts(prev =>
      prev.map(post => {
        if (post.id !== id) return post;

        const current = post.userReaction;
        const updated = { ...post.reactions };

        if (current) {
          updated[current] = (updated[current] || 1) - 1;
          if (updated[current] <= 0) delete updated[current];
        }

        let newReaction: string | null = type;

        if (current === type) {
          newReaction = null;
        } else {
          updated[type] = (updated[type] || 0) + 1;
        }

        return {
          ...post,
          reactions: updated,
          userReaction: newReaction,
        };
      })
    );

    setActivePost(null);

    try {
      await axios.patch(`/api/confessions/${id}/like`, { type });
    } catch (err) {
      console.error("Reaction failed", err);
      load(); // fallback to server truth
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const res = await axios.get(
        `/api/comments?confessionId=${postId}`
      );

      setComments(prev => ({
        ...prev,
        [postId]: res.data,
      }));
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;

    try {
      const res = await axios.post("/api/comments", {
        confessionId: postId,
        text,
      });

      setComments(prev => ({
        ...prev,
        [postId]: [res.data, ...(prev[postId] || [])],
      }));

      setCommentInputs(prev => ({
        ...prev,
        [postId]: "",
      }));
    } catch (err) {
      console.error("Failed to submit comment", err);
    }
  };

  const handlePressStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setActivePost(id);
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleShare = async (postId: string) => {
    try {
      const url = `${window.location.origin}/confession/${postId}`;
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy link");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <p>No confessions</p>
      ) : (
        posts.map(post => {
          const words = post.content.trim().split(/\s+/);
          const exceedsLimit = words.length > 50;
          const isExpanded = expandedPosts[post.id];

          const displayedText =
            exceedsLimit && !isExpanded
              ? words.slice(0, 50).join(" ")
              : post.content;

          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 transition hover:shadow-md"
            >
              {/* Header */}
              <div className="flex justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">
                    {post?.user?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-3 py-3 font-bold rounded-full bg-gray-100 text-gray-600 border">
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <p className="text-lg mb-2 whitespace-pre-wrap">
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

              {/* Actions */}
              <div className="flex items-center gap-6 text-sm">
                <button
                  onClick={() => setActivePost(post.id)}
                  onTouchStart={() => handlePressStart(post.id)}
                  onTouchEnd={handlePressEnd}
                  className="px-3 py-1 rounded hover:bg-gray-100 transition cursor-pointer"
                >
                  {post.userReaction && reactionConfig[post.userReaction]
                    ? `${reactionConfig[post.userReaction].emoji} ${reactionConfig[post.userReaction].label}`
                    : "React"}
                </button>

                <button
                  onClick={() => {
                    if (activeComments === post.id) {
                      setActiveComments(null);
                    } else {
                      setActiveComments(post.id);
                      if (!comments[post.id]) loadComments(post.id);
                    }
                  }}
                  className="hover:text-black cursor-pointer"
                >
                  💬 Comment {comments[post.id]?.length || ""}
                </button>

                <button
                  onClick={() => handleShare(post.id)}
                  className="hover:text-black cursor-pointer">↗ Share</button>
              </div>

              {/* Reaction Summary */}
              <div className="flex gap-3 text-sm text-gray-600 mt-2">
                {Object.entries(post.reactions).map(([type, count]) => (
                  <span key={type}>
                    {reactionConfig[type]?.emoji} {count}
                  </span>
                ))}
              </div>

              {/* Reaction Modal */}
              {activePost === post.id && (
                <div
                  className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
                  onClick={() => setActivePost(null)}
                >
                  <div
                    className="bg-white rounded-full px-6 py-4 flex gap-4 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.entries(reactionConfig).map(([type, config]) => (
                      <button
                        key={type}
                        onClick={() => react(post.id, type)}
                        className="text-3xl transform transition duration-200 hover:scale-125 active:scale-110"
                      >
                        {config.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment Section */}
              {activeComments === post.id && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div className="flex gap-2">
                    <input
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs(prev => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      placeholder="Write a comment..."
                      className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => submitComment(post.id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
                    >
                      Post
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {comments[post.id]?.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No comments yet.
                      </p>
                    )}

                    {comments[post.id]?.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 rounded-xl p-3 text-sm"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold">
                            {comment.user.username}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}