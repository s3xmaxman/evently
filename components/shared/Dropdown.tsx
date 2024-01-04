import React, { startTransition, useEffect, useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
    

import { ICategory } from '@/lib/database/models/category.model'
import { Input } from '../ui/input'
import { createCategory, getAllCategories } from '@/lib/actions/category.actions'
  

type DropDownProps = {
    value: string
    onChangeHandler?: (value: string) => void
}

const Dropdown = ({ value, onChangeHandler}: DropDownProps) => {
  const  [categories, setCategories] = useState<ICategory[]>([])
  const [newCategory, setNewCategory] = useState('')

  
  const handleAddCategory = () => {
    // createCategory メソッドを使用して、トリム（前後の空白削除）された新しいカテゴリを作成
    createCategory({
      categoryName: newCategory.trim()
    })
    .then((category) => {
        // 成功時、カテゴリの状態を更新して新しく作成されたカテゴリをカテゴリリストに追加
        setCategories((prevState) => [...prevState, category])
    })
  }

  useEffect(() => {
    const getCategories = async () => {
      const categoryList = await getAllCategories()
      categoryList && setCategories(categoryList as ICategory[])
    }
    getCategories()
  }, [])



  return (
    <Select defaultValue={value} onValueChange={onChangeHandler}>
        <SelectTrigger className="select-field">
            <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.length > 0 && categories.map((category) => (
            <SelectItem key={category._id} value={category._id} className='select-item p-regular-14'>
                {category.name}
            </SelectItem>
          ))}
          <AlertDialog>
            <AlertDialogTrigger 
                className='
                p-medium-14 
                flex 
                w-full 
                rounded-sm 
                py-3 
                pl-8
              text-primary-500
              hover:bg-primary-500
              focus:text-primary-500
              '
            >
                新しいカテゴリを追加
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                <AlertDialogTitle>New Category</AlertDialogTitle>
                <AlertDialogDescription>
                    <Input type="text" placeholder="Category name" className="input-field mt-3" onChange={(e) => setNewCategory(e.target.value)} />
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => startTransition(handleAddCategory)}>追加</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
           </AlertDialog>
        </SelectContent>
    </Select>
  )
}

export default Dropdown