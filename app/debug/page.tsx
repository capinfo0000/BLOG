'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [status, setStatus] = useState('チェック中...');
  const [posts, setPosts] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key exists:', !!supabaseKey);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .limit(5);

      if (postsError) {
        setError(`Posts Error: ${postsError.message}`);
        console.error('Posts error:', postsError);
      } else {
        setPosts(postsData || []);
        console.log('Posts:', postsData);
      }

      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*');

      if (tagsError) {
        setError(prev => prev + ` | Tags Error: ${tagsError.message}`);
        console.error('Tags error:', tagsError);
      } else {
        setTags(tagsData || []);
        console.log('Tags:', tagsData);
      }

      if (!postsError && !tagsError) {
        setStatus('✅ 接続成功！');
      } else {
        setStatus('❌ 接続エラー');
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('❌ エラー発生');
      console.error('Error:', err);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">デバッグページ</h1>

        <div className="space-y-6">
          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a]">
            <h2 className="text-xl font-bold mb-4">接続状態</h2>
            <p className="text-2xl">{status}</p>
            {error && <p className="text-red-400 mt-2">{error}</p>}
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a]">
            <h2 className="text-xl font-bold mb-4">環境変数</h2>
            <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '未設定'}</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}</p>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a]">
            <h2 className="text-xl font-bold mb-4">記事データ ({posts.length}件)</h2>
            <pre className="text-sm overflow-auto">{JSON.stringify(posts, null, 2)}</pre>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a]">
            <h2 className="text-xl font-bold mb-4">タグデータ ({tags.length}件)</h2>
            <pre className="text-sm overflow-auto">{JSON.stringify(tags, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
