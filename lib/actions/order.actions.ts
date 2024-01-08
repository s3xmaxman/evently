"use server"

import { CheckoutOrderParams, CreateOrderParams, GetOrdersByEventParams, GetOrdersByUserParams } from "@/types"
import { redirect } from "next/navigation";
import Stripe from 'stripe';
import { handleError } from "../utils";
import { connectToDatabase } from "../database";
import Order from "../database/models/order.model";
import Event from "../database/models/event.model";
import User from "../database/models/user.model";
import {ObjectId} from 'mongodb';


// 注文のチェックアウトプロセスを行うための非同期関数です。
export const checkoutOrder = async (order: CheckoutOrderParams) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  // 注文が無料の場合は0を、そうでない場合は価格をセント単位に変換します。
  const price = order.isFree ? 0 : Number(order.price) * 100;

  try {
      // Stripeのセッションを作成し、必要な情報を設定します。
      const session = await stripe.checkout.sessions.create({
          // 購入する製品の情報がここに含まれます。
          line_items: [
            {
              price_data: {
                currency: 'usd',
                unit_amount: price,
                product_data: {
                  name: order.eventTitle
                }
              },
              quantity: 1
            },
          ],
          // イベントIDと購入者IDはメタデータとして保存されます。
          metadata: {
            eventId: order.eventId,
            buyerId: order.buyerId,
          },
          // 'payment'モードは支払いの準備をします。
          mode: 'payment',
          // 支払い成功時とキャンセル時にリダイレクトされるURLです。
          success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
          cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
        });
        
      // 支払いページにリダイレクトします。
      redirect(session.url!)
  } catch (error) {
      // エラーが発生した場合はそれを投げます。
      throw error
  }
}

// 新しい注文をデータベースに作成する非同期関数です。
export const createOrder = async (order: CreateOrderParams) => {
try {
   // データベースに接続します。
   await connectToDatabase()

   // 新しい注文をデータベースに保存します。
   const newOrder = await Order.create({
     ...order,
     event: order.eventId,
     buyer: order.buyerId,
   })

   // 返却するデータをJSON形式に変換します。
   return JSON.parse(JSON.stringify(newOrder))
} catch (error) {
  // エラーが発生した場合はハンドリング処理を行います。
  handleError(error)
}
}

// 特定のイベントに関連した注文を取得する関数です。
export async function getOrdersByEvent({ searchString, eventId }: GetOrdersByEventParams) {
try {
  // データベースに接続します。
  await connectToDatabase()

  // イベントIDが必須であるため、それがなければエラーを投げます。
  if (!eventId) throw new Error('Event ID is required')
  // 検索対象となるイベントのObjectIdを取得します。
  const eventObjectId = new ObjectId(eventId)

  // 注文を集約して必要な情報と合わせて取得します。
  const orders = await Order.aggregate([
    // 購入者の情報を参照します。
    {
      $lookup: {
        from: 'users',
        localField: 'buyer',
        foreignField: '_id',
        as: 'buyer',
      },
    },
    // 配列を単一の要素に展開します。
    {
      $unwind: '$buyer',
    },
    // イベントの情報を参照します。
    {
      $lookup: {
        from: 'events',
        localField: 'event',
        foreignField: '_id',
        as: 'event',
      },
    },
    // 配列を単一の要素に展開します。
    {
      $unwind: '$event',
    },
    // 必要なフィールドを選択して出力します。
    {
      $project: {
        _id: 1,
        totalAmount: 1,
        createdAt: 1,
        eventTitle: '$event.title',
        eventId: '$event._id',
        // 購入者の氏名を結合します。
        buyer: {
          $concat: ['$buyer.firstName', ' ', '$buyer.lastName'],
        },
      },
    },
    // 指定されたイベントIDと検索文字列に基づいて結果を絞り込みます。
    {
      $match: {
        $and: [{ eventId: eventObjectId }, { buyer: { $regex: RegExp(searchString, 'i') } }],
      },
    },
  ])

  // 返却するデータをJSON形式に変換します。
  return JSON.parse(JSON.stringify(orders))
} catch (error) {
  // エラーが発生した場合はハンドリング処理を行います。
  handleError(error)
}
}

// ユーザーに紐づいた注文を取得する関数です。
export async function getOrdersByUser({ userId, limit = 3, page }: GetOrdersByUserParams) {
try {
  // データベースに接続します。
  await connectToDatabase()

  // ページに基づいたスキップ量を計算します。
  const skipAmount = (Number(page) - 1) * limit
  // ユーザーIDに基づいた検索条件を設定します。
  const conditions = { buyer: userId }

  // 条件に一致する注文をデータベースから取得し、関連するイベントや主催者の情報も同時に取得します。
  const orders = await Order.distinct('event._id')
    .find(conditions)
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
    .populate({
      path: 'event',
      model: Event,
      populate: {
        path: 'organizer',
        model: User,
        select: '_id firstName lastName',
      },
    })

  // 総注文数を取得します。
  const ordersCount = await Order.distinct('event._id').countDocuments(conditions)

  // 最終的なデータとページ数情報を返却します。
  return { data: JSON.parse(JSON.stringify(orders)), totalPages: Math.ceil(ordersCount / limit) }
} catch (error) {
  // エラーが発生した場合はハンドリング処理を行います。
  handleError(error)
}
}
