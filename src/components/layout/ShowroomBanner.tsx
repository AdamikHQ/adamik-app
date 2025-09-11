import Link from "next/link";

export const ShowroomBanner = () => {
  return (
    <div className="w-full bg-gray-800/70 text-center text-base py-2 rounded-full border border-gray-600 text-white flex items-center justify-center gap-1">
      You are using the demo version of Adamik App.{" "}
      <Link 
        href="/settings" 
        className="underline hover:text-blue-400 transition-colors"
      >
        Go to settings
      </Link>
      {" "}to change mode.
    </div>
  );
};
