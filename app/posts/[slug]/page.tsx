'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, ArrowLeft, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
  affiliate_link: string | null;
  in_content_ad: string | null;
  created_at: string;
  tags?: { name: string; slug: string }[];
};

type Comment = {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
};

export default function PostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentName, setCommentName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [commentHoneypot, setCommentHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          slug,
          content,
          excerpt,
          cover_image,
          affiliate_link,
          in_content_ad,
          created_at,
          post_tags (
            tag:tags (
              name,
              slug
            )
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const postWithTags = {
          ...data,
          tags: data.post_tags?.map((pt: any) => pt.tag) || [],
        };
        setPost(postWithTags);
        fetchComments(data.id);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, author_name, content, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (commentHoneypot) {
      return;
    }

    if (!commentName.trim() || !commentContent.trim()) {
      toast.error('名前とコメントを入力してください');
      return;
    }

    if (!post) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          author_name: commentName.trim(),
          content: commentContent.trim(),
          ip_address: null,
        });

      if (error) throw error;

      toast.success('コメントを投稿しました');
      setCommentName('');
      setCommentContent('');
      fetchComments(post.id);
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('コメントの投稿に失敗しました');
    } finally {
      setSubmitting(false);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#f0f0f0]">読み込み中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#f0f0f0] mb-4">記事が見つかりません</h2>
          <Link href="/">
            <Button>ホームに戻る</Button>
          </Link>
        </div>
      </div>
    );
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
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-[#f0f0f0] hover:text-blue-400">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ホームに戻る
          </Button>
        </Link>

        <article>
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags?.map((tag, index) => (
                <Link key={index} href={`/tags/${tag.slug}`}>
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-[#f0f0f0] mb-4 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center text-[#a0a0a0] mb-6">
              <Clock className="w-4 h-4 mr-2" />
              {formatDate(post.created_at)}
            </div>

            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full rounded-lg mb-8"
              />
            )}
          </div>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-8 mb-8">
            <div
              className="prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </Card>

          {post.affiliate_link && (
            <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 p-6 mb-8">
              <h3 className="text-lg font-bold text-[#f0f0f0] mb-3">おすすめリンク</h3>
              <a
                href={post.affiliate_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                詳細はこちら
                <ExternalLink className="w-4 h-4" />
              </a>
            </Card>
          )}

          {post.in_content_ad && (
            <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-[#2a2a2a] p-6 mb-8">
              <h3 className="text-lg font-bold text-[#f0f0f0] mb-3">記事内広告</h3>
              <div dangerouslySetInnerHTML={{ __html: post.in_content_ad }} />
            </Card>
          )}

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#f0f0f0] mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              コメント ({comments.length})
            </h2>

            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6 mb-6">
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#f0f0f0]">名前</Label>
                  <Input
                    id="name"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    placeholder="匿名"
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0]"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-[#f0f0f0]">コメント</Label>
                  <Textarea
                    id="comment"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="コメントを入力してください..."
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0] min-h-[120px]"
                    disabled={submitting}
                  />
                </div>

                <input
                  type="text"
                  value={commentHoneypot}
                  onChange={(e) => setCommentHoneypot(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? '投稿中...' : 'コメントを投稿'}
                </Button>
              </form>
            </Card>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6 text-center">
                  <p className="text-[#a0a0a0]">まだコメントがありません</p>
                </Card>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id} className="bg-[#1a1a1a] border-[#2a2a2a] p-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-[#f0f0f0]">{comment.author_name}</span>
                      <span className="text-sm text-[#808080]">{formatDateTime(comment.created_at)}</span>
                    </div>
                    <p className="text-[#e0e0e0] whitespace-pre-wrap">{comment.content}</p>
                  </Card>
                ))
              )}
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-[#2a2a2a] bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-[#808080]">
          <p>&copy; 2024 Luxury Blog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
