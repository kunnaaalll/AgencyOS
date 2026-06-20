import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { KnowledgeAPI } from '../api';
import { KnowledgeStatus } from '../types';

export function KnowledgeEditorPage() {
  const { id } = useParams({ strict: false });
  const isEditing = Boolean(id && id !== 'new');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<KnowledgeStatus>('DRAFT');

  const { data: article } = useQuery({
    queryKey: ['knowledge_article', id],
    queryFn: () => KnowledgeAPI.getArticle(id as string),
    enabled: isEditing,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your SOP, playbook, or documentation here...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-neutral max-w-none focus:outline-none min-h-[400px]',
      },
    },
  });

  useEffect(() => {
    if (article && editor) {
      setTitle(article.title);
      setStatus(article.status);
      if (editor.getHTML() !== article.content) {
        editor.commands.setContent(article.content);
      }
    }
  }, [article, editor]);

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; status: KnowledgeStatus; slug: string }) => {
      if (isEditing) {
        return KnowledgeAPI.updateArticle(id as string, data);
      }
      return KnowledgeAPI.createArticle(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_articles'] });
      navigate({ to: '/knowledge' });
    },
  });

  const handleSave = (newStatus: KnowledgeStatus) => {
    if (!title.trim() || !editor) return;
    saveMutation.mutate({
      title,
      content: editor.getHTML(),
      status: newStatus,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      <header className="flex items-center justify-between px-8 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: '/knowledge' })}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Article Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold text-neutral-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-neutral-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave('DRAFT')}
            disabled={saveMutation.isPending || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button 
            onClick={() => handleSave('PUBLISHED')}
            disabled={saveMutation.isPending || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            Publish
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-12 px-8">
          <EditorContent editor={editor} />
        </div>
      </main>
    </div>
  );
}
