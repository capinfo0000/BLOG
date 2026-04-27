'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditPostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [inContentAd, setInContentAd] = useState('');
  const [published, setPublished] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  useEffect(() => {
    fetchPost();
    fetchTags();
  }, [postId]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const fetchPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_tags (
            tag_id
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setExcerpt(data.excerpt);
        setCoverImage(data.cover_image || '');
        setAffiliateLink(data.affiliate_link || '');
        setInContentAd(data.in_content_ad || '');
        setPublished(data.status === 'published');

        const postTagIds = data.post_tags?.map((pt: any) => pt.tag_id) || [];
        setSelectedTags(postTagIds);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('記事の読み込みに失敗しました');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    return cleanText || `post-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const slug = generateSlug(title);
      const status = published ? 'published' : 'draft';

      const { data: currentPost } = await supabase
        .from('posts')
        .select('status, published_at')
        .eq('id', postId)
        .single();

      const isBecomingPublished = status === 'published' && currentPost?.status !== 'published';

      const { error } = await supabase
        .from('posts')
        .update({
          title,
          slug,
          content,
          excerpt,
          cover_image: coverImage || null,
          affiliate_link: affiliateLink || null,
          in_content_ad: inContentAd || null,
          status,
          published,
          published_at: isBecomingPublished ? new Date().toISOString() : currentPost?.published_at,
        })
        .eq('id', postId);

      if (error) throw error;

      const { error: deleteError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId);

      if (deleteError) throw deleteError;

      if (selectedTags.length > 0) {
        const postTagsData = selectedTags.map(tagId => ({
          post_id: postId,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(postTagsData);

        if (tagsError) throw tagsError;
      }

      router.push('/admin');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('記事の更新に失敗しました');
    } finally {
      setSaving(false);
    }
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
          <Link href="/admin">
            <Button variant="ghost" className="text-[#f0f0f0] hover:text-[#a0a0a0]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#f0f0f0] mb-8">記事を編集</h1>

        <form onSubmit={handleSubmit}>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] mb-6">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[#f0f0f0]">
                  タイトル *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0]"
                  placeholder="記事のタイトルを入力"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-[#f0f0f0]">
                  概要 *
                </Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  required
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0] min-h-[80px]"
                  placeholder="記事の概要を入力"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-[#f0f0f0]">
                  本文 *
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0] min-h-[400px]"
                  placeholder="記事の内容を入力"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage" className="text-[#f0f0f0]">
                  カバー画像URL
                </Label>
                <Input
                  id="coverImage"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0]"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliateLink" className="text-[#f0f0f0]">
                  アフィリエイトリンク
                </Label>
                <Input
                  id="affiliateLink"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0]"
                  placeholder="https://affiliate-link.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inContentAd" className="text-[#f0f0f0]">
                  記事内広告
                </Label>
                <Textarea
                  id="inContentAd"
                  value={inContentAd}
                  onChange={(e) => setInContentAd(e.target.value)}
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0] min-h-[100px]"
                  placeholder="広告のHTMLコードまたは埋め込みコードを入力"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#f0f0f0]">タグ</Label>
                <div className="grid grid-cols-2 gap-3 p-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-md">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <Label
                        htmlFor={`tag-${tag.id}`}
                        className="text-[#f0f0f0] cursor-pointer text-sm"
                      >
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={setPublished}
                />
                <Label htmlFor="published" className="text-[#f0f0f0] cursor-pointer">
                  公開する
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? '保存中...' : '変更を保存'}
            </Button>
            <Link href="/admin">
              <Button
                type="button"
                variant="outline"
                className="border-[#2a2a2a] text-[#f0f0f0] hover:bg-[#2a2a2a]"
              >
                キャンセル
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
