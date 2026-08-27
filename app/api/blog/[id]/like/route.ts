// app/api/blog/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: currentBlog, error: fetchError } = await supabase
      .from('blogs')
      .select('likes')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    const currentLikes = currentBlog?.likes || 0
    const newLikes = currentLikes + 1

    const { error: updateError } = await supabase
      .from('blogs')
      .update({ likes: newLikes })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update likes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ likes: newLikes })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}