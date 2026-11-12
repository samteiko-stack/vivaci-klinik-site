"use client";

/**
 * App icon set — Lucide Icons with stable export names.
 * Import from `@/lib/icons` only.
 */

import type { LucideIcon as LucideIconComponent, LucideProps } from "lucide-react";
import {
  AlertCircle as LucideAlertCircle,
  AlertTriangle as LucideAlertTriangle,
  Archive as LucideArchive,
  ArchiveRestore as LucideArchiveRestore,
  ArrowLeft as LucideArrowLeft,
  ArrowRight as LucideArrowRight,
  BarChart2 as LucideBarChart2,
  Bell as LucideBell,
  Bold as LucideBold,
  Building as LucideBuilding,
  Calendar as LucideCalendar,
  CalendarCheck as LucideCalendarCheck,
  Check as LucideCheck,
  ChevronDown as LucideChevronDown,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  ChevronUp as LucideChevronUp,
  Circle as LucideCircle,
  CircleCheck as LucideCircleCheck,
  CircleMinus as LucideCircleMinus,
  Copy as LucideCopy,
  EllipsisVertical as LucideEllipsisVertical,
  ExternalLink as LucideExternalLink,
  Eye as LucideEye,
  EyeOff as LucideEyeOff,
  FileText as LucideFileText,
  Globe as LucideGlobe,
  GripVertical as LucideGripVertical,
  Inbox as LucideInbox,
  Info as LucideInfo,
  Italic as LucideItalic,
  Kanban as LucideKanban,
  KeyRound as LucideKeyRound,
  LayoutDashboard as LucideLayoutDashboard,
  LayoutGrid as LucideLayoutGrid,
  LayoutList as LucideLayoutList,
  Link2 as LucideLink2,
  List as LucideList,
  ListOrdered as LucideListOrdered,
  Loader2 as LucideLoader2,
  Lock as LucideLock,
  LogIn as LucideLogIn,
  LogOut as LucideLogOut,
  Mail as LucideMail,
  Megaphone as LucideMegaphone,
  Menu as LucideMenu,
  MessageCircle as LucideMessageCircle,
  MessagesSquare as LucideMessagesSquare,
  MessageSquare as LucideMessageSquare,
  Minus as LucideMinus,
  Music2 as LucideMusic2,
  NotebookPen as LucideNotebookPen,
  Paperclip as LucidePaperclip,
  Pencil as LucidePencil,
  Phone as LucidePhone,
  PhoneCall as LucidePhoneCall,
  PhoneIncoming as LucidePhoneIncoming,
  PhoneMissed as LucidePhoneMissed,
  PhoneOff as LucidePhoneOff,
  Plus as LucidePlus,
  RefreshCw as LucideRefreshCw,
  ScrollText as LucideScrollText,
  Search as LucideSearch,
  Send as LucideSend,
  Settings as LucideSettings,
  Share2 as LucideShare2,
  ShieldAlert as LucideShieldAlert,
  ShieldCheck as LucideShieldCheck,
  SlidersHorizontal as LucideSlidersHorizontal,
  Smile as LucideSmile,
  Sparkles as LucideSparkles,
  Stethoscope as LucideStethoscope,
  Trash2 as LucideTrash2,
  TrendingDown as LucideTrendingDown,
  TrendingUp as LucideTrendingUp,
  Upload as LucideUpload,
  User as LucideUser,
  UserCog as LucideUserCog,
  UserMinus as LucideUserMinus,
  UserPlus as LucideUserPlus,
  Users as LucideUsers,
  UserX as LucideUserX,
  X as LucideX,
} from "lucide-react";

export type AppIconProps = {
  className?: string;
  strokeWidth?: number;
  size?: number | string;
  /** Ignored — kept for backward compat */
  weight?: string;
};

export type AppIcon = React.ComponentType<AppIconProps>;

/** @deprecated Use AppIcon */
export type LucideIcon = AppIcon;

/** Source chips / raw Lucide components. */
export type IconProps = LucideProps;

const DEFAULT_STROKE = 1.75;

function createIcon(Icon: LucideIconComponent, defaultStroke = DEFAULT_STROKE): AppIcon {
  return function AppIconComponent({ className, strokeWidth, size }: AppIconProps) {
    return (
      <Icon
        className={className}
        size={size}
        strokeWidth={strokeWidth ?? defaultStroke}
        aria-hidden
      />
    );
  };
}

