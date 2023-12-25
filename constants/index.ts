export const headerLinks = [
    {
      label: 'ホーム',
      route: '/',
    },
    {
      label: 'イベント作成',
      route: '/events/create',
    },
    {
      label: 'プロフィール',
      route: '/profile',
    },
  ]
  
  export const eventDefaultValues = {
    title: '',
    description: '',
    location: '',
    imageUrl: '',
    startDateTime: new Date(),
    endDateTime: new Date(),
    categoryId: '',
    price: '',
    isFree: false,
    url: '',
  }