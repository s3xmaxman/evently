"use server";

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/database'
import User from '@/lib/database/models/user.model'
import Order from '@/lib/database/models/order.model'
import Event from '@/lib/database/models/event.model'
import { handleError } from '@/lib/utils'

import { CreateUserParams, UpdateUserParams } from '@/types'


// ユーザーを作成する関数
export const createUser = async (user: CreateUserParams) => {
   try {
      // データベースに接続する
      await connectToDatabase();
      
      // 渡されたユーザーデータを使って新しいユーザーを作成する
      const newUser = await User.create(user);
      
      // 新しいユーザーをJSON形式に変換して返す
      return JSON.parse(JSON.stringify(newUser));
   } catch (error) {
      // エラーハンドリング関数を呼び出してエラーを処理する
      handleError(error);
   }
}

// ユーザー情報を更新する関数
export async function updateUser(clerkId: string, user: UpdateUserParams) {
   try {
      // データベースに接続する
      await connectToDatabase();
      
      // clerkIdで指定されたユーザー情報を、渡されたユーザー情報で更新する
      const updatedUser = await User.findOneAndUpdate(
         { clerkId },
         user,
         { new: true }
      )
      
      // 更新されたユーザー情報がない場合、エラーをスローする
      if(!updatedUser) throw new Error("User Update Failed");
      
      // 更新されたユーザー情報をJSON形式に変換して返す
      return JSON.parse(JSON.stringify(updatedUser));
   } catch (error) {
      // エラーハンドリング関数を呼び出してエラーを処理する
      handleError(error);
   }
}

// ユーザーを削除する関数
export async function deleteUser(clerkId: string) {
   try {
     await connectToDatabase() // データベースへ接続します。

     // ユーザーを検索して削除します。
     const userToDelete = await User.findOne({ clerkId })

     // ユーザーが見つからない場合、エラーを投げます。
     if (!userToDelete) {
       throw new Error('User not found')
     }

     // 並行して複数の更新操作を行います。
     await Promise.all([
       // 該当ユーザーがオーガナイザーであるイベントから、そのユーザーを削除します。
       Event.updateMany(
         { _id: { $in: userToDelete.events } },
         { $pull: { organizer: userToDelete._id } }
       ),

       // 該当ユーザーが購入者である注文から、そのユーザー情報を削除します。
       Order.updateMany({ _id: { $in: userToDelete.orders } }, { $unset: { buyer: 1 } }),
     ])

     // ユーザー本体を削除します。
     const deletedUser = await User.findByIdAndDelete(userToDelete._id)
     revalidatePath('/') // 削除後、パスを再検証します。

     // 削除したユーザー情報を返送します。nullの場合はnullを返します。
     return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null
   } catch (error) {
     handleError(error) // エラー処理を実行します。
   }
}

