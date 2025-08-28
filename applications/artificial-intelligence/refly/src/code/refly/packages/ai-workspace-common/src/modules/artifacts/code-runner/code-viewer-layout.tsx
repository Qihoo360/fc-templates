import { ReactNode } from 'react';

export default function CodeViewerLayout({
  children,
  isShowing,
}: {
  children: ReactNode;
  isShowing: boolean;
}) {
  return (
    <div className="h-full p-0 relative">
      {isShowing ? (
        <div className="absolute inset-0 overflow-hidden">{children}</div>
      ) : (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
          <p className="text-gray-400">Code editor closed</p>
        </div>
      )}
    </div>
  );
}
