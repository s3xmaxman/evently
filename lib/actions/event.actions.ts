'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import User from '@/lib/database/models/user.model'
import Category from '@/lib/database/models/category.model'
import { handleError } from '@/lib/utils'

import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
} from '@/types'

// 「getCategoryByName」関数は、引数で渡された名前に基づいてカテゴリーを検索します。
const getCategoryByName = async (name: string) => {
  // 'name'フィールドで大文字小文字を区別せずに正規表現検索を行うことで、名前が一致するCategoryドキュメントを取得します。
  return Category.findOne({ name: { $regex: name, $options: 'i' } })
}


// populateEvent関数は、イベントの詳細データを取得するために使われます。
const populateEvent = (query: any) => {
  // 'organizer'フィールドをUserモデルから'_id', 'firstName', 'lastName'を選択して充填(populate)します。
  return query
    .populate({ path: 'organizer', model: User, select: '_id firstName lastName' })
    // 'category'フィールドをCategoryモデルから'_id', 'name'を選択して充填(populate)します。
    .populate({ path: 'category', model: Category, select: '_id name' })
}
// この関数を使って、クエリに基づき関連するデータを結びつけた完全なイベントオブジェクトを作成することができます。


// CREATE
export async function createEvent({ userId, event, path }: CreateEventParams) {
  try {
    // データベースに接続します。
    await connectToDatabase()

    // イベントの主催者となるユーザーをIDで検索します。
    const organizer = await User.findById(userId)
    // 主催者が見つからない場合はエラーを投げます。
    if (!organizer) throw new Error('Organizer not found')

    // 新しいイベントを作成します。イベントの詳細と主催者のIDを組み込みます。
    const newEvent = await Event.create({ ...event, category: event.categoryId, organizer: userId })
    // イベントの作成に成功したら、関連するパスを再検証します。
    revalidatePath(path)

    // 新しいイベントのデータをJSON形式で返します。
    return JSON.parse(JSON.stringify(newEvent))
  } catch (error) {
    // エラーが発生した場合はそれをハンドリングします。
    handleError(error)
  }
}


// GET ONE EVENT BY ID
export async function getEventById(eventId: string) {
  try {
    await connectToDatabase() // データベースに接続します。

    const event = await populateEvent(Event.findById(eventId)) // 与えられたeventIdを使用してイベントを検索し、関連する詳細情報を付加します。

    if (!event) throw new Error('Event not found') // イベントが見つからない場合は、エラーを投げます。

    return JSON.parse(JSON.stringify(event)) // イベントデータをJSON形式に変換して返します。
  } catch (error) {
    handleError(error) // エラーが発生した場合は、handleErrorメソッドで処理します。
  }
}


// UPDATE
export async function updateEvent({ userId, event, path }: UpdateEventParams) {
  try {
    await connectToDatabase() // データベースに接続します。

    const eventToUpdate = await Event.findById(event._id) // 更新するイベントをIDを使って検索します。
    // イベントが見つからない、またはイベントの主催者がuserIdと異なる場合、エラーを投げます。
    if (!eventToUpdate || eventToUpdate.organizer.toHexString() !== userId) {
      throw new Error('Unauthorized or event not found')
    }

    // イベントを更新し、新しいイベントオブジェクトを取得します。
    // { new: true } オプションにより、更新後のドキュメントを返します。
    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { ...event, category: event.categoryId },
      { new: true }
    )
    revalidatePath(path) // 更新が終わったあとで、クライアント側のパスを再度検証します。

    return JSON.parse(JSON.stringify(updatedEvent)) // 更新されたイベントデータをJSON形式に変換して返します。
  } catch (error) {
    handleError(error) // エラーが発生した場合は、handleErrorメソッドで処理します。
  }
}


// DELETE
export async function deleteEvent({ eventId, path }: DeleteEventParams) {
  try {
    // データベースに接続するための処理
    await connectToDatabase()
    // eventIdに一致するイベントを削除する
    const deletedEvent = await Event.findByIdAndDelete(eventId)
    // イベントが削除された場合、指定されたパスを再検証する
    if (deletedEvent) revalidatePath(path)
  } catch (error) {
    // エラーが発生した場合は、handleErrorメソッドで処理します。
    handleError(error)
  }
}

