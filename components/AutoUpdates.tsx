'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Car,
  Eye,
  Heart,
  BookOpen,
  Clock,
  Sparkles,
  Loader2,
  Newspaper,
  LayoutGrid,
  List
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  author: string
  category: string
  tags: string[]
  read_time: number
  views: number
  likes: number
  is_published: boolean
  is_featured: boolean
  published_at: string
  created_at: string
}

// Blog categories
const blogCategories = [
  'All',
  'Buying Guides',
  'Car Reviews',
  'Electric Vehicles',
  'Luxury Cars',
  'Maintenance Tips',
  'Industry News',
  'Auto Trends',
  'Safety',
  'Featured'
]

interface AutoUpdatesProps {
  className?: string
}

export default function AutoUpdates({ className = '' }: AutoUpdatesProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [blogLoading, setBlogLoading] = useState(true)
  const [selectedBlogCategory, setSelectedBlogCategory] = useState('All')
  const [blogSearchQuery, setBlogSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('is_published', true)
          .order('is_featured', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(20)

        if (error) {
          console.error('Error fetching blogs:', error)
          setBlogLoading(false)
          return
        }

        setBlogs(data || [])
        setBlogLoading(false)
      } catch (err) {
        console.error('Error fetching blogs:', err)
        setBlogLoading(false)
      }
    }

    fetchBlogs()
  }, [])

  // Filter blogs
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blogSearchQuery === '' || 
      blog.title.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(blogSearchQuery.toLowerCase()))
    
    const matchesCategory = selectedBlogCategory === 'All' || blog.category === selectedBlogCategory
    
    return matchesSearch && matchesCategory
  })

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (blogLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="text-white/60 ml-3">Loading articles...</span>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Blog Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Auto Updates</h2>
            <p className="text-xs text-white/40 hidden sm:block">Expert insights, reviews, and automotive news</p>
          </div>
        </div>
        
        {/* Grid/List Toggle */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5 flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-red-500 text-white' 
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
            aria-label="Grid view"
            type="button"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list' 
                ? 'bg-red-500 text-white' 
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
            aria-label="List view"
            type="button"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Blog Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search articles..."
            value={blogSearchQuery}
            onChange={(e) => setBlogSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {blogCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedBlogCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedBlogCategory === cat
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Grid/List */}
      {filteredBlogs.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No articles found matching your criteria</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredBlogs.map((blog, index) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/5 rounded-xl overflow-hidden border transition-all hover:border-white/10 hover:bg-white/10 group ${
                blog.is_featured ? 'border-red-500/30' : 'border-white/5'
              } ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''}`}
            >
              <Link href={`/blog/${blog.slug}`} className={`flex ${viewMode === 'list' ? 'flex-col sm:flex-row w-full' : 'flex-col w-full'}`}>
                <div className={`relative ${viewMode === 'list' ? 'sm:w-48 md:w-56 lg:w-64 flex-shrink-0' : 'w-full'}`}>
                  {blog.cover_image ? (
                    <img
                      src={blog.cover_image}
                      alt={blog.title}
                      className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        viewMode === 'list' ? 'h-48 sm:h-full' : 'h-40 sm:h-48'
                      }`}
                    />
                  ) : (
                    <div className={`w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${
                      viewMode === 'list' ? 'h-48 sm:h-full' : 'h-40 sm:h-48'
                    }`}>
                      <Car className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  {blog.is_featured && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500/90 rounded-full text-[10px] font-medium text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-[10px] text-white/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {blog.read_time || 5} min read
                  </div>
                </div>
                <div className={`p-3 sm:p-4 flex-1 flex flex-col ${viewMode === 'list' ? 'sm:justify-center' : ''}`}>
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <span className="text-[10px] font-medium text-red-400">
                      {blog.category || 'General'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[10px] text-white/40">
                      {formatDate(blog.published_at || blog.created_at)}
                    </span>
                  </div>
                  <h3 className={`font-semibold text-white group-hover:text-red-400 transition-colors ${
                    viewMode === 'list' ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
                  } line-clamp-2`}>
                    {blog.title}
                  </h3>
                  {blog.excerpt && (
                    <p className={`text-white/40 mt-0.5 sm:mt-1 line-clamp-2 ${
                      viewMode === 'list' ? 'text-sm' : 'text-[10px] sm:text-xs'
                    }`}>
                      {blog.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5">
                    <span className="text-[9px] sm:text-[10px] text-white/30">
                      By {blog.author || 'AutoRepublic'}
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-white/30">
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {blog.views || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {blog.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}

      {/* Blog Results Count */}
      {filteredBlogs.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-white/30">
            Showing {filteredBlogs.length} of {blogs.length} articles
          </p>
        </div>
      )}
    </div>
  )
}