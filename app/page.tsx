'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Tag as TagIcon } from 'lucide-react';

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
  tags?: { name: string; slug: string }[];
};

type Tag = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

type Ads = {
  sidebar_ad: string | null;
  banner_ad: string | null;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ads, setAds] = useState<Ads | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    fetchTags();
    fetchAds();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          cover_image,
          created_at,
          post_tags (
            tag:tags (
              name,
              slug
            )
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const postsWithTags = data?.map(post => ({
        ...post,
        tags: post.post_tags?.map((pt: any) => pt.tag) || [],
      })) || [];

      setPosts(postsWithTags);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data: tagsData, error } = await supabase
        .from('tags')
        .select(`
          id,
          name,
          slug,
          post_tags(
            post:posts!inner(status)
          )
        `);

      if (error) throw error;

      const tagsWithCount = tagsData?.map(tag => ({
        ...tag,
        count: tag.post_tags?.filter((pt: any) => pt.post?.status === 'published').length || 0,
      }))
      .filter(tag => tag.count > 0)
      .sort((a, b) => b.count - a.count) || [];

      setTags(tagsWithCount);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('sidebar_ad, banner_ad')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle();

      if (error) throw error;
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
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

      <section className="bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] py-20 border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-[#f0f0f0] mb-6">
            プレミアムな情報を
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              お届けします
            </span>
          </h2>
          <p className="text-xl text-[#a0a0a0] max-w-2xl mx-auto leading-relaxed">
            金融、テクノロジー、エンターテイメントまで、厳選された情報を高品質な記事でお届けします。
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-[#f0f0f0]">最新の記事</h3>
            </div>

            {loading ? (
              <div className="text-center py-12 text-[#a0a0a0]">
                読み込み中...
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-[#a0a0a0]">
                まだ記事がありません
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
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags?.slice(0, 2).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-[#2a2a2a] text-[#a0a0a0] hover:bg-[#3a3a3a]"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                        <h4 className="text-xl font-bold text-[#f0f0f0] mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-[#a0a0a0] mb-4 line-clamp-2">
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
          </div>

          <aside className="lg:w-80 space-y-6">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6">
              <div className="flex items-center gap-2 mb-4">
                <TagIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-[#f0f0f0]">カテゴリ</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 10).map((tag) => (
                  <Link key={tag.id} href={`/tags/${tag.slug}`}>
                    <Badge
                      variant="outline"
                      className="bg-[#0f0f0f] border-[#3a3a3a] text-[#f0f0f0] hover:bg-[#2a2a2a] hover:border-blue-400 transition-colors cursor-pointer"
                    >
                      {tag.name} ({tag.count})
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>

            {ads?.sidebar_ad && (
              <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#2a2a2a] p-6">
                <h3 className="text-lg font-bold text-[#f0f0f0] mb-3">広告</h3>
                <div dangerouslySetInnerHTML={{ __html: ads.sidebar_ad }} />
              </Card>
            )}

            {ads?.banner_ad && (
              <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#2a2a2a] p-6">
                <h3 className="text-lg font-bold text-[#f0f0f0] mb-3">バナー広告</h3>
                <div dangerouslySetInnerHTML={{ __html: ads.banner_ad }} />
              </Card>
            )}
          </aside>
        </div>
      </main>

      <footer className="border-t border-[#2a2a2a] bg-[#0f0f0f] mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-[#808080]">
          <p>&copy; 2024 Luxury Blog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
