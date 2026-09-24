/// <reference types="vite/client" />

declare module "lucide-react" {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

  type Icon = ForwardRefExoticComponent<
    SVGProps<SVGSVGElement> & { size?: string | number } & RefAttributes<SVGSVGElement>
  >;

  export const AlertCircle: Icon, ArrowLeft: Icon, ArrowRight: Icon, ArrowUpRight: Icon;
  export const BarChart3: Icon, Bell: Icon, Briefcase: Icon, Building2: Icon;
  export const Calendar: Icon, Camera: Icon, Check: Icon, CheckCircle2: Icon;
  export const ChevronDown: Icon, ChevronLeft: Icon, ChevronRight: Icon, ChevronsRight: Icon;
  export const Clock: Icon, Copy: Icon, Database: Icon, DollarSign: Icon, Download: Icon;
  export const Edit3: Icon, ExternalLink: Icon, Eye: Icon, EyeOff: Icon, Factory: Icon;
  export const FileText: Icon, Filter: Icon, Hash: Icon, HelpCircle: Icon, Home: Icon;
  export const Kanban: Icon, Key: Icon, Layers: Icon, LayoutGrid: Icon, List: Icon, Lock: Icon;
  export const LogOut: Icon, Mail: Icon, MapPin: Icon, Menu: Icon, Monitor: Icon, Moon: Icon;
  export const Package: Icon, Palette: Icon, Plus: Icon, RefreshCw: Icon, RotateCcw: Icon;
  export const Save: Icon, Search: Icon, Settings: Icon, Shield: Icon, ShieldCheck: Icon;
  export const ShoppingCart: Icon, SlidersHorizontal: Icon, Snowflake: Icon, Sparkles: Icon;
  export const Sun: Icon, Tag: Icon, Trash2: Icon, TrendingUp: Icon, User: Icon;
  export const UserPlus: Icon, Users: Icon, Workflow: Icon, X: Icon;
}
