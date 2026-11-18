import { useQuery } from '@tanstack/react-query'
import { getTaskStats, listAllTasksForBoard, listTasks } from '../lib/api'
import type { ListTasksParams } from '../types/task'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: ListTasksParams) => [...taskKeys.lists(), params] as const,
  board: () => [...taskKeys.all, 'board'] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
}

export function useTasks(params: ListTasksParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => listTasks(params),
  })
}

export function useBoardTasks() {
  return useQuery({
    queryKey: taskKeys.board(),
    queryFn: listAllTasksForBoard,
  })
}

export function useTaskStats() {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: getTaskStats,
  })
}
