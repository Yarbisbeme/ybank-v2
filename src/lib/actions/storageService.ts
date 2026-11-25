import { getSupabaseBrowserClient } from '@/shared/supabase/browser'

export const storageService = {
  async uploadAvatar(file: File, userId: string): Promise<string> {
    const supabase = getSupabaseBrowserClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (error) throw new Error(error.message)

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return data.publicUrl
  }
}