// ── UI icons ──
export const AlertCircle = createIcon(LucideAlertCircle);
export const AlertTriangle = createIcon(LucideAlertTriangle);
export const SlidersHorizontal = createIcon(LucideSlidersHorizontal);
export const ArchiveRestore = createIcon(LucideArchiveRestore);
export const ArrowLeft = createIcon(LucideArrowLeft);
export const ArrowRight = createIcon(LucideArrowRight);
export const BarChart2 = createIcon(LucideBarChart2);
export const Bold = createIcon(LucideBold);
export const CalendarCheck = createIcon(LucideCalendarCheck);
export const CalendarDays = createIcon(LucideCalendar);
export const Check = createIcon(LucideCheck);
export const CheckCircle = createIcon(LucideCircleCheck);
export const CheckCircle2 = createIcon(LucideCircleCheck);
export const ChevronDown = createIcon(LucideChevronDown);
export const ChevronLeft = createIcon(LucideChevronLeft);
export const ChevronRight = createIcon(LucideChevronRight);
export const ChevronUp = createIcon(LucideChevronUp);
export const Circle = createIcon(LucideCircle);
export const Copy = createIcon(LucideCopy);
export const MoreVertical = createIcon(LucideEllipsisVertical);
export const ExternalLink = createIcon(LucideExternalLink);
export const Eye = createIcon(LucideEye);
export const EyeOff = createIcon(LucideEyeOff);
export const FileText = createIcon(LucideFileText);
export const GripVertical = createIcon(LucideGripVertical);
export const Inbox = createIcon(LucideInbox);
export const InfoCircle = createIcon(LucideInfo);
export const Italic = createIcon(LucideItalic);
export const KeyRound = createIcon(LucideKeyRound);
export const LayoutDashboard = createIcon(LucideLayoutDashboard);
export const LayoutGrid = createIcon(LucideLayoutGrid);
export const LayoutKanban = createIcon(LucideKanban);
export const LayoutList = createIcon(LucideLayoutList);
export const Link2 = createIcon(LucideLink2);
export const List = createIcon(LucideList);
export const ListOrdered = createIcon(LucideListOrdered);
export const Loader = createIcon(LucideLoader2, 2);
export const Lock = createIcon(LucideLock);
export const LogIn = createIcon(LucideLogIn);
export const LogOut = createIcon(LucideLogOut);
export const Mail = createIcon(LucideMail);
export const Menu = createIcon(LucideMenu);
export const MessageCircle = createIcon(LucideMessageCircle);
export const MessageSquare = createIcon(LucideMessageSquare);
export const Minus = createIcon(LucideMinus);
export const MinusCircle = createIcon(LucideCircleMinus);
export const Paperclip = createIcon(LucidePaperclip);
export const Pencil = createIcon(LucidePencil);
export const Phone = createIcon(LucidePhone);
export const PhoneCall = createIcon(LucidePhoneCall);
export const PhoneIncoming = createIcon(LucidePhoneIncoming);
export const PhoneMissed = createIcon(LucidePhoneMissed);
export const PhoneOff = createIcon(LucidePhoneOff);
export const Plus = createIcon(LucidePlus);
export const RefreshCw = createIcon(LucideRefreshCw);
export const ScrollText = createIcon(LucideScrollText);
export const Search = createIcon(LucideSearch);
export const Send = createIcon(LucideSend);
export const Settings = createIcon(LucideSettings);
export const ShieldAlert = createIcon(LucideShieldAlert);
export const ShieldCheck = createIcon(LucideShieldCheck);
export const Smile = createIcon(LucideSmile);
export const Sparkles = createIcon(LucideSparkles);
export const StickyNote = createIcon(LucideNotebookPen);
export const Trash2 = createIcon(LucideTrash2);
export const TrendingDown = createIcon(LucideTrendingDown);
export const TrendingUp = createIcon(LucideTrendingUp);
export const Upload = createIcon(LucideUpload);
export const User = createIcon(LucideUser);
export const UserMinus = createIcon(LucideUserMinus);
export const UserPlus = createIcon(LucideUserPlus);
export const UserRoundCog = createIcon(LucideUserCog);
export const Users = createIcon(LucideUsers);
export const UserX = createIcon(LucideUserX);
export const X = createIcon(LucideX);
export const Bell = createIcon(LucideBell);
export const Archive = createIcon(LucideArchive);
export const Building = createIcon(LucideBuilding);
export const Stethoscope = createIcon(LucideStethoscope);
export const Speakerphone = createIcon(LucideMegaphone);

// ── Brand / channel (semantic Lucide stand-ins — no trademark logos in Lucide) ──
export const WhatsappLogoIcon = createIcon(LucideMessageCircle, 1.5);
export const MessengerLogoIcon = createIcon(LucideMessagesSquare, 1.5);
export const MetaLogoIcon = createIcon(LucideShare2, 1.5);
export const TiktokLogoIcon = createIcon(LucideMusic2, 1.5);
export const GlobeSimpleIcon = createIcon(LucideGlobe, 1.75);

export const WhatsAppChannelIcon = WhatsappLogoIcon;
export const EmailChannelIcon = createIcon(LucideMail, 1.75);
export const MessengerChannelIcon = MessengerLogoIcon;
export const NotesChannelIcon = createIcon(LucideNotebookPen, 1.75);

/** Raw Lucide components for SourceIcon (`size` / `strokeWidth`). */
export {
  LucideGlobe as GlobeSimple,
  LucideShare2 as MetaLogo,
  LucidePencil as PencilSimple,
  LucideMusic2 as TiktokLogo,
  LucideMessageCircle as WhatsappLogo,
};
