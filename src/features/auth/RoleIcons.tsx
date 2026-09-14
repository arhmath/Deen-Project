import type { SVGProps } from "react";
import type { UserRole } from "../../types/auth";

function SantriIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M4.5 20c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5" />
      <path d="M9 6.2c0-1.5 1.3-2.7 3-2.7" />
    </svg>
  );
}

function ParentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8.5" cy="7" r="3" />
      <circle cx="17" cy="8.5" r="2.2" />
      <path d="M3 20c0-3.4 2.5-5.4 5.5-5.4S14 16.6 14 20" />
      <path d="M15.2 14.3c2.4.2 4.3 1.9 4.3 4.4" />
    </svg>
  );
}

export function UsersRoleIcon({
  role,
  ...props
}: SVGProps<SVGSVGElement> & { role: UserRole }) {
  return role === "SANTRI" ? <SantriIcon {...props} /> : <ParentIcon {...props} />;
}
