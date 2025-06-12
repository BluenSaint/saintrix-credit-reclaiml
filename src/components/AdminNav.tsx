import { Users, FileText, Settings, LogOut, BarChart3, Bell, Shield, Award, MessageSquare, BookOpen } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Documents', href: '/admin/documents', icon: FileText },
  { name: 'Referrals', href: '/admin/referrals', icon: Award },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Communications', href: '/admin/communications', icon: MessageSquare },
  {
    name: 'Follow-ups',
    href: '/admin/followups',
    icon: Bell,
  },
  { name: 'Legal Coach', href: '/admin/legal-coach', icon: BookOpen },
]; 