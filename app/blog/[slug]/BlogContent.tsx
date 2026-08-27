'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Eye, 
  Heart, 
  Share2, 
  BookOpen,
  Tag,
  User,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  X,
  Maximize2,
  Loader2,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Send,
  ThumbsUp,
  Reply,
  ChevronDown,
  ChevronUp,
  Pin,
  Flag,
  TrendingUp,
  Award,
  Star,
  Car,
  Gavel,
  Crown,
  Zap,
  Flame,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  LayoutGrid
} from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import Ads from '@/components/Ads'
import CarCard from '@/components/CarCard'
import { supabase } from '@/lib/supabase/client'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  author: string
  author_id?: string
  author_avatar?: string
  category: string
  tags: string[]
  read_time: number
  views: number
  likes: number
  is_published: boolean
  is_featured: boolean
  published_at: string
  created_at: string
  updated_at: string
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  cover_image: string
  excerpt: string
  published_at: string
  category: string
}

interface Comment {
  id: string
  user_id: string
  content: string
  likes: number
  is_pinned: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
  parent_id: string | null
  user: {
    first_name: string
    last_name: string
    avatar_url: string | null
    email: string
  } | null
  replies?: Comment[]
  _repliesLoaded?: boolean
  _showReplies?: boolean
}

interface QuickLink {
  id: string
  title: string
  icon: any
  href: string
  color: string
}

interface BlogContentProps {
  blog: BlogPost
  relatedPosts: RelatedPost[]
  formattedDate: string
}

// Helper function to get condition label
function getConditionLabel(condition: string): string {
  if (!condition) return 'Used'
  const cond = condition.toLowerCase()
  if (cond === 'brand new') return 'New'
  if (cond === 'foreign used') return 'F-Used'
  if (cond === 'local used') return 'L-Used'
  return condition.charAt(0).toUpperCase() + condition.slice(1)
}

// Helper to get display name from user data
const getUserDisplayName = (user: any) => {
  if (!user) return 'User'
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  if (user.first_name) return user.first_name
  if (user.email) return user.email.split('@')[0]
  return 'User'
}

// Helper to get user initials
const getUserInitials = (user: any) => {
  if (!user) return 'U'
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  }
  if (user.first_name) {
    return user.first_name[0].toUpperCase()
  }
  if (user.email) {
    return user.email[0].toUpperCase()
  }
  return 'U'
}

