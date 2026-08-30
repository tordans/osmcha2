import {
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  BugBeetle,
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  CaretUpDown,
  ChatCircleText,
  Check,
  CheckCircle,
  CircleNotch,
  Clipboard,
  ClipboardText,
  FlagPennant,
  Funnel,
  Globe,
  Link,
  MapPin,
  NotePencil,
  Pencil,
  Plus,
  PlusCircle,
  Quotes,
  Rss,
  Sidebar,
  SortAscending,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash,
  Translate,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import { appIcon } from './icon.tsx'

/** Action / control icons — Phosphor `regular` (outline). */
export const ArrowDownWideNarrowIcon = appIcon(SortAscending)
export const ArrowLeftIcon = appIcon(ArrowLeft)
export const ArrowRightIcon = appIcon(ArrowRight)
export const ArrowPathIcon = appIcon(ArrowClockwise)
export const CalendarDaysIcon = appIcon(CalendarBlank)
export const CheckIcon = appIcon(Check)
export const ChevronDownIcon = appIcon(CaretDown)
export const ChevronLeftIcon = appIcon(CaretLeft)
export const ChevronRightIcon = appIcon(CaretRight)
export const ChevronsUpDownIcon = appIcon(CaretUpDown)
export const ChevronUpIcon = appIcon(CaretUp)
export const ClipboardDocumentCheckIcon = appIcon(ClipboardText)
export const ClipboardIcon = appIcon(Clipboard)
export const ArrowTopRightOnSquareIcon = appIcon(ArrowSquareOut)
export const FunnelIcon = appIcon(Funnel)
export const GlobeAltIcon = appIcon(Globe)
export const HandThumbDownIcon = appIcon(ThumbsDown)
export const HandThumbUpIcon = appIcon(ThumbsUp)
export const LanguageIcon = appIcon(Translate)
export const LinkIcon = appIcon(Link)
export const MapPinIcon = appIcon(MapPin)
export const LoaderCircleIcon = appIcon(CircleNotch)
export const PanelLeftCloseIcon = appIcon(Sidebar)
export const PanelLeftOpenIcon = appIcon(Sidebar)
export const PencilIcon = appIcon(Pencil)
export const PencilSquareIcon = appIcon(NotePencil)
export const PlusCircleIcon = appIcon(PlusCircle)
export const PlusIcon = appIcon(Plus)
export const QuoteIcon = appIcon(Quotes)
export const RssIcon = appIcon(Rss)
export const TrashIcon = appIcon(Trash)
export const XMarkIcon = appIcon(X)
/** Dual-use: outline on buttons; pass `variant="fill"` for status badges. */
export const ChatBubbleLeftIcon = appIcon(ChatCircleText)
export const CircleCheckIcon = appIcon(CheckCircle)
export const FlagIcon = appIcon(FlagPennant)

/** Status-only — Phosphor `duotone` by default (`variant="fill"`). */
export const BugAntIcon = appIcon(BugBeetle, { status: true })
export const MessageCircleWarningIcon = appIcon(WarningCircle, { status: true })
export const ExclamationTriangleIcon = appIcon(Warning, { status: true })
export const StarIcon = appIcon(Star, { status: true })
