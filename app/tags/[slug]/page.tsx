'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
};

export default function TagPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchTagAndPosts();
    }
  }, [slug]);

  const fetchTagAndPosts = async () => {
    try {
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle();

      if (tagError) throw tagError;
      if (!tagData) {
        setLoading(false);
        return;
      }

      setTagName(tagData.name);

      const { data: postTagsData, error: postTagsError } = await supabase
        .from('post_tags')
        .select(`
          post:posts (
            id,
            title,
            slug,
            excerpt,
            cover_image,
            created_at,
            published
          )
        `)
        .eq('tag_id', tagData.id);

      if (postTagsError) throw postTagsError;

      const filteredPosts = postTagsData
        ?.map((pt: any) => pt.post)
        .filter((post: any) => post && post.published)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error fetching tag posts:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen">
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
              <Link href="/login" className="text-[#f0f0f0] hover:text-[#a0a0a0] transition-colors">
                管理
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-[#f0f0f0] hover:text-blue-400">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ホームに戻る
          </Button>
        </Link>

        <div className="mb-8">
          <Badge className="bg-blue-600 text-white text-lg px-4 py-2 mb-4">
            {tagName}
          </Badge>
          <h2 className="text-3xl font-bold text-[#f0f0f0]">
            {tagName} の記事一覧
          </h2>
          <p className="text-[#a0a0a0] mt-2">
            {posts.length} 件の記事
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#a0a0a0]">
            読み込み中...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#a0a0a0] text-lg">
              このカテゴリにはまだ記事がありません
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.slug}`}>
                <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-all group overflow-hidden h-full">
                  {post.cover_image && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-[#f0f0f0] mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[#a0a0a0] mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-sm text-[#808080]">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDate(post.created_at)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#2a2a2a] bg-[#0f0f0f] mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-[#808080]">
          <p>&copy; 2024 Luxury Blog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