export default function BlogContent({ blog: initialBlog, relatedPosts: initialRelatedPosts, formattedDate: initialFormattedDate }: BlogContentProps) {
  const router = useRouter()
  const [blog, setBlog] = useState<BlogPost>(initialBlog)
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>(initialRelatedPosts)
  const [similarBlogs, setSimilarBlogs] = useState<RelatedPost[]>([])
  const [formattedDate, setFormattedDate] = useState(initialFormattedDate)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(initialBlog.likes || 0)
  const [viewsCount, setViewsCount] = useState(initialBlog.views || 0)
  const [sharing, setSharing] = useState(false)
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Comments states
  const [comments, setComments] = useState<Comment[]>([])
  const [commentLoading, setCommentLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyComment, setReplyComment] = useState<{id: string, author: string} | null>(null)
  const [commentError, setCommentError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)
  
  // Image zoom states
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)

  // Featured vehicles states
  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([])
  const [promotedVehicles, setPromotedVehicles] = useState<any[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0)

  // Quick Links
  const quickLinks: QuickLink[] = [
    {
      id: 'luxury',
      title: 'Luxury Cars',
      icon: Crown,
      href: '/luxury',
      color: 'from-amber-500/20 to-amber-600/10'
    },
    {
      id: 'evs',
      title: 'EV Cars',
      icon: Zap,
      href: '/evs',
      color: 'from-green-500/20 to-green-600/10'
    },
    {
      id: 'distress',
      title: 'Distress Sales',
      icon: Gavel,
      href: '/distress',
      color: 'from-red-500/20 to-red-600/10'
    }
  ]

  // Fetch latest blog data on mount
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        setLoading(true)
        
        // Fetch blog with author data using proper join through users table
        const { data: latestBlog, error: blogError } = await supabase
          .from('blogs')
          .select(`
            *,
            author:users!blogs_author_id_fkey (
              first_name,
              last_name,
              avatar_url,
              email,
              user_id
            )
          `)
          .eq('id', initialBlog.id)
          .single()

        if (blogError) throw blogError

        if (latestBlog) {
          const authorData = latestBlog.author as any
          setBlog({
            ...latestBlog,
            author: getUserDisplayName(authorData),
            author_avatar: authorData?.avatar_url || null,
            author_id: latestBlog.author_id
          })
          setLikesCount(latestBlog.likes || 0)
          setViewsCount(latestBlog.views || 0)
          
          const date = new Date(latestBlog.published_at || latestBlog.created_at)
          setFormattedDate(date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }))
        }

        // Fetch related posts (same category)
        const { data: related, error: relatedError } = await supabase
          .from('blogs')
          .select('id, title, slug, cover_image, excerpt, published_at, category')
          .eq('is_published', true)
          .neq('id', initialBlog.id)
          .eq('category', initialBlog.category)
          .order('published_at', { ascending: false })
          .limit(3)

        if (!relatedError && related) {
          setRelatedPosts(related)
        }

        // Fetch similar blogs (featured and recent)
        const { data: similar, error: similarError } = await supabase
          .from('blogs')
          .select('id, title, slug, cover_image, excerpt, published_at, category, is_featured')
          .eq('is_published', true)
          .neq('id', initialBlog.id)
          .order('is_featured', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(6)

        if (!similarError && similar) {
          setSimilarBlogs(similar)
        }

        setError('')
      } catch (err) {
        console.error('Error fetching latest blog data:', err)
        setError('Failed to load latest data')
      } finally {
        setLoading(false)
      }
    }

    fetchLatestData()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('blog-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'blogs',
          filter: `id=eq.${initialBlog.id}`,
        },
        (payload) => {
          const updatedBlog = payload.new as BlogPost
          if (updatedBlog) {
            setLikesCount(updatedBlog.likes || 0)
            setViewsCount(updatedBlog.views || 0)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [initialBlog.id, initialBlog.category])

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setCommentLoading(true)
        
        let query = supabase
          .from('blog_comments')
          .select(`
            *,
            user:users!blog_comments_user_id_fkey (
              first_name,
              last_name,
              avatar_url,
              email,
              user_id
            )
          `)
          .eq('blog_id', blog.id)
          .eq('is_approved', true)
          .is('parent_id', null)

        // Apply sorting
        switch (commentSort) {
          case 'newest':
            query = query.order('created_at', { ascending: false })
            break
          case 'oldest':
            query = query.order('created_at', { ascending: true })
            break
          case 'popular':
            query = query.order('likes', { ascending: false })
            break
          default:
            query = query.order('created_at', { ascending: false })
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching comments:', error)
          setCommentLoading(false)
          return
        }

        // Fetch replies for each comment
        const commentsWithReplies = await Promise.all(
          (data || []).map(async (comment) => {
            const { data: replies, error: repliesError } = await supabase
              .from('blog_comments')
              .select(`
                *,
                user:users!blog_comments_user_id_fkey (
                  first_name,
                  last_name,
                  avatar_url,
                  email,
                  user_id
                )
              `)
              .eq('parent_id', comment.id)
              .eq('is_approved', true)
              .order('created_at', { ascending: true })

            if (repliesError) {
              console.error('Error fetching replies:', repliesError)
              return {
                ...comment,
                replies: [],
                _repliesLoaded: true,
                _showReplies: false
              }
            }

            return {
              ...comment,
              replies: replies || [],
              _repliesLoaded: true,
              _showReplies: false
            }
          })
        )

        setComments(commentsWithReplies)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setCommentLoading(false)
      }
    }

    fetchComments()
  }, [blog.id, commentSort])

  // Fetch featured and promoted vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setVehiclesLoading(true)
        
        // Fetch featured vehicles
        const { data: featuredData, error: featuredError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('status', 'active')
          .eq('featured', true)
          .or('Removed.is.null,Removed.eq.false')
          .limit(10)

        if (!featuredError && featuredData) {
          setFeaturedVehicles(featuredData)
        }

        // Fetch promoted vehicles
        const { data: promotedData, error: promotedError } = await supabase
          .from('vehicles')
          .select(`
            *,
            vehicle_promotions!left (
              package_type,
              end_date,
              is_active,
              status
            )
          `)
          .eq('status', 'active')
          .or('Removed.is.null,Removed.eq.false')
          .limit(10)

        if (!promotedError && promotedData) {
          const withPromotion = promotedData.map((v: any) => ({
            ...v,
            is_promoted: v.vehicle_promotions?.some((p: any) => p.is_active && p.status === 'active') || false,
            promotion_package: v.vehicle_promotions?.find((p: any) => p.is_active && p.status === 'active')?.package_type || null
          }))
          setPromotedVehicles(withPromotion)
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err)
      } finally {
        setVehiclesLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  // Auto-scroll vehicle carousel
  useEffect(() => {
    if (allVehicles.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentVehicleIndex(prev => 
        prev + 1 >= allVehicles.length ? 0 : prev + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [featuredVehicles.length, promotedVehicles.length])

  // Focus reply input when replyComment is set
  useEffect(() => {
    if (replyComment && replyInputRef.current) {
      setTimeout(() => {
        replyInputRef.current?.focus()
        replyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [replyComment])

  // Handle like
  const handleLike = async () => {
    if (liked) return
    
    try {
      const newCount = likesCount + 1
      setLikesCount(newCount)
      setLiked(true)
      
      const { error } = await supabase
        .from('blogs')
        .update({ likes: newCount })
        .eq('id', blog.id)

      if (error) {
        console.error('Error updating likes:', error)
        setLikesCount(likesCount)
        setLiked(false)
      }
    } catch (err) {
      console.error('Error liking post:', err)
      setLikesCount(likesCount)
      setLiked(false)
    }
  }

  // Handle share
  const handleShare = async () => {
    setSharing(true)
    const url = `https://autorepublic.ng/blog/${blog.slug}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt || `Check out this article on AutoRepublic Blog: ${blog.title}`,
          url: url,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
      setSharing(false)
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setShowShareTooltip(true)
      setTimeout(() => setShowShareTooltip(false), 2000)
    } catch (err) {
      console.error('Error copying link:', err)
    }
    setSharing(false)
  }

  // Share on social media
  const shareOnSocial = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const url = `https://autorepublic.ng/blog/${blog.slug}`
    const text = blog.title
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }
    
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer')
  }

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      setCommentError('Please enter a comment')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    try {
      setSubmitting(true)
      setCommentError('')

      // Get the user's profile from the users table
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single()

      if (userError) {
        console.error('Error fetching user profile:', userError)
        setCommentError('Failed to post comment. Please try again.')
        return
      }

      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          blog_id: blog.id,
          user_id: userProfile.user_id,
          content: newComment.trim(),
          parent_id: replyComment ? replyComment.id : null
        })
        .select(`
          *,
          user:users!blog_comments_user_id_fkey (
            first_name,
            last_name,
            avatar_url,
            email,
            user_id
          )
        `)
        .single()

      if (error) {
        console.error('Error posting comment:', error)
        setCommentError('Failed to post comment. Please try again.')
        return
      }

      // Add comment to state
      if (replyComment) {
        // Add as reply to existing comment
        setComments(prev => prev.map(comment => {
          if (comment.id === replyComment.id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data],
              _showReplies: true
            }
          }
          return comment
        }))
        setReplyComment(null)
      } else {
        // Add as top-level comment
        setComments(prev => [data, ...prev])
      }

      setNewComment('')
      
      // Scroll to comments section
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      console.error('Error:', err)
      setCommentError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle comment like
  const handleCommentLike = async (commentId: string) => {
    try {
      // Update likes in database
      const { error } = await supabase.rpc('increment_comment_likes', {
        comment_id: commentId
      })

      if (error) {
        console.error('Error liking comment:', error)
        return
      }

      // Update local state
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, likes: (comment.likes || 0) + 1 }
        }
        // Check replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === commentId 
                ? { ...reply, likes: (reply.likes || 0) + 1 }
                : reply
            )
          }
        }
        return comment
      }))
    } catch (err) {
      console.error('Error:', err)
    }
  }

  // Handle image click to zoom
  const handleImageClick = (imageUrl: string) => {
    if (imageUrl) {
      setZoomedImage(imageUrl)
      setIsZoomed(true)
    }
  }

  const closeZoom = () => {
    setIsZoomed(false)
    setZoomedImage(null)
  }

  // Handle ESC key to close zoom
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomed) {
        closeZoom()
      }
    }
    
    if (isZoomed) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    window.addEventListener('keydown', handleEsc)
    
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isZoomed])

  // Listen for custom image click events from content
  useEffect(() => {
    const handleImageClickEvent = (e: any) => {
      if (e.detail) {
        setZoomedImage(e.detail)
        setIsZoomed(true)
      }
    }
    
    document.addEventListener('imageClick', handleImageClickEvent)
    
    return () => {
      document.removeEventListener('imageClick', handleImageClickEvent)
    }
  }, [])

  // Process content with proper HTML rendering and clickable images
  const processContent = () => {
    let content = blog.content || ''
    
    // Ensure content has proper paragraph tags
    if (content && !content.includes('<p>') && !content.includes('<h1>') && !content.includes('<h2>') && !content.includes('<h3>')) {
      // Split by double newlines or single newlines for paragraphs
      const paragraphs = content.split(/\n\s*\n/);
      if (paragraphs.length > 1 || content.includes('\n')) {
        const processedParagraphs = paragraphs.map(p => {
          const trimmed = p.trim();
          if (!trimmed) return '';
          // Check if it's a heading
          if (trimmed.startsWith('# ')) {
            return `<h1>${trimmed.replace('# ', '')}</h1>`;
          }
          if (trimmed.startsWith('## ')) {
            return `<h2>${trimmed.replace('## ', '')}</h2>`;
          }
          if (trimmed.startsWith('### ')) {
            return `<h3>${trimmed.replace('### ', '')}</h3>`;
          }
          // Check for lists
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const items = trimmed.split('\n').filter(line => line.startsWith('- ') || line.startsWith('* '));
            return `<ul>${items.map(item => `<li>${item.replace(/^[-*]\s*/, '')}</li>`).join('')}</ul>`;
          }
          if (/^\d+\./.test(trimmed)) {
            const items = trimmed.split('\n').filter(line => /^\d+\./.test(line));
            return `<ol>${items.map(item => `<li>${item.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol>`;
          }
          // Wrap in paragraph
          return `<p>${trimmed}</p>`;
        });
        content = processedParagraphs.filter(p => p).join('\n');
      } else {
        // Single paragraph
        content = `<p>${content}</p>`;
      }
    }
    
    // Find all img tags and make them clickable with proper styling
    const imgRegex = /<img([^>]*)src=["']([^"']*)["']([^>]*)>/g
    
    content = content.replace(imgRegex, (match, before, src, after) => {
      if (match.includes('data-zoomed')) return match
      
      return `<img${before} src="${src}"${after} data-zoomed="true" style="cursor: pointer; border-radius: 8px; max-width: 100%; height: auto; max-height: 400px; object-fit: contain; transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin: 1.5rem auto; display: block; border: 1px solid rgba(255,255,255,0.05);" onclick="document.dispatchEvent(new CustomEvent('imageClick', { detail: '${src}' }))" />`
    })
    
    return content
  }

  // Format comment date
  const formatCommentDate = (date: string) => {
    const now = new Date()
    const commentDate = new Date(date)
    const diff = now.getTime() - commentDate.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    if (weeks < 4) return `${weeks}w ago`
    if (months < 12) return `${months}mo ago`
    return `${years}y ago`
  }

  // Navigate vehicle carousel
  const prevVehicle = () => {
    setCurrentVehicleIndex(prev => 
      prev - 1 < 0 ? allVehicles.length - 1 : prev - 1
    )
  }

  const nextVehicle = () => {
    setCurrentVehicleIndex(prev => 
      prev + 1 >= allVehicles.length ? 0 : prev + 1
    )
  }

  // Get all vehicles for carousel
  const allVehicles = [...promotedVehicles, ...featuredVehicles]
  const currentVehicle = allVehicles[currentVehicleIndex]

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Ads Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Ads className="rounded-2xl overflow-hidden shadow-lg shadow-red-500/5" />
      </div>

      <main className="pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content - 3 columns on desktop */}
            <div className="lg:col-span-3 space-y-6">
              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">Back to Blog</span>
              </button>

              {/* Loading/Error States */}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                  <span className="text-white/40 ml-2 text-sm">Updating...</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Article */}
              <article className="space-y-5">
                {/* Category & Date */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-red-500/10 rounded-full text-xs font-medium text-red-400">
                    {blog.category || 'General'}
                  </span>
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </span>
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {blog.read_time || 5} min read
                  </span>
                  {blog.is_featured && (
                    <span className="text-xs text-yellow-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  {blog.title}
                </h1>

                {/* Author & Stats */}
                <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-t border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center overflow-hidden">
                      {blog.author_avatar ? (
                        <img 
                          src={blog.author_avatar} 
                          alt={blog.author}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{blog.author || 'AutoRepublic'}</p>
                      <p className="text-[10px] text-white/40">Author</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {viewsCount}
                    </span>
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-1 transition-colors ${
                        liked ? 'text-red-400' : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''}`} />
                      {likesCount}
                    </button>
                    <div className="relative">
                      <button
                        onClick={handleShare}
                        disabled={sharing}
                        className="text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        {sharing ? '...' : 'Share'}
                      </button>
                      {showShareTooltip && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-black/90 text-white text-[10px] rounded whitespace-nowrap">
                          Link copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Share Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Share on:</span>
                  <button
                    onClick={() => shareOnSocial('facebook')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => shareOnSocial('twitter')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => shareOnSocial('linkedin')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cover Image - Reduced size */}
                {blog.cover_image && (
                  <div 
                    className="relative w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-white/5 cursor-pointer group"
                    onClick={() => handleImageClick(blog.cover_image!)}
                  >
                    <img
                      src={blog.cover_image}
                      alt={blog.title}
                      className="w-full h-auto max-h-[300px] md:max-h-[350px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/placeholder-blog.jpg'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-sm rounded-full p-3">
                        <Maximize2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-[10px] text-white/40">
                      Click to zoom
                    </div>
                  </div>
                )}

                {/* Content - with smaller font size */}
                <div className="blog-content prose prose-invert max-w-none 
                  prose-p:text-white/80 
                  prose-p:leading-relaxed 
                  prose-p:mb-4
                  prose-p:mt-0
                  prose-p:text-sm
                  prose-headings:text-white 
                  prose-headings:font-bold 
                  prose-headings:mt-8 
                  prose-headings:mb-4
                  prose-h1:text-2xl
                  prose-h2:text-xl
                  prose-h3:text-lg
                  prose-strong:text-white 
                  prose-strong:font-semibold
                  prose-a:text-red-400 
                  prose-a:hover:text-red-300 
                  prose-a:underline 
                  prose-a:transition-colors
                  prose-li:text-white/80 
                  prose-li:mb-1
                  prose-li:text-sm
                  prose-ul:list-disc 
                  prose-ul:pl-6 
                  prose-ul:my-3
                  prose-ol:list-decimal 
                  prose-ol:pl-6 
                  prose-ol:my-3
                  prose-blockquote:border-l-4 
                  prose-blockquote:border-red-500 
                  prose-blockquote:pl-4 
                  prose-blockquote:py-1 
                  prose-blockquote:my-4 
                  prose-blockquote:text-white/60 
                  prose-blockquote:italic
                  prose-blockquote:bg-white/5 
                  prose-blockquote:rounded-r-lg
                  prose-img:rounded-lg 
                  prose-img:max-h-[400px] 
                  prose-img:w-auto 
                  prose-img:object-contain 
                  prose-img:cursor-pointer 
                  prose-img:transition-all 
                  prose-img:hover:opacity-90
                  prose-img:shadow-md
                  prose-img:my-6
                  prose-img:mx-auto
                  prose-img:block
                  prose-code:text-red-400 
                  prose-code:bg-white/5 
                  prose-code:px-1 
                  prose-code:py-0.5 
                  prose-code:rounded 
                  prose-code:text-sm
                  prose-pre:bg-white/5 
                  prose-pre:p-4 
                  prose-pre:rounded-lg 
                  prose-pre:overflow-x-auto
                  prose-pre:border 
                  prose-pre:border-white/5
                  prose-hr:border-white/5 
                  prose-hr:my-8
                  prose-table:border-collapse 
                  prose-table:w-full
                  prose-th:border 
                  prose-th:border-white/10 
                  prose-th:p-2 
                  prose-th:text-left
                  prose-td:border 
                  prose-td:border-white/10 
                  prose-td:p-2
                ">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: processContent() 
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (target.tagName === 'IMG') {
                        handleImageClick(target.getAttribute('src') || '')
                      }
                    }}
                  />
                </div>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="pt-6 border-t border-white/5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag className="w-4 h-4 text-white/40" />
                      {blog.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs text-white/60 transition-colors cursor-default"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-white/60" />
                      <h3 className="text-lg font-bold text-white">
                        Comments ({comments.length})
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">Sort by:</span>
                      <select
                        value={commentSort}
                        onChange={(e) => setCommentSort(e.target.value as 'newest' | 'oldest' | 'popular')}
                        className="bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 px-2 py-1 focus:outline-none focus:border-red-500/50 transition-colors"
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="popular">Most Popular</option>
                      </select>
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="mb-6">
                    {replyComment && (
                      <div className="flex items-center justify-between mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in slide-in-from-top duration-200">
                        <span className="text-xs text-white/60">
                          Replying to <span className="text-white font-medium">{replyComment.author}</span>
                        </span>
                        <button
                          onClick={() => setReplyComment(null)}
                          className="text-xs text-white/40 hover:text-white/60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      <textarea
                        ref={replyComment ? replyInputRef : null}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyComment ? `Reply to ${replyComment.author}...` : "Write a comment..."}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors resize-none min-h-[80px]"
                        rows={3}
                      />
                      {commentError && (
                        <p className="text-xs text-red-400">{commentError}</p>
                      )}
                      <div className="flex justify-end">
                        <button
                          onClick={handleCommentSubmit}
                          disabled={submitting || !newComment.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {replyComment ? 'Post Reply' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  {commentLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                      <span className="text-white/40 ml-2 text-sm">Loading comments...</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                          {/* Comment Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {comment.user?.avatar_url ? (
                                  <img 
                                    src={comment.user.avatar_url} 
                                    alt={getUserDisplayName(comment.user)}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-red-400">
                                    {getUserInitials(comment.user)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-white truncate">
                                    {getUserDisplayName(comment.user)}
                                  </span>
                                  {comment.is_pinned && (
                                    <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                                      <Pin className="w-3 h-3" />
                                      Pinned
                                    </span>
                                  )}
                                  <span className="text-[10px] text-white/30">
                                    {formatCommentDate(comment.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Comment Content */}
                          <p className="text-sm text-white/80 mt-2">{comment.content}</p>

                          {/* Comment Actions */}
                          <div className="flex items-center gap-4 mt-3">
                            <button
                              onClick={() => handleCommentLike(comment.id)}
                              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{comment.likes || 0}</span>
                            </button>
                            <button
                              onClick={() => {
                                setReplyComment({
                                  id: comment.id,
                                  author: getUserDisplayName(comment.user)
                                })
                                // Scroll to reply input
                                setTimeout(() => {
                                  replyInputRef.current?.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'center' 
                                  })
                                }, 200)
                              }}
                              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                            >
                              <Reply className="w-3.5 h-3.5" />
                              Reply
                            </button>
                            {comment.replies && comment.replies.length > 0 && (
                              <button
                                onClick={() => {
                                  setComments(prev => prev.map(c => {
                                    if (c.id === comment.id) {
                                      return { ...c, _showReplies: !c._showReplies }
                                    }
                                    return c
                                  }))
                                }}
                                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                              >
                                {comment._showReplies ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                                {comment.replies.length} replies
                              </button>
                            )}
                          </div>

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && comment._showReplies && (
                            <div className="mt-3 pl-4 border-l-2 border-white/10 space-y-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="bg-white/5 rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                      {reply.user?.avatar_url ? (
                                        <img 
                                          src={reply.user.avatar_url} 
                                          alt={getUserDisplayName(reply.user)}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-[8px] font-bold text-red-400">
                                          {getUserInitials(reply.user)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-medium text-white">
                                      {getUserDisplayName(reply.user)}
                                    </span>
                                    <span className="text-[10px] text-white/30">
                                      {formatCommentDate(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/70 mt-1">{reply.content}</p>
                                  <button
                                    onClick={() => handleCommentLike(reply.id)}
                                    className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors mt-1"
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                    <span>{reply.likes || 0}</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={commentsEndRef} />
                    </div>
                  )}
                </div>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <div className="pt-8 border-t border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Related Articles</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {relatedPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/blog/${post.slug}`}
                          className="group bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all"
                        >
                          <div className="relative w-full aspect-[16/9] bg-white/5">
                            {post.cover_image ? (
                              <img
                                src={post.cover_image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/images/placeholder-blog.jpg'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-white/20" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <span className="text-[10px] text-red-400">{post.category}</span>
                            <h4 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-2 mt-1">
                              {post.title}
                            </h4>
                            <p className="text-xs text-white/40 line-clamp-2 mt-1">
                              {post.excerpt}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                {blog.updated_at && blog.updated_at !== blog.created_at && (
                  <div className="text-xs text-white/20 text-center">
                    Last updated: {new Date(blog.updated_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                )}
              </article>
            </div>

            {/* Sidebar - 1 column on desktop - Sticky and Scrollable */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto scrollbar-thin space-y-6 lg:pr-2">
                {/* Quick Links - Luxury, EV, Distress */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-red-400" />
                    Quick Links
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {quickLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <Link
                          key={link.id}
                          href={link.href}
                          className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r ${link.color} border border-white/5 hover:border-white/20 transition-all group`}
                        >
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon className="w-4 h-4 text-white/80" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{link.title}</p>
                            <p className="text-[10px] text-white/40">Explore now →</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Similar Articles */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                    Similar Articles
                  </h3>
                  <div className="space-y-3">
                    {similarBlogs.length > 0 ? (
                      similarBlogs.slice(0, 4).map((post) => (
                        <Link
                          key={post.id}
                          href={`/blog/${post.slug}`}
                          className="block group bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all"
                        >
                          <div className="flex gap-3 p-2">
                            {post.cover_image && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={post.cover_image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/images/placeholder-blog.jpg'
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-red-400">{post.category}</p>
                              <h4 className="text-xs font-medium text-white group-hover:text-red-400 transition-colors line-clamp-2">
                                {post.title}
                              </h4>
                              <p className="text-[10px] text-white/30 mt-0.5">
                                {new Date(post.published_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <BookOpen className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-xs text-white/40">No similar articles found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Promoted & Featured Vehicles Carousel */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4 text-red-400" />
                    Featured Vehicles
                  </h3>
                  
                  {vehiclesLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                    </div>
                  ) : allVehicles.length > 0 ? (
                    <div className="relative">
                      {/* Vehicle Card */}
                      <div className="relative">
                        <CarCard 
                          car={{
                            id: currentVehicle.id,
                            title: currentVehicle.title,
                            brand: currentVehicle.brand,
                            model: currentVehicle.model,
                            year: currentVehicle.year,
                            price: currentVehicle.price,
                            mileage: currentVehicle.mileage || 'N/A',
                            fuel_type: currentVehicle.fuel_type,
                            transmission: currentVehicle.transmission,
                            cover_image: currentVehicle.cover_image,
                            images: currentVehicle.images,
                            location: currentVehicle.city || 'Location Unknown',
                            conditionLabel: currentVehicle.condition ? getConditionLabel(currentVehicle.condition) : 'Used',
                            condition: currentVehicle.condition,
                            car_code: currentVehicle.car_code || undefined,
                            is_promoted: currentVehicle.is_promoted || false,
                            promotion_package: currentVehicle.promotion_package || undefined,
                            distress: currentVehicle.distress || false,
                          }}
                          index={0}
                        />
                      </div>

                      {/* Navigation Arrows */}
                      {allVehicles.length > 1 && (
                        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                          <button
                            onClick={prevVehicle}
                            className="pointer-events-auto p-1.5 bg-black/70 hover:bg-black/90 rounded-full text-white/60 hover:text-white transition-all -ml-2"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={nextVehicle}
                            className="pointer-events-auto p-1.5 bg-black/70 hover:bg-black/90 rounded-full text-white/60 hover:text-white transition-all -mr-2"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Dots Indicator */}
                      {allVehicles.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-3">
                          {allVehicles.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentVehicleIndex(index)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                index === currentVehicleIndex 
                                  ? 'bg-red-500 w-4' 
                                  : 'bg-white/20 hover:bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Car className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-xs text-white/40">No featured vehicles available</p>
                    </div>
                  )}
                </div>

                {/* Ads in Sidebar - Hidden on desktop, visible on mobile */}
                <div className="lg:hidden bg-white/5 rounded-xl p-4 border border-white/5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    Sponsored
                  </h3>
                  <Ads className="rounded-lg overflow-hidden" />
                </div>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-red-400" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {blog.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[10px] text-white/60 transition-colors cursor-default"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {isZoomed && zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={closeZoom}
          >
            <button
              onClick={closeZoom}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white/60 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-5xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedImage}
                alt="Zoomed image"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/images/placeholder-blog.jpg'
                }}
              />
              <button
                onClick={closeZoom}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/60 hover:text-white transition-colors backdrop-blur-sm"
              >
                Click outside or press ESC to close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}