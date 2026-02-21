import {
  HomeLayout as BasicHomeLayout,
  PackageManagerTabs,
} from '@rspress/core/theme-original'
import {} from '@rspress/core'

export default function HomeLayout() {
  return (
    <BasicHomeLayout
      afterHeroActions={<PackageManagerTabs command="install zustand" />}
    />
  )
}

export { HomeLayout }
export * from '@rspress/core/theme-original'
