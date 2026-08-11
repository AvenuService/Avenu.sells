import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size = 20, rest: SVGProps<SVGSVGElement>) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const SearchIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const CartIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M2 4h2l2.4 12.3a1.6 1.6 0 0 0 1.6 1.3h8.8a1.6 1.6 0 0 0 1.6-1.2L21 7H6" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></svg>
);
export const MenuIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);
export const CloseIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const ChevronRight = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="m9 6 6 6-6 6" /></svg>
);
export const ChevronLeft = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="m15 6-6 6 6 6" /></svg>
);
export const ArrowRight = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M5 12h14M13 5l7 7-7 7" /></svg>
);
export const StarIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, { ...rest, fill: "currentColor", stroke: "none" })}><path d="m12 2 2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17l-5.8 3.8 1.6-6.7-5.2-4.6 6.9-.6L12 2Z" /></svg>
);
export const TrashIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M10 11v7M14 11v7" /></svg>
);
export const PlusIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M12 5v14M5 12h14" /></svg>
);
export const MinusIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M5 12h14" /></svg>
);
export const TruckIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>
);
export const ShieldIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const SwapIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M4 7h13M14 4l3 3-3 3M20 17H7M10 14l-3 3 3 3" /></svg>
);
export const SparkIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" /></svg>
);
export const CheckIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="m5 12 5 5L20 7" /></svg>
);
export const HeartIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M12 20s-7-4.7-9.4-9C1.2 8 2.7 5 5.7 5c2 0 3.2 1.2 4.3 2.7C11 6.2 12.3 5 14.3 5 17.3 5 18.8 8 17.4 11 15 15.3 12 20 12 20Z" /></svg>
);
export const UserIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>
);
export const FilterIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M3 5h18M6 12h12M10 19h4" /></svg>
);
export const ZapIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
);
export const LogoutIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M4 12h11" /></svg>
);
export const EditIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
);
export const CopyIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>
);
export const StarFilledIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, { ...rest, fill: "currentColor", stroke: "none" })}><path d="m12 2 2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17l-5.8 3.8 1.6-6.7-5.2-4.6 6.9-.6L12 2Z" /></svg>
);
export const DigitalIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M3 5h7l2 3h6v9a2 2 0 0 1-2 2H3z" /><path d="M11 13h6M11 16h4" /></svg>
);
export const BoxIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><path d="M12 3 21 8v8l-9 5-9-5V8l9-5Z" /><path d="M3 8l9 5 9-5M12 13v8" /></svg>
);
export const GlobeIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
);
export const InstagramIcon = ({ size, ...rest }: IconProps) => (
  <svg {...base(size, rest)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
