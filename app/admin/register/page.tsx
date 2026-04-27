'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function AdminRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上である必要があります');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('SignUp Error:', signUpError);
        throw signUpError;
      }

      console.log('SignUp Response:', data);

      if (!data.user) {
        throw new Error('ユーザー登録に失敗しました');
      }

      console.log('User ID:', data.user.id);

      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          id: data.user.id,
          email: email,
        });

      if (adminError) {
        console.error('Admin Insert Error:', adminError);
        throw adminError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Registration Error:', error);
      setError(error.message || '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] px-4">
      <Card className="w-full max-w-md bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-[#f0f0f0]">
            管理者アカウント登録
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-6">
              <p className="text-green-500 mb-4">登録が完了しました!</p>
              <p className="text-[#a0a0a0] text-sm">
                ログインページにリダイレクトします...
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#f0f0f0]">
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#f0f0f0]">
                  パスワード
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#f0f0f0]">
                  パスワード（確認）
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0f0f0]"
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? '登録中...' : '登録'}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center space-y-2">
            <Link
              href="/login"
              className="text-sm text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors block"
            >
              すでにアカウントをお持ちの方
            </Link>
            <Link
              href="/"
              className="text-sm text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors block"
            >
              ホームに戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
