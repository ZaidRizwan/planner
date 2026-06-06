import { useState, useEffect } from 'react'

const STORAGE_KEY = 'planner_data'

const defaultData = {
  goals: [],
  targets: [],
  notes: [],
  dailyChecklists: {},
  tasks: [],
  someday: [],
  weeklyReviews: [],
  lastActive: null,
  streak: { current: 0, longest: 0, lastDate: null },
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
    return { ...defaultData, ...JSON.parse(raw) }
  } catch {
    return defaultData
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useStore() {
  const [data, setData] = useState(load)
  useEffect(() => { save(data) }, [data])

  function update(fn) { setData(prev => fn(prev)) }

  // ── Goals ──────────────────────────────────────────────────────────────────
  function addGoal(goal) {
    update(d => ({ ...d, goals: [...d.goals, { id: uid(), createdAt: now(), ...goal }] }))
  }
  function updateGoal(id, patch) {
    update(d => ({ ...d, goals: d.goals.map(g => g.id === id ? { ...g, ...patch } : g) }))
  }
  function deleteGoal(id) {
    update(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) }))
  }

  // ── Targets ────────────────────────────────────────────────────────────────
  function addTarget(target) {
    update(d => ({ ...d, targets: [...d.targets, { id: uid(), createdAt: now(), progress: 0, ...target }] }))
  }
  function updateTarget(id, patch) {
    update(d => ({ ...d, targets: d.targets.map(t => t.id === id ? { ...t, ...patch } : t) }))
  }
  function deleteTarget(id) {
    update(d => ({ ...d, targets: d.targets.filter(t => t.id !== id) }))
  }

  // ── Notes ──────────────────────────────────────────────────────────────────
  function addNote(note) {
    update(d => ({ ...d, notes: [...d.notes, { id: uid(), createdAt: now(), ...note }] }))
  }
  function updateNote(id, patch) {
    update(d => ({ ...d, notes: d.notes.map(n => n.id === id ? { ...n, ...patch } : n) }))
  }
  function deleteNote(id) {
    update(d => ({ ...d, notes: d.notes.filter(n => n.id !== id) }))
  }

  // ── Daily Checklists ───────────────────────────────────────────────────────
  function patchCLItem(d, dateKey, itemId, fn) {
    return {
      ...d,
      dailyChecklists: {
        ...d.dailyChecklists,
        [dateKey]: (d.dailyChecklists[dateKey] || []).map(i => i.id === itemId ? fn(i) : i),
      },
    }
  }

  function getChecklist(dateKey) {
    return data.dailyChecklists[dateKey] || []
  }

  function addChecklistItem(dateKey, text) {
    update(d => {
      const list = d.dailyChecklists[dateKey] || []
      return {
        ...d,
        dailyChecklists: {
          ...d.dailyChecklists,
          [dateKey]: [...list, { id: uid(), text, done: false, subtasks: [], createdAt: now() }],
        },
      }
    })
  }

  function toggleChecklistItem(dateKey, itemId) {
    update(d => {
      const patched = patchCLItem(d, dateKey, itemId, i => ({ ...i, done: !i.done }))
      return updateStreakIfNeeded(patched, dateKey)
    })
  }

  function deleteChecklistItem(dateKey, itemId) {
    update(d => ({
      ...d,
      dailyChecklists: {
        ...d.dailyChecklists,
        [dateKey]: (d.dailyChecklists[dateKey] || []).filter(i => i.id !== itemId),
      },
    }))
  }

  function updateChecklistItem(dateKey, itemId, text) {
    update(d => patchCLItem(d, dateKey, itemId, i => ({ ...i, text })))
  }

  function addChecklistSubtask(dateKey, itemId, text) {
    update(d => patchCLItem(d, dateKey, itemId, i => ({
      ...i, subtasks: [...(i.subtasks || []), { id: uid(), text, done: false }],
    })))
  }

  function toggleChecklistSubtask(dateKey, itemId, subId) {
    update(d => patchCLItem(d, dateKey, itemId, i => ({
      ...i, subtasks: (i.subtasks || []).map(s => s.id === subId ? { ...s, done: !s.done } : s),
    })))
  }

  function updateChecklistSubtask(dateKey, itemId, subId, text) {
    update(d => patchCLItem(d, dateKey, itemId, i => ({
      ...i, subtasks: (i.subtasks || []).map(s => s.id === subId ? { ...s, text } : s),
    })))
  }

  function deleteChecklistSubtask(dateKey, itemId, subId) {
    update(d => patchCLItem(d, dateKey, itemId, i => ({
      ...i, subtasks: (i.subtasks || []).filter(s => s.id !== subId),
    })))
  }

  function carryForward(fromDate, toDate) {
    update(d => {
      const fromList = d.dailyChecklists[fromDate] || []
      const unfinished = fromList.filter(i => !i.done)
      if (!unfinished.length) return d
      const toList = d.dailyChecklists[toDate] || []
      const newItems = unfinished.map(i => ({
        ...i,
        id: uid(),
        done: false,
        createdAt: now(),
        subtasks: (i.subtasks || []).map(s => ({ ...s, id: uid(), done: false })),
        carriedFrom: fromDate,
      }))
      return {
        ...d,
        dailyChecklists: {
          ...d.dailyChecklists,
          [toDate]: [...toList, ...newItems],
        },
      }
    })
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────
  function addTask(task) {
    update(d => ({
      ...d,
      tasks: [...d.tasks, {
        id: uid(), createdAt: now(), lastTouched: now(),
        status: 'todo', priority: 'medium', subtasks: [], goalId: null,
        ...task,
      }],
    }))
  }

  function updateTask(id, patch) {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === id ? { ...t, ...patch, lastTouched: now() } : t),
    }))
  }

  function deleteTask(id) {
    update(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }))
  }

  function addSubtask(taskId, text) {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === taskId
        ? { ...t, lastTouched: now(), subtasks: [...(t.subtasks || []), { id: uid(), text, done: false, createdAt: now() }] }
        : t),
    }))
  }

  function updateSubtask(taskId, subtaskId, patch) {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === taskId
        ? { ...t, subtasks: (t.subtasks || []).map(s => s.id === subtaskId ? { ...s, ...patch } : s) }
        : t),
    }))
  }

  function deleteSubtask(taskId, subtaskId) {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === taskId
        ? { ...t, subtasks: (t.subtasks || []).filter(s => s.id !== subtaskId) }
        : t),
    }))
  }

  function toggleSubtask(taskId, subtaskId) {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === taskId
        ? { ...t, lastTouched: now(), subtasks: (t.subtasks || []).map(s => s.id === subtaskId ? { ...s, done: !s.done } : s) }
        : t),
    }))
  }

  // ── Someday ────────────────────────────────────────────────────────────────
  function addSomeday(item) {
    update(d => ({ ...d, someday: [...(d.someday || []), { id: uid(), createdAt: now(), ...item }] }))
  }

  function updateSomeday(id, patch) {
    update(d => ({ ...d, someday: (d.someday || []).map(s => s.id === id ? { ...s, ...patch } : s) }))
  }

  function deleteSomeday(id) {
    update(d => ({ ...d, someday: (d.someday || []).filter(s => s.id !== id) }))
  }

  function promoteToTask(somedayId) {
    update(d => {
      const item = (d.someday || []).find(s => s.id === somedayId)
      if (!item) return d
      return {
        ...d,
        someday: (d.someday || []).filter(s => s.id !== somedayId),
        tasks: [...d.tasks, {
          id: uid(), createdAt: now(), lastTouched: now(),
          status: 'todo', priority: 'medium', subtasks: [], goalId: null,
          title: item.text, description: item.note || '',
        }],
      }
    })
  }

  // ── Streak ────────────────────────────────────────────────────────────────
  function updateStreakIfNeeded(d, dateKey) {
    const list = d.dailyChecklists[dateKey] || []
    if (!list.length || !list.every(i => i.done)) return d
    const streak = d.streak || { current: 0, longest: 0, lastDate: null }
    if (streak.lastDate === dateKey) return d
    const prevDate = new Date(dateKey + 'T00:00:00')
    prevDate.setDate(prevDate.getDate() - 1)
    const yesterday = prevDate.toISOString().slice(0, 10)
    const newCurrent = streak.lastDate === yesterday ? streak.current + 1 : 1
    const newLongest = Math.max(streak.longest || 0, newCurrent)
    return { ...d, streak: { current: newCurrent, longest: newLongest, lastDate: dateKey } }
  }

  // ── Last Active ───────────────────────────────────────────────────────────
  function setLastActive(info) {
    update(d => ({ ...d, lastActive: { ...info, timestamp: now() } }))
  }

  // ── Weekly Reviews ────────────────────────────────────────────────────────
  function saveWeeklyReview(review) {
    update(d => ({
      ...d,
      weeklyReviews: [...(d.weeklyReviews || []), { id: uid(), completedAt: now(), ...review }],
    }))
  }

  return {
    data,
    addGoal, updateGoal, deleteGoal,
    addTarget, updateTarget, deleteTarget,
    addNote, updateNote, deleteNote,
    getChecklist,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem, updateChecklistItem,
    addChecklistSubtask, toggleChecklistSubtask, updateChecklistSubtask, deleteChecklistSubtask,
    carryForward,
    addTask, updateTask, deleteTask,
    addSubtask, updateSubtask, deleteSubtask, toggleSubtask,
    addSomeday, updateSomeday, deleteSomeday, promoteToTask,
    setLastActive,
    saveWeeklyReview,
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function now() {
  return new Date().toISOString()
}
