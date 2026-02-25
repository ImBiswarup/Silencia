'use client';
import { useState, useEffect } from "react";
import AuthModal from "./AuthModal";
import { useRouter } from "next/navigation";
import axios from "axios";

interface User {
  id: string;
  username: string;
}

const Header = () => {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();


  useEffect(() => {
    const fetchUser = async () => {
      const res = await axios.get("/api/user")
      console.log(res.data);
      setUser(res.data);
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await axios.post("/api/user/logout");
    setUser(null);
    setOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 bg-transparent backdrop-blur-md z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between py-3 px-4">

          <h1
            onClick={() => { router.push("/") }}
            className="text-xl font-semibold tracking-tight cursor-pointer"
          >
            Echoes
          </h1>

          <div className="relative">

            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user ? user.username : "A"}
              </div>

              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user ? user.username?.charAt(0) : "Anonymous"}
              </span>

              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fadeIn">

                {!user && (
                  <button
                    onClick={() => {
                      setAuthOpen(true);
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm transition"
                  >
                    Login / Register
                  </button>
                )}

                {user && (
                  <>
                    <button
                      className="w-full text-left px-4 py-2 text-sm transition cursor-pointer text-black hover:bg-gray-50"
                      onClick={() => { router.push(`/user`) }}
                    >
                      Profile
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                    >
                      Logout
                    </button>
                  </>
                )}

              </div>
            )}

          </div>
        </div>
      </header >

      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
};

export default Header;