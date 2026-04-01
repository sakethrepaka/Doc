/**
 * Same behavior as @tiptap/extension-collaboration-cursor, but yCursorPlugin is
 * imported from @tiptap/y-tiptap so it shares ySyncPluginKey with
 * @tiptap/extension-collaboration. The stock package uses y-prosemirror’s
 * yCursorPlugin, which reads sync state under a different PluginKey and crashes
 * with: Cannot read properties of undefined (reading 'doc').
 */
import { Extension } from '@tiptap/core'
import type { DecorationAttrs } from '@tiptap/pm/view'
import { defaultSelectionBuilder, yCursorPlugin } from '@tiptap/y-tiptap'

type CollaborationCursorStorage = {
  users: { clientId: number; [key: string]: unknown }[]
}

type Provider = { awareness: import('y-protocols/awareness').Awareness }

const awarenessStatesToArray = (states: Map<number, Record<string, unknown>>) => {
  return Array.from(states.entries()).map(([key, value]) => ({
    clientId: key,
    ...(value.user as Record<string, unknown> | undefined),
  }))
}

export const CollaborationCursorYtiptap = Extension.create({
  name: 'collaborationCursor',

  addOptions() {
    return {
      provider: null as Provider | null,
      user: {
        name: null as string | null,
        color: null as string | null,
      },
      render: (user: Record<string, unknown>) => {
        const cursor = document.createElement('span')
        cursor.classList.add('collaboration-cursor__caret')
        cursor.setAttribute('style', `border-color: ${user.color as string}`)
        const label = document.createElement('div')
        label.classList.add('collaboration-cursor__label')
        label.setAttribute('style', `background-color: ${user.color as string}`)
        label.insertBefore(document.createTextNode(String(user.name)), null)
        cursor.insertBefore(label, null)
        return cursor
      },
      selectionRender: defaultSelectionBuilder as (
        user: Record<string, unknown>,
        clientId: number,
      ) => DecorationAttrs,
    }
  },

  addStorage() {
    return {
      users: [],
    } as CollaborationCursorStorage
  },

  addCommands() {
    return {
      updateUser:
        (attributes: Record<string, unknown>) =>
        () => {
          const ctx = this as unknown as { options: { user: Record<string, unknown>; provider: Provider } }
          ctx.options.user = attributes
          ctx.options.provider.awareness.setLocalStateField('user', ctx.options.user)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      yCursorPlugin(
        (() => {
          const provider = this.options.provider as Provider
          provider.awareness.setLocalStateField('user', this.options.user)
          ;(this.storage as CollaborationCursorStorage).users = awarenessStatesToArray(provider.awareness.states)
          provider.awareness.on('update', () => {
            ;(this.storage as CollaborationCursorStorage).users = awarenessStatesToArray(provider.awareness.states)
          })
          return provider.awareness
        })(),
        {
          cursorBuilder: (user, clientId) => {
            void clientId
            return this.options.render(user)
          },
          selectionBuilder: (user, clientId) => this.options.selectionRender(user, clientId),
        },
      ),
    ]
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    collaborationCursor: {
      updateUser: (attributes: Record<string, unknown>) => ReturnType
    }
  }
}
