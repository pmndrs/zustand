import './index.css'
import {
  HomeLayout as BasicHomeLayout,
  PackageManagerTabs,
} from '@rspress/core/theme-original'

export default function HomeLayout() {
  return (
    <BasicHomeLayout
      afterHeroActions={<PackageManagerTabs command="install zustand" />}
    />
  )
}

export { HomeLayout }
export * from '@rspress/core/theme-original'
