import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Stroke({ d, ...props }: P & { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

export const HomeIcon = (p: P) => <Stroke d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...p} />;
export const MapIcon = (p: P) => <Stroke d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" {...p} />;
export const BookOpenIcon = (p: P) => <Stroke d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7" {...p} />;
export const TrophyIcon = (p: P) => <Stroke d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4" {...p} />;
export const ProfileIcon = (p: P) => <Stroke d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" {...p} />;
export const ChatIcon = (p: P) => <Stroke d="M4 5h16v11H9l-5 4z" {...p} />;
export const UsersIcon = (p: P) => <Stroke d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5A6.5 6.5 0 0 1 21.5 20" {...p} />;
export const DoorIcon = (p: P) => <Stroke d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12h.01" {...p} />;
export const ChartIcon = (p: P) => <Stroke d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...p} />;
export const CheckIcon = (p: P) => <Stroke d="M5 12.5l4.5 4.5L19 7.5" {...p} />;
export const LogoutIcon = (p: P) => <Stroke d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9" {...p} />;
export const MenuIcon = (p: P) => <Stroke d="M4 6h16M4 12h16M4 18h16" {...p} />;
export const CloseIcon = (p: P) => <Stroke d="M6 6l12 12M18 6 6 18" {...p} />;
export const SearchIcon = (p: P) => <Stroke d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" {...p} />;
export const ChevronLeftIcon = (p: P) => <Stroke d="M15 5l-7 7 7 7" {...p} />;
export const ChevronRightIcon = (p: P) => <Stroke d="M9 5l7 7-7 7" {...p} />;
export const AlertIcon = (p: P) => <Stroke d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" {...p} />;
export const ShieldIcon = (p: P) => <Stroke d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...p} />;
export const ClockIcon = (p: P) => <Stroke d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" {...p} />;
export const ArrowRightIcon = (p: P) => <Stroke d="M5 12h14M13 6l6 6-6 6" {...p} />;

export const PlusIcon = (p: P) => <Stroke d="M12 5v14M5 12h14" {...p} />;
export const TrashIcon = (p: P) => <Stroke d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" {...p} />;
export const ArrowUpIcon = (p: P) => <Stroke d="M12 19V5M5 12l7-7 7 7" {...p} />;
export const ArrowDownIcon = (p: P) => <Stroke d="M12 5v14M5 12l7 7 7-7" {...p} />;
export const CopyIcon = (p: P) => <Stroke d="M9 9h11v11H9zM5 15H4V4h11v1" {...p} />;

export function CoinIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.6" />
      <path d="M12 8.5v7M9.5 11h5" stroke="#fff" strokeOpacity=".8" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
