import * as z from "zod"

export const eventFormSchema = z.object({
   title: z.string().min(3, 'タイトルは3文字以上入力してください'),
   description: z.string().min(3, '説明は3文字以上入力してください').max(400, '説明は400文字以下入力してください'),
   location: z.string().min(3, 'ロケーションは3文字以上入力してください').max(400, 'ロケーションは400文字以下入力してください'),
   imageUrl: z.string(),
   startDateTime: z.date(),
   endDateTime: z.date(),
   categoryId: z.string(),
   price: z.string(),
   isFree: z.boolean(),
   url: z.string().url(),
})