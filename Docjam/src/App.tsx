import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Collaboration } from '@tiptap/extension-collaboration'
import { CollaborationCursorYtiptap } from './extensions/collaborationCursorYtiptap'
import { TextAlign } from '@tiptap/extension-text-align'
import './App.css'

const YJS_WS_URL = 'wss://doc-production-f168.up.railway.app'
const API_BASE_URL = 'https://doc-production-f168.up.railway.app'

function useDebounce<T extends (...args: never[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

const Icon = ({ name }: { name: string }) => {
  switch (name) {
    case 'bold':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
        </svg>
      )
    case 'italic':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
        </svg>
      )
    case 'underline':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
        </svg>
      )
    case 'list-bullet':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      )
    case 'list-number':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
        </svg>
      )
    case 'align-left':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
        </svg>
      )
    case 'align-center':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 15v2h10v-2H7zm-4 4v2h18v-2H3zm0-8v2h18v-2H3zm4-4v2h10V7H7zm-4-4v2h18V3H3z" />
        </svg>
      )
    case 'align-right':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" />
        </svg>
      )
    case 'undo':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
        </svg>
      )
    case 'redo':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
        </svg>
      )
    case 'sun':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
        </svg>
      )
    case 'moon':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      )
    case 'h1':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 12h-2V9h-2v2H8V9H6v6h2v-2h2v2h2v-6h2v6zm5.5-1h-2v1H16v-1c0-.55.45-1 1-1h1V9h-2.5V8H19c.55 0 1 .45 1 1v5c0 .55-.45 1-1 1z" />
        </svg>
      )
    case 'h2':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 12h-2V9h-2v2H8V9H6v6h2v-2h2v2h2v-6h2v6zm5 0h-4v-1c0-.55.45-1 1-1h2V11h-3v-1h3c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1h-2v1h3v1z" />
        </svg>
      )
    case 'h3':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 12h-2V9h-2v2H8V9H6v6h2v-2h2v2h2v-6h2v6zm5.5-2c0 .55-.45 1-1 1H16v-1h2.5v-1H17v-1h1.5V10H16V9h2.5c.55 0 1 .45 1 1v1.25c0 .41-.25.75-.61.9.36.15.61.49.61.9V13z" />
        </svg>
      )
    default:
      return null
  }
}

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A1', '#33FFF5']

function colorForUsername(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(31, h) + name.charCodeAt(i)
  }
  return COLORS[Math.abs(h) % COLORS.length]
}

type CollabBundle = { ydoc: Y.Doc; provider: WebsocketProvider }

type CollaborativeEditorProps = {
  collab: CollabBundle
  docId: string
  title: string
  setTitle: React.Dispatch<React.SetStateAction<string>>
  username: string
  userColor: string
  setStats: React.Dispatch<React.SetStateAction<{ words: number; chars: number }>>
  saveToBackend: (id: string, content: string, title: string) => void
}

