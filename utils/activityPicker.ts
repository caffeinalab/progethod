export interface ActivityItem {
  id: string
  [key: string]: unknown
}

export interface ActivityGroup<T extends ActivityItem = ActivityItem> {
  key: string
  label: string
  items: T[]
}
