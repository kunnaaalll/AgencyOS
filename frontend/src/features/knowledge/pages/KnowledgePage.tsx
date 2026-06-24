import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus, Search, BookOpen, Clock, Tag } from 'lucide-react';
import { KnowledgeAPI } from '../api';
import { KnowledgeArticle } from '../types';
import { useDemoQuery } from '@/lib/useDemoQuery';
import { mockKnowledgeArticles } from '@/mocks';

export function KnowledgePage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: articles = [], isLoading } = useDemoQuery({
    queryKey: ['knowledge_articles'],
    queryFn: KnowledgeAPI.getArticles,
  }, mockKnowledgeArticles);

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Knowledge OS</h1>
          <p className="text-neutral-500 mt-1">Manage SOPs, playbooks, and team documentation.</p>
        </div>
        <Link 
          to="/knowledge/new"
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Article
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input 
          type="text" 
          placeholder="Search knowledge base..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-shadow"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-neutral-500">Loading articles...</div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <BookOpen className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No articles found</h3>
          <p className="text-neutral-500 mb-6">Create your first SOP or playbook to get started.</p>
          <Link 
            to="/knowledge/new"
            className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-900 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Article
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => (
            <Link 
              key={article.id} 
              to={`/knowledge/${article.id}/edit`}
              className="group bg-white p-6 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                  article.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' :
                  article.status === 'DRAFT' ? 'bg-amber-50 text-amber-700' :
                  'bg-neutral-100 text-neutral-700'
                }`}>
                  {article.status}
                </div>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex items-center gap-1 text-neutral-400">
                    <Tag className="w-3 h-3" />
                    <span className="text-xs">{article.tags.length}</span>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-neutral-500 line-clamp-3 mb-4">
                {article.content.replace(/<[^>]*>?/gm, '').substring(0, 120)}...
              </p>
              <div className="flex items-center gap-2 text-xs text-neutral-400 pt-4 border-t border-neutral-100">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
