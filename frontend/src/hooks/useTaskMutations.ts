import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask, deleteTask, updateTask } from '../lib/api'
import type { CreateTaskInput, Task, UpdateTaskInput } from '../types/task'
import { taskKeys } from './useTasks'

function invalidateTaskViews(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: taskKeys.all })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => invalidateTaskViews(queryClient),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => updateTask(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.board() })
      const previous = queryClient.getQueryData<Task[]>(taskKeys.board())
      if (previous && input.status) {
        queryClient.setQueryData<Task[]>(
          taskKeys.board(),
          previous.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: input.status ?? task.status,
                  title: input.title ?? task.title,
                  priority: input.priority ?? task.priority,
                  description:
                    input.description === undefined
                      ? task.description
                      : (input.description ?? ''),
                }
              : task,
          ),
        )
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.board(), context.previous)
      }
    },
    onSettled: () => invalidateTaskViews(queryClient),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => invalidateTaskViews(queryClient),
  })
}
