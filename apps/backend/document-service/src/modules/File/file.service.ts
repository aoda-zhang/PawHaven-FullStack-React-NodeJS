export class FileService {
  private static readonly TRIP_DEFAULT_VIEWS = [
    {
      img: 'https://www.travelandleisure.com/thmb/LtxHE8ECg6zBz1tM3KtCheUnZO4=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/TAL-colosseum-WORLDWONDERS0523-74ede1158daf493f97aa2a8c8474f9cf.jpg',
      title: 'home.destinations_italy',
      rows: 2,
      cols: 2,
    },
    {
      img: 'https://www.travelandleisure.com/thmb/28jNpC4Z7JIKUEM7asi9xVtTzHA=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/nepal-himilayas-BUCKETLISTRIP0421-ff8e2488519c4b4c90d697a94a0e96c3.jpg',
      title: 'home.destinations_himalayas',
    },
    {
      img: 'https://www.travelandleisure.com/thmb/1YtOIazju6AhmF5Tc2K-nUJOysg=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/TAL-great-wall-of-china-WORLDWONDERS0523-5f28e953141c45ea94fd59e1d28b3327.jpg',
      title: 'home.destinations_china',
    },
    {
      img: 'https://www.travelandleisure.com/thmb/VksPLDLra4uJ-3VsowgeNwe-0fc=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/paris-at-night-56a6312b5f9b58b7d0e0571a.jpeg',
      title: 'home.destinations_paris',
      cols: 2,
    },
    {
      img: 'https://www.travelandleisure.com/thmb/E5I_Scol8vkt00w7sOi5h6lmciQ=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/marrakech-morocco-market-mosaics-ALISTBUCKET0419-055c5f0fe4e34bb986c3a86a707fa599.jpg',
      title: 'home.destinations_morocco',
      cols: 2,
    },
    {
      img: 'https://www.travelandleisure.com/thmb/kfe2kSaxpnluW1w4cR10gk5qZzw=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/TAL-greece-ALISTBUCKETMFOG0523-150b33d63919487f8777015193626bd1.jpg',
      title: 'home.destinations_greece',
      rows: 2,
      cols: 2,
    },
    {
      img: 'https://www.travelandleisure.com/thmb/vGtHe3saGlsWmaMHao_NKyBhXqs=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/lion-kenya-safari-BUCKETLISTRIP0421-a6fff55e7d4644449d12260666d7db7f.jpg',
      title: 'home.destinations_safari',
    },
    {
      img: 'https://www.travelandleisure.com/thmb/742QEqnpjm0cgwEUEQ9RLNy_HhI=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Great_Pyramid_Giza-0503514a90a144d3be53448aa2c820ee.jpg',
      title: 'home.destinations_egypt',
    },
  ] as const;

  getTripDefaultViews() {
    return FileService.TRIP_DEFAULT_VIEWS;
  }
}
