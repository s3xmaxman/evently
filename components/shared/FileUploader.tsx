'use client'

import { useCallback, Dispatch, SetStateAction } from 'react'
import type { FileWithPath } from '@uploadthing/react'
import { useDropzone } from '@uploadthing/react/hooks'
import { generateClientDropzoneAccept } from 'uploadthing/client'

import { Button } from '@/components/ui/button'
import { convertFileToUrl } from '@/lib/utils'

interface FileUploadProps {
    imageUrl: string
    onFieldChange: (value: string) => void
    setFiles: Dispatch<SetStateAction<File[]>>
}

// FileUploadPropsというインターフェースを定義

// imageUrl: string
// 画像のURLを表す文字列

// onFieldChange: (value: string) => void
// フィールドの値が変更されたときに呼び出されるコールバック関数。
// 引数として新しい値を受け取り、何も返さない。

// setFiles: Dispatch<SetStateAction<File[]>>
// ファイルの配列を更新するための関数。
// 新しいファイルの配列を引数として受け取り、状態を更新する。


export function FileUploader({ imageUrl, onFieldChange, setFiles }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
      // ドロップされたファイルをセットする
      setFiles(acceptedFiles)
      // フィールドの変更をトリガーするために、ファイルをURLに変換して渡す
      onFieldChange(convertFileToUrl(acceptedFiles[0]))
  }, [])

  // useDropzoneフックからgetRootPropsとgetInputPropsを取得する
  const { getRootProps, getInputProps } = useDropzone({
      // onDropメソッドを指定することで、ファイルのドロップ時に実行される処理を設定する
      onDrop,
      // 受け入れるファイルの種類を指定する
      accept: 'image/*' ? generateClientDropzoneAccept(['image/*']) : undefined,
  })
  return (
    <div
      {...getRootProps()}
      className="flex-center bg-dark-3 flex h-72 cursor-pointer flex-col overflow-hidden rounded-xl bg-grey-50">
      <input {...getInputProps()} className="cursor-pointer" />

      {imageUrl ? (
        <div className="flex h-full w-full flex-1 justify-center ">
          <img
            src={imageUrl}
            alt="image"
            width={250}
            height={250}
            className="w-full object-cover object-center"
          />
        </div>
      ) : (
        <div className="flex-center flex-col py-5 text-grey-500">
          <img src="/assets/icons/upload.svg" width={77} height={77} alt="file upload" />
          <h3 className="mb-2 mt-2">ファイルをドラッグする</h3>
          <p className="p-medium-12 mb-4">SVG, PNG, JPG</p>
          <Button type="button" className="rounded-full">
            パソコンから選択する
          </Button>
        </div>
      )}
    </div>
  )
}