function CollaborativeEditor({
  collab,
  docId,
  title,
  setTitle,
  username,
  userColor,
  setStats,
  saveToBackend,
}: CollaborativeEditorProps) {
  const saveRef = useRef(saveToBackend)
  saveRef.current = saveToBackend
  const docIdRef = useRef(docId)
  docIdRef.current = docId
  const titleRef = useRef(title)
  titleRef.current = title

  const [docBootstrapPending, setDocBootstrapPending] = useState(true)

  // Sync title with Yjs
  useEffect(() => {
    const yTitle = collab.ydoc.getText('title')
    
    // Update local state when Yjs title changes
    const onUpdate = () => {
      const newTitle = yTitle.toString()
      if (newTitle !== title) {
        setTitle(newTitle)
      }
    }
    
    yTitle.observe(onUpdate)
    
    // Initial sync
    if (yTitle.toString()) {
      setTitle(yTitle.toString())
    }

    return () => yTitle.unobserve(onUpdate)
  }, [collab, setTitle])

  // Update Yjs when local title changes (only if it's different)
  useEffect(() => {
    const yTitle = collab.ydoc.getText('title')
    if (yTitle.toString() !== title) {
      collab.ydoc.transact(() => {
        yTitle.delete(0, yTitle.length)
        yTitle.insert(0, title)
      })
    }
  }, [title, collab])

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({ undoRedo: false }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Collaboration.configure({
          document: collab.ydoc,
          field: 'default',
        }),
        CollaborationCursorYtiptap.configure({
          provider: collab.provider,
          user: {
            name: username,
            color: userColor,
          },
        }),
      ],
      editorProps: {
        attributes: {
          class: 'tiptap editor-page',
          spellcheck: 'true',
          'data-placeholder': 'Start typing...',
        },
        handlePaste: (view, event) => {
          const text = event.clipboardData?.getData('text/plain')
          if (text) {
            event.preventDefault()
            const { from, to } = view.state.selection
            view.dispatch(view.state.tr.delete(from, to).insertText(text, from))
            return true
          }
          return false
        },
      },
      onUpdate: ({ editor: ed }) => {
        const text = ed.getText()
        const words = text.trim() ? text.trim().split(/\s+/).length : 0
        setStats({ words, chars: text.length })
        saveRef.current(docIdRef.current, ed.getHTML(), titleRef.current)
      },
    },
    [collab],
  )

  useEffect(() => {
    if (!editor) return
    editor.commands.updateUser({ name: username, color: userColor })
  }, [editor, username, userColor])

  // Seed from REST only after Yjs has synced (or a fallback timeout). If we fetch
  // while the fragment is still empty and apply setContent before the websocket
  // delivers the same doc, Yjs then merges remote updates and content appears twice.
  useEffect(() => {
    if (!editor) return
    let cancelled = false
    let seedInFlight = false
    let seedFinished = false
    const { provider } = collab

    const finishBootstrap = () => {
      if (!cancelled) setDocBootstrapPending(false)
    }

    const trySeedFromRest = async () => {
      if (cancelled || seedFinished || seedInFlight) return
      const fragment = collab.ydoc.getXmlFragment('default')
      if (fragment.length > 0) {
        seedFinished = true
        finishBootstrap()
        return
      }

      seedInFlight = true
      try {
        const res = await fetch(`${API_BASE_URL}/doc/${docId}`)
        const data = await res.json()
        if (cancelled) return
        // Yjs may have filled the fragment while we were fetching
        if (collab.ydoc.getXmlFragment('default').length > 0) {
          seedFinished = true
          return
        }
        if (data.content && typeof data.content === 'string') {
          editor.commands.setContent(data.content, { emitUpdate: false })
          const text = editor.getText()
          const words = text.trim() ? text.trim().split(/\s+/).length : 0
          setStats({ words, chars: text.length })
        }
        if (data.title && typeof data.title === 'string') {
          console.log('Setting title to', data.title)
          setTitle(data.title)
        }
        seedFinished = true
      } catch (e) {
        console.error('Failed to load initial content', e)
        seedFinished = true
      } finally {
        seedInFlight = false
        finishBootstrap()
      }
    }

    const onSync = (isSynced: boolean) => {
      if (!isSynced || cancelled) return
      void trySeedFromRest()
    }

    provider.on('sync', onSync)
    if (provider.synced) {
      void trySeedFromRest()
    }

    // No websocket / sync never completes — still load from REST after a short wait
    const fallback = window.setTimeout(() => {
      if (!cancelled && !seedFinished) void trySeedFromRest()
    }, 4000)

    return () => {
      cancelled = true
      window.clearTimeout(fallback)
      provider.off('sync', onSync)
    }
  }, [editor, docId, collab, setStats])

  const toolbar =
    useEditorState({
      editor,
      selector: (ctx) => {
        const ed = ctx.editor
        if (!ed) {
          return {
            bold: false,
            italic: false,
            underline: false,
            bulletList: false,
            orderedList: false,
            alignLeft: false,
            alignCenter: false,
            alignRight: false,
          }
        }
        return {
          bold: ed.isActive('bold'),
          italic: ed.isActive('italic'),
          underline: ed.isActive('underline'),
          bulletList: ed.isActive('bulletList'),
          orderedList: ed.isActive('orderedList'),
          alignLeft: ed.isActive({ textAlign: 'left' }),
          alignCenter: ed.isActive({ textAlign: 'center' }),
          alignRight: ed.isActive({ textAlign: 'right' }),
        }
      },
    }) ?? {
      bold: false,
      italic: false,
      underline: false,
      bulletList: false,
      orderedList: false,
      h1: false,
      h2: false,
      h3: false,
      alignLeft: false,
      alignCenter: false,
      alignRight: false,
    }

  const exec = (fn: () => void) => {
    fn()
    editor?.commands.focus()
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-group">
          <button type="button" className="toolbar-btn" onClick={() => exec(() => editor?.chain().focus().undo().run())} title="Undo">
            <Icon name="undo" />
          </button>
          <button type="button" className="toolbar-btn" onClick={() => exec(() => editor?.chain().focus().redo().run())} title="Redo">
            <Icon name="redo" />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${toolbar.bold ? 'active' : ''}`}
            onClick={() => exec(() => editor?.chain().focus().toggleBold().run())}
            title="Bold"
          >
            <Icon name="bold" />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${toolbar.italic ? 'active' : ''}`}
            onClick={() => exec(() => editor?.chain().focus().toggleItalic().run())}
            title="Italic"
          >
            <Icon name="italic" />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${toolbar.underline ? 'active' : ''}`}
            onClick={() => exec(() => editor?.chain().focus().toggleUnderline().run())}
            title="Underline"
          >
            <Icon name="underline" />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${toolbar.alignLeft ? 'active' : ''}`}
            onClick={() => exec(() => editor?.chain().focus().setTextAlign('left').run())}
            title="Align Left"
          >
            <Icon name="align-left" />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${toolbar.alignCenter ? 'active' : ''}`}
            onClick={() => exec(() => editor?.chain().focus().setTextAlign('center').run())}
            title="Align Center"
          >
            <Icon name="align-center" />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${toolbar.alignRight ? 'active' : ''}`}
            onClick={() => exec(() => editor?.chain().focus().setTextAlign('right').run())}
            title="Align Right"
          >
            <Icon name="align-right" />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${toolbar.bulletList ? 'active' : ''}`}
            onClick={() => exec(() => editor?.chain().focus().toggleBulletList().run())}
            title="Bullet List"
          >
            <Icon name="list-bullet" />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${toolbar.orderedList ? 'active' : ''}`}
            onClick={() => exec(() => editor?.chain().focus().toggleOrderedList().run())}
            title="Numbered List"
          >
            <Icon name="list-number" />
          </button>
        </div>
      </div>

      <main className="content-scroll-area" onClick={() => editor?.chain().focus().run()}>
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <EditorContent editor={editor} className="editor-content-root" />
          {docBootstrapPending && <div className="loading-overlay">Syncing document...</div>}
        </div>
      </main>
    </>
  )
}

