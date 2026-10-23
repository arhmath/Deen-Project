import type { ComponentType, SVGProps } from "react";
import type { Role } from "../../types/user";
import {
  ChartIcon,
  ChatIcon,
  DoorIcon,
  HomeIcon,
  MapIcon,
  BookOpenIcon,
  ProfileIcon,
  TrophyIcon,
  UsersIcon,
} from "../ui/DashIcons";

export interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** true → hanya aktif jika path sama persis */
  end?: boolean;
}

/** Sesuai Frontend Architecture §5 (Role Navigation). */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  SANTRI: [
    { label: "Dashboard", to: "/dashboard", icon: HomeIcon, end: true },
    { label: "Maps", to: "/maps", icon: MapIcon },
    { label: "Pembelajaran", to: "/learning", icon: BookOpenIcon },
    { label: "Leaderboard", to: "/leaderboard", icon: TrophyIcon },
    { label: "Profile", to: "/profile", icon: ProfileIcon },
    { label: "Chatbot", to: "/chat", icon: ChatIcon },
  ],
  PARENT: [
    { label: "Dashboard", to: "/dashboard", icon: HomeIcon, end: true },
    { label: "Monitoring Anak", to: "/parent", icon: UsersIcon },
    { label: "Chatbot", to: "/chat", icon: ChatIcon },
  ],
  ADMIN: [
    { label: "Dashboard", to: "/admin", icon: HomeIcon, end: true },
    { label: "Rooms", to: "/admin/rooms", icon: DoorIcon },
    { label: "Pembelajaran", to: "/admin/courses", icon: BookOpenIcon },
    { label: "Monitoring", to: "/admin/monitoring", icon: ChartIcon },
    { label: "Profile", to: "/profile", icon: ProfileIcon },
    { label: "Chatbot", to: "/chat", icon: ChatIcon },
  ],
};
