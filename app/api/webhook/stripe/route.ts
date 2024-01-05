// Stripeライブラリをインポートしています。
import stripe from 'stripe'
// Next.jsのサーバーサイドレスポンスユーティリティをインポートしています。
import { NextResponse } from 'next/server'
// 注文作成用の関数をライブラリからインポートしています。
import { createOrder } from '@/lib/actions/order.actions'

// POSTメソッドを非同期でエクスポートしています。Request型のrequestオブジェクトを引数として受け取ります。
export async function POST(request: Request) {
  // リクエストの本文をテキストとして取得しています。
  const body = await request.text()

  // Stripeの署名をリクエストヘッダーから取得します。
  const sig = request.headers.get('stripe-signature') as string
  // 環境変数からStripeのWebhookの秘密鍵を取得しています。
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event

  // Stripeのwebhooks.constructEventメソッドを利用してイベントデータを構築し、
  // 署名を検証しています。検証に失敗した場合はエラーを返します。
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    return NextResponse.json({ message: 'Webhook error', error: err })
  }

  // イベントからタイプを取得しています。
  const eventType = event.type

  // イベントのタイプが'checkout.session.completed'のとき、新しい注文を作成します。
  if (eventType === 'checkout.session.completed') {
    // イベントデータからid、amount_total、metadataを取得しています。
    const { id, amount_total, metadata } = event.data.object

    // 注文のデータを作成します。
    const order = {
      stripeId: id,
      eventId: metadata?.eventId || '',
      buyerId: metadata?.buyerId || '',
      totalAmount: amount_total ? (amount_total / 100).toString() : '0',
      createdAt: new Date(),
    }

    // createOrder関数を利用して注文をデータベースに保存し、新しい注文情報でレスポンスを返します。
    const newOrder = await createOrder(order)
    return NextResponse.json({ message: 'OK', order: newOrder })
  }

  // どの条件にも当てはまらなかった場合は、200ステータスで空のレスポンスを返します。
  return new Response('', { status: 200 })
}
