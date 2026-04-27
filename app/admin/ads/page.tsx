'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default function AdsManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarAd, setSidebarAd] = useState('');
  const [bannerAd, setBannerAd] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchAds();
    }
  }, [user, authLoading, router]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('sidebar_ad, banner_ad')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSidebarAd(data.sidebar_ad || '');
        setBannerAd(data.banner_ad || '');
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('広告データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from('ads')
        .update({
          sidebar_ad: sidebarAd.trim() || null,
          banner_ad: bannerAd.trim() || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;

      toast.success('広告設定を保存しました');
    } catch (error) {
      console.error('Error saving ads:', error);
      toast.error('広告設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#f0f0f0]">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Toaster />
      <header className="border-b border-[#2a2a2a] bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link href="/">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#f0f0f0] to-[#a0a0a0] bg-clip-text text-transparent">
                Luxury Blog
              </h1>
            </Link>
            <nav className="flex gap-6">
              <Link href="/" className="text-[#f0f0f0] hover:text-[#a0a0a0] transition-colors">
                ホーム
              </Link>
              <Link href="/admin" className="text-[#f0f0f0] hover:text-[#a0a0a0] transition-colors">
                管理画面
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/admin">
          <Button variant="ghost" className="mb-6 text-[#f0f0f0] hover:text-blue-400">
            <ArrowLeft className="mr-2 h-4 w-4" />
            管理画面に戻る
          </Button>
        </Link>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-[#f0f0f0]">広告管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sidebar-ad" className="text-[#f0f0f0]">
                サイドバー広告 (HTML)
              </Label>
              <Textarea
                id="sidebar-ad"
                value={sidebarAd}
                onChange={(e) => setSidebarAd(e.target.value)}
                placeholder="HTMLコードを入力してください..."
                className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0] min-h-[200px] font-mono text-sm"
              />
              <p className="text-sm text-[#808080]">
                空欄の場合、サイドバー広告は表示されません
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-ad" className="text-[#f0f0f0]">
                バナー広告 (HTML)
              </Label>
              <Textarea
                id="banner-ad"
                value={bannerAd}
                onChange={(e) => setBannerAd(e.target.value)}
                placeholder="HTMLコードを入力してください..."
                className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0] min-h-[200px] font-mono text-sm"
              />
              <p className="text-sm text-[#808080]">
                空欄の場合、バナー広告は表示されません
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-[#2a2a2a] bg-[#0f0f0f] mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-[#808080]">
          <p>&copy; 2024 Luxury Blog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
