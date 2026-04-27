'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, LogOut, CreditCard as Edit, Trash2 } from 'lucide-react';

type Post = {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: adminData, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !adminData) {
      alert('管理者権限がありません');
      await supabase.auth.signOut();
      router.push('/');
      return;
    }

    setUser(user);
    fetchPosts();
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この記事を削除してもよろしいですか?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#a0a0a0]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
      <header className="border-b border-[#2a2a2a] bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#f0f0f0]">管理画面</h1>
            <div className="flex gap-4 items-center">
              <span className="text-sm text-[#a0a0a0]">{user?.email}</span>
              <Link href="/">
                <Button variant="outline" className="border-[#2a2a2a] text-[#f0f0f0] hover:bg-[#2a2a2a]">
                  サイトを見る
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-[#2a2a2a] text-[#f0f0f0] hover:bg-[#2a2a2a]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex gap-4">
          <Link href="/admin/ads">
            <Button className="bg-green-600 hover:bg-green-700">
              広告管理
            </Button>
          </Link>
          <Link href="/admin/tags">
            <Button className="bg-purple-600 hover:bg-purple-700">
              カテゴリ管理
            </Button>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#f0f0f0]">記事一覧</h2>
          <Link href="/admin/posts/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              新規作成
            </Button>
          </Link>
        </div>

        {posts.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="py-12 text-center text-[#a0a0a0]">
              まだ記事がありません
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[#f0f0f0]">
                          {post.title}
                        </h3>
                        <Badge
                          variant={post.status === 'published' ? 'default' : 'secondary'}
                          className={post.status === 'published' ? 'bg-green-600' : 'bg-[#2a2a2a]'}
                        >
                          {post.status === 'published' ? '公開中' : '下書き'}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#a0a0a0]">
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/posts/${post.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#2a2a2a] text-[#f0f0f0] hover:bg-[#2a2a2a]"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          編集
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleDelete(post.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-900/50 text-red-500 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        削除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
