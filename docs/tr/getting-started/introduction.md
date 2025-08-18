---
title: Giriş
description: Zustand nasıl kullanılır
nav: 0
---

<div className="flex justify-center mb-4">
  <img src="../bear.jpg" alt="Zustand Logosu" />
</div>

Küçük, hızlı ve ölçeklenebilir, fazlalıklardan arınmış bir durum yönetimi (state management) çözümüdür.
Zustand, hook’lar üzerine kurulmuş sade ve kullanımı kolay bir API sunar.
Ne fazladan kod yazdırır ne de katı kurallar dayatır;
ama yine de düzenli ve flux tarzını andıran bir yapıya sahiptir.

Sevimli görünmesine aldanmayın, pençeleri keskin!
Yaygın sorunlarla uğraşmaya çok zaman harcandı:
[zombie child problem], [React concurrency] ve farklı renderer’lar arasında yaşanan [context loss].
Tüm bunları doğru şekilde ele alan nadir React durum yönetimi çözümlerinden biridir.

Canlı denemek için [buraya](https://codesandbox.io/s/dazzling-moon-itop4) göz atabilirsiniz.

[zombie child problem]: https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
[react concurrency]: https://github.com/bvaughn/rfcs/blob/useMutableSource/text/0000-use-mutable-source.md
[context loss]: https://github.com/facebook/react/issues/13332

## Kurulum

Zustand, NPM üzerinden kolayca yüklenebilir:

```bash
# NPM
npm install zustand
# veya kullandığınız başka bir package manager ile
```

## Önce bir store oluşturun

Store aslında bir hook’tur!
İçine istediğinizi koyabilirsiniz: primitive değerler, objeler ya da fonksiyonlar.
`set` fonksiyonu state’i *merge* ederek günceller.

```js
import { create } from 'zustand'

const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}))
```

## Sonra component’lerinizi bağlayın, hepsi bu!

Hook’u istediğiniz yerde, provider’a ihtiyaç duymadan kullanabilirsiniz.
State’i seçin; bu state değiştiğinde ilgili component otomatik olarak yeniden render olur.

```jsx
function BearCounter() {
  const bears = useStore((state) => state.bears)
  return <h1>Burada {bears} ayı var...</h1>
}

function Controls() {
  const increasePopulation = useStore((state) => state.increasePopulation)
  return <button onClick={increasePopulation}>Bir tane ekle</button>
}
```
