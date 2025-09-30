'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { User, Edit, Trash2, BookOpen, Calendar, Hash } from 'lucide-react'
import { createClient } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface UserProfile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  email?: string
}

interface UserSettings {
  daily_new_limit?: number
  review_session_limit?: number
}

interface FlashcardSet {
  id: string
  name: string
  description?: string
  created_at: string
  card_count: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [settings, setSettings] = useState<UserSettings>({ daily_new_limit: 20, review_session_limit: 100 })

  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      setUser(user)
      
      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData(prev => ({
          ...prev,
          username: profileData.username || '',
          full_name: profileData.full_name || '',
          avatar_url: profileData.avatar_url || '',
          email: user.email || ''
        }))
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || '',
          full_name: '',
          avatar_url: ''
        }
        
        await supabase.from('user_profiles').insert(newProfile)
        setProfile(newProfile)
        setFormData(prev => ({
          ...prev,
          username: newProfile.username,
          email: user.email || ''
        }))
      }

      // Load flashcard sets with card counts
      const { data: setsData } = await supabase
        .from('flashcard_sets')
        .select(`
          id,
          name,
          description,
          created_at,
          flashcards(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const formattedSets = setsData?.map(set => ({
        id: set.id,
        name: set.name,
        description: set.description,
        created_at: set.created_at,
        card_count: set.flashcards?.[0]?.count || 0
      })) || []

      setFlashcardSets(formattedSets)

      // Load or create settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('daily_new_limit, review_session_limit')
        .eq('user_id', user.id)
        .single()
      if (settingsData) setSettings(settingsData)
      else {
        await supabase.from('user_settings').upsert({ user_id: user.id, daily_new_limit: 20, review_session_limit: 100 })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          daily_new_limit: settings.daily_new_limit,
          review_session_limit: settings.review_session_limit,
          updated_at: new Date().toISOString()
        })
      if (error) throw error
      toast({ title: 'Saved', description: 'Settings updated' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save settings', variant: 'destructive' })
    }
  }

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          username: formData.username,
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Update email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (emailError) throw emailError
      }

      setProfile(prev => ({
        ...prev!,
        username: formData.username,
        full_name: formData.full_name,
        avatar_url: formData.avatar_url
      }))

      setIsEditingProfile(false)
      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      })
    }
  }

  const changePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      setIsChangingPassword(false)
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))

      toast({
        title: "Success",
        description: "Password changed successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      })
    }
  }

  const deleteAccount = async () => {
    try {
      // Delete user profile and related data (cascading deletes will handle flashcards)
      await supabase.from('user_profiles').delete().eq('id', user.id)
      
      // Sign out and redirect
      await supabase.auth.signOut()
      router.push('/')
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-600" />
              <span className="text-xl font-bold text-purple-600">Flashy</span>
            </div>
            <div className="hidden md:flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>Home</Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/flashcards')}>Flashcards</Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/games')}>Games</Button>
              <Button variant="default" size="sm">Profile</Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Profile</h1>
          <p className="text-gray-600 text-lg">Manage your account settings and view your flashcard sets</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-lg bg-purple-100 text-purple-600">
                      {profile?.full_name?.[0] || profile?.username?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {profile?.full_name || profile?.username || 'User'}
                    </h3>
                    <p className="text-gray-600">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Username</Label>
                    <p className="mt-1 text-gray-900">{profile?.username || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                    <p className="mt-1 text-gray-900">{profile?.full_name || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="hover:bg-purple-50">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white/95 backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                          Update your profile information
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="avatar_url">Avatar URL</Label>
                          <Input
                            id="avatar_url"
                            value={formData.avatar_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                            placeholder="https://example.com/avatar.jpg"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                          Cancel
                        </Button>
                        <Button onClick={updateProfile} className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="hover:bg-purple-50">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white/95 backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your new password
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new_password">New Password</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirm_password">Confirm New Password</Label>
                          <Input
                            id="confirm_password"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                          Cancel
                        </Button>
                        <Button onClick={changePassword} className="bg-purple-600 hover:bg-purple-700">Change Password</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Learning Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Daily New Cards Limit</Label>
                  <Input type="number" value={settings.daily_new_limit}
                    onChange={(e)=>setSettings(prev=>({...prev, daily_new_limit: Number(e.target.value)}))} />
                </div>
                <div>
                  <Label>Review Session Limit</Label>
                  <Input type="number" value={settings.review_session_limit}
                    onChange={(e)=>setSettings(prev=>({...prev, review_session_limit: Number(e.target.value)}))} />
                </div>
                <div>
                  <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700">Save Settings</Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Once you delete your account, there is no going back. This will permanently delete your account and all your flashcard sets.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          {/* Flashcard Sets Overview */}
          <div>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Your Flashcard Sets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flashcardSets.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No flashcard sets yet</p>
                    <Button onClick={() => router.push('/flashcards')} className="bg-purple-600 hover:bg-purple-700">
                      Create Your First Set
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flashcardSets.map((set) => (
                      <div key={set.id} className="p-3 border rounded-lg hover:bg-purple-50 cursor-pointer transition-all duration-300"
                           onClick={() => router.push(`/flashcards?set=${set.id}`)}>
                        <h4 className="font-medium text-gray-900">{set.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {set.card_count} cards
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(set.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 hover:bg-purple-50"
                      onClick={() => router.push('/flashcards')}
                    >
                      View All Sets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}