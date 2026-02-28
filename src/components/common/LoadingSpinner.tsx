

export function LoadingSpinner({
  message = "One Momment✍️",
  fullScreen = false
}: {
  message?: string;
  fullScreen?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen bg-sbk-neutral-light' : 'py-12'}`}>
      <img
        src="/assets/logo.png"
        alt="Loading..."
        className="w-20 h-20 mb-4 animate-breathe drop-shadow-md"
      />
      <p className="text-sbk-slate-500 font-medium animate-pulse text-sm">{message}</p>
    </div>
  );
}