function App() {
  const [docId, setDocId] = useState<string>(() => {
    const path = window.location.pathname.split('/')[2]
    return path || 'default'
  })
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('docjam-username') || `User-${Math.floor(Math.random() * 1000)}`
  })
  const [isJoined, setIsJoined] = useState<boolean>(!!localStorage.getItem('docjam-username'))
  const [title, setTitle] = useState<string>('')

  useEffect(() => {
    localStorage.setItem(`docjam-title-${docId}`, title)
  }, [title, docId])
  const [stats, setStats] = useState({ words: 0, chars: 0 })
  const [users, setUsers] = useState<{ name: string; color: string; lastActive?: number }[]>([])
  const [collab, setCollab] = useState<CollabBundle | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000)
    return () => clearInterval(interval)
  }, [])

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('docjam-darkmode') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('docjam-darkmode', isDarkMode.toString())
    if (isDarkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [isDarkMode])

  const userColor = useMemo(() => colorForUsername(username), [username])

  const saveToBackend = useDebounce(async (id: string, content: string, title: string) => {
    try {
      await fetch(`${API_BASE_URL}/doc/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      })
    } catch (err) {
      console.error('Failed to save to backend', err)
    }
  }, 2000)

  useEffect(() => {
    if (!isJoined) return

    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider(YJS_WS_URL, docId, ydoc)

    provider.awareness.setLocalStateField('user', {
      name: username,
      color: userColor,
    })

    const syncUsers = () => {
      const states = Array.from(provider.awareness.getStates().values())
      setUsers(states.map((s: { user?: { name: string; color: string; lastActive?: number } }) => s.user).filter(Boolean) as { name: string; color: string; lastActive?: number }[])
    }

    provider.awareness.on('change', syncUsers)
    syncUsers()

    const updateActivity = () => {
      provider.awareness.setLocalStateField('user', {
        name: username,
        color: userColor,
        lastActive: Date.now(),
      })
    }

    const activityEvents = ['mousedown', 'keydown', 'mousemove', 'touchstart']
    activityEvents.forEach(event => window.addEventListener(event, updateActivity))

    queueMicrotask(() => {
      setCollab({ ydoc, provider })
    })

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, updateActivity))
      provider.awareness.off('change', syncUsers)
      provider.destroy()
      ydoc.destroy()
      setCollab(null)
    }
  }, [docId, isJoined, username, userColor])

  useEffect(() => {
    if (!isJoined || !collab) return
    saveToBackend(docId, collab.ydoc.getXmlFragment('default').toString(), title)
  }, [title, docId, isJoined, collab, saveToBackend])

  useEffect(() => {
    window.history.pushState({}, '', `/doc/${docId}`)
  }, [docId])

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      localStorage.setItem('docjam-username', username)
      setIsJoined(true)
    }
  }

  if (!isJoined) {
    return (
      <div className="join-container">
        <div className="join-card">
          <h1>Welcome to Docjam</h1>
          <p>Enter a username and Document ID to start collaborating</p>
          <form onSubmit={handleJoin}>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="text" placeholder="Document ID (e.g. project-x)" value={docId} onChange={(e) => setDocId(e.target.value)} required />
            <button type="submit">Join Document</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="editor-header">
        <div className="header-left">
          <div className="doc-icon" onClick={() => (window.location.href = '/')}>
            📄
          </div>
          <div className="title-container">
            <input
              type="text"
              className="editor-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=""
            />
          </div>
        </div>
        <div className="user-list">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <Icon name={isDarkMode ? 'sun' : 'moon'} />
          </button>
          <div className="toolbar-divider" style={{ height: '24px', margin: '0 8px' }} />
          {users.map((user, i) => {
            const isIdle = user.lastActive && now - user.lastActive > 60000
            return (
              <div
                key={i}
                className={`user-badge ${isIdle ? 'idle' : ''}`}
                style={{ backgroundColor: user.color }}
                title={`${user.name}${isIdle ? ' (Idle)' : ''}`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )
          })}
          <span className="user-count">{users.length} online</span>
        </div>
      </header>

      {!collab ? (
        <main className="content-scroll-area">
          <div className="loading-overlay">Connecting...</div>
        </main>
      ) : (
        <CollaborativeEditor
          key={docId}
          collab={collab}
          docId={docId}
          title={title}
          setTitle={setTitle}
          username={username}
          userColor={userColor}
          setStats={setStats}
          saveToBackend={saveToBackend}
        />
      )}

      <footer className="editor-footer">
        <div className="footer-stats">
          <span>{stats.words} words</span>
          <span>{stats.chars} characters</span>
        </div>
        <div className="footer-status">
          Connected to: <code>{docId}</code>
        </div>
      </footer>
    </div>
  )
}

export default App
