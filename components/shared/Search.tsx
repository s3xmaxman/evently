"use client"

import Image from 'next/image';
import { useEffect, useState } from 'react'
import { Input } from '../ui/input';
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

const Search = ({ placeholder = 'Search title...' }: { placeholder?: string }) => {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 一定時間（300ミリ秒）経過後に実行される関数をセットします。
    const delayDebounceFn = setTimeout(() => {
      let newUrl = '';
  
      // もし検索クエリが存在する場合、URLを更新する関数 `formUrlQuery` を使用して新しいURLを生成します。
      if(query) {
        newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: 'query',
          value: query
        })
      } else {
        // 検索クエリが存在しない場合、URLからクエリキーを除去する `removeKeysFromQuery` 関数を使用します。
        newUrl = removeKeysFromQuery({
          params: searchParams.toString(),
          keysToRemove: ['query']
        })
      }
  
      // 新しいURLにルーターを使用して遷移します。スクロールは false に設定されているため、ページのスクロール位置は保持されます。
      router.push(newUrl, { scroll: false });
    }, 300)
  
    // useEffect フックがクリーンアップされる際（コンポーネントのアンマウントや依存関係が変わった時）、
    // タイマーをクリアして、意図しないURL変更が発生しないようにします。
    return () => clearTimeout(delayDebounceFn);
  }, [query, searchParams, router])
  

  return (
    <div className="flex-center min-h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
      <Image src="/assets/icons/search.svg" alt="search" width={24} height={24} />
      <Input 
        type="text"
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        className="p-regular-16 border-0 bg-grey-50 outline-offset-0 placeholder:text-grey-500 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}

export default Search