// GET ALL EVENTS
export async function getAllEvents({ query, limit = 6, page, category }: GetAllEventsParams) {
  try {
    await connectToDatabase() // データベースに接続します。

    // イベントのタイトルに基づく検索条件を設定します。queryパラメータがある場合はその値で、なければ空のオブジェクトを返します。
    const titleCondition = query ? { title: { $regex: query, $options: 'i' } } : {}
    // categoryパラメータに基づいてカテゴリー条件を設定します。カテゴリーが指定されていればそのIDを取得し、なければnullを返します。
    const categoryCondition = category ? await getCategoryByName(category) : null
    // 上記の二つの検索条件を$and構文で組み合わせます。
    const conditions = {
      $and: [titleCondition, categoryCondition ? { category: categoryCondition._id } : {}],
    }

    // ページネーションを計算します。何番目のアイテムから読み込むかを決めます。
    const skipAmount = (Number(page) - 1) * limit
    // 条件に一致するイベントを検索します。createdAtで降順に並べ変え、スキップする量と取得する量を指定します。
    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    // populateEvent関数を使って、取得したイベントに関連するデータを充填します。
    const events = await populateEvent(eventsQuery)
    // 条件に一致するイベントの総数を取得します。
    const eventsCount = await Event.countDocuments(conditions)

    return {
      data: JSON.parse(JSON.stringify(events)), // 全イベントデータをJSON形式で返します。
      totalPages: Math.ceil(eventsCount / limit), // 総ページ数も計算します。
    }
  } catch (error) {
    handleError(error) // エラーが起きた場合は、handleError関数で処理します。
  }
}


// GET EVENTS BY ORGANIZER
export async function getEventsByUser({ userId, limit = 6, page }: GetEventsByUserParams) {
  try {
    await connectToDatabase() // データベースに接続します。

    const conditions = { organizer: userId } // 検索条件として、主催者のIDを設定します。

    const skipAmount = (page - 1) * limit // ページネーションに基づいてスキップするイベントの数を計算します。

    const eventsQuery = Event.find(conditions) // 条件に一致するイベントを検索します。
      .sort({ createdAt: 'desc' }) // イベントを作成日時の降順で並び替えます。
      .skip(skipAmount) // 指定した数だけスキップします。
      .limit(limit) // 一度に取得するイベントの数の上限を設定します。

    const events = await populateEvent(eventsQuery) // イベントに関連するデータを追加します。
    const eventsCount = await Event.countDocuments(conditions) // 条件に該当するイベントの総数を取得します。

    return {
      data: JSON.parse(JSON.stringify(events)), // イベントデータをJSON形式に変換して返します。
      totalPages: Math.ceil(eventsCount / limit) // 総ページ数を計算して返します。
    }
  } catch (error) {
    handleError(error) // エラーが発生した場合はエラー処理関数を呼び出します。
  }
}


// GET RELATED EVENTS: EVENTS WITH SAME CATEGORY
export async function getRelatedEventsByCategory({
  categoryId,
  eventId,
  limit = 3,
  page = 1,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase() // データベースに接続します。

    const skipAmount = (Number(page) - 1) * limit // ページ番号に基づき、何件をスキップするか計算します。

    // 検索条件を設定します。指定したカテゴリIDに属し、指定したイベントIDではないものを検索します。
    const conditions = { $and: [{ category: categoryId }, { _id: { $ne: eventId } }] }

    const eventsQuery = Event.find(conditions) // 条件に合うイベントを検索します。
      .sort({ createdAt: 'desc' }) // 作成日時の新しい順にソートします。
      .skip(skipAmount) // 計算した数だけスキップします。
      .limit(limit) // リミット数だけ取得します。

    const events = await populateEvent(eventsQuery) // イベントデータを取得し、関連データで充填します。
    const eventsCount = await Event.countDocuments(conditions) // 条件に合うイベントの総数をカウントします。

    return {
      data: JSON.parse(JSON.stringify(events)), // 取得したイベントデータをJSON形式に変換して返します。
      totalPages: Math.ceil(eventsCount / limit) // 総ページ数を計算して返します。
    }
  } catch (error) {
    handleError(error) // エラー発生時はエラーハンドリング関数で処理します。
  }